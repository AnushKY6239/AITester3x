import React, { useState, useEffect } from 'react';

function App() {
  const [pdfFiles, setPdfFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState('');
  const [ingestStatus, setIngestStatus] = useState('idle'); // idle, ingesting, success, error
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]); // each message: {role: 'user'|'assistant', content: string, chunks?: Array}
  const [loading, setLoading] = useState(false);

  // Helper to list PDF files in data/data (we'll need backend endpoint)
  // For simplicity, we can assume a known file or let user type filename.
  // We'll add a backend endpoint to list files.

  useEffect(() => {
    // fetch list of PDFs from backend
    async function fetchPdfs() {
      try {
        const resp = await fetch('http://localhost:8000/files');
        if (resp.ok) {
          const data = await resp.json();
          setPdfFiles(data.files || []);
        } else {
          console.warn('Failed to fetch PDF list');
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchPdfs();
  }, []);

  const handleIngest = async () => {
    if (!selectedFile) return;
    setIngestStatus('ingesting');
    try {
      const resp = await fetch(`http://localhost:8000/ingest?filename=${encodeURIComponent(selectedFile)}`, {
        method: 'POST',
      });
      if (resp.ok) {
        const result = await resp.json();
        setIngestStatus('success');
        alert(`Ingested ${result.chunks_indexed} chunks`);
      } else {
        const err = await resp.text();
        setIngestStatus('error');
        alert(`Ingestion failed: ${err}`);
      }
    } catch (e) {
      setIngestStatus('error');
      alert('Error: ' + e);
    }
  };

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMessage = chatInput;
    setChatInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);
    try {
      const resp = await fetch('http://localhost:8000/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage, top_k: 4 }),
      });
      if (!resp.ok) {
        const err = await resp.text();
        throw new Error(err);
      }
      const data = await resp.json();
      const assistantMsg = {
        role: 'assistant',
        content: data.answer,
        chunks: data.chunks || [],
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + e }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>RAG Explorer</h1>
      <div style={{ marginBottom: '20px' }}>
        <h2>Document Ingestion</h2>
        <div>
          <label>
            Select PDF:
            <select value={selectedFile} onChange={e => setSelectedFile(e.target.value)}>
              <option value="">-- choose a file --</option>
              {pdfFiles.map(f => (
                <option key={f} value={f}>
                  {f}
                </option>
              ))}
            </select>
          </label>
          <button onClick={handleIngest} disabled={!selectedFile || ingestStatus === 'ingesting'}>
            {ingestStatus === 'ingesting' ? 'Ingesting...' : 'Ingest'}
          </button>
          {ingestStatus === 'success' && <span style={{ color: 'green', marginLeft: '10px' }}>✅ Ingested</span>}
          {ingestStatus === 'error' && <span style={{ color: 'red', marginLeft: '10px' }}>❌ Error</span>}
        </div>
      </div>

      <div style={{ border: '1px solid #ddd', padding: '15px', borderRadius: '8px' }}>
        <h2>Chat</h2>
        <div style={{ height: '400px', overflowY: 'auto', marginBottom: '10px', border: '1px solid #eee', padding: '10px' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ marginBottom: '15px' }}>
              {msg.role === 'user' && (
                <div style={{ background: '#e3f2fd', padding: '10px', borderRadius: '8px' }}>
                  <strong>You:</strong> {msg.content}
                </div>
              )}
              {msg.role === 'assistant' && (
                <>
                  <div style={{ background: '#f5f5f5', padding: '10px', borderRadius: '8px' }}>
                    <strong>Assistant:</strong> {msg.content}
                  </div>
                  {msg.chunks && msg.chunks.length > 0 && (
                    <div style={{ marginTop: '10px' }}>
                      <strong>Retrieved Chunks:</strong>
                      {msg.chunks.map((chunk, i) => (
                        <div key={i} style={{ background: '#fff9c4', padding: '8px', margin: '5px 0', borderRadius: '4px', fontSize: '0.9em' }}>
                          <div>Distance: {chunk.distance?.toFixed(4)}</div>
                          <div>Source: {chunk.metadata?.source}</div>
                          <div>{chunk.content}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
          {loading && <div>Thinking...</div>}
        </div>
        <div>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
            placeholder="Ask a question about the document..."
            style={{ width: '70%', padding: '8px' }}
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading || !chatInput.trim()} style={{ marginLeft: '10px', padding: '8px 16px' }}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
