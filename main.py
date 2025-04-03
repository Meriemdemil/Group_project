from langchain.vectorstores import FAISS
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.chains import RetrievalQA
from langchain.llms import OpenAI

def main():
    # Step 1: Load the vector database
    embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    vector_store = FAISS.load_local("vector_db/faiss_index", embedding_model, allow_dangerous_deserialization=True)

    # Step 2: Create a retriever
    retriever = vector_store.as_retriever()

    # Step 3: Query the vector database
    query = input("Enter your query: ")
    relevant_docs = retriever.get_relevant_documents(query)

    # Step 4: Print the retrieved documents
    print("\nRelevant Documents:")
    for doc in relevant_docs:
        print(doc.page_content)

    # Optional: Use a QA chain to get a direct answer
    llm = OpenAI(model="text-davinci-003")  # Replace with your preferred LLM
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=retriever)
    response = qa_chain.run(query)
    print("\nAnswer:")
    print(response)

if __name__ == "__main__":
    main()