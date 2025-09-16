import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import chatRouter from "../src/routes/chat.js";

import sessionRouter from "../src/routes/session.js";
import { initRedis } from "./services/sessionStore.js";
import { initQdrant } from "./services/qdrant.js";

dotenv.config();
const app = express();

const PORT = process.env.PORT || 4000;
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.use('/api/chat', chatRouter);
app.use('/api/session', sessionRouter); 

async function startServer() {
    try {
        await initRedis();
        await initQdrant();
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }       
}

startServer();  