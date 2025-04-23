from langchain_community.vectorstores import FAISS
from langchain_community.docstore.document import Document
from langchain_community.embeddings import HuggingFaceEmbeddings
import os

# Use LangChain-compatible embedder
embedder = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Sample text
sample_docs = [
    Document(page_content=(
        "Data mining is the process of discovering patterns and knowledge from large amounts of data. "
        "The data sources can include databases, data warehouses, the internet, and other sources. "
        "It involves methods at the intersection of machine learning, statistics, and database systems."
    ))
]

# Create FAISS vector store
faiss_store = FAISS.from_documents(sample_docs, embedder)

# Save to disk
faiss_store.save_local("vector_db/vector_db/test_vector_store")

print("✅ Sample FAISS vector store created.")
