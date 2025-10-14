// src/pages/Shop.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function Shop() {
	const { backendUser } = useAuth();
	const [items, setItems] = useState([]);
	const [busyId, setBusyId] = useState(null);
	const [err, setErr] = useState("");

	useEffect(() => {
		loadItems();
	}, []);

	const loadItems = async () => {
		try {
			const { data } = await api.get("/cosmetics");
			setItems(Array.isArray(data) ? data : data.items || []);
			setErr("");
			// log de apoio
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
			// backend espera POST /cosmetics/buy/{item_id}
			await api.post(`/cosmetics/buy/${item.id}`);
			alert("Compra realizada!");
			await loadItems();
		} catch (e) {
			alert(
				e?.response?.data?.detail || e?.message || "Não foi possível comprar.",
			);
			console.error("[SHOP] buy error:", e?.response || e);
		} finally {
			setBusyId(null);
		}
	};

	// --- DIAGNÓSTICO: testa conectividade e exibe resultado na tela ---
	const [diag, setDiag] = useState(null);
	const diagnosticar = async () => {
		const r = { baseURL: api.defaults.baseURL };
		try {
			const ping = await api.get("/ping");
			r.ping = ping.data;
		} catch (e) {
			r.pingError = e?.response?.data || e?.message;
		}
		try {
			const l = await api.get("/cosmetics");
			r.itemsOk = Array.isArray(l.data) ? l.data.length : 0;
		} catch (e) {
			r.itemsError = e?.response?.data || e?.message;
		}
		setDiag(r);
		console.log("[SHOP] diag =", r);
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<header className="bg-black/30 backdrop-blur-md border-b border-white/10">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<h1 className="text-2xl font-bold text-white">🛍️ Loja</h1>
					<Link to="/dashboard" className="text-cyan-400 hover:text-cyan-300">
						← Voltar
					</Link>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 text-white">
				<div className="mb-6">
					<span className="bg-white/10 px-3 py-1 rounded-lg">
						💰 C$ {backendUser?.coins ?? 0}
					</span>
					<button
						type="button"
						onClick={diagnosticar}
						className="ml-3 bg-gray-700/50 hover:bg-gray-600/50 px-3 py-1 rounded"
						title="Diagnóstico rápido de API/CORS"
					>
						Diagnosticar API
					</button>
				</div>

				{diag && (
					<pre className="text-sm bg-black/30 p-3 rounded-lg mb-6 overflow-auto">
						{JSON.stringify(diag, null, 2)}
					</pre>
				)}

				{err && <p className="text-red-300 mb-4">{err}</p>}

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{items.map((it) => (
						<div
							key={it.id}
							className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4 flex flex-col justify-between"
						>
							<div>
								<div className="text-3xl mb-2">{it.emoji || "🎁"}</div>
								<h3 className="font-semibold">{it.name}</h3>
								<p className="text-gray-300/70 text-sm">
									{it.description || "—"}
								</p>
							</div>

							<div className="mt-4 flex items-center justify-between">
								<span className="text-yellow-300 font-semibold">
									C$ {it.price}
								</span>
								<button
									type="button"
									disabled={!!it.owned || busyId === it.id}
									onClick={() => buy(it)}
									className={`px-4 py-2 rounded-lg font-semibold transition
                    ${
											it.owned
												? "bg-gray-600/40 text-gray-300 cursor-not-allowed"
												: "bg-cyan-600 hover:bg-cyan-500 text-white"
										}`}
								>
									{it.owned
										? "Comprado"
										: busyId === it.id
											? "Comprando..."
											: "Comprar"}
								</button>
							</div>
						</div>
					))}
				</div>

				{items.length === 0 && !err && (
					<p className="text-gray-300 mt-6">Nenhum item disponível.</p>
				)}
			</main>
		</div>
	);
}
