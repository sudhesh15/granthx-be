GranthX Backend — README
Overview

Node/Express API powering GranthX.ai. Handles:

Content ingestion (PDF/CSV, YouTube transcripts, website crawl, pasted text)

Chunking + embeddings

Vector storage in Qdrant

Retrieval + answer generation via Cerebras (LLaMA 3.1-8B)

Tech

Node 18+

Express

Qdrant (vector DB)

Cerebras Cloud (inference)

Prerequisites

Node 18+

Running Qdrant instance (local or cloud)

Environment

Create .env in the project root:

QDRANT_URL=https://YOUR-QDRANT-URL
QDRANT_API_KEY=YOUR_QDRANT_API_KEY
CEREBRAS_API_KEY=YOUR_CEREBRAS_API_KEY


If you also use local Qdrant: QDRANT_URL=http://localhost:6333 and leave QDRANT_API_KEY empty if not required.

Install & Run
npm install
npm run dev     # if you have nodemon
# or
npm start       # production start


Default server port is typically 5000 (update PORT in your code if needed).

Typical Endpoints (example)

Adjust to match your routes if names differ.

POST /api/index/upload — upload PDF/CSV

POST /api/index/youtube — add by YouTube URL (fetch transcript)

POST /api/index/website — crawl site and index content

POST /api/index/text — index raw pasted text

POST /api/chat — body: { query: "..." } → answer + sources

Example (cURL)
curl -X POST "$API_BASE/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"query":"What does the docs say about pricing?"}'

Deployment Notes

Local Dev: ensure Qdrant is reachable (cloud or local 6333).

CORS: allow your frontend origin (e.g., http://localhost:3000 or your production domain).

File Uploads: if using serverless (e.g., Vercel), prefer diskless/streamed upload or use /tmp with size limits.

Env on Hosts: set QDRANT_URL, QDRANT_API_KEY, CEREBRAS_API_KEY in the host dashboard.

Troubleshooting

401/403 on Qdrant: verify API key and URL scheme (https:// for cloud).

Model errors: check CEREBRAS_API_KEY and model name/version used in code.

Time-outs on large crawls: add sensible crawl depth/rate limits and timeouts.

Security

Never commit .env.

Validate and sanitize URLs for crawls.

Limit file size/types on upload.
