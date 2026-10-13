# Chat-With-PDF AI: Full-Stack RAG Document Assistant

[**Live Demo:**](https://chat-with-pdf-swart.vercel.app/) | [**Backend API:**](https://chat-with-pdf-1-eq85.onrender.com/) 

DocuChat AI is a production-ready Retrieval-Augmented Generation (RAG) platform. It allows users to upload complex PDF documents and instantly extract insights, summarize data, and answer questions using natural language. The system strictly grounds all AI responses in the uploaded document to eliminate hallucinations.

## Architecture & Tech Stack

**Frontend (The Face)**
* **Framework:** React.js powered by Vite for lightning-fast HMR.
* **UI/Rendering:** Custom CSS, `react-markdown`, and `rehype-katex` for parsing and rendering complex mathematical formulas and formatted text directly from the LLM.
* **Deployment:** Vercel

**Backend (The Brain)**
* **Framework:** FastAPI (Python) for high-performance, asynchronous API routing.
* **Vector Database:** ChromaDB for persistent, local semantic storage.
* **Orchestration:** LangChain for document chunking, prompt engineering, and pipeline management.
* **Deployment:** Render

**Artificial Intelligence**
* **LLM:** Google Gemini Flash (`gemini-3.8-flash`) tailored for high-speed, factual generation.
* **Embeddings:** Google Generative AI Embeddings (`gemini-embedding-2`) for vectorizing text chunks.

---

## Key Engineering Highlights

* **Multi-Tenant Context Isolation:** Engineered strict metadata filtering (`filter={"source": active_doc}`) within ChromaDB. This prevents cross-document contamination, ensuring the LLM only queries mathematical vectors belonging to the currently selected PDF.
* **Memory & Compute Optimization:** Initially prototyped with local Hugging Face transformer models (`all-MiniLM-L6-v2`). To resolve Out-Of-Memory (OOM) server crashes during PDF parsing on cloud infrastructure, the embedding architecture was migrated to Google's API-based embeddings, reducing server memory footprint by over 90%.
* **Hallucination Guardrails:** Implemented rigid prompt engineering that forces the LLM to rely *strictly* on the top 3 retrieved semantic chunks ($k=3$). If the answer is not in the text, the system is programmed to admit missing context rather than fabricating data.
* **Optimized Chunking Strategy:** Utilized `RecursiveCharacterTextSplitter` with a 1,000-character window and 200-character overlap to preserve semantic meaning and sentence continuity during vectorization.

---

## Future Enhancements

* **Authentication:** Integrate Firebase Auth to allow users to save their personal document history.
* **Cloud Vector Storage:** Migrate from local ChromaDB storage to a managed vector database (like Pinecone) for limitless horizontal scaling.
* **Multi-Modal Support:** Upgrade the LangChain pipeline to parse and embed images and charts found within the PDFs.
