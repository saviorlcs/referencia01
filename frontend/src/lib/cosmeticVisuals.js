// src/lib/cosmeticVisuals.js
let injected = false;
export function injectBadgeCSSOnce() {
  if (injected) return;
  injected = true;
  const css = `
    @keyframes glow { 0%,100%{ filter: drop-shadow(0 0 6px rgba(255,255,255,.35)); }
                      50%{ filter: drop-shadow(0 0 18px rgba(255,255,255,.7)); } }
    @keyframes pulse { 0%,100%{ transform:scale(1) } 50%{ transform:scale(1.04) } }
    @keyframes neon-flicker { 0%,100%{ filter:brightness(1) } 40%{ filter:brightness(1.2) } 50%{ filter:brightness(.9) } 60%{ filter:brightness(1.3) } }
    @keyframes ringPulse { 0%{ box-shadow:0 0 0 0 rgba(255,255,255,.15)} 70%{ box-shadow:0 0 0 12px rgba(255,255,255,0)} 100%{ box-shadow:0 0 0 0 rgba(255,255,255,0)} }
    /* fundos (mesmos nomes que você já está usando no Shop.js) */
    @keyframes wave { 0%{ background-position:0% 50% } 100%{ background-position:200% 50% } }
    @keyframes matrix-rain { 0%{ background-position:0 0 } 100%{ background-position:0 100% } }
    @keyframes sakura-fall { 0%{ background-position:0 0 } 100%{ background-position:0 200% } }
    @keyframes nebula-drift { 0%{ filter:hue-rotate(0deg) } 100%{ filter:hue-rotate(360deg) } }
    @keyframes ethereal { 0%{ background-position:0 0 } 100%{ background-position:100% 100% } }
    @keyframes monolith-pulse { 0%,100%{ box-shadow:inset 0 0 0 rgba(255,255,255,0)} 50%{ box-shadow:inset 0 0 30px rgba(255,255,255,.08)} }
    @keyframes vaporwave { 0%{ filter:hue-rotate(0deg) } 100%{ filter:hue-rotate(-360deg) } }
    @keyframes holographic-wave { 0%{ background-position:0% 50% } 100%{ background-position:200% 50% } }
  `;
  const el = document.createElement("style");
  el.setAttribute("data-cosmetics", "true");
  el.textContent = css;
  document.head.appendChild(el);
}

/** ---------- BADGES ---------- */
const BADGE_MAP = {
  "badge-star":     { color: "#9fd3ff", symbol: "★",   animation: "glow 3s ease-in-out infinite" },
  "badge-emerald":  { color: "#00f5a8", symbol: "💎",  animation: "glow 3.2s ease-in-out infinite" },
  "badge-bronze":   { color: "#cd7f32", symbol: "🥉",  animation: "pulse 3.5s ease-in-out infinite" },
  "badge-silver":   { color: "#c0c0c0", symbol: "🥈",  animation: "pulse 3.5s ease-in-out infinite" },
  "badge-gold":     { color: "#ffd166", symbol: "🥇",  animation: "ringPulse 2.4s ease-out infinite" },
  "badge-ruby":     { color: "#ff4d6d", symbol: "🔴",  animation: "glow 3s ease-in-out infinite" },
  "badge-sapphire": { color: "#36c9ff", symbol: "🔷",  animation: "glow 3.2s ease-in-out infinite" },
  "badge-onyx":     { color: "#3b3b3b", symbol: "⚫",  animation: "pulse 3.2s ease-in-out infinite" },
  "badge-diamond":  { color: "#aaf0ff", symbol: "💎",  animation: "ringPulse 2.2s ease-out infinite" },
  "badge-platinum": { color: "#e5e4e2", symbol: "⟡",   animation: "glow 3.2s ease-in-out infinite" },
  "badge-titanium": { color: "#8e9aaf", symbol: "⦿",   animation: "pulse 3s ease-in-out infinite" },
  "badge-master":   { color: "#8a5cf6", symbol: "✪",   animation: "glow 2.6s ease-in-out infinite" },
  "badge-legend":   { color: "#ff9e00", symbol: "✦",   animation: "glow 2.4s ease-in-out infinite" },
  "badge-grand":    { color: "#22d3ee", symbol: "◎",   animation: "ringPulse 2s ease-out infinite" },
  "badge-immortal": { color: "#00ffa3", symbol: "∞",   animation: "ringPulse 1.8s ease-out infinite" },
  "badge-celestial":{ color: "#60a5fa", symbol: "✹",   animation: "glow 2s ease-in-out infinite" },
  "badge_star":     { color: "#FFD700", symbol: "⭐",  animation: "glow 3s ease-in-out infinite" },
  "badge_gold":     { color: "#FFD700", symbol: "🥇",  animation: "ringPulse 2.4s ease-out infinite" },
  "badge_diamond":  { color: "#B9F2FF", symbol: "💎",  animation: "ringPulse 2s ease-out infinite" },
};

/** ---------- BORDERS ---------- */
export function borderStyleFor(id) {
  const base = {
    border: "2px solid rgba(255,255,255,.12)",
    shadow: "inset 0 2px 10px rgba(0,0,0,.25)",
  };
  const map = {
    "border-neon":     { border: "2px solid #00e7ff", shadow: "0 0 12px #00e7ff66", animation: "neon-flicker 4s ease-in-out infinite" },
    "border-gold":     { border: "2px solid #f6c85f", shadow: "0 0 10px #f6c85f55" },
    "border-emerald":  { border: "2px solid #21e6a2", shadow: "0 0 10px #21e6a255" },
    "border-purple":   { border: "2px solid #a78bfa", shadow: "0 0 10px #a78bfa55" },
    "border-prism":    { borderImage: "linear-gradient(45deg,#22d3ee,#a78bfa,#f6c85f,#ff6b6b) 1", animation: "wave 10s linear infinite" },
    "border-platina":  { border: "2px solid #e5e4e2", shadow: "0 0 10px #e5e4e255" },
    "border-arcane":   { borderImage: "linear-gradient(45deg,#7c3aed,#22d3ee) 1", shadow: "0 0 12px #7c3aed55" },
    "border-obsidian": { border: "2px solid #0b1220", shadow: "0 0 16px #000 inset" },
    "border-crystal":  { borderImage: "linear-gradient(45deg,#aaf0ff,#ffffff) 1", shadow: "0 0 10px #aaf0ff66" },
    "border-horizon":  { borderImage: "linear-gradient(90deg,#22d3ee,#10b981) 1" },
    "border-royal":    { borderImage: "linear-gradient(45deg,#60a5fa,#7c3aed) 1" },
    "border-phantom":  { border: "2px dashed #94a3b8", animation: "pulse 4s ease-in-out infinite" },
    "border-glitch":   { borderImage: "linear-gradient(45deg,#22d3ee,#ef4444) 1", animation: "neon-flicker 2.5s ease-in-out infinite" },
    "border-lava":     { borderImage: "linear-gradient(45deg,#ef4444,#f59e0b) 1" },
    "border-arctic":   { borderImage: "linear-gradient(45deg,#60a5fa,#22d3ee) 1" },
    "border-eclipse":  { border: "2px solid #222", shadow: "inset 0 0 30px rgba(255,255,255,.08)", animation: "monolith-pulse 5s ease-in-out infinite" },
    "border-starlight":{ borderImage: "linear-gradient(45deg,#60a5fa,#a78bfa,#22d3ee) 1" },
    "border-cosmos":   { borderImage: "linear-gradient(45deg,#22d3ee,#7c3aed,#f6c85f) 1" },
    "border-eternal":  { borderImage: "linear-gradient(45deg,#06b6d4,#60a5fa,#7c3aed) 1" },
    "border-jade":     { border: "2px solid #00f5a8", shadow: "0 0 12px #00f5a866" },
    "border-amethyst": { border: "2px solid #9d4edd", shadow: "0 0 12px #9d4edd66" },
    "border_neon":     { border: "3px solid #00FFFF", shadow: "0 0 15px #00FFFF" },
    "border_prism":    { border: "4px solid", borderImage: "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1", shadow: "0 0 25px rgba(255,255,255,0.6)" },
    "border_eternal":  { border: "5px solid #FFD700", shadow: "0 0 30px rgba(255,215,0,0.9)", animation: "pulse 2s infinite" },
  };
  return { ...base, ...(map[id] || {}) };
}

/** ---------- BACKGROUNDS ---------- */
export function bgStyleFor(id) {
  const map = {
    "bg-aurora":      { background: "linear-gradient(135deg,#1e3a8a,#0ea5e9 40%,#22d3ee)", animation: "ethereal 14s linear infinite" },
    "bg-dusk":        { background: "linear-gradient(135deg,#0ea5e9,#22d3ee,#7c3aed)",     animation: "wave 12s linear infinite" },
    "bg-matrix":      { background: "repeating-linear-gradient(transparent,transparent 30px,#0b1220 30px,#0b1220 31px)", animation: "matrix-rain 8s linear infinite" },
    "bg-ocean":       { background: "linear-gradient(135deg,#0ea5e9,#3b82f6)",             animation: "wave 10s linear infinite" },
    "bg-sakura":      { background: "radial-gradient(circle at 20% 20%,#ff89c6,#1f2937 60%)", animation: "sakura-fall 14s linear infinite" },
    "bg-nebula":      { background: "linear-gradient(135deg,#7c3aed,#60a5fa,#ef4444)",     animation: "nebula-drift 18s linear infinite" },
    "bg-supernova":   { background: "radial-gradient(circle at 50% 50%,#ffd166,#ef4444 50%,#1f2937 70%)", animation: "pulse 8s ease-in-out infinite" },
    "bg-eternum":     { background: "linear-gradient(135deg,#06b6d4,#60a5fa)",              animation: "ethereal 18s linear infinite" },
    "bg-monolith":    { background: "linear-gradient(180deg,#0b1220,#111827)",             animation: "monolith-pulse 7s ease-in-out infinite" },
    "bg-glacier":     { background: "linear-gradient(135deg,#a5f3fc,#60a5fa)",             animation: "ethereal 16s linear infinite" },
    "bg-desert":      { background: "linear-gradient(135deg,#f59e0b,#ef4444)",             animation: "wave 16s linear infinite" },
    "bg-rainforest":  { background: "linear-gradient(135deg,#059669,#10b981)",             animation: "ethereal 20s linear infinite" },
    "bg-cybergrid":   { background: "repeating-linear-gradient(90deg,#0ea5e9 0 2px,transparent 2px 40px), repeating-linear-gradient(#0ea5e9 0 2px,transparent 2px 40px)", animation: "wave 16s linear infinite" },
    "bg-vapor":       { background: "linear-gradient(135deg,#22d3ee,#a78bfa,#f472b6)",     animation: "vaporwave 20s linear infinite" },
    "bg-midnight":    { background: "radial-gradient(circle at 30% 30%,#111827,#0b1220 60%)" },
    "bg-sunrise":     { background: "linear-gradient(135deg,#fde68a,#f59e0b)" },
    "bg-sunset":      { background: "linear-gradient(135deg,#f59e0b,#ef4444)",             animation: "wave 16s linear infinite" },
    "bg-galaxy":      { background: "radial-gradient(circle at 60% 40%,#7c3aed,#0ea5e9 50%,#111827 70%)", animation: "ethereal 22s linear infinite" },
    "bg-cyberpunk":   { background: "linear-gradient(135deg,#22d3ee,#ef4444)",             animation: "neon-flicker 6s ease-in-out infinite" },
    "bg-neoncity":    { background: "linear-gradient(135deg,#60a5fa,#22d3ee,#7c3aed)",     animation: "wave 18s linear infinite" },
    "bg-forestnight": { background: "radial-gradient(circle at 50% 20%,#065f46,#0b1220 60%)" },
    "bg-holo":        { background: "linear-gradient(135deg,#22d3ee,#a78bfa,#f6c85f,#ff6b6b)", backgroundSize: "200% 200%", animation: "holographic-wave 14s linear infinite" },
    "bg_aurora":      { background: "linear-gradient(135deg,#667eea 0%,#764ba2 100%)", animation: "none" },
    "bg_twilight":    { background: "linear-gradient(135deg,#ff7e5f 0%,#feb47b 100%)", animation: "none" },
    "bg_matrix":      { background: "linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 100%)", animation: "matrix-rain 5s infinite" },
    "bg_ocean":       { background: "linear-gradient(135deg,#2e3192 0%,#1bffff 100%)", animation: "wave 10s infinite" },
    "bg_sakura":      { background: "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)", animation: "sakura-fall 15s infinite" },
    "bg_nebula":      { background: "linear-gradient(135deg,#4b0082 0%,#8a2be2 50%,#ff1493 100%)", animation: "nebula-drift 20s infinite" },
    "bg_holographic": { background: "linear-gradient(135deg,#667eea 0%,#764ba2 33%,#f093fb 66%,#f5576c 100%)", animation: "holographic-wave 10s infinite" },
  };
  const entry = map[id] || { background: "linear-gradient(135deg,#0b1220,#111827)" };
  if (!entry.backgroundSize) entry.backgroundSize = "200% 200%";
  return entry;
}

/** Visual "principal" por tipo */
export function getVisual(id, type) {
  if (type === "border")   return borderStyleFor(id);
  if (type === "background") return bgStyleFor(id);
  // badge
  return BADGE_MAP[id] || { color: "#ffd700", symbol: "🏅", animation: "glow 3s ease-in-out infinite" };
}

/** Função auxiliar para obter cor de raridade */
export function getRarityColor(rarity) {
  const colors = {
    "Comum": "#9CA3AF",
    "Incomum": "#3B82F6",
    "Raro": "#A855F7",
    "Épico": "#EC4899",
    "Lendário": "#F59E0B",
  };
  return colors[rarity] || "#9CA3AF";
}
