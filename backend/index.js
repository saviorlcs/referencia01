// backend/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();


// CORS dev-friendly
const allowed = (process.env.CORS_ORIGIN || "http://localhost:3000,http://127.0.0.1:3000")
  .split(",")
  .map(s => s.trim());

app.use(cors({
  origin(origin, cb) {
    // permite chamadas do próprio browser sem Origin (ex: curl/local)
    if (!origin) return cb(null, true);
    if (allowed.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS: " + origin));
  },
  credentials: true, // necessário pro withCredentials do axios
}));


const DB_FILE = path.join(__dirname, "data", "db.json");
function defaultItems() {
  return [
    { id: "theme_ocean",   name: "Tema Oceano", price: 0,  type: "theme" },
    { id: "theme_neon",    name: "Tema Neon",   price: 50, type: "theme" },
    { id: "ringtone_piano",name: "Toque Piano", price: 30, type: "ringtone" },
  ];
}
function ensureDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
    const seed = {
      users: [{
        id: "demo",
        name: "Convidado",
        nick_tag: "guest#0001",
        level: 1,
        coins: 200,
        total_minutes: 0,
        inventory: [],
        selected_alarm: "bell",
        study_subjects: [],
        timer_settings: { mode: "segments", ratioStudy: 5, ratioBreak: 1 },
        block_prefs: { studyBlockMin: 50, breakBlockMin: 10 },
        daily_goal: 120,
        weekly_goal: 900,
        keep_awake: true
      }],
      quests: [],
      shop: { items: defaultItems() }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2));
  }
}
function readDB() {
  ensureDB();
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function writeDB(db) {
  fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}
function currentUser(db) {
  return db.users[0]; // sem auth: sempre o primeiro
}
function generateQuests() {
  return [
    { id: "q1", title: "Estude 60 min",  description: "Faça 60 minutos de estudo nesta semana.",
      target: 60,  progress: 0, xp_reward: 100, coins_reward: 15 },
    { id: "q2", title: "Estude 120 min", description: "Complete 120 minutos de estudo.",
      target: 120, progress: 0, xp_reward: 200, coins_reward: 25 },
    { id: "q3", title: "Estude 300 min", description: "Maratona de 300 minutos!",
      target: 300, progress: 0, xp_reward: 500, coins_reward: 60 },
  ];
}

/* ---------- Users ---------- */
app.get("/api/users/me", (req, res) => {
  const db = readDB();
  return res.json(currentUser(db));
});

app.put("/api/users/me/settings", (req, res) => {
  const db = readDB();
  const u = currentUser(db);
  const {
    timer_settings, block_prefs, daily_goal, weekly_goal, keep_awake,
    study_subjects, selected_alarm
  } = req.body || {};

  if (timer_settings)  u.timer_settings  = { ...u.timer_settings,  ...timer_settings };
  if (block_prefs)     u.block_prefs     = { ...u.block_prefs,     ...block_prefs };
  if (typeof daily_goal  !== "undefined") u.daily_goal  = Number(daily_goal);
  if (typeof weekly_goal !== "undefined") u.weekly_goal = Number(weekly_goal);
  if (typeof keep_awake  !== "undefined") u.keep_awake  = !!keep_awake;
  if (Array.isArray(study_subjects))      u.study_subjects = study_subjects;
  if (selected_alarm)                     u.selected_alarm = selected_alarm;

  writeDB(db);
  res.json({ ok: true });
});

app.post("/api/users/me/cycle-complete", (req, res) => {
  const db = readDB();
  const u = currentUser(db);
  u.level = Math.min(1000, (u.level || 1) + 1);
  writeDB(db);
  res.json({ ok: true, level: u.level });
});

/* ---------- Sessões (tempo estudado) ---------- */
app.post("/api/sessions", (req, res) => {
  const { duration = 0 } = req.body || {}; // segundos
  const db = readDB();
  const u  = currentUser(db);
  const minutes = Math.max(0, Math.floor(Number(duration) / 60));
  u.total_minutes = (u.total_minutes || 0) + minutes;
  // recompensa simples: 1 moeda por minuto real
  u.coins = (u.coins || 0) + minutes;
  writeDB(db);
  res.json({ ok: true, added_minutes: minutes, coins: u.coins });
});

/* ---------- Quests ---------- */
app.get("/api/quests", (req, res) => {
  const db = readDB();
  if (!Array.isArray(db.quests) || db.quests.length === 0) {
    db.quests = generateQuests();
    writeDB(db);
  }
  res.json(db.quests);
});

app.post("/api/quests/generate", (req, res) => {
  const db = readDB();
  db.quests = generateQuests();
  writeDB(db);
  res.json({ ok: true, quests: db.quests });
});

app.post("/api/quests/reset", (req, res) => {
  const db = readDB();
  const u = currentUser(db);
  const cost = 25;
  if ((u.coins || 0) < cost) {
    return res.status(400).json({ detail: "Moedas insuficientes para resetar quests." });
  }
  u.coins -= cost;
  db.quests = generateQuests();
  writeDB(db);
  res.json({ ok: true, coins: u.coins, quests: db.quests });
});

/* ---------- Loja ---------- */
app.get("/api/shop/items", (req, res) => {
  const db = readDB();
  const u  = currentUser(db);
  const items = (db.shop?.items || defaultItems()).map(it => ({
    ...it,
    owned: (u.inventory || []).includes(it.id)
  }));
  res.json(items);
});

app.post("/api/shop/buy", (req, res) => {
  const { itemId } = req.body || {};
  const db = readDB();
  const u  = currentUser(db);
  const items = db.shop?.items || defaultItems();
  const item  = items.find(i => i.id === itemId);
  if (!item) return res.status(404).json({ detail: "Item não encontrado." });
  u.inventory = u.inventory || [];
  if (u.inventory.includes(item.id)) {
    return res.status(400).json({ detail: "Item já adquirido." });
  }
  const price = Number(item.price || 0);
  if ((u.coins || 0) < price) {
    return res.status(400).json({ detail: "Moedas insuficientes." });
  }
  u.coins -= price;         // aceita preço 0 sem erro
  u.inventory.push(item.id);
  writeDB(db);
  res.json({ ok: true, coins: u.coins, item });
});

/* ---------- Util ---------- */
app.get("/api/ping", (req, res) => res.json({ pong: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log("API up on port", PORT);
});
