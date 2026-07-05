import { useState, useEffect, useCallback } from 'react'
import './App.css'

const API = ''

const PIPELINE = [
  { id: 'ingest',   label: '1. PDF Ingest',   desc: 'Read PDF from data/data' },
  { id: 'chunk',    label: '2. Chunking',     desc: 'Split text into ~1000 char chunks' },
  { id: 'embed',    label: '3. Embedding',    desc: 'nomic-embed-text-v2-moe (Ollama)' },
  { id: 'store',    label: '4. Store',        desc: 'Persist vectors in ChromaDB' },
  { id: 'retrieve', label: '5. Retrieve',     desc: 'Top-4 similar chunks' },
  { id: 'answer',   label: '6. Generate',     desc: 'Groq openai/gpt-oss-120b' },
]

function Stage({ active, done, label, desc }) {
  return (
    <div className={`stage ${active ? 'active' : ''} ${done ? 'done' : ''}`}>
      <div className="stage-dot" />
      <div className="stage-text">
        <div className="stage-label">{label}</div>
        <div className="stage-desc">{desc}</div>
      </div>
    </div>
  )
}

export default function App() {
  const [health, setHealth] = useState(null)
  const [chunkCount, setChunkCount] = useState(0)
  const [ingestResult, setIngestResult] = useState(null)
  const [ingesting, setIngesting] = useState(false)
  const [error, setError] = useState(null)

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState(null)
  const [chunks, setChunks] = useState([])
  const [querying, setQuerying] = useState(false)
  const [activeStage, setActiveStage] = useState(null)

  const fetchStatus = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/status`)
      const j = await r.json()
      setChunkCount(j.chunk_count || 0)
    } catch (e) {
      // ignore
    }
  }, [])

  const fetchHealth = useCallback(async () => {
    try {
      const r = await fetch(`${API}/api/health`)
      setHealth(await r.json())
    } catch (e) {
      setHealth(null)
    }
  }, [])

  useEffect(() => {
    fetchHealth()
    fetchStatus()
  }, [fetchHealth, fetchStatus])

  const ingest = async () => {
    setIngesting(true)
    setError(null)
    setIngestResult(null)
    try {
      const r = await fetch(`${API}/api/ingest`, { method: 'POST' })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Ingest failed')
      setIngestResult(j.result)
      await fetchStatus()
    } catch (e) {
      setError(e.message)
    } finally {
      setIngesting(false)
    }
  }

  const ask = async () => {
    if (!question.trim()) return
    setQuerying(true)
    setError(null)
    setAnswer(null)
    setChunks([])
    const steps = ['retrieve', 'answer']
    for (const s of steps) {
      setActiveStage(s)
      await new Promise((res) => setTimeout(res, 350))
    }
    try {
      const r = await fetch(`${API}/api/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      })
      const j = await r.json()
      if (!r.ok) throw new Error(j.error || 'Query failed')
      setAnswer(j.answer)
      setChunks(j.chunks || [])
    } catch (e) {
      setError(e.message)
    } finally {
      setActiveStage(null)
      setQuerying(false)
    }
  }

  const isDone = (id) => {
    if (id === 'ingest') return ingestResult || chunkCount > 0
    if (id === 'chunk') return !!ingestResult
    if (id === 'embed') return !!ingestResult
    if (id === 'store') return chunkCount > 0
    if (id === 'retrieve') return chunks.length > 0
    if (id === 'answer') return !!answer
    return false
  }

  return (
    <div className="app">
      <header className="header">
        <h1>RAG Explorer</h1>
        <p className="subtitle">
          PDF → Chunks → Embeddings → ChromaDB → Retrieval → Groq LLM
        </p>
        <div className="badges">
          <span className={`badge ${health ? 'ok' : 'bad'}`}>
            Backend {health ? 'online' : 'offline'}
          </span>
          {health && (
            <>
              <span className="badge">Embed: {health.embed_model}</span>
              <span className="badge">LLM: {health.groq_model}</span>
              <span className={`badge ${health.groq_key_set ? 'ok' : 'bad'}`}>
                Groq key {health.groq_key_set ? 'set' : 'MISSING'}
              </span>
            </>
          )}
        </div>
      </header>

      <section className="pipeline">
        {PIPELINE.map((s) => (
          <Stage
            key={s.id}
            label={s.label}
            desc={s.desc}
            active={activeStage === s.id || (ingesting && s.id === 'ingest')}
            done={isDone(s.id)}
          />
        ))}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Ingestion</h2>
          <button onClick={ingest} disabled={ingesting}>
            {ingesting ? 'Ingesting…' : 'Ingest PDF'}
          </button>
        </div>
        <p className="muted">
          Reads all <code>*.pdf</code> files from <code>data/data/</code>, splits into chunks,
          embeds with Ollama, and stores in a local ChromaDB instance.
        </p>
        {chunkCount > 0 && (
          <p className="muted">Stored chunks: <strong>{chunkCount}</strong></p>
        )}
        {ingestResult && (
          <div className="result">
            <h3>Ingestion result</h3>
            <div className="stat-row">
              <span>Total chunks: <strong>{ingestResult.total_chunks}</strong></span>
              <span>Store time: <strong>{ingestResult.store_time_sec}s</strong></span>
              <span>Model: {ingestResult.embed_model}</span>
            </div>
            <table>
              <thead>
                <tr><th>File</th><th>Chars</th><th>Chunks</th><th>Time (s)</th></tr>
              </thead>
              <tbody>
                {ingestResult.files.map((f) => (
                  <tr key={f.file}>
                    <td>{f.file}</td><td>{f.chars}</td><td>{f.chunks}</td><td>{f.time_sec}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Ask a question</h2>
          <button onClick={ask} disabled={querying || !question.trim()}>
            {querying ? 'Thinking…' : 'Ask'}
          </button>
        </div>
        <textarea
          rows={3}
          placeholder="e.g. What is the main goal of the VWO PRD?"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ask()
          }}
        />
        <p className="muted hint">Ctrl/Cmd+Enter to submit</p>
      </section>

      {error && <div className="error">⚠ {error}</div>}

      {chunks.length > 0 && (
        <section className="card">
          <h2>Retrieved chunks (top {chunks.length})</h2>
          <div className="chunks">
            {chunks.map((c, i) => (
              <div className="chunk" key={i}>
                <div className="chunk-head">
                  <span className="chunk-num">#{i + 1}</span>
                  <span className="chunk-src">{c.source} · idx {c.index}</span>
                  <span className="chunk-score">score {c.score}</span>
                </div>
                <p>{c.content}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {answer && (
        <section className="card answer-card">
          <h2>Answer</h2>
          <div className="answer">{answer}</div>
        </section>
      )}

      <footer className="footer">
        RAG Explorer · React + Flask · Ollama · ChromaDB · Groq
      </footer>
    </div>
  )
}
