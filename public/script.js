const chatEl = document.getElementById("chat");
const emptyState = document.getElementById("empty-state");
const composer = document.getElementById("composer");
const input = document.getElementById("input");
const sendBtn = document.getElementById("send-btn");
const newChatBtn = document.getElementById("new-chat-btn");
const conversationList = document.getElementById("conversation-list");
const sidebar = document.getElementById("sidebar");
const sidebarToggle = document.getElementById("sidebar-toggle");

const STORAGE_KEY = "nova-conversations";

// conversations = { [id]: { id, title, messages: [{role, content}], updatedAt } }
let conversations = {};
let activeId = null;

function loadAll() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    conversations = saved ? JSON.parse(saved) : {};
  } catch (err) {
    console.warn("Couldn't load conversations:", err);
    conversations = {};
  }
}

function saveAll() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (err) {
    console.warn("Couldn't save conversations:", err);
  }
}

function makeTitle(text) {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 40 ? clean.slice(0, 40) + "…" : clean;
}

function createConversation() {
  const id = "c_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7);
  conversations[id] = { id, title: "New chat", messages: [], updatedAt: Date.now() };
  saveAll();
  return id;
}

function renderSidebar() {
  conversationList.innerHTML = "";
  const sorted = Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt);

  sorted.forEach((conv) => {
    const item = document.createElement("div");
    item.className = "conv-item" + (conv.id === activeId ? " active" : "");

    const title = document.createElement("span");
    title.className = "conv-title";
    title.textContent = conv.title || "New chat";

    const del = document.createElement("button");
    del.className = "conv-delete";
    del.innerHTML = "&times;";
    del.title = "Delete conversation";
    del.addEventListener("click", (e) => {
      e.stopPropagation();
      delete conversations[conv.id];
      saveAll();
      if (conv.id === activeId) {
        const remaining = Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt);
        switchTo(remaining.length ? remaining[0].id : createConversation());
      } else {
        renderSidebar();
      }
    });

    item.appendChild(title);
    item.appendChild(del);
    item.addEventListener("click", () => switchTo(conv.id));
    conversationList.appendChild(item);
  });
}

function renderChat() {
  chatEl.innerHTML = "";
  chatEl.appendChild(emptyState);
  const conv = conversations[activeId];
  if (!conv || conv.messages.length === 0) {
    emptyState.style.display = "block";
    return;
  }
  emptyState.style.display = "none";
  conv.messages.forEach((m) => addMessage(m.role, m.content, false));
}

function switchTo(id) {
  activeId = id;
  closeSidebarOnMobile();
  renderChat();
  renderSidebar();
}

function autoGrow() {
  input.style.height = "auto";
  input.style.height = Math.min(input.scrollHeight, 160) + "px";
}
input.addEventListener("input", autoGrow);

input.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    composer.requestSubmit();
  }
});

function addMessage(role, text, scroll = true) {
  emptyState.style.display = "none";
  const msg = document.createElement("div");
  msg.className = `msg ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  msg.appendChild(bubble);
  chatEl.appendChild(msg);
  if (scroll) chatEl.parentElement.scrollTop = chatEl.parentElement.scrollHeight;
  return bubble;
}

function addTypingIndicator() {
  emptyState.style.display = "none";
  const msg = document.createElement("div");
  msg.className = "msg assistant";
  msg.id = "typing-msg";
  msg.innerHTML = `<div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
  chatEl.appendChild(msg);
  chatEl.parentElement.scrollTop = chatEl.parentElement.scrollHeight;
}

function removeTypingIndicator() {
  const el = document.getElementById("typing-msg");
  if (el) el.remove();
}

composer.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  const conv = conversations[activeId];
  const isFirstMessage = conv.messages.length === 0;

  addMessage("user", text);
  conv.messages.push({ role: "user", content: text });
  if (isFirstMessage) conv.title = makeTitle(text);
  conv.updatedAt = Date.now();
  saveAll();
  renderSidebar();

  input.value = "";
  autoGrow();
  sendBtn.disabled = true;
  addTypingIndicator();

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: conv.messages }),
    });

    const data = await res.json();
    removeTypingIndicator();

    if (!res.ok) {
      const bubble = addMessage("assistant", data.error || "Something went wrong.");
      bubble.classList.add("error");
      return;
    }

    addMessage("assistant", data.reply);
    conv.messages.push({ role: "assistant", content: data.reply });
    conv.updatedAt = Date.now();
    saveAll();
  } catch (err) {
    removeTypingIndicator();
    const bubble = addMessage("assistant", "Couldn't reach the server. Is it running?");
    bubble.classList.add("error");
  } finally {
    sendBtn.disabled = false;
    input.focus();
  }
});

newChatBtn.addEventListener("click", () => {
  switchTo(createConversation());
});

sidebarToggle.addEventListener("click", () => {
  sidebar.classList.toggle("open");
});

function closeSidebarOnMobile() {
  if (window.innerWidth <= 768) sidebar.classList.remove("open");
}

// --- init ---
loadAll();
const existing = Object.values(conversations).sort((a, b) => b.updatedAt - a.updatedAt);
activeId = existing.length ? existing[0].id : createConversation();
renderChat();
renderSidebar();