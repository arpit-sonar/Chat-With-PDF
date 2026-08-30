from fastapi import FastAPI, File, UploadFile
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.vectorstores import Chroma
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
import os
import shutil
from dotenv import load_dotenv
load_dotenv()

api_key = os.getenv("GOOGLE_API_KEY")
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
allow_origins=["http://localhost:5173", "https://your-future-vercel-app-url.vercel.app"],    
allow_methods=["*"],
allow_headers=["*"],
)

from langchain_google_genai import GoogleGenerativeAIEmbeddings
embeddings = GoogleGenerativeAIEmbeddings(model="models/text-embedding-004")
db = Chroma(persist_directory="./chroma_db", embedding_function=embeddings)
llm = ChatGoogleGenerativeAI(model="gemini-3.5-flash",api_key=api_key)

class Query(BaseModel):
    question: str
    document_id: str 

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    file_path = f"temp_{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    try:
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        for doc in documents:
            doc.metadata["source"] = file.filename
            
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(documents)
        
        db.add_documents(chunks)
        
        return {"filename": file.filename, "message": "Upload successful"}
        
    except Exception as e:
        return {"error": str(e)}
        
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)


@app.post("/ask")
async def ask_question(query: Query):
    docs = db.similarity_search(
        query.question, 
        k=3,
        filter={"source": query.document_id} 
    )
    
    context = "\n".join([doc.page_content for doc in docs])
    
    prompt = (
        f"Answer the question based strictly on this context:\n{context}\n\n"
        f"Question: {query.question}"
    )
    
    response = llm.invoke(prompt)
    
    return {"answer": response.content}