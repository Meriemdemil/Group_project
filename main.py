from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_core import rag_pipeline
import re

app = Flask(__name__)
CORS(app, resources={
    r"/query": {
        "origins": ["http://localhost:5173", "http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:5000"],
        "methods": ["POST"]
    }
})

@app.route("/query", methods=["POST"])
def handle_query():
    try:
        data = request.get_json()
        query = data.get("question") or data.get("query", "").strip()
        history = data.get("history", [])
        conversation_id = data.get("conversation_id")



        if not query:
            return jsonify({"error": "Query cannot be empty", "answers": []}), 400

        result = rag_pipeline(question=query, chat_history=history)


        return jsonify({
            "answer": result["answer"],
            "status": "success",
            "conversation_id": result.get("conversation_id", "")
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "answers": ["Something went wrong. Please try again."],
            "status": "error"
        }), 500


if __name__ == "__main__":
    print("\nEfficient Document RAG Search API (running on port 5000)")
    app.run(port=5000, debug=True) 