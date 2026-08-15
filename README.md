# AI Prompt Studio — Generation Engine

A content generation tool built on Google's Gemini API. Pick a creative format, describe a topic, and get back a structured draft — with the API key kept on a Node backend rather than shipped to the browser.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-Express_5-339933?logo=node.js&logoColor=white)
![Gemini](https://img.shields.io/badge/Google_Gemini-2.5_Flash-4285F4?logo=google&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)

---

## Screenshots

<!-- Suggested: the format/topic form, and a generated output with the Save to Vault button. -->

_Coming soon._

---

## What it does

Four creative formats, each producing a different kind of draft:

- Anime Animation Script
- ASMR Audio Outline
- Midjourney Visual Prompt
- YouTube Hook & Intro

Enter a topic, hit generate, and the server wraps your input in a role-primed prompt before sending it to Gemini. Output comes back as Markdown and can be saved to a local vault in the browser.

---

## Tech stack

| Layer | Choices |
|---|---|
| Frontend | React 19, Vite, Axios, Tailwind CSS (CDN) |
| Backend | Node.js, Express 5 |
| AI | Google Gemini 2.5 Flash via `@google/genai` |

```
AI-Generation-Engine/
├── client/src/
│   ├── api/axios.js            Pre-configured Axios instance
│   └── components/Generator.jsx
└── server/
    ├── controllers/aiController.js   Prompt construction + Gemini call
    ├── routes/generate.js
    └── server.js
```

---

## Engineering notes

### The API key never reaches the browser

This is the whole reason there's a backend. Calling Gemini directly from React would mean bundling the key into JavaScript that anyone can read via DevTools — and a leaked key is billable to you until you notice.

The flow instead:

```
Browser → POST /api/generate { topic, format } → Express → Gemini (key server-side) → response
```

The key lives in `server/.env`, read as `process.env.GEMINI_API_KEY`. The client never sees it and doesn't need to.

### Prompt engineering happens server-side

The user types a topic; the server turns it into an instruction:

```js
const masterPrompt = `Act as an expert creative director. Write a highly detailed ${format} about the following topic: "${topic}".
Please format the output cleanly using Markdown, with clear headings, bullet points where necessary, and highly readable spacing.`;
```

Two things this buys. Assigning a role ("expert creative director") measurably improves output quality over a bare topic. And requesting Markdown explicitly makes the response predictable enough to render consistently instead of arriving in whatever shape the model chose.

Keeping the template on the server also means prompt tuning is a backend deploy, not a frontend rebuild — and users can't tamper with the instruction.

### Inputs are validated before spending a request

```js
if (!topic || !format) {
  return res.status(400).json({ message: "Topic and format are required." });
}
```

An empty topic would produce a useless generation *and* consume API quota. Rejecting it early costs nothing.

### The vault is deliberately local

Saving writes to `localStorage` rather than a database:

```js
const updatedVault = [newPrompt, ...existingVault];
localStorage.setItem("ai_vault", JSON.stringify(updatedVault));
```

No accounts, no server storage, no privacy surface. The tradeoff is honest — saved generations don't follow you to another browser or device.

---

## API reference

| Method | Route | Body | Description |
|---|---|---|---|
| POST | `/api/generate` | `{ topic, format }` | Generate content, returns `{ generatedText }` |
| GET | `/api/status` | — | Health check |

---

## Running locally

**You'll need:** Node 18+ and a Gemini API key — free from [Google AI Studio](https://aistudio.google.com/app/apikey).

```bash
git clone https://github.com/EnnilavanSV/AI-GenerationEngine.git
cd AI-GenerationEngine
```

**Server**

```bash
cd server
npm install
```

`server/.env`:

```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key
```

```bash
node server.js       # → http://localhost:5000
```

**Client**

```bash
cd ../client
npm install
npm run dev          # → http://localhost:5173
```

> **Point the client at your local server.** `client/src/api/axios.js` has a hardcoded remote `baseURL`. To develop locally, change it to `http://localhost:5000/api` — see Known limitations.

---

## Environment variables

`server/.env`

| Variable | Description |
|---|---|
| `PORT` | API port (defaults to 5000) |
| `GEMINI_API_KEY` | Google Gemini key — server-side only, never expose |

---

## Known limitations

- **The API base URL is hardcoded.** `client/src/api/axios.js` points at a fixed remote host instead of reading `import.meta.env.VITE_API_URL`, so a fresh clone can't talk to a local server without editing source. This is the first thing to fix.
- **Tailwind is loaded from the CDN.** `index.html` pulls `cdn.tailwindcss.com`, which Tailwind explicitly marks as not for production — no tree-shaking, no build-time purge, and a hard dependency on a third-party script at runtime. Installing it as a Vite plugin is the proper setup.
- **No rate limiting.** Nothing stops repeated requests from burning through API quota.
- **Markdown isn't rendered.** The response asks for Markdown but the client displays it as preformatted text, so headings and bullets show as raw syntax. `react-markdown` would close the loop.
- **No streaming.** The UI waits for the complete response instead of streaming tokens, so long generations feel frozen behind a loading label.
- **CORS is open**, and there are no automated tests.

## Roadmap

- [ ] Env-driven API base URL
- [ ] Tailwind as a build-time dependency
- [ ] Render the Markdown properly
- [ ] Stream responses for faster perceived output
- [ ] Rate limiting on the generate endpoint

---

## Author

**Ennilavan SV** — MERN stack developer

[GitHub](https://github.com/EnnilavanSV) · [LinkedIn](https://www.linkedin.com/in/ennilavan-sv-09a151340) · [Portfolio](https://personal-portfolio-kappa-topaz-a13ieb812t.vercel.app/)
