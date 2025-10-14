// src/pages/Shop.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { injectBadgeCSSOnce, getVisual, getRarityColor } from "@/lib/cosmeticVisuals";

export default function Shop() {
  const { backendUser } = useAuth();
  const [items, setItems] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterRarity, setFilterRarity] = useState("all");

  useEffect(() => {
    injectBadgeCSSOnce();
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await api.get("/cosmetics");
      setItems(Array.isArray(data) ? data : data.items || []);
      setErr("");
      console.log("[SHOP] baseURL =", api.defaults.baseURL, "items=", data);
    } catch (e) {
      const msg =
        e?.response?.data?.detail || e?.message || "Falha ao carregar a loja.";
      setErr(msg);
      console.error("[SHOP] loadItems error:", e?.response || e);
    }
  };

  const buy = async (item) => {
    try {
      setBusyId(item.id);
      await api.post(`/cosmetics/buy/${item.id}`);
      alert("Compra realizada com sucesso! ✨");
      await loadItems();
    } catch (e) {
      alert(
        e?.response?.data?.detail || e?.message || "Não foi possível comprar."
      );
      console.error("[SHOP] buy error:", e?.response || e);
    } finally {
      setBusyId(null);
    }
  };

  // Filtros
  const filteredItems = items.filter((item) => {
    const typeMatch = filterType === "all" || item.type === filterType;
    const rarityMatch =
      filterRarity === "all" ||
      (item.style_data?.rarity || "Comum") === filterRarity;
    return typeMatch && rarityMatch;
  });

  // Agrupa por tipo
  const groupedItems = {
    badge: filteredItems.filter((i) => i.type === "badge"),
    border: filteredItems.filter((i) => i.type === "border"),
    background: filteredItems.filter((i) => i.type === "background"),
  };

  const typeLabels = {
    badge: "🏅 Badges",
    border: "🖼️ Bordas",
    background: "🎨 Fundos",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">🛍️ Loja de Cosméticos</h1>
          <Link
            to="/dashboard"
            className="text-cyan-400 hover:text-cyan-300 transition"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 text-white">
        {/* Saldo e Filtros */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-4 py-2 rounded-lg font-bold text-lg shadow-lg">
              💰 C$ {backendUser?.coins?.toLocaleString() ?? 0}
            </span>
          </div>

          {/* Filtros */}
          <div className="flex gap-3 flex-wrap">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Todos os Tipos</option>
              <option value="badge">🏅 Badges</option>
              <option value="border">🖼️ Bordas</option>
              <option value="background">🎨 Fundos</option>
            </select>

            <select
              value={filterRarity}
              onChange={(e) => setFilterRarity(e.target.value)}
              className="bg-gray-800/80 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <option value="all">Todas as Raridades</option>
              <option value="Comum">Comum</option>
              <option value="Incomum">Incomum</option>
              <option value="Raro">Raro</option>
            </select>
          </div>
        </div>

        {err && (
          <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-6">
            <p className="text-red-300">{err}</p>
          </div>
        )}

        {/* Grid de Itens por Tipo */}
        {Object.entries(groupedItems).map(
          ([type, typeItems]) =>
            typeItems.length > 0 && (
              <div key={type} className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  {typeLabels[type]}
                  <span className="text-gray-400 text-lg">
                    ({typeItems.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {typeItems.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      busy={busyId === item.id}
                      onBuy={buy}
                    />
                  ))}
                </div>
              </div>
            )
        )}

        {filteredItems.length === 0 && !err && (
          <div className="text-center py-20">
            <p className="text-gray-400 text-xl mb-2">
              Nenhum item encontrado
            </p>
            <p className="text-gray-500">
              Tente ajustar os filtros acima
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function ItemCard({ item, busy, onBuy }) {
  const visual = getVisual(item.id, item.type);
  const rarity = item.style_data?.rarity || "Comum";
  const rarityColor = getRarityColor(rarity);

  // Define automaticamente raridade baseada no preço se não tiver
  const autoRarity =
    rarity || (item.price >= 10000 ? "Raro" : item.price >= 1000 ? "Incomum" : "Comum");
  const finalRarityColor = getRarityColor(autoRarity);

  const renderPreview = () => {
    if (item.style_data?.svg) {
      return (
        <div
          className="w-full h-40 flex items-center justify-center p-4"
          dangerouslySetInnerHTML={{ __html: item.style_data.svg }}
        />
      );
    }

    // Fallback visual
    if (item.type === "badge") {
      return (
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto"
          style={{
            background: visual.color || "#ffd700",
            animation: visual.animation,
          }}
        >
          {visual.symbol || "🏅"}
        </div>
      );
    }

    if (item.type === "border") {
      return (
        <div
          className="w-32 h-32 rounded-lg mx-auto"
          style={{
            border: visual.border,
            boxShadow: visual.shadow,
            animation: visual.animation,
          }}
        />
      );
    }

    if (item.type === "background") {
      return (
        <div
          className="w-full h-40 rounded-lg"
          style={{
            background: visual.background,
            backgroundSize: visual.backgroundSize,
            animation: visual.animation,
          }}
        />
      );
    }
  };

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm border-2 rounded-2xl overflow-hidden hover:scale-105 transition-transform duration-300 shadow-xl hover:shadow-2xl"
      style={{ borderColor: finalRarityColor + "80" }}
    >
      {/* Badge de Raridade */}
      {autoRarity !== "Comum" && (
        <div className="absolute top-2 right-2 z-10">
          <span
            className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg"
            style={{
              background: finalRarityColor,
              color: "#fff",
            }}
          >
            {autoRarity}
          </span>
        </div>
      )}

      {/* Preview Visual */}
      <div className="bg-gray-900/50 p-6 relative">
        {renderPreview()}
      </div>

      {/* Informações */}
      <div className="p-5">
        <h3 className="font-bold text-lg mb-2 text-white truncate">
          {item.name}
        </h3>
        <p className="text-gray-400 text-sm mb-4 h-10 overflow-hidden">
          {item.description || `${item.type.charAt(0).toUpperCase() + item.type.slice(1)} exclusivo`}
        </p>

        {/* Preço e Botão */}
        <div className="flex items-center justify-between">
          <span className="text-yellow-400 font-bold text-xl">
            C$ {item.price.toLocaleString()}
          </span>
          <button
            type="button"
            disabled={!!item.owned || busy}
            onClick={() => onBuy(item)}
            className={`px-5 py-2 rounded-lg font-semibold transition-all duration-200 ${
              item.owned
                ? "bg-gray-600/60 text-gray-300 cursor-not-allowed"
                : busy
                ? "bg-cyan-500 text-white animate-pulse"
                : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg hover:shadow-cyan-500/50"
            }`}
          >
            {item.owned ? "✓ Possui" : busy ? "..." : "Comprar"}
          </button>
        </div>
      </div>
    </div>
  );
}
