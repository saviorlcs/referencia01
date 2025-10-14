import json
import math


def generate_price(index, total, min_price, max_price):
    """Gera preço exponencial"""
    if min_price == 0:
        if index == 0:
            return 0
        return generate_price(index - 1, total - 1, 1000, max_price)
    ratio = index / (total - 1)
    return int(min_price * math.pow(max_price / min_price, ratio))


# 30 SELOS
badges = []
badge_names = [
    "Iniciante",
    "Aprendiz",
    "Estudante",
    "Dedicado",
    "Aplicado",
    "Focado",
    "Disciplinado",
    "Persistente",
    "Determinado",
    "Resiliente",
    "Sábio",
    "Erudito",
    "Mestre",
    "Expert",
    "Virtuoso",
    "Gênio",
    "Prodígio",
    "Fenômeno",
    "Lenda",
    "Titã",
    "Imortal",
    "Divino",
    "Celestial",
    "Transcendente",
    "Supremo",
    "Absoluto",
    "Perfeito",
    "Infinito",
    "Eterno",
    "Onisciente",
]

for i, name in enumerate(badge_names):
    if i == 0:
        price = 0
    else:
        price = generate_price(i - 1, 29, 10000, 3000000)

    badges.append(
        {
            "id": f"badge_{i+1}",
            "name": f"Selo {name}",
            "type": "badge",
            "price": price,
            "description": f"Símbolo de {name.lower()} - Tier {i+1}/30",
            "style_data": {"symbol": "🏅", "tier": i + 1},
        }
    )

# 30 BORDAS
borders = []
border_names = [
    "Simples",
    "Elegante",
    "Sutil",
    "Refinada",
    "Delicada",
    "Nobre",
    "Sofisticada",
    "Clássica",
    "Imperial",
    "Real",
    "Majestosa",
    "Grandiosa",
    "Esplêndida",
    "Radiante",
    "Brilhante",
    "Luminosa",
    "Reluzente",
    "Cintilante",
    "Espetacular",
    "Magnífica",
    "Divina",
    "Celestial",
    "Angelical",
    "Sagrada",
    "Mística",
    "Arcana",
    "Transcendente",
    "Suprema",
    "Absoluta",
    "Eterna",
]

for i, name in enumerate(border_names):
    price = generate_price(i, 30, 50000, 3000000)
    borders.append(
        {
            "id": f"border_{i+1}",
            "name": f"Borda {name}",
            "type": "border",
            "price": price,
            "description": f"Moldura {name.lower()} - Tier {i+1}/30",
            "style_data": {"tier": i + 1, "glow": i > 20},
        }
    )

# 30 FUNDOS
backgrounds = []
bg_names = [
    "Aurora",
    "Crepúsculo",
    "Alvorada",
    "Entardecer",
    "Manhã",
    "Tarde",
    "Noite",
    "Meia-Noite",
    "Oceano",
    "Deserto",
    "Floresta",
    "Montanha",
    "Vale",
    "Pradaria",
    "Tundra",
    "Savana",
    "Selva",
    "Pântano",
    "Nebulosa",
    "Galáxia",
    "Cosmos",
    "Quasar",
    "Supernova",
    "Buraco Negro",
    "Dimensão",
    "Éter",
    "Vazio",
    "Infinito",
    "Eternidade",
    "Omniverso",
]

for i, name in enumerate(bg_names):
    price = generate_price(i, 30, 5000, 3000000)
    backgrounds.append(
        {
            "id": f"bg_{i+1}",
            "name": f"Fundo {name}",
            "type": "background",
            "price": price,
            "description": f"Paisagem {name.lower()} - Tier {i+1}/30",
            "style_data": {"tier": i + 1, "animated": i > 20},
        }
    )

all_cosmetics = badges + borders + backgrounds

print(f"✅ Gerados {len(all_cosmetics)} cosméticos (30 selos + 30 bordas + 30 fundos)")
print(f"\n📊 Selos: ${badges[0]['price']:,} até ${badges[-1]['price']:,}")
print(f"📊 Bordas: ${borders[0]['price']:,} até ${borders[-1]['price']:,}")
print(f"📊 Fundos: ${backgrounds[0]['price']:,} até ${backgrounds[-1]['price']:,}")

with open("/app/backend/cosmetics_data.json", "w", encoding="utf-8") as f:
    json.dump(all_cosmetics, f, ensure_ascii=False, indent=2)
print("\n📁 Salvo em cosmetics_data.json")
