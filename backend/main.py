import os 
import shutil
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

load_dotenv();

app = FastAPI(title = "Chat-With-PDF RAG API");

origins = os.getenv("ALLOWED_ORIGINS", "").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

embeddings = GoogleGenerativeAIEmbeddings(model = "models/text-embedding-004")
db = Chroma(embedding_function = embeddings, persist_directory = "./chroma_db")

llm  = ChatGoogleGenerativeAI(model = "gemini-2.5", temperature = 0.2)

class QueryRequest(BaseModel):
    question: str
    document_id: str


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    temp_path = f"temp_{file.filename}"

    try:
        with open(temp_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        loader = PyPDFLoader(temp_path)
        documents = loader.load()

        for doc in documents:
            doc.metadata["source"] = file.filename

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, 
            chunk_overlap=200
        )
        chunks = text_splitter.split_documents(documents)

        db.add_documents(chunks)

        return {"filename": file.filename, "message": "Upload successful", "chunks": len(chunks)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {str(e)}")

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.post("/ask")
async def ask_question(query: QueryRequest):
    try:
        docs = db.similarity_search(
            query.question,
            k=3,
            filter={"source": query.document_id}
        )

        if not docs:
            return {"answer": "No relevant information found in the selected document."}

        context = "\n\n".join([doc.page_content for doc in docs])

        prompt = (
            "You are a helpful assistant answering questions based strictly on the provided document context.\n"
            "If the answer cannot be derived directly from the context, state clearly that the document does not contain the answer.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query.question}"
        )

        response = llm.invoke(prompt)
        return {"answer": response.content}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {str(e)}")