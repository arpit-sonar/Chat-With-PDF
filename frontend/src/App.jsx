import { useState } from 'react';

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

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

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
      setAnswer("Error connecting to backend.");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "600px", margin: "auto", fontFamily: "sans-serif" }}>
      <h2>RAG Platform Prototype</h2>
      
      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9f9f9", borderRadius: "5px", border: "1px solid #ddd" }}>
        <h4 style={{ margin: "0 0 10px 0" }}>1. Upload PDF</h4>
        <input 
          id="pdf-upload"
          type="file" 
          accept=".pdf" 
          onChange={handleFileChange} 
          style={{ marginBottom: "10px", display: "block" }}
        />
        <button 
          onClick={handleUpload} 
          disabled={!file || uploading}
          style={{ padding: "5px 15px", cursor: file ? "pointer" : "not-allowed" }}
        >
          {uploading ? "Uploading..." : "Upload PDF"}
        </button>
      </div>

      <div style={{ marginBottom: "1.5rem", padding: "1rem", background: "#f9f9f9", borderRadius: "5px", border: "1px solid #ddd" }}>
        <h4 style={{ margin: "0 0 10px 0" }}>2. Select Active Document</h4>
        <select 
          value={activeDoc} 
          onChange={(e) => setActiveDoc(e.target.value)}
          disabled={documents.length === 0}
          style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
        >
          <option value="" disabled>
            {documents.length === 0 ? "No documents uploaded yet" : "Select a PDF"}
          </option>
          {documents.map((doc, index) => (
            <option key={index} value={doc}>{doc}</option>
          ))}
        </select>
      </div>

      <h4 style={{ margin: "0 0 10px 0" }}>3. Ask a Question</h4>
      <textarea 
        value={question} 
        onChange={(e) => setQuestion(e.target.value)} 
        placeholder="Ask a question about the active PDF..."
        style={{ width: "100%", height: "100px", padding: "10px", marginBottom: "1rem", boxSizing: "border-box" }}
      />
      <button 
        onClick={askQuestion} 
        disabled={loading || !activeDoc || !question.trim()} 
        style={{ padding: "10px 20px", cursor: (loading || !activeDoc || !question.trim()) ? "not-allowed" : "pointer", width: "100%" }}
      >
        {loading ? "Searching documents..." : "Ask"}
      </button>
      
      {answer && (
        <div style={{ marginTop: "2rem", padding: "1rem", background: "#f4f4f4", borderRadius: "5px", border: "1px solid #ddd" }}>
          <strong>Answer:</strong>
          <p style={{ whiteSpace: "pre-wrap", margin: "10px 0 0 0" }}>{answer}</p>
        </div>
      )}
    </div>
  );
}