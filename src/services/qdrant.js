import {QdrantClient} from "@qdrant/js-client-rest";
import dotenv from "dotenv";

dotenv.config();

const QDRANT_URL = process.env.QDRANT_URL ;
const collectionName = process.env.QDRANT_COLLECTION || "news";
const QDRANT_API_KEY = process.env.QDRANT_API_KEY;
let client;
export async function initQdrant() {
    client = new QdrantClient({
    url: QDRANT_URL,
    apiKey: QDRANT_API_KEY, 
});  
    
    try{
        await client.getCollection(collectionName);
    }catch(error){
        console.log(`Collection not found, creating...`);
        const vectorSize = parseInt(process.env.EMBED_DIM || "1024", 10);
        // console.log(`Using vector size: ${vectorSize}`);
        await client.createCollection(collectionName,{
            vectors:{size:vectorSize, distance:"Cosine"}
        });
        console.log(`Collection ${collectionName} created.`);
    }
    return client;
}

export async function upsertPoints(points) {
    if(!client)await initQdrant();
    try{
    await client.upsert(collectionName, {points});
    }catch(error){
        console.error("Failed to upsert points to Qdrant:",error);
       
    }
    
}
export async function qdrantSearch(vector, k=5) {
    if(!client)await initQdrant();
    const searchResult = await client.search(collectionName, {
        vector,
        limit: k,
        with_payload: true
    });
    return searchResult;    
}