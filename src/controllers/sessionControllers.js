import { getFullSessionHistory, clearSessionHistory } from '../services/sessionStore.js';


export async function getSessionHistory(req, res) {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ error: "sessionId is required" });
        }
        const history = await getFullSessionHistory(sessionId);
        return res.json({ history });
    } catch (error) {
        console.error("Error in getSessionHistory:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}


export async function clearSession(req, res) {
    try {
        const { sessionId } = req.params;
        if (!sessionId) {
            return res.status(400).json({ error: "sessionId is required" });
        }
        await clearSessionHistory(sessionId);
        return res.status(200).json({ message: "Session cleared successfully." });
    } catch (error) {
        console.error("Error in clearSession:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}