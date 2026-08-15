// Standalone Gemini diagnostic - takes Express entirely out of the picture.
//
//   cd server
//   node scripts/testGemini.js
//
// If this passes, your key and model are fine and the problem is in the API
// layer. If it fails, the message below tells you exactly which part is wrong.

import dotenv from "dotenv";
dotenv.config();

import { GoogleGenAI } from "@google/genai";

const KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Models to try in order if the configured one fails, so a single run tells you
// which names this key can actually reach.
const FALLBACKS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
  "gemini-flash-latest",
];

console.log("Gemini diagnostic\n");

if (!KEY) {
  console.error("FAIL  GEMINI_API_KEY is not set.");
  console.error("      Create server/.env containing:  GEMINI_API_KEY=your_key");
  console.error("      Get a free key: https://aistudio.google.com/app/apikey");
  process.exit(1);
}

console.log(`key    loaded (${KEY.length} chars, starts "${KEY.slice(0, 6)}...")`);
if (!KEY.startsWith("AIza")) {
  console.warn('warn   Gemini keys normally start with "AIza" - double-check this value.');
}
console.log(`model  ${MODEL}\n`);

const ai = new GoogleGenAI({ apiKey: KEY });

const attempt = async (model) => {
  process.stdout.write(`trying ${model.padEnd(22)} ... `);
  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Reply with exactly the word: OK",
    });
    const text = response?.text;
    if (!text) {
      console.log("no text returned (possibly safety-blocked)");
      return false;
    }
    console.log(`OK -> "${text.trim().slice(0, 40)}"`);
    return true;
  } catch (error) {
    const msg = error?.message || String(error);
    console.log(`FAILED`);
    console.log(`       ${msg.split("\n")[0]}`);

    if (/API key not valid|API_KEY_INVALID/i.test(msg)) {
      console.log("       -> The key itself is rejected. Regenerate it in AI Studio.");
    } else if (/not found|404|not supported/i.test(msg)) {
      console.log("       -> This model name is unavailable for your key.");
    } else if (/quota|RESOURCE_EXHAUSTED|429/i.test(msg)) {
      console.log("       -> Quota or rate limit hit. Wait and retry.");
    } else if (/permission|PERMISSION_DENIED|403/i.test(msg)) {
      console.log("       -> Enable the Generative Language API for this key's project,");
      console.log("          and check the key has no referrer/API restrictions.");
    } else if (/fetch failed|ENOTFOUND|ETIMEDOUT|network/i.test(msg)) {
      console.log("       -> Network problem reaching Google. Check connection/proxy/firewall.");
    }
    return false;
  }
};

const order = [MODEL, ...FALLBACKS.filter((m) => m !== MODEL)];
let working = null;

for (const model of order) {
  if (await attempt(model)) {
    working = model;
    break;
  }
}

console.log();
if (working) {
  console.log(`PASS  "${working}" works with this key.`);
  if (working !== MODEL) {
    console.log(`      Your configured model (${MODEL}) did not. Add this to server/.env:`);
    console.log(`      GEMINI_MODEL=${working}`);
  } else {
    console.log("      Key and model are both fine - the problem is elsewhere in the API layer.");
  }
} else {
  console.log("FAIL  No model worked. The messages above identify the cause.");
  process.exit(1);
}
