from flask import Flask, request, jsonify
from flask_cors import CORS
from rag_core import rag_pipeline
import re

app = Flask(__name__)
CORS(app, resources={
    r"/query": {
        "origins": ["http://localhost:3000", "http://192.168.56.1:3000", "http://localhost:5000"],
        "methods": ["POST"]
    }
})

@app.route("/query", methods=["POST"])
def handle_query():
    try:
        data = request.get_json()
        query = data.get("question") or data.get("query", "").strip()
        
        if not query:
            return jsonify({"error": "Query cannot be empty", "answers": []}), 400
        
        # Get RAG response
        answer = rag_pipeline(query)
        
        # Clean up the answer if needed
        cleaned_answer = re.sub(r"\s+", " ", answer).strip()
        
        # Return in the format your frontend expects
        return jsonify({
            "answers": [cleaned_answer],  # Note: Wrapping in array to match frontend expectation
            "status": "success"
        })
        
    except Exception as e:
        return jsonify({
            "error": str(e),
            "answers": ["Something went wrong. Please try again."],
            "status": "error"
        }), 500

if __name__ == "__main__":
    print("\nEfficient Document RAG Search API (running on port 5000)")
    app.run(port=5000, debug=True)  # Added debug=True for better error reporting