from langchain_community.vectorstores import FAISS
from sentence_transformers import SentenceTransformer
from together import Together
import os
from dotenv import load_dotenv
load_dotenv()

# ------------------------
# ✅ Set up Together client
# ------------------------
client = Together(api_key=os.getenv("TOGETHER_API_KEY"))

# ------------------------
# ✅ Embedder setup
# ------------------------
embedder = SentenceTransformer("all-MiniLM-L6-v2", device="cpu")


# ------------------------
# ✅ Efficient RAG Search
# ------------------------
class EfficientDocumentSearch:
    def __init__(self):
        try:
            self.vector_stores = [
                FAISS.load_local("vector_db/vector_db/DM_vector_store", embedder, allow_dangerous_deserialization=True),
            ]
            total_docs = sum(store.index.ntotal for store in self.vector_stores)
            print(f"✅ Loaded {total_docs} documents from multiple vector stores")
        except Exception as e:
            print("❌ Vector store load failed:", e)
            exit()

    def get_context(self, query, min_score=0.85, top_k=3):
        query_vec = embedder.encode(query, normalize_embeddings=True)
        all_results = []
        for store in self.vector_stores:
            try:
                docs = store.similarity_search_with_score_by_vector(query_vec, k=top_k)
                for doc, score in docs:
                    if 1 - score >= min_score:
                        all_results.append((doc.page_content, 1 - score))
            except Exception as e:
                print(f"Search error: {e}")
        all_results.sort(key=lambda x: x[1], reverse=True)
        return "\n".join([doc for doc, _ in all_results[:top_k]])


# ------------------------
# ✅ LLM Response using Together API
# ------------------------
def generate_answer(context, question):
    prompt = f"""You are a helpful assistant.\n\nContext:\n{context}\n\nQuestion: {question}\nAnswer:"""
    messages = [{"role": "user", "content": prompt}]
    
    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=messages,
            max_tokens=512,
            temperature=0.7
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        return f"❌ Error generating response: {e}"


# ------------------------
# ✅ Final RAG pipeline
# ------------------------
searcher = EfficientDocumentSearch()

def rag_pipeline(question):
    context = searcher.get_context(question)
    return generate_answer(context, question)
