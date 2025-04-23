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
        FAISS.load_local("vector_db/DM_vector_store", embedder, allow_dangerous_deserialization=True)
            ]
            total_docs = sum(store.index.ntotal for store in self.vector_stores)
            print(f"✅ Loaded {total_docs} documents from multiple vector stores")
        except Exception as e:
            print("❌ Vector store load failed:", e)
            exit()

    def get_context(self, query, top_k=3, max_distance=1.5):
        query_vec = embedder.encode(query, normalize_embeddings=True)
        all_results = []
        for store in self.vector_stores:
            try:
                docs = store.similarity_search_with_score_by_vector(query_vec, k=top_k)
                for doc, distance in docs:
                    print(f"Distance: {distance:.4f} | Content Preview: {doc.page_content[:100]}...")
                    if distance <= max_distance:
                        all_results.append((doc.page_content, distance))
            except Exception as e:
                print(f"Search error: {e}")
        
        all_results.sort(key=lambda x: x[1])  # Sort by smallest distance
        return "\n".join([doc for doc, _ in all_results[:top_k]])





# ------------------------
# ✅ LLM Response using Together API
# ------------------------
def generate_answer(context, question):
    system_prompt = (
        "You are a helpful assistant. "
        "Only answer using the information provided in the context. "
        "If the answer is not found in the context, say 'I don't know based on the provided information.' "
        "Do not make up information."
    )
    
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": f"Context:\n{context}\n\nQuestion: {question}\nAnswer:"}
    ]
    
    try:
        response = client.chat.completions.create(
            model="meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
            messages=messages,
            max_tokens=512,
            temperature=0.3  # Lower temp for more focused answers
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
