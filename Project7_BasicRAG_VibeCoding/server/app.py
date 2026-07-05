"""Flask backend for the RAG Explorer."""

from __future__ import annotations

import logging
import traceback

from flask import Flask, jsonify, request
from flask_cors import CORS

import rag

app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("rag_explorer")


@app.get("/api/health")
def health():
    return jsonify(
        {
            "status": "ok",
            "groq_model": rag.GROQ_MODEL,
            "embed_model": rag.EMBED_MODEL,
            "groq_key_set": bool(rag.GROQ_API_KEY),
        }
    )


@app.get("/api/status")
def status():
    try:
        collection = rag.get_collection()
        count = collection.count()
    except Exception as exc:  # noqa: BLE001
        log.exception("status error")
        return jsonify({"error": str(exc)}), 500
    return jsonify({"chunk_count": count, "ready": count > 0})


@app.post("/api/ingest")
def ingest():
    try:
        result = rag.ingest_all()
        log.info("Ingestion complete: %s", result)
        return jsonify({"ok": True, "result": result})
    except FileNotFoundError as exc:
        return jsonify({"ok": False, "error": str(exc)}), 404
    except Exception as exc:  # noqa: BLE001
        log.exception("ingest error")
        return jsonify({"ok": False, "error": str(exc), "trace": traceback.format_exc()}), 500


@app.post("/api/query")
def query():
    data = request.get_json(silent=True) or {}
    question = (data.get("question") or "").strip()
    if not question:
        return jsonify({"error": "question is required"}), 400

    try:
        chunks = rag.retrieve_chunks(question, top_k=rag.TOP_K)
        if not chunks:
            return jsonify(
                {
                    "answer": "No documents have been ingested yet. Click 'Ingest PDF' first.",
                    "chunks": [],
                    "question": question,
                }
            )
        contexts = [c["content"] for c in chunks]
        answer = rag.generate_answer(question, contexts)
        return jsonify(
            {
                "answer": answer,
                "chunks": chunks,
                "question": question,
                "model": rag.GROQ_MODEL,
                "embed_model": rag.EMBED_MODEL,
            }
        )
    except Exception as exc:  # noqa: BLE001
        log.exception("query error")
        return jsonify({"error": str(exc), "trace": traceback.format_exc()}), 500


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
