# Nova AI — your own AI chat app (powered by Google Gemini, free)

A working chat app powered by Google's Gemini API — completely free, no credit card needed. You built this.

## Setup (5 minutes)

1. **Install Node.js** (v18+) if you don't have it: https://nodejs.org

2. **Get a free API key**
   - Go to https://aistudio.google.com/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Set your API key** (in the same terminal you'll run the server from)

   Mac/Linux:
   ```bash
   export GEMINI_API_KEY="your-key-here"
   ```
   Windows (PowerShell):
   ```bash
   $env:GEMINI_API_KEY="your-key-here"
   ```

5. **Run it**
   ```bash
   npm start
   ```
   Open http://localhost:3000 in your browser. Start chatting.

## What's what

- `server.js` — Express backend. Receives your message, forwards it to the Gemini API, sends the reply back.
- `public/index.html` — the chat page structure.
- `public/style.css` — the look and feel.
- `public/script.js` — handles typing, sending messages, and rendering replies.

## Free tier limits

Gemini's free tier (as of writing) gives you a generous number of requests per day for `gemini-2.0-flash` — plenty for personal use and learning. If you ever hit a limit, just wait until it resets, or check https://ai.google.dev/pricing for current details.

## Make it yours

- **Change the personality/name**: edit `SYSTEM_PROMPT` in `server.js`.
- **Change the model**: edit `MODEL` in `server.js` (see https://ai.google.dev/gemini-api/docs/models for current free-tier models).
- **Change the look**: colors and fonts are all in `public/style.css` under `:root`.
- **Add memory across sessions**: right now chat history resets on page reload — you could save it to a database (like SQLite) so conversations persist.

## Deploying it live

Once it works locally, you can put it online for free on:
- [Render](https://render.com) — easiest for Node apps
- [Railway](https://railway.app)

Just remember to set `GEMINI_API_KEY` as an environment variable in whichever platform you use — never commit it into your code or GitHub repo.
