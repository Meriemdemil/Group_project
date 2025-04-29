import os
import re
from together import Together
from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from typing import Optional
import requests            # for web lookup
import json
from dotenv import load_dotenv

load_dotenv()

# ——————————————
# 1) Setup Everything
# ——————————————
client    = Together(api_key=os.getenv("TOGETHER_API_KEY"))
embedder  = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
VECTOR_DB = "vector_db/DM_vector_store"

# ——————————————
# 2) Load Your FAISS Store
# ——————————————
searcher = FAISS.load_local(VECTOR_DB, embedder, allow_dangerous_deserialization=True)

# ——————————————
# 3) Helper: Do a quick Google / Wikipedia snippet lookup
# ——————————————
def web_lookup(query: str) -> Optional[str]:
    """
    Call out to a search API (e.g. SerpAPI, Bing or Wikipedia REST).
    Return the top 1–2 sentences as a string, or None if nothing found.
    """
    # Example: Wikipedia REST API
    url = (
        "https://en.wikipedia.org/api/rest_v1/page/summary/"
        + requests.utils.quote(query)
    )
    resp = requests.get(url, headers={"User-Agent": "student-booster/1.0"})
    if resp.status_code == 200:
        data = resp.json()
        # take the extract field (first paragraph)
        return data.get("extract")
    return None

# ——————————————
# 4) Core RAG + Optional Fallback
# ——————————————
def rag_pipeline(question: str) -> str:
    # 4.1) First: run your FAISS similarity search
    query_vec = embedder.encode(question, normalize_embeddings=True)
    docs = searcher.similarity_search_with_score_by_vector(query_vec, k=3)
    context_chunks = [d.page_content for d, dist in docs]  # ignore distances
    
    # 4.2) If we got nothing relevant from your PDFs…
    if not context_chunks:
        #  A) Glossary / definition fallback
        #  B) Code-example fallback
        #  C) Multimedia fallback
        snippet = web_lookup(question)
        if snippet:
            context = snippet
        else:
            return "I don't know based on the provided information."
    else:
        # join the top-K PDF passages into one context string
        context = "\n\n".join(context_chunks)
    
    # 4.3) Build your system prompt (force Markdown headings & bullets)
    system_prompt = (
        "You are a knowledgeable assistant.  "
        "Answer *only* from the provided context.  "
        "If the context came from the web, prefix your answer with '(external) '.  "
        "If you cannot answer, say: 'I don't know based on the provided information.'\n\n"
        "Format rules:\n"
        "- Use `##` headings on their own lines.\n"
        "- Prefix each bullet with `- ` on a new line.\n\n"
    )
    
    # 4.4) Send to your LLM
    messages = [
        {"role":"system",  "content": system_prompt},
        {"role":"user",    "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"}
    ]
    resp = client.chat.completions.create(
        model="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages=messages,
        max_tokens=512,
        temperature=0.3
    )
    answer = resp.choices[0].message.content.strip()
    
    # 4.5) If this came from a web snippet, tag it so UI can highlight it
    if not context_chunks:
        return "(external) " + answer
    return answer
