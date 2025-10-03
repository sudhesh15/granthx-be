import { OpenAIEmbeddings } from "@langchain/openai";
import { QdrantVectorStore } from "@langchain/qdrant";
import Cerebras from "@cerebras/cerebras_cloud_sdk";

const cerebras = new Cerebras({
  apiKey: process.env.CEREBRAS_API_KEY,
});

export async function chatWithContext(
  userQuery,
  {
    stream = false,
    onToken,
    model = "llama3.1-8b",
    temperature = 0.7,
    top_p = 0.8,
    max_completion_tokens = 2000,
  } = {}
) {

  const embeddings = new OpenAIEmbeddings({
    model: "text-embedding-3-large",
  });

  const vectorStore = await QdrantVectorStore.fromExistingCollection(embeddings, {
    url: process.env.QDRANT_URL,
    collectionName: "granthX",
    apiKey: process.env.QDRANT_API_KEY,
  });

  const retriever = vectorStore.asRetriever({ k: 3 });
  const relevantChunks = await retriever.invoke(userQuery);

  const contextText = relevantChunks
    .map((chunk, index) => `Source ${index + 1}:\n${chunk.pageContent}`)
    .join("\n\n---\n\n");

  const SYSTEM_PROMPT = `You are a helpful AI assistant. Answer questions based ONLY on the provided context.

FORMATTING RULES:
- Use clear headings with ## for main topics
- Use bullet points for lists
- Use **bold** for important terms
- Use proper paragraph spacing
- Keep responses well-structured and easy to read
- If providing steps, use numbered lists
- Include relevant examples when helpful

Context:
${contextText}

If the context doesn't contain enough information to answer the question, say so politely and suggest what additional information might be needed.`;

  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: userQuery },
  ];

  if (!stream) {
    const resp = await cerebras.chat.completions.create({
      model,
      messages,
      temperature,
      top_p,
      max_completion_tokens,
    });

    return resp.choices?.[0]?.message?.content || "";
  }

  const s = await cerebras.chat.completions.create({
    model,
    messages,
    temperature,
    top_p,
    max_completion_tokens,
    stream: true,
  });

  let full = "";
  for await (const chunk of s) {
    const delta = chunk?.choices?.[0]?.delta?.content || "";
    if (delta) {
      full += delta;
      if (onToken) onToken(delta);
    }
  }
  return full;
}
