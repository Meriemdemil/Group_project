from flask import Flask, request, jsonify
from flask_cors import CORS
from sentence_transformers import SentenceTransformer
from langchain_community.vectorstores import FAISS
import re

app = Flask(__name__)
CORS(app)  # Enable CORS

embedder = SentenceTransformer('all-MiniLM-L6-v2', device='cpu')

class EfficientDocumentSearch:
    def __init__(self):
        self.vector_stores = [
            FAISS.load_local("vector_db/vector_db/DM_vector_store", embedder, allow_dangerous_deserialization=True),
            FAISS.load_local("vector_db/OR_vector_store", embedder, allow_dangerous_deserialization=True)
        ]

    def search(self, query, min_score=0.85, top_k=3):
        if not query.strip():
            return ["Query cannot be empty."]

        query_vec = embedder.encode(query, normalize_embeddings=True)
        all_results = []
        for i, vector_store in enumerate(self.vector_stores):
            try:
                docs = vector_store.similarity_search_with_score_by_vector(query_vec, k=top_k)
                for doc, score in docs:
                    all_results.append((i, doc, score))
            except:
                continue

        all_results.sort(key=lambda x: x[2])
        selected_results = all_results[:top_k]
        results = []

        for store_index, doc, score in selected_results:
            if score > (1 - min_score):
                content = re.sub(r"\s+", " ", doc.page_content).strip()
                results.append(content)

        return results or ["No matches above confidence threshold."]

searcher = EfficientDocumentSearch()

@app.route("/query", methods=["POST"])
def query():
    data = request.get_json()
    query = data.get("question") or data.get("query", "")
    results = searcher.search(query)
    return jsonify({"answers": results})

if __name__ == "__main__":
    app.run(port=5000)
