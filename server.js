// server.js — simple backend that relays chat messages to the Google Gemini API (free tier)
const express = require("express");
 require("dotenv").config();
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = "gemini-3-flash-preview"; // current free-tier model

// System prompt — this is where you give your AI its personality/name
const SYSTEM_PROMPT = `You are Nova AI, a friendly and helpful AI assistant built by a solo developer learning to code.
Keep answers clear, warm, and not too long unless the user asks for depth.`;

app.post("/api/chat", async (req, res) => {
  const { messages } = req.body; // [{ role: "user"|"assistant", content: "..." }]

  if (!API_KEY) {
    return res.status(500).json({
      error:
        "No API key found. Set GEMINI_API_KEY as an environment variable before starting the server.",
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  // Gemini uses "user" / "model" roles instead of "user" / "assistant",
  // and wraps text in a "parts" array.
  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API error:", errText);
      return res.status(response.status).json({ error: "Upstream API error", detail: errText });
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
