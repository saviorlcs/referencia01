#!/usr/bin/env python3
"""
Atualiza o banco de dados com cosméticos animados
"""

import asyncio
import json
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv()


async def update_cosmetics():
    # Conectar ao MongoDB
    MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017")
    DB_NAME = os.getenv("DB_NAME", "test_database")
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    print("📦 Carregando cosméticos animados...")
    with open("/app/backend/animated_cosmetics.json", "r", encoding="utf-8") as f:
        cosmetics = json.load(f)

    print(f"✅ Carregados {len(cosmetics)} cosméticos")

    # Limpar coleção existente
    print("🗑️  Limpando cosméticos antigos...")
    await db.cosmetics.delete_many({})

    # Inserir novos cosméticos
    print("💾 Inserindo cosméticos animados...")
    await db.cosmetics.insert_many(cosmetics)

    print(f"✅ {len(cosmetics)} cosméticos animados adicionados com sucesso!")

    # Estatísticas
    badges = [c for c in cosmetics if c["type"] == "badge"]
    borders = [c for c in cosmetics if c["type"] == "border"]
    backgrounds = [c for c in cosmetics if c["type"] == "background"]

    print("\n📊 Resumo:")
    print(f"   Badges: {len(badges)}")
    print(f"   Borders: {len(borders)}")
    print(f"   Backgrounds: {len(backgrounds)}")
    print(f"   Total: {len(cosmetics)}")

    client.close()


if __name__ == "__main__":
    asyncio.run(update_cosmetics())
