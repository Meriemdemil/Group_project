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
VECTOR_DB_DIRS = [
    "vector_db/DM_vector_store",
    "vector_db/DSA1_vector_store",
    "vector_db/DSA2_vector_store",
    "vector_db/OR_vector_store",
    "vector_db/ANA1_vector_store",
    "vector_db/DB_vector_store",
    "vector_db/RL_vector_store",
    "vector_db/CV_vector_store",
    
]
vector_stores = {}


for dir_path in VECTOR_DB_DIRS:
    if os.path.exists(dir_path):
        try:
            vector_stores[dir_path] = FAISS.load_local(dir_path, embedder, allow_dangerous_deserialization=True)
            print(f"Successfully loaded FAISS index from: {dir_path}")
        except Exception as e:
            print(f"Failed to load FAISS index from {dir_path}: {e}")
    else:
        print(f"Directory {dir_path} does not exist.")
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

You are a helpful AI tutor. Only use the provided documents to answer questions. Do not make up examples, definitions, or explanations unless they are present in the retrieved content. If the user asks for an explanation or example that is not in the retrieved documents, respond clearly that more information is needed.


Respond to emotional or mood-based messages with empathy and brevity.
If the student sounds bored, tired, stuck, or emotional, respond casually — don't be overly formal. You're not here to lecture.

If the student asks something that isn’t covered in the documents, say:  
**"I don't know based on the provided information."**

Do **not** use internet sources unless allowed.

Always respond using clear Markdown formatting. Use `##` for main sections, `###` for sub-sections, and `*` for bullet points.
Do not leave space between bullet points and paragraph leave just space when you are moving to a new section

Example:
## Section Title
Some text describing this section.
### Subsection

* Bullet 1
* Bullet 2

"""

def ensure_newlines(md: str) -> str:
    # Add line breaks before bullets
    md = re.sub(r'(?<!\n)\* ', r'\n* ', md)
    # Add line breaks before headers
    md = re.sub(r'(?<!\n)(#{2,} )', r'\n\1', md)
    return md.strip()

def ensure_markdown_structure(md: str) -> str:
    # Normalize line endings
    md = md.replace('\r\n', '\n')

    # Add a newline before headers (if not already there)
    md = re.sub(r'(?<!\n)(#{2,} )', r'\n\1', md)

    # Add a newline before list items (if not already there)
    md = re.sub(r'(?<!\n)\* ', r'\n* ', md)

    # Collapse multiple newlines into a maximum of two
    md = re.sub(r'\n{3,}', r'\n\n', md)

    return md.strip()




# ----------------------------
# Main Pipeline
# ----------------------------
# ----------------------------
# Main Pipeline
# ----------------------------
def rag_pipeline(question: str, chat_history: list, conversation_id: Optional[str] = None) -> dict:
    # Step 0: Rephrase vague follow-up
    if chat_history:
        last_user_question = next((m["content"] for m in reversed(chat_history) if m["role"] == "user"), None)
        if last_user_question and question.strip().lower() in ["explain more", "what do you mean", "give example", "more details"]:
            question = f"{last_user_question.strip()}\n{question.strip()}"

    # Step 1: Retrieve context from FAISS
    query_vec = embedder.encode(question, normalize_embeddings=True)

    # Collect context from all vector stores
    context_chunks = []
    for dir_path, searcher in vector_stores.items():
        docs = searcher.similarity_search_with_score_by_vector(query_vec, k=3)
        context_chunks.extend([d.page_content for d, _ in docs])

    if not context_chunks:
        # If no context is found in vector stores, fallback to web lookup
        snippet = web_lookup(question)
        if snippet:
            context = snippet
        else:
            return {
                "answer": "I don't know based on the provided information.",
                "conversation_id": conversation_id or ""
            }
    else:
        # Format the retrieved context
        context = "\n\n".join(f"### Source {i+1}\n{chunk}" for i, chunk in enumerate(context_chunks))

    # Step 2: Build message history with context
    messages = [{"role": "system", "content": system_prompt}]
    messages.extend(chat_history)
    messages.append({
        "role": "user",
        "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"
    })

    # Step 3: Generate response
    response = client.chat.completions.create(
        model="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
        messages=messages,
        max_tokens=2048,
        temperature=0.3
    )

    raw_answer = response.choices[0].message.content.strip()
    final_answer = ensure_markdown_structure(raw_answer)

    # DEBUGGING
    print("======== RAW =========\n", raw_answer)
    print("======== FORMATTED =========\n", final_answer)

    return {
        "answer": raw_answer,
        "conversation_id": conversation_id or ""
    }


