import dotenv from "dotenv";
import Parser from "rss-parser";
import axios from "axios";
import { load } from "cheerio";
import { v4 as uuidv4 } from "uuid";
import { embedTexts } from "../services/embeddings.js";
import { initQdrant, upsertPoints } from "../services/qdrant.js";
import { RSS_FEEDS } from "../utils/rssFeed.js";

dotenv.config();

const BROWSER_HEADER = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36",
};



function chunkText(text, maxWords = 400) {
  const words = text.split(/\s+/);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    chunks.push(words.slice(i, i + maxWords).join(" "));
  }
  return chunks;
}

function htmlToText(html) {
  const $ = load(html);
  $("script, style, noscript").remove();
  return $("body").text().replace(/\s+/g, " ").trim();
}

async function fetchArticle(url) {
  try {
    const r = await axios.get(url, { headers: BROWSER_HEADER, timeout: 20000 });
    return htmlToText(r.data);
  } catch (e) {
    console.warn("failed fetch", url, e.message);
    return null;
  }
}

async function ingest() {
  await initQdrant();
  const parser = new Parser({
    requestOptions: {
      headers: BROWSER_HEADER,
    },
  });

  const entries = [];

  for (const feedUrl of RSS_FEEDS) {
    try {
      const feed = await parser.parseURL(feedUrl);
      for (const item of feed.items) {
        entries.push(item);
        if (entries.length >= 50) break;
      }
      if (entries.length >= 50) break;
    } catch (e) {
      console.warn("rss error", feedUrl, e.message);
    }
  }

  const docs = [];
  for (const it of entries) {
    const url = it.link || it.enclosure?.url;
    if (!url) continue;
    const txt = await fetchArticle(url);
    if (!txt) continue;
    const chunks = chunkText(txt);
    for (const chunk of chunks) {
      docs.push({ id: uuidv4(), text: chunk, url, meta: { title: it.title, pubDate: it.pubDate } });
    }
  }

  const BATCH = 16;
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH);
    const texts = batch.map(d => d.text);
    const vectors = await embedTexts(texts);
    const payload = batch.map((d, idx) => ({
      id: d.id,
      vector: vectors[idx],
      payload: { text: d.text, url: d.url, meta: d.meta }
    }));
    await upsertPoints(payload);
    // console.log(`upserted ${i + points.length}/${docs.length}`);
  }

  console.log("ingest done:", docs.length);
}

ingest().catch(err => {
  console.error("Fatal error in ingest:", err);
  process.exit(1);
});