import os
import re
import requests
import json
from dotenv import load_dotenv
from typing import Optional
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import FAISS
from together import Together

load_dotenv()

# ----------------------------
# Setup Everything
# ----------------------------
client = Together(api_key=os.getenv("TOGETHER_API_KEY"))
embedder = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")
VECTOR_DB = "vector_db/DM_vector_store"
searcher = FAISS.load_local(VECTOR_DB, embedder, allow_dangerous_deserialization=True)

# ----------------------------
# Web Fallback (Optional)
# ----------------------------
def web_lookup(query: str) -> Optional[str]:
    url = (
        "https://en.wikipedia.org/api/rest_v1/page/summary/"
        + requests.utils.quote(query)
    )
    resp = requests.get(url, headers={"User-Agent": "student-booster/1.0"})
    if resp.status_code == 200:
        data = resp.json()
        return data.get("extract")
    return None

# ----------------------------
# System Prompt
# ----------------------------
system_prompt = """
You're LLaMA, a smart, conversational assistant who helps students only with what they're currently studying, based on the provided documents.

You're deeply aware of tone. If the student says "hi", "yo", "hey", or anything casual like that, respond with a short, warm greeting like:  
**Hi! How can I help you with your studies today?**

Respond to emotional or mood-based messages with empathy and brevity.
If the student sounds bored, tired, stuck, or emotional, respond casually — don't be overly formal. You're not here to lecture.

If the student asks something that isn’t covered in the documents, say:  
**"I don't know based on the provided information."**

Do **not** use internet sources unless allowed.

Use **Markdown**, and always separate headings, lists, and paragraphs with **two newlines (`\n\n`)**.
"""

# ----------------------------
# Main Pipeline
# ----------------------------
def rag_pipeline(question: str, chat_history: list, conversation_id: Optional[str] = None) -> dict:
    # Step 1: Retrieve context from FAISS
    query_vec = embedder.encode(question, normalize_embeddings=True)
    docs = searcher.similarity_search_with_score_by_vector(query_vec, k=3)
    context_chunks = [d.page_content for d, _ in docs]

    if not context_chunks:
        snippet = web_lookup(question)
        if snippet:
            context = snippet
        else:
            return {
                "answer": "I don't know based on the provided information.",
                "conversation_id": conversation_id or ""
            }
    else:
        context = "\n\n".join(context_chunks)

    # Step 2: Build message history with context
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_history)
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    })

    # Step 3: Call LLaMA model
    response = client.chat.completions.create(
        model="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages=messages,
        max_tokens=512,
        temperature=0.3
    )

    return {
        "answer": response.choices[0].message.content.strip(),
        "conversation_id": conversation_id or ""
    }

