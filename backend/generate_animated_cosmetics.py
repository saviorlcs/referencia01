#!/usr/bin/env python3
"""
Gera cosméticos animados e interativos (badges, borders, backgrounds)
com SVG e CSS animations
"""

import json
import random


def generate_animated_badges():
    """Gera 30 badges animados com efeitos brilhantes"""
    badges = []

    # Cores vibrantes para badges
    colors = [
        ["#FFD700", "#FFA500"],  # Dourado
        ["#00FFFF", "#0080FF"],  # Ciano
        ["#FF00FF", "#8B00FF"],  # Magenta
        ["#00FF00", "#008000"],  # Verde
        ["#FF0000", "#8B0000"],  # Vermelho
        ["#FFFFFF", "#C0C0C0"],  # Prata
        ["#FF69B4", "#FF1493"],  # Rosa
        ["#00CED1", "#20B2AA"],  # Turquesa
        ["#FF4500", "#DC143C"],  # Laranja-Vermelho
        ["#9370DB", "#8A2BE2"],  # Roxo
    ]

    animations = [
        "pulse",
        "glow",
        "rotate",
        "bounce",
        "shake",
        "shimmer",
        "sparkle",
        "wave",
        "float",
        "spin",
    ]

    shapes = [
        {"name": "star", "icon": "⭐"},
        {"name": "diamond", "icon": "💎"},
        {"name": "crown", "icon": "👑"},
        {"name": "trophy", "icon": "🏆"},
        {"name": "medal", "icon": "🏅"},
        {"name": "fire", "icon": "🔥"},
        {"name": "lightning", "icon": "⚡"},
        {"name": "gem", "icon": "💠"},
        {"name": "heart", "icon": "💖"},
        {"name": "sparkles", "icon": "✨"},
    ]

    tiers = [
        {"tier": "Comum", "price_range": (100, 500)},
        {"tier": "Incomum", "price_range": (600, 2000)},
        {"tier": "Raro", "price_range": (2500, 10000)},
    ]

    for i in range(30):
        tier = tiers[i % len(tiers)]
        shape = shapes[i % len(shapes)]
        color_pair = colors[i % len(colors)]
        animation = animations[i % len(animations)]

        price = random.randint(tier["price_range"][0], tier["price_range"][1])

        # SVG com animação
        svg = f"""<svg width="80" height="80" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="badge-grad-{i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:{color_pair[0]};stop-opacity:1" />
      <stop offset="100%" style="stop-color:{color_pair[1]};stop-opacity:1" />
    </radialGradient>
    <filter id="glow-{i}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <circle cx="40" cy="40" r="35" fill="url(#badge-grad-{i})" filter="url(#glow-{i})" class="badge-{animation}">
    <animate attributeName="opacity" values="1;0.7;1" dur="2s" repeatCount="indefinite"/>
  </circle>
  <text x="40" y="48" font-size="28" text-anchor="middle" fill="white">{shape["icon"]}</text>
</svg>"""

        badge = {
            "id": f"badge_{i+1}",
            "type": "badge",
            "name": f"Selo {shape['name'].title()} {tier['tier']}",
            "description": f"Badge {tier['tier']} com animação {animation}",
            "price": price,
            "style_data": {
                "rarity": tier["tier"],
                "animation": animation,
                "svg": svg,
                "css": f"""
.badge-{animation} {{
  animation: badge-{animation}-anim 2s ease-in-out infinite;
}}

@keyframes badge-{animation}-anim {{
  0%, 100% {{ transform: scale(1) rotate(0deg); }}
  50% {{ transform: scale(1.1) rotate({random.randint(-10, 10)}deg); }}
}}
""",
            },
        }

        badges.append(badge)

    return badges


def generate_animated_borders():
    """Gera 30 bordas animadas que brilham e se mexem"""
    borders = []

    colors = [
        ["#FF00FF", "#00FFFF"],  # Neon
        ["#FFD700", "#FF8C00"],  # Dourado
        ["#00FF00", "#32CD32"],  # Verde
        ["#FF1493", "#FF69B4"],  # Rosa
        ["#1E90FF", "#00BFFF"],  # Azul
        ["#FF4500", "#FF6347"],  # Laranja
        ["#9370DB", "#BA55D3"],  # Roxo
        ["#00CED1", "#48D1CC"],  # Turquesa
        ["#FFD700", "#FFFF00"],  # Amarelo
        ["#FF0000", "#DC143C"],  # Vermelho
    ]

    patterns = [
        "solid",
        "dashed",
        "dotted",
        "double",
        "gradient",
        "glow",
        "neon",
        "wave",
        "pulse",
        "shimmer",
    ]

    tiers = [
        {"tier": "Comum", "price_range": (200, 1000)},
        {"tier": "Incomum", "price_range": (1500, 5000)},
        {"tier": "Raro", "price_range": (6000, 20000)},
    ]

    for i in range(30):
        tier = tiers[i % len(tiers)]
        pattern = patterns[i % len(patterns)]
        color_pair = colors[i % len(colors)]

        price = random.randint(tier["price_range"][0], tier["price_range"][1])

        # SVG com borda animada
        svg = f"""<svg width="120" height="120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="border-grad-{i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{color_pair[0]};stop-opacity:1">
        <animate attributeName="stop-color" values="{color_pair[0]};{color_pair[1]};{color_pair[0]}" dur="3s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:{color_pair[1]};stop-opacity:1">
        <animate attributeName="stop-color" values="{color_pair[1]};{color_pair[0]};{color_pair[1]}" dur="3s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <filter id="border-glow-{i}">
      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect x="5" y="5" width="110" height="110" fill="none" 
        stroke="url(#border-grad-{i})" stroke-width="6" 
        filter="url(#border-glow-{i})" rx="15" class="border-{pattern}">
    <animate attributeName="stroke-width" values="6;8;6" dur="2s" repeatCount="indefinite"/>
  </rect>
</svg>"""

        border = {
            "id": f"border_{i+1}",
            "type": "border",
            "name": f"Borda {pattern.title()} {tier['tier']}",
            "description": f"Borda {tier['tier']} com efeito {pattern}",
            "price": price,
            "style_data": {
                "rarity": tier["tier"],
                "pattern": pattern,
                "svg": svg,
                "css": f"""
.border-{pattern} {{
  animation: border-{pattern}-anim 3s linear infinite;
}}

@keyframes border-{pattern}-anim {{
  0% {{ stroke-dashoffset: 0; filter: drop-shadow(0 0 5px {color_pair[0]}); }}
  50% {{ stroke-dashoffset: 50; filter: drop-shadow(0 0 15px {color_pair[1]}); }}
  100% {{ stroke-dashoffset: 0; filter: drop-shadow(0 0 5px {color_pair[0]}); }}
}}
""",
            },
        }

        borders.append(border)

    return borders


def generate_animated_backgrounds():
    """Gera 30 fundos magníficos com gradientes animados"""
    backgrounds = []

    gradients = [
        ["#667eea", "#764ba2"],  # Roxo-Azul
        ["#f093fb", "#f5576c"],  # Rosa-Vermelho
        ["#4facfe", "#00f2fe"],  # Azul Claro
        ["#43e97b", "#38f9d7"],  # Verde-Turquesa
        ["#fa709a", "#fee140"],  # Rosa-Amarelo
        ["#30cfd0", "#330867"],  # Turquesa-Roxo Escuro
        ["#a8edea", "#fed6e3"],  # Menta-Rosa
        ["#ff9a56", "#ff6a88"],  # Laranja-Rosa
        ["#ffecd2", "#fcb69f"],  # Pêssego
        ["#ff6e7f", "#bfe9ff"],  # Vermelho-Azul Claro
    ]

    effects = [
        "gradient-flow",
        "wave-motion",
        "pulse-glow",
        "shimmer-shift",
        "color-cycle",
        "aurora",
        "nebula",
        "cosmic",
        "sunset",
        "ocean",
    ]

    tiers = [
        {"tier": "Comum", "price_range": (500, 2000)},
        {"tier": "Incomum", "price_range": (2500, 8000)},
        {"tier": "Raro", "price_range": (10000, 50000)},
    ]

    for i in range(30):
        tier = tiers[i % len(tiers)]
        effect = effects[i % len(effects)]
        gradient = gradients[i % len(gradients)]

        price = random.randint(tier["price_range"][0], tier["price_range"][1])

        # SVG com fundo animado
        svg = f"""<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg-grad-{i}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:{gradient[0]};stop-opacity:1">
        <animate attributeName="offset" values="0;0.5;0" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" style="stop-color:{gradient[1]};stop-opacity:0.8">
        <animate attributeName="stop-color" values="{gradient[1]};{gradient[0]};{gradient[1]}" dur="5s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" style="stop-color:{gradient[0]};stop-opacity:1">
        <animate attributeName="offset" values="1;0.5;1" dur="5s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <radialGradient id="bg-overlay-{i}" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:white;stop-opacity:0.2"/>
      <stop offset="100%" style="stop-color:transparent;stop-opacity:0"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bg-grad-{i})" class="background-{effect}"/>
  <rect width="400" height="300" fill="url(#bg-overlay-{i})">
    <animate attributeName="opacity" values="0.3;0.7;0.3" dur="4s" repeatCount="indefinite"/>
  </rect>
</svg>"""

        background = {
            "id": f"background_{i+1}",
            "type": "background",
            "name": f"Fundo {effect.replace('-', ' ').title()} {tier['tier']}",
            "description": f"Fundo {tier['tier']} com efeito {effect}",
            "price": price,
            "style_data": {
                "rarity": tier["tier"],
                "effect": effect,
                "svg": svg,
                "css": f"""
.background-{effect} {{
  animation: bg-{effect}-anim 5s ease-in-out infinite;
}}

@keyframes bg-{effect}-anim {{
  0%, 100% {{ transform: scale(1) rotate(0deg); opacity: 1; }}
  25% {{ transform: scale(1.05) rotate(1deg); opacity: 0.95; }}
  50% {{ transform: scale(1.02) rotate(-1deg); opacity: 0.98; }}
  75% {{ transform: scale(1.05) rotate(0.5deg); opacity: 0.96; }}
}}
""",
            },
        }

        backgrounds.append(background)

    return backgrounds


def main():
    print("🎨 Gerando cosméticos animados...")

    badges = generate_animated_badges()
    borders = generate_animated_borders()
    backgrounds = generate_animated_backgrounds()

    all_cosmetics = badges + borders + backgrounds

    print(f"✅ Gerados {len(all_cosmetics)} cosméticos animados!")
    print(f"   - {len(badges)} badges com animações")
    print(f"   - {len(borders)} bordas animadas")
    print(f"   - {len(backgrounds)} fundos magníficos")

    # Salvar em JSON
    with open("/app/backend/animated_cosmetics.json", "w", encoding="utf-8") as f:
        json.dump(all_cosmetics, f, ensure_ascii=False, indent=2)

    print("\n📁 Salvo em /app/backend/animated_cosmetics.json")

    # Estatísticas
    total_value = sum(item["price"] for item in all_cosmetics)
    avg_price = total_value / len(all_cosmetics)

    print("\n📊 Estatísticas:")
    print(f"   Valor total: {total_value:,} coins")
    print(f"   Preço médio: {avg_price:,.0f} coins")
    print(f"   Item mais barato: {min(item['price'] for item in all_cosmetics)} coins")
    print(f"   Item mais caro: {max(item['price'] for item in all_cosmetics):,} coins")


if __name__ == "__main__":
    main()
