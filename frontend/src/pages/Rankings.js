import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Rankings() {
	const [tab, setTab] = useState("global");
	const [ranking, setRanking] = useState([]);

	const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

	useEffect(() => {
		loadRanking();
	}, [tab]);

	const loadRanking = async () => {
		try {
			const response = await axios.get(`${API_URL}/ranking/${tab}`);
			setRanking(response.data);
		} catch (error) {
			console.error("Erro ao carregar ranking:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<header className="bg-black/30 backdrop-blur-md border-b border-white/10">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link to="/dashboard" className="text-white hover:text-cyan-400">
						← Voltar
					</Link>
					<h1 className="text-2xl font-bold text-white">🏆 Rankings</h1>
					<div></div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="flex gap-4 mb-6 flex-wrap">
					<button
						type="button"
						onClick={() => setTab("global")}
						className={`px-4 py-2 rounded-lg transition ${tab === "global" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Global
					</button>
					<button
						type="button"
						onClick={() => setTab("daily")}
						className={`px-4 py-2 rounded-lg transition ${tab === "daily" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Diário
					</button>
					<button
						type="button"
						onClick={() => setTab("weekly")}
						className={`px-4 py-2 rounded-lg transition ${tab === "weekly" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Semanal
					</button>
					<button
						type="button"
						onClick={() => setTab("monthly")}
						className={`px-4 py-2 rounded-lg transition ${tab === "monthly" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Mensal
					</button>
				</div>

				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
					{ranking.length === 0 ? (
						<p className="text-gray-400 text-center py-8">
							Nenhum dado disponível
						</p>
					) : (
						<div className="space-y-3">
							{ranking.map((item, index) => {
								const user = item.user || item;
								return (
									<div
										key={user.id}
										className={`flex items-center justify-between p-4 rounded-lg ${index < 3 ? "bg-gradient-to-r from-yellow-900/30 to-yellow-700/30 border border-yellow-500/30" : "bg-gray-700/30"}`}
									>
										<div className="flex items-center gap-4">
											<div
												className={`text-2xl font-bold ${index === 0 ? "text-yellow-400" : index === 1 ? "text-gray-300" : index === 2 ? "text-orange-400" : "text-gray-500"}`}
											>
												#{index + 1}
											</div>
											<div>
												<p className="text-white font-semibold">{user.name}</p>
												<p className="text-gray-400 text-sm">{user.nick_tag}</p>
											</div>
										</div>
										<div className="text-right">
											{tab === "global" && (
												<>
													<p className="text-cyan-400 font-bold text-lg">
														{user.xp} XP
													</p>
													<p className="text-gray-400 text-sm">
														Nível {user.level}
													</p>
												</>
											)}
											{tab !== "global" && (
												<>
													<p className="text-cyan-400 font-bold text-lg">
														{Math.floor(
															(item.daily_time ||
																item.weekly_time ||
																item.monthly_time) / 60,
														)}{" "}
														min
													</p>
													<p className="text-gray-400 text-sm">
														{item.daily_xp || item.weekly_xp || item.monthly_xp}{" "}
														XP
													</p>
												</>
											)}
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
