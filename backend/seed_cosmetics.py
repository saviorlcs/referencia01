# ==== manter compat com seu seed atual ====
import os
from pathlib import Path

BASE_DIR = Path(__file__).parent
os.chdir(BASE_DIR)

import asyncio

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

# Carrega env (.env do backend) — usa as MESMAS variáveis do seu seed novo
load_dotenv(BASE_DIR / ".env")
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "studyapp")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

# ==========================
# 1) CATÁLOGO DO SITE ORIGINAL (preços “baixos”)
# ==========================
ORIG_BADGES = [
    ("badge-star", "Selo Estrela", 0),
    ("badge-emerald", "Selo Esmeralda", 20),
    ("badge-bronze", "Selo Bronze", 36),
    ("badge-silver", "Selo Prata", 64),
    ("badge-gold", "Selo Ouro", 116),
    ("badge-ruby", "Selo Rubi", 207),
    ("badge-sapphire", "Selo Safira", 372),
    ("badge-onyx", "Selo Ônix", 668),
    ("badge-diamond", "Selo Diamante", 1198),
    ("badge-platinum", "Selo Platina", 2150),
    ("badge-titanium", "Selo Titânio", 3858),
    ("badge-master", "Selo Mestre", 6923),
    ("badge-legend", "Selo Lendário", 12423),
    ("badge-grand", "Selo Grão-Mestre", 22291),
    ("badge-immortal", "Selo Imortal", 40000),
    ("badge-celestial", "Selo Celestial", 50000),
]
ORIG_BORDERS = [
    ("border-neon", "Borda Neon", 80),
    ("border-gold", "Borda Dourada", 110),
    ("border-emerald", "Borda Esmeralda", 152),
    ("border-purple", "Borda Violeta", 210),
    ("border-prism", "Borda Prisma", 290),
    ("border-platina", "Borda Platina", 400),
    ("border-arcane", "Borda Arcana", 552),
    ("border-obsidian", "Borda Obsidiana", 761),
    ("border-crystal", "Borda Cristal", 1051),
    ("border-horizon", "Borda Horizonte", 1450),
    ("border-royal", "Borda Real", 2000),
    ("border-phantom", "Borda Fantasma", 2759),
    ("border-glitch", "Borda Glitch", 3807),
    ("border-lava", "Borda Lava", 5253),
    ("border-arctic", "Borda Ártica", 7248),
    ("border-eclipse", "Borda Eclipse", 10000),
    ("border-starlight", "Borda Estelar", 13797),
    ("border-cosmos", "Borda Cosmos", 19037),
    ("border-eternal", "Borda Eterna", 26265),
    ("border-jade", "Borda Jade", 36239),
    ("border-amethyst", "Borda Ametista", 50000),
]
ORIG_BACKGROUNDS = [
    ("bg-aurora", "Fundo Aurora", 90),
    ("bg-dusk", "Fundo Crepúsculo", 120),
    ("bg-matrix", "Fundo Matrix", 161),
    ("bg-ocean", "Fundo Oceano", 215),
    ("bg-sakura", "Fundo Sakura", 287),
    ("bg-nebula", "Fundo Nébulas", 384),
    ("bg-supernova", "Fundo Supernova", 514),
    ("bg-eternum", "Fundo Eternum", 687),
    ("bg-monolith", "Fundo Monólito", 918),
    ("bg-glacier", "Fundo Geleira", 1227),
    ("bg-desert", "Fundo Deserto", 1641),
    ("bg-rainforest", "Fundo Floresta", 2194),
    ("bg-cybergrid", "Fundo Cybergrid", 2933),
    ("bg-vapor", "Fundo Vaporwave", 3921),
    ("bg-midnight", "Fundo Meia-noite", 5241),
    ("bg-sunrise", "Fundo Amanhecer", 7007),
    ("bg-sunset", "Fundo Pôr do Sol", 9368),
    ("bg-galaxy", "Fundo Galáxia", 12523),
    ("bg-cyberpunk", "Fundo Cyberpunk", 16742),
    ("bg-neoncity", "Fundo Neon City", 22381),
    ("bg-forestnight", "Fundo Floresta à Noite", 29921),
    ("bg-holo", "Fundo Holográfico (Lendário)", 40000),
]

# ==========================
# 2) ITENS DO SEU SEED NOVO (IDs com _ e animações nomeadas)
#    — mantemos os preços “altos” como metas longas
# ==========================
NEW_BADGES = [
    ("badge_star", "Selo Estrela", 0, {"symbol": "⭐", "color": "#FFD700"}),
    ("badge_gold", "Selo Ouro", 1500000, {"symbol": "🥇", "color": "#FFD700"}),
    ("badge_diamond", "Selo Diamante", 3000000, {"symbol": "💎", "color": "#B9F2FF"}),
]
NEW_BORDERS = [
    (
        "border_neon",
        "Borda Neon",
        100000,
        {"border": "3px solid #00FFFF", "shadow": "0 0 15px #00FFFF"},
    ),
    (
        "border_prism",
        "Borda Prisma",
        1550000,
        {
            "border": "4px solid",
            "borderImage": "linear-gradient(45deg, #ff0000, #ff7f00, #ffff00, #00ff00, #0000ff, #4b0082, #9400d3) 1",
            "shadow": "0 0 25px rgba(255,255,255,0.6)",
        },
    ),
    (
        "border_eternal",
        "Borda Eterna",
        3000000,
        {
            "border": "5px solid #FFD700",
            "shadow": "0 0 30px rgba(255,215,0,0.9)",
            "animation": "pulse 2s infinite",
        },
    ),
]
NEW_BACKGROUNDS = [
    (
        "bg_aurora",
        "Fundo Aurora",
        6750,
        {
            "background": "linear-gradient(135deg,#667eea 0%,#764ba2 100%)",
            "animation": "none",
        },
    ),
    (
        "bg_twilight",
        "Fundo Crepúsculo",
        9000,
        {
            "background": "linear-gradient(135deg,#ff7e5f 0%,#feb47b 100%)",
            "animation": "none",
        },
    ),
    (
        "bg_matrix",
        "Fundo Matrix",
        12000,
        {
            "background": "linear-gradient(135deg,#0f0f0f 0%,#1a1a1a 100%)",
            "animation": "matrix-rain 5s infinite",
        },
    ),
    (
        "bg_ocean",
        "Fundo Oceano",
        16000,
        {
            "background": "linear-gradient(135deg,#2e3192 0%,#1bffff 100%)",
            "animation": "wave 10s infinite",
        },
    ),
    (
        "bg_sakura",
        "Fundo Sakura",
        21500,
        {
            "background": "linear-gradient(135deg,#ffecd2 0%,#fcb69f 100%)",
            "animation": "sakura-fall 15s infinite",
        },
    ),
    (
        "bg_nebula",
        "Fundo Nébulas",
        28800,
        {
            "background": "linear-gradient(135deg,#4b0082 0%,#8a2be2 50%,#ff1493 100%)",
            "animation": "nebula-drift 20s infinite",
        },
    ),
    (
        "bg_supernova",
        "Fundo Supernova",
        38500,
        {
            "background": "radial-gradient(circle,#ff6b6b 0%,#4ecdc4 50%,#1a535c 100%)",
            "animation": "supernova 8s infinite",
        },
    ),
    (
        "bg_eternum",
        "Fundo Eternum",
        51500,
        {
            "background": "linear-gradient(135deg,#a8edea 0%,#fed6e3 100%)",
            "animation": "ethereal 12s infinite",
        },
    ),
    (
        "bg_monolith",
        "Fundo Monólito",
        68800,
        {
            "background": "linear-gradient(135deg,#232526 0%,#414345 100%)",
            "animation": "monolith-pulse 10s infinite",
        },
    ),
    (
        "bg_glacier",
        "Fundo Geleira",
        92000,
        {
            "background": "linear-gradient(135deg,#e0eafc 0%,#cfdef3 100%)",
            "animation": "glacier-shift 15s infinite",
        },
    ),
    (
        "bg_desert",
        "Fundo Deserto",
        123000,
        {
            "background": "linear-gradient(135deg,#f2994a 0%,#f2c94c 100%)",
            "animation": "desert-heat 18s infinite",
        },
    ),
    (
        "bg_forest",
        "Fundo Floresta",
        164500,
        {
            "background": "linear-gradient(135deg,#134e5e 0%,#71b280 100%)",
            "animation": "forest-breeze 20s infinite",
        },
    ),
    (
        "bg_cybergrid",
        "Fundo Cybergrid",
        220000,
        {
            "background": "linear-gradient(135deg,#0f0c29 0%,#302b63 50%,#24243e 100%)",
            "animation": "cyber-grid 5s infinite",
        },
    ),
    (
        "bg_vaporwave",
        "Fundo Vaporwave",
        294000,
        {
            "background": "linear-gradient(135deg,#ff6e7f 0%,#bfe9ff 100%)",
            "animation": "vaporwave 10s infinite",
        },
    ),
    (
        "bg_midnight",
        "Fundo Meia-noite",
        393000,
        {
            "background": "linear-gradient(135deg,#000428 0%,#004e92 100%)",
            "animation": "stars-twinkle 25s infinite",
        },
    ),
    (
        "bg_dawn",
        "Fundo Amanhecer",
        525500,
        {
            "background": "linear-gradient(135deg,#ff9a56 0%,#ff6a88 50%,#ff99ac 100%)",
            "animation": "dawn-rise 30s infinite",
        },
    ),
    (
        "bg_sunset",
        "Fundo Pôr do Sol",
        702500,
        {
            "background": "linear-gradient(135deg,#fa709a 0%,#fee140 100%)",
            "animation": "sunset-fade 35s infinite",
        },
    ),
    (
        "bg_galaxy",
        "Fundo Galáxia",
        939000,
        {
            "background": "radial-gradient(circle,#240b36 0%,#c31432 100%)",
            "animation": "galaxy-spin 40s infinite",
        },
    ),
    (
        "bg_cyberpunk",
        "Fundo Cyberpunk",
        1255500,
        {
            "background": "linear-gradient(135deg,#fc00ff 0%,#00dbde 100%)",
            "animation": "cyberpunk-glitch 8s infinite",
        },
    ),
    (
        "bg_neon_city",
        "Fundo Neon City",
        1678500,
        {
            "background": "linear-gradient(135deg,#d53369 0%,#daae51 100%)",
            "animation": "neon-flicker 6s infinite",
        },
    ),
    (
        "bg_night_forest",
        "Fundo Floresta à Noite",
        2244000,
        {
            "background": "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
            "animation": "moonlight-shimmer 45s infinite",
        },
    ),
    (
        "bg_holographic",
        "Fundo Holográfico",
        3000000,
        {
            "background": "linear-gradient(135deg,#667eea 0%,#764ba2 33%,#f093fb 66%,#f5576c 100%)",
            "animation": "holographic-wave 10s infinite",
        },
    ),
]

# ==========================
# 3) GERAÇÃO DE SVG (animações idênticas no visual)
# ==========================
PALETTES_BADGE = [
    ("#00D4FF", "#06FFA5"),
    ("#FFD23F", "#FF8C42"),
    ("#9D4EDD", "#00D4FF"),
    ("#FF6B6B", "#FFD23F"),
    ("#06FFA5", "#4ECDC4"),
]
PALETTES_BORDER = [
    ("#00D4FF", "#9D4EDD"),
    ("#FFD23F", "#FF6B6B"),
    ("#4ECDC4", "#06FFA5"),
    ("#FF8C42", "#FFD23F"),
    ("#9D4EDD", "#4ECDC4"),
]
PALETTES_BG = [
    ("#0ea5e9", "#22d3ee"),
    ("#7c3aed", "#06b6d4"),
    ("#f59e0b", "#ef4444"),
    ("#10b981", "#3b82f6"),
    ("#ef4444", "#f59e0b"),
]


def _h(s):  # hash simples p/ escolher paleta
    v = 0
    for c in s:
        v = (v + ord(c)) % 2147483647
    return v


def badge_svg(item_id):
    c1, c2 = PALETTES_BADGE[_h(item_id) % len(PALETTES_BADGE)]
    return f"""
<svg width="96" height="96" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g_{item_id}">
      <stop offset="0%" stop-color="{c1}"/>
      <stop offset="100%" stop-color="{c2}"/>
    </radialGradient>
    <style>
      @keyframes pulse_{item_id} {{ 0%,100% {{ transform: scale(1); }} 50% {{ transform: scale(1.08);}} }}
      @keyframes glow_{item_id}  {{ 0%,100% {{ filter: drop-shadow(0 0 4px {c1}); }} 50% {{ filter: drop-shadow(0 0 12px {c2}); }} }}
      .p_{item_id} {{ transform-origin: 60px 60px; animation: pulse_{item_id} 2s infinite, glow_{item_id} 2s infinite; }}
      .t_{item_id} {{ font: 700 26px system-ui, sans-serif; fill: #fff; text-anchor: middle; dominant-baseline: middle; }}
    </style>
  </defs>
  <g class="p_{item_id}">
    <circle cx="60" cy="60" r="38" fill="url(#g_{item_id})"/>
    <circle cx="60" cy="60" r="40" fill="none" stroke="#ffffff33" stroke-width="3"/>
    <text x="60" y="60" class="t_{item_id}">🏅</text>
  </g>
</svg>""".strip()


def border_svg(item_id):
    c1, c2 = PALETTES_BORDER[_h(item_id) % len(PALETTES_BORDER)]
    return f"""
<svg width="120" height="96" viewBox="0 0 160 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gb_{item_id}" x1="0" y1="0" x2="160" y2="120">
      <stop offset="0%" stop-color="{c1}"/><stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <style>
      @keyframes rotate_{item_id} {{ to {{ stroke-dashoffset: -400; }} }}
      .r_{item_id} {{
        stroke: url(#gb_{item_id}); stroke-width: 6; fill: none; stroke-linejoin: round;
        stroke-dasharray: 24 10; animation: rotate_{item_id} 5s linear infinite;
        filter: drop-shadow(0 0 6px {c1}66);
      }}
    </style>
  </defs>
  <rect x="12" y="12" width="136" height="96" rx="14" class="r_{item_id}"/>
</svg>""".strip()


def background_svg(item_id):
    c1, c2 = PALETTES_BG[_h(item_id) % len(PALETTES_BG)]
    return f"""
<svg width="160" height="96" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="gg_{item_id}" x1="0" y1="0" x2="200" y2="120">
      <stop offset="0%" stop-color="{c1}"/><stop offset="100%" stop-color="{c2}"/>
    </linearGradient>
    <style>
      @keyframes shimmer_{item_id} {{ 0% {{opacity:1}} 50% {{opacity:.8}} 100% {{opacity:1}} }}
      .bg_{item_id} {{ animation: shimmer_{item_id} 2.5s ease-in-out infinite; rx: 14px; }}
      .tx_{item_id} {{ font: 600 14px system-ui, sans-serif; fill: #fff; opacity:.9 }}
    </style>
  </defs>
  <rect x="8" y="8" width="184" height="104" fill="url(#gg_{item_id})" class="bg_{item_id}"/>
  <text x="100" y="68" text-anchor="middle" class="tx_{item_id}">🎨 Fundo</text>
</svg>""".strip()


def make_svg(item_id, item_type):
    if item_type == "badge":
        return badge_svg(item_id)
    if item_type == "border":
        return border_svg(item_id)
    return background_svg(item_id)


def rarity_for(item_id: str, price: int) -> str:
    # regra simples: itens "caríssimos" ou com certos nomes viram "Raro"
    if price >= 1000000 or any(
        k in item_id
        for k in [
            "legend",
            "immortal",
            "celestial",
            "holo",
            "amethyst",
            "eternal",
            "cosmos",
            "diamond",
        ]
    ):
        return "Raro"
    return ""


# Helper p/ construir doc unificado
def as_doc(item_id, name, price, t, extra_style=None):
    svg = make_svg(item_id, t)
    style_data = {"svg": svg, "rarity": rarity_for(item_id, price)}
    # preserve campos do seed novo (background/border/animation etc)
    if extra_style:
        style_data.update(extra_style)
    return {
        "id": item_id,
        "name": name,
        "type": t,  # badge | border | background
        "price": int(price),
        "description": "",
        "style_data": style_data,
    }


async def seed_cosmetics():
    await db.cosmetics.delete_many({})

    docs = []
    # 3.1) Produtos do site ORIGINAL
    for _id, name, price in ORIG_BADGES:
        docs.append(as_doc(_id, name, price, "badge"))
    for _id, name, price in ORIG_BORDERS:
        docs.append(as_doc(_id, name, price, "border"))
    for _id, name, price in ORIG_BACKGROUNDS:
        docs.append(as_doc(_id, name, price, "background"))

    # 3.2) Produtos do SEED NOVO (mantendo campos de animação)
    for _id, name, price, st in NEW_BADGES:
        docs.append(as_doc(_id, name, price, "badge", st))
    for _id, name, price, st in NEW_BORDERS:
        docs.append(as_doc(_id, name, price, "border", st))
    for _id, name, price, st in NEW_BACKGROUNDS:
        docs.append(as_doc(_id, name, price, "background", st))

    if docs:
        await db.cosmetics.insert_many(docs)

    # Stats
    agg = {"badge": 0, "border": 0, "background": 0}
    for d in docs:
        agg[d["type"]] += 1
    print(f"✅ Seed concluído: {len(docs)} itens")
    print(
        f"   Badges: {agg['badge']} | Bordas: {agg['border']} | Fundos: {agg['background']}"
    )


async def main():
    await seed_cosmetics()
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
