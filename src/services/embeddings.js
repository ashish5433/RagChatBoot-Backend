import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const JINA_URL = process.env.JINA_URL || "https://api.jina.ai/v1/embeddings";
const JINA_API_KEY = process.env.JINA_API_KEY ;  

if(!JINA_URL || !JINA_API_KEY) {
    throw new Error("Jina URL or API Key is not set in environment variables");
}

export async function embedTexts(texts,model="jina-embeddings-v3") {
    const payload={model,input:texts};
    const headers={"Authorization":`Bearer ${JINA_API_KEY}`};      
    const response=await axios.post(JINA_URL,payload,{headers});
    // console.log("Jina response:",response.data.data);
    if(response.status!==200 || !response.data || !Array.isArray(response.data.data)){
        throw new Error(`Failed to get embeddings from Jina: ${response.status} - ${response.statusText}`);
    }       
    return response.data.data.map(e=>e.embedding|| e);

}