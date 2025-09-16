import express from 'express';
import { getSessionHistory, clearSession } from "../controllers/sessionControllers.js";
import { Router } from 'express';

const router = Router();

router.get('/:sessionId/history', getSessionHistory);
router.delete('/:sessionId', clearSession);

export default router;