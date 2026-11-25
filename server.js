// server.js — Nova AI backend (Railway) — relays chat messages to Google Gemini
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEMINI_API_KEY;

// Pehla model busy ho (503/429) toh agla try hoga
const MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.8-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SYSTEM_PROMPT = `You are Nova AI, a friendly and helpful AI assistant built by a solo developer learning to code.
Keep answers clear, warm, and not too long unless the user asks for depth.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body;

  if (!API_KEY) {
    return res.status(500).json({
      error: "No API key found. Set GEMINI_API_KEY as an environment variable before starting the server.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    let response;
    // 2 round: sab models try kar, sab busy ho toh 2 sec ruk ke dobara
    outer: for (let round = 0; round < 2; round++) {
      for (const model of MODELS) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": API_KEY,
          },
          body: JSON.stringify({
            contents,
            systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          }),
        });
        if (response.ok) break outer;
        console.error(`${model} failed (${response.status}), trying next...`);
        // sirf busy/quota/model-nahi-mila pe aage badh, baaki errors pe ruk ja
        if (![503, 429, 404].includes(response.status)) break outer;
      }
      await sleep(2000);
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(response.status).json({ error: "AI abhi busy hai, thodi der baad try kar." });
    }

    const data = await response.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("\n") ||
      "Hmm, I didn't get a response back. Try again?";

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong talking to the AI." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nova AI server running at http://localhost:${PORT}`);
});
