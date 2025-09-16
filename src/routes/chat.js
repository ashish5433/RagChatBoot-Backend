import express from 'express';
import {handleChat} from '../controllers/chatControllers.js';
import { Router } from 'express';

const router = Router();
router.post('/', handleChat);

export default router;