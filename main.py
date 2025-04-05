from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import FAISS
import numpy as np
import re

# Initialize model (cache embeddings for better performance)
embedder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

class EfficientDocumentSearch:
    def __init__(self):
        try:
            # Load multiple vector stores separately
            self.vector_stores = [
                FAISS.load_local("vector_db/vector_db/DM_vector_store", embedder, allow_dangerous_deserialization=True),
                FAISS.load_local("vector_db/OR_vector_store", embedder, allow_dangerous_deserialization=True)
            ]
            total_docs = sum(store.index.ntotal for store in self.vector_stores)
            print(f"Loaded {total_docs} documents from multiple vector stores")
        except Exception as e:
            print("Vector store load failed:", e)
            exit()

    def search(self, query, min_score=0.85, top_k=3):
        """Search across all vector stores and return the top_k most relevant results."""
        if not query.strip():
            return ["Query cannot be empty. Please enter a valid one."]
        
        query_vec = embedder.encode(query, normalize_embeddings=True)
        all_results = []

        # Gather results from all vector stores
        for i, vector_store in enumerate(self.vector_stores):
            try:
                docs = vector_store.similarity_search_with_score_by_vector(query_vec, k=top_k)
                for doc, score in docs:
                    all_results.append((i, doc, score))
            except Exception as e:
                print(f"Error searching in store {i}:", e)

        if not all_results:
            return ["No matches found in any vector store."]

        # Sort all results by score (ascending = more relevant in FAISS)
        all_results.sort(key=lambda x: x[2])

        # Filter top_k results across all stores
        selected_results = all_results[:top_k]

        results = []
        for store_index, doc, score in selected_results:
            if score > (1 - min_score):  # since cosine distance is (1 - similarity)
                cleaned_content = re.sub(r"[•●○◦▶■♦◇✓✦]", "", doc.page_content)
                cleaned_content = re.sub(r"\s+", " ", cleaned_content).strip()
                results.append(f"[Store: {store_index}, Score: {1 - score:.3f}]\n{cleaned_content}\n")

        if not results:
            return ["No matches above confidence threshold."]

        return results

    
searcher = EfficientDocumentSearch()

print("\nEfficient Document Search (type 'quit' to exit)")
while True:
    try:
        query = input("\nSearch query: ").strip()
        if query.lower() in ('quit', 'exit'):
            break
            
        results = searcher.search(query)
        
        print("\n" + "="*50)
        print(f"Top {len(results)} result(s):")
        print("="*50)
        print("\n".join(results))
        
    except KeyboardInterrupt:
        break
    except Exception as e:
        print(f"Error: {e}")