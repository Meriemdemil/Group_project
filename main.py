from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import FAISS
import numpy as np

# Initialize model (cache embeddings for better performance)
embedder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

class EfficientDocumentSearch:
    def __init__(self):
        try:
            self.vector_store = FAISS.load_local(
                "vector_db/faiss_index",
                embedder,
                allow_dangerous_deserialization=True
            )
            print(f"Loaded {self.vector_store.index.ntotal} documents")
        except Exception as e:
            print("Vector store load failed:", e)
            exit()

    def search(self, query, min_score=0.85, top_k=3):
        """Optimized search with early stopping"""
        query_vec = embedder.encode(query, normalize_embeddings=True)
        
        # Perform similarity search
        docs = self.vector_store.similarity_search_with_score_by_vector(
            query_vec,
            k=top_k
        )
        
        # Extract scores and filter based on min_score
        scores = np.array([score for _, score in docs])
        passed = scores >= min_score
        
        if not passed.any():
            return ["No matches above confidence threshold"]
        
        # Filter and format results
        return [
            f"[Score: {score:.3f}]\n{doc.page_content}\n"
            for (doc, score), valid in zip(docs, passed)
            if valid
        ]

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