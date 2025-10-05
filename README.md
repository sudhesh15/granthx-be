# 📚 GranthX Backend

Backend API for **GranthX.ai** – a GenAI-powered platform that turns documents, websites, and text into interactive conversations.  
It handles **indexing, embeddings, and chat responses** by integrating with **Qdrant** (vector DB) and **Cerebras Cloud** (LLaMA 3.1-8B model).

---

## ✨ Features

- **Indexing**
  - Upload PDFs/CSVs for ingestion
  - Provide URLs (websites, YouTube links) or raw text
- **Vector Storage** with **Qdrant**
- **Chat API** to ask questions grounded in indexed context
- **Cerebras Cloud Integration** for LLaMA 3.1-8B inference
- **Frontend Hosting**: Serves React build from `../frontend/build` if present

---

## 🛠️ Tech Stack

- **Node.js 18+**
- **Express.js**
- **Multer** (for file uploads)
- **Qdrant** (vector database)
- **Cerebras Cloud API**
- **dotenv**, **cors**

---

## 📂 Project Structure

/api
├── chatRoutes.js # POST /api/chat
└── indexRoutes.js # POST /api/index/*
/services
├── chatService.js # chatWithContext(query)
└── indexService.js # initIndexing(input)
server.js # app bootstrap & static hosting

yaml
Copy code

---

## ⚙️ Environment Variables

Create a `.env` file in the project root:

```env
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=
CEREBRAS_API_KEY=your_cerebras_api_key
PORT=5000
QDRANT_URL → Local (http://localhost:6333) or Cloud (https://<cluster>.cloud.qdrant.io)

QDRANT_API_KEY → Required for cloud; empty for local

CEREBRAS_API_KEY → From Cerebras Cloud dashboard

PORT → Defaults to 5000

🔒 Do not commit .env to git.

🚀 Run Locally
bash
Copy code
# Install dependencies
npm install

# Run in dev (with nodemon if available)
npm run dev

# Run in production
npm start
API available at: http://localhost:5000

🔌 API Endpoints
📤 1. Upload File (PDF/CSV)
POST /api/index/upload
Upload and index a document.

Body: multipart/form-data with field file

Example

bash
Copy code
curl -X POST http://localhost:5000/api/index/upload \
  -F "file=@/path/to/document.pdf"
Response

json
Copy code
{ "success": true, "message": "File indexed successfully" }
🌐 2. Index URL or Raw Text
POST /api/index/url-or-text

Body: JSON

json
Copy code
{ "input": "https://example.com/docs" }
or

json
Copy code
{ "input": "Paste plain text directly here" }
Response

json
Copy code
{ "success": true, "message": "Content indexed successfully" }
💬 3. Chat with Context
POST /api/chat

Body: JSON

json
Copy code
{ "query": "What does the pricing page say?" }
Response

json
Copy code
{
  "success": true,
  "response": "Your context-aware answer here..."
}
Example

bash
Copy code
curl -X POST http://localhost:5000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"query":"Summarize the docs index."}'
