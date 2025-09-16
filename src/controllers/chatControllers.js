import { embedTexts } from "../services/embeddings.js"; 
import { qdrantSearch } from "../services/qdrant.js";
import { streamGemini } from "../services/gemini.js";
import { getSessionHistory, pushSessionEntry, getFullSessionHistory } from "../services/sessionStore.js";


export async function handleChat(req, res) {
    try {
        const { session_id, query, k = 5 } = req.body;
        if (!session_id || !query) {
            return res.status(400).json({ error: "session_id and query are required" });
        }

        const history = await getSessionHistory(session_id, 2);
        const [qvec] = await embedTexts([query]);
        const hits = await qdrantSearch(qvec, k);
        const prompt = buildRagPrompt(query, hits, history);

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders();

        const stream = streamGemini(prompt);
        let fullAnswer = "";

        for await (const chunk of stream) {
            fullAnswer += chunk;
            res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
        }

        const entry = { role: "user", query, hits: hits.length, answer: fullAnswer, ts: Date.now() };
        await pushSessionEntry(session_id, entry);

        res.end();

    } catch (error) {
        console.error("Error in handleChat:", error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Internal Server Error" });
        } else {
            res.end();
        }
    }
}


function buildRagPrompt(query, passages, history = []) {
    let prompt = "Use the following passages to answer the question.\n\n";
    passages.forEach((h, i) => {
        const text = h.payload?.text ?? h.payload?.content ?? "";
        prompt += `PASSAGE ${i + 1} (score=${h.score ?? h.distance ?? "NA"}):\n${text}\nSOURCE: 
        ${h.payload?.url ?? "unknown"}\n\n`;
    });

    if (history.length > 0) {
        prompt += "This is the conversation history so far:\n";
        history.forEach(entry => {
            prompt += `User asked: "${entry.query}"\nYou answered: "${entry.answer}"\n\n`;
        });
    }
    prompt += `Based on the passages and conversation history, answer the user's current question below.\n`;
    prompt += `User question: ${query}\n\nAnswer like you are human and replying to Query and give relevent 
    and concise answer only .`;
    
    return prompt;
}