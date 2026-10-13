import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; 

export default function App() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const [file, setFile] = useState(null);
  const [documents, setDocuments] = useState([]); 
  const [activeDoc, setActiveDoc] = useState("");
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${BACKEND_URL}/upload`, {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        const data = await response.json();
        const uploadedFilename = data.filename || file.name; 
        
        if (!documents.includes(uploadedFilename)) {
          setDocuments(prev => [...prev, uploadedFilename]);
        }
        
        setActiveDoc(uploadedFilename);
        setFile(null); 
        document.getElementById('pdf-upload').value = ""; 
      } else {
        alert("Upload failed. Check backend console.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Error connecting to backend for upload.");
    }
    setUploading(false);
  };

  const askQuestion = async () => {
    if (!activeDoc) {
      alert("Please upload and select a PDF first.");
      return;
    }

    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch(`${BACKEND_URL}/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          question: question,
          document_id: activeDoc 
        })
      });
      const data = await res.json();
      const responseText = Array.isArray(data.answer) 
        ? data.answer[0].text 
        : data.answer;

      setAnswer(responseText);
    } catch (error) {
      setAnswer("Error connecting to backend.",error);
    }
    setLoading(false);
  };

  return (
    <div style={{ 
      padding: "2rem", 
      maxWidth: "750px", 
      margin: "auto", 
      fontFamily: "Inter, system-ui, sans-serif",
      color: "#e2e8f0",
      backgroundColor: "#0f172a",
      minHeight: "100vh",
      boxSizing: "border-box"
    }}>
      <h2 style={{ textAlign: "center", marginBottom: "2rem", color: "#38bdf8" }}>Chat-With-PDF AI Platform</h2>
      
      <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>1. Upload PDF</h4>
        <input 
          id="pdf-upload"
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          style={{ marginBottom: "12px", display: "block", color: "#94a3b8" }}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          style={{ 
            padding: "8px 18px", 
            cursor: file ? "pointer" : "not-allowed",
            backgroundColor: file ? "#0284c7" : "#475569",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "500"
          }}
        >
          {uploading ? "Uploading & Embedding..." : "Upload PDF"}
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>2. Select Active Document</h4>
        <select 
          value={activeDoc} 
          onChange={(e) => setActiveDoc(e.target.value)}
          disabled={documents.length === 0}
          style={{ 
            width: "100%", 
            padding: "10px", 
            borderRadius: "6px", 
            backgroundColor: "#0f172a", 
            color: "#f8fafc", 
            border: "1px solid #475569" 
          }}
        >
          <option value="" disabled>
            {documents.length === 0 ? "No documents uploaded yet" : "Select a PDF"}
          </option>
          {documents.map((doc, index) => (
            <option key={index} value={doc}>{doc}</option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: "1.5rem", padding: "1.25rem", background: "#1e293b", borderRadius: "8px", border: "1px solid #334155" }}>
        <h4 style={{ margin: "0 0 12px 0", color: "#f8fafc" }}>3. Ask a Question</h4>
        <textarea 
          value={question} 
          onChange={(e) => setQuestion(e.target.value)} 
          placeholder="Ask a question about the active PDF..."
          style={{ 
            width: "100%", 
            height: "100px", 
            padding: "12px", 
            marginBottom: "1rem", 
            boxSizing: "border-box",
            borderRadius: "6px",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            border: "1px solid #475569",
            resize: "vertical"
          }}
        />
        <button 
          onClick={askQuestion} 
          disabled={loading || !activeDoc || !question.trim()} 
          style={{ 
            padding: "12px 20px", 
            cursor: (loading || !activeDoc || !question.trim()) ? "not-allowed" : "pointer", 
            width: "100%",
            backgroundColor: (loading || !activeDoc || !question.trim()) ? "#475569" : "#16a34a",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontWeight: "600"
          }}
        >
          {loading ? "Searching vector context & generating answer..." : "Ask Question"}
        </button>
      </div>
      
      {answer && (
        <div style={{ 
          marginTop: "2rem", 
          padding: "1.5rem", 
          background: "#1e293b", 
          borderRadius: "8px", 
          border: "1px solid #38bdf8",
          textAlign: "left"
        }}>
          <h4 style={{ margin: "0 0 1rem 0", color: "#38bdf8" }}>Answer:</h4>
          <div style={{ lineHeight: "1.6", color: "#f1f5f9" }}>
            <ReactMarkdown 
              remarkPlugins={[remarkMath]} 
              rehypePlugins={[rehypeKatex]}
            >
              {answer}
            </ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}