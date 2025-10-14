"""
Gera SVGs únicos para selos, bordas e fundos
"""

import json


def generate_badge_svg(tier, color_hue):
    """Gera SVG único para badge baseado no tier"""
    # Cores baseadas no tier
    primary = f"hsl({color_hue}, 70%, 50%)"
    secondary = f"hsl({(color_hue + 30) % 360}, 70%, 60%)"

    # Formas diferentes por tier
    if tier <= 10:
        # Badges simples - estrelas
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="bg{tier}">
      <stop offset="0%" stop-color="{primary}"/>
      <stop offset="100%" stop-color="{secondary}"/>
    </radialGradient>
  </defs>
  <polygon points="50,10 61,35 88,35 67,52 77,77 50,60 23,77 33,52 12,35 39,35" 
           fill="url(#bg{tier})" stroke="white" stroke-width="2"/>
  <circle cx="50" cy="50" r="{5 + tier}" fill="white" opacity="0.3"/>
</svg>"""
    elif tier <= 20:
        # Badges intermediários - escudos
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="lg{tier}" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="{primary}"/>
      <stop offset="100%" stop-color="{secondary}"/>
    </linearGradient>
  </defs>
  <path d="M50,10 L80,25 L80,55 Q80,80 50,90 Q20,80 20,55 L20,25 Z" 
        fill="url(#lg{tier})" stroke="gold" stroke-width="3"/>
  <text x="50" y="55" text-anchor="middle" font-size="24" font-weight="bold" fill="white">{tier}</text>
</svg>"""
    else:
        # Badges avançados - coroas
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="rg{tier}">
      <stop offset="0%" stop-color="gold"/>
      <stop offset="100%" stop-color="{primary}"/>
    </radialGradient>
    <filter id="glow{tier}">
      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <polygon points="50,15 55,30 70,25 65,40 80,45 65,50 70,65 55,60 50,75 45,60 30,65 35,50 20,45 35,40 30,25 45,30" 
           fill="url(#rg{tier})" filter="url(#glow{tier})" stroke="white" stroke-width="2"/>
  <circle cx="50" cy="50" r="15" fill="white" opacity="0.5"/>
</svg>"""


def generate_border_svg(tier, color_hue):
    """Gera SVG único para borda baseado no tier"""
    primary = f"hsl({color_hue}, 70%, 50%)"
    width = 2 + (tier * 0.3)

    if tier <= 10:
        # Bordas simples
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="5" y="5" width="90" height="90" fill="none" 
        stroke="{primary}" stroke-width="{width}" rx="5"/>
</svg>"""
    elif tier <= 20:
        # Bordas duplas
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect x="3" y="3" width="94" height="94" fill="none" 
        stroke="{primary}" stroke-width="{width}" rx="8"/>
  <rect x="8" y="8" width="84" height="84" fill="none" 
        stroke="white" stroke-width="1" rx="5" opacity="0.5"/>
</svg>"""
    else:
        # Bordas ornamentadas
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="borderGrad{tier}">
      <stop offset="0%" stop-color="{primary}"/>
      <stop offset="50%" stop-color="gold"/>
      <stop offset="100%" stop-color="{primary}"/>
    </linearGradient>
  </defs>
  <rect x="2" y="2" width="96" height="96" fill="none" 
        stroke="url(#borderGrad{tier})" stroke-width="{width}" rx="10"/>
  <circle cx="10" cy="10" r="5" fill="gold"/>
  <circle cx="90" cy="10" r="5" fill="gold"/>
  <circle cx="10" cy="90" r="5" fill="gold"/>
  <circle cx="90" cy="90" r="5" fill="gold"/>
</svg>"""


def generate_background_svg(tier, color_hue):
    """Gera SVG único para background baseado no tier"""
    h1, h2 = color_hue, (color_hue + 60) % 360

    if tier <= 10:
        # Backgrounds gradiente simples
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bgGrad{tier}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl({h1}, 60%, 30%)"/>
      <stop offset="100%" stop-color="hsl({h2}, 60%, 20%)"/>
    </linearGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad{tier})"/>
</svg>"""
    elif tier <= 20:
        # Backgrounds com padrões
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <linearGradient id="bgGrad{tier}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="hsl({h1}, 70%, 35%)"/>
      <stop offset="100%" stop-color="hsl({h2}, 70%, 25%)"/>
    </linearGradient>
    <pattern id="pattern{tier}" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
      <circle cx="25" cy="25" r="2" fill="white" opacity="0.1"/>
    </pattern>
  </defs>
  <rect width="400" height="300" fill="url(#bgGrad{tier})"/>
  <rect width="400" height="300" fill="url(#pattern{tier})"/>
</svg>"""
    else:
        # Backgrounds complexos animados
        return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
  <defs>
    <radialGradient id="bgRad{tier}">
      <stop offset="0%" stop-color="hsl({h1}, 80%, 40%)"/>
      <stop offset="100%" stop-color="hsl({h2}, 80%, 20%)"/>
    </radialGradient>
  </defs>
  <rect width="400" height="300" fill="url(#bgRad{tier})"/>
  <circle cx="100" cy="100" r="80" fill="hsl({h1}, 70%, 50%)" opacity="0.2">
    <animate attributeName="r" from="80" to="100" dur="3s" repeatCount="indefinite"/>
  </circle>
  <circle cx="300" cy="200" r="60" fill="hsl({h2}, 70%, 50%)" opacity="0.2">
    <animate attributeName="r" from="60" to="80" dur="4s" repeatCount="indefinite"/>
  </circle>
</svg>"""


# Atualizar cosméticos com SVGs
with open("/app/backend/cosmetics_data.json", "r", encoding="utf-8") as f:
    cosmetics = json.load(f)

for cosmetic in cosmetics:
    tier = cosmetic["style_data"]["tier"]
    color_hue = (tier * 12) % 360

    if cosmetic["type"] == "badge":
        cosmetic["style_data"]["svg"] = generate_badge_svg(tier, color_hue)
    elif cosmetic["type"] == "border":
        cosmetic["style_data"]["svg"] = generate_border_svg(tier, color_hue)
    elif cosmetic["type"] == "background":
        cosmetic["style_data"]["svg"] = generate_background_svg(tier, color_hue)

with open("/app/backend/cosmetics_data.json", "w", encoding="utf-8") as f:
    json.dump(cosmetics, f, ensure_ascii=False, indent=2)

print("✅ SVGs únicos gerados para todos os 90 cosméticos!")
