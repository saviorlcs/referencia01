// src/pages/Settings.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext"; // <— importante
import { api } from "@/lib/api";

// chaves usadas no Dashboard
const LS_TIMER_KEY = "timer_settings_v1";
const LS_PREFS_KEY = "study_block_prefs_v1";
const LS_SCREEN_LOCK = "keep_awake_v1";

export default function Settings() {
	const navigate = useNavigate();
	const { backendUser } = useAuth();

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [savedAt, setSavedAt] = useState(null);

	// Modo do timer
	const [timerMode, setTimerMode] = useState("segments"); // "segments" | "ratio"

	// Segmentos (50/10 por padrão)
	const [studyBlockMin, setStudyBlockMin] = useState(50);
	const [breakBlockMin, setBreakBlockMin] = useState(10);

	// Proporção (5:1 por padrão)
	const [ratioStudy, setRatioStudy] = useState(5);
	const [ratioBreak, setRatioBreak] = useState(1);

	// Extras simples (opcionais)
	const [dailyGoal, setDailyGoal] = useState(120);
	const [weeklyGoal, setWeeklyGoal] = useState(900);
	const [keepAwake, setKeepAwake] = useState(true);

	// Sugestão de pausa para exibição no modo proporção
	const breakSuggestion = useMemo(() => {
		return Math.round(
			(Math.max(1, studyBlockMin) * Math.max(0, ratioBreak)) /
				Math.max(1, ratioStudy),
		);
	}, [studyBlockMin, ratioBreak, ratioStudy]);

	// Carregar (backend > localStorage > defaults)
	useEffect(() => {
		const load = async () => {
			try {
				const { data: user } = await api.get("/users/me");
				const t = user?.timer_settings;
				const p = user?.block_prefs;

				if (t) {
					setTimerMode(t.mode || "segments");
					setRatioStudy(Number(t.ratioStudy ?? 5));
					setRatioBreak(Number(t.ratioBreak ?? 1));
				} else {
					const rawT = localStorage.getItem(LS_TIMER_KEY);
					if (rawT) {
						const v = JSON.parse(rawT);
						setTimerMode(v.mode || "segments");
						setRatioStudy(Number(v.ratioStudy ?? 5));
						setRatioBreak(Number(v.ratioBreak ?? 1));
					}
				}

				if (p) {
					setStudyBlockMin(Number(p.studyBlockMin ?? 50));
					setBreakBlockMin(Number(p.breakBlockMin ?? 10));
				} else {
					const rawP = localStorage.getItem(LS_PREFS_KEY);
					if (rawP) {
						const v = JSON.parse(rawP);
						setStudyBlockMin(Number(v.studyBlockMin ?? 50));
						setBreakBlockMin(Number(v.breakBlockMin ?? 10));
					}
				}

				setDailyGoal(Number(user?.daily_goal ?? 120));
				setWeeklyGoal(Number(user?.weekly_goal ?? 900));
			} catch {
				// fallback localStorage quando o backend não estiver no ar
				const rawT = localStorage.getItem(LS_TIMER_KEY);
				const rawP = localStorage.getItem(LS_PREFS_KEY);
				if (rawT) {
					const v = JSON.parse(rawT);
					setTimerMode(v.mode || "segments");
					setRatioStudy(Number(v.ratioStudy ?? 5));
					setRatioBreak(Number(v.ratioBreak ?? 1));
				}
				if (rawP) {
					const v = JSON.parse(rawP);
					setStudyBlockMin(Number(v.studyBlockMin ?? 50));
					setBreakBlockMin(Number(v.breakBlockMin ?? 10));
				}
			} finally {
				setKeepAwake(localStorage.getItem(LS_SCREEN_LOCK) !== "0");
				setLoading(false);
			}
		};
		load();
	}, []);

	const saveAll = async () => {
		setSaving(true);
		try {
			// salva localStorage (usado pelo Dashboard)
			localStorage.setItem(
				LS_TIMER_KEY,
				JSON.stringify({ mode: timerMode, ratioStudy, ratioBreak }),
			);
			localStorage.setItem(
				LS_PREFS_KEY,
				JSON.stringify({ studyBlockMin, breakBlockMin }),
			);
			localStorage.setItem(LS_SCREEN_LOCK, keepAwake ? "1" : "0");

			// salva no backend (se estiver disponível)
			await api.put("/users/me/settings", {
				timer_settings: { mode: timerMode, ratioStudy, ratioBreak },
				block_prefs: { studyBlockMin, breakBlockMin },
				daily_goal: dailyGoal,
				weekly_goal: weeklyGoal,
				keep_awake: keepAwake,
			});

			setSavedAt(new Date());
		} catch {
			// ok – se o backend não estiver on, já gravamos localmente
			setSavedAt(new Date());
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 grid place-items-center">
				<div className="text-white/90">Carregando configurações…</div>
			</div>
		);
	}

	// classes utilitárias para inputs escuros
	const inputCls =
		"w-full bg-slate-900/60 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-cyan-500/60";
	const labelCls = "text-sm text-white/70 mb-1 block";

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<main className="container mx-auto px-6 py-8">
				{/* Voltar */}
				<button
					type="button"
					onClick={() => navigate(-1)}
					className="mb-6 inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-white/90 hover:bg-white/10"
				>
					← Voltar
				</button>

				{/* CARD ESCURO */}
				<div className="bg-[#0f172a] border border-white/10 rounded-2xl p-6">
					<h1 className="text-xl font-semibold text-white mb-6">
						Configurações
					</h1>

					{/* Modo do timer */}
					<div className="mb-6">
						<label className={labelCls}>Modo do timer</label>
						<select
							value={timerMode}
							onChange={(e) => setTimerMode(e.target.value)}
							className={inputCls}
						>
							<option value="segments">
								Segmentos (ex.: 50 min estudo / 10 min pausa)
							</option>
							<option value="ratio">Proporção (ex.: 5 : 1)</option>
						</select>
					</div>

					{/* Campos dependentes do modo */}
					{timerMode === "segments" ? (
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							<div>
								<label className={labelCls}>Duração do estudo (min)</label>
								<input
									type="number"
									min="1"
									value={studyBlockMin}
									onChange={(e) =>
										setStudyBlockMin(Math.max(1, Number(e.target.value || 0)))
									}
									className={inputCls}
								/>
								<p className="text-xs text-white/40 mt-1">Padrão: 50 min</p>
							</div>
							<div>
								<label className={labelCls}>Duração da pausa (min)</label>
								<input
									type="number"
									min="0"
									value={breakBlockMin}
									onChange={(e) =>
										setBreakBlockMin(Math.max(0, Number(e.target.value || 0)))
									}
									className={inputCls}
								/>
								<p className="text-xs text-white/40 mt-1">Padrão: 10 min</p>
							</div>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
							<div>
								<label className={labelCls}>Estudo</label>
								<input
									type="number"
									min="1"
									value={ratioStudy}
									onChange={(e) =>
										setRatioStudy(Math.max(1, Number(e.target.value || 0)))
									}
									className={inputCls}
								/>
							</div>
							<div>
								<label className={labelCls}>Pausa</label>
								<input
									type="number"
									min="0"
									value={ratioBreak}
									onChange={(e) =>
										setRatioBreak(Math.max(0, Number(e.target.value || 0)))
									}
									className={inputCls}
								/>
							</div>
							<div className="flex items-end">
								<div className="text-white/70 text-sm">
									Ex.: para{" "}
									<span className="text-white font-medium">
										{studyBlockMin} min
									</span>{" "}
									de estudo ⇒{" "}
									<span className="text-cyan-300 font-medium">
										{breakSuggestion} min
									</span>{" "}
									de pausa sugerida
								</div>
							</div>
						</div>
					)}

					{/* Metas e tela ligada */}
					<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
						<div>
							<label className={labelCls}>Meta diária (min)</label>
							<input
								type="number"
								min="0"
								value={dailyGoal}
								onChange={(e) =>
									setDailyGoal(Math.max(0, Number(e.target.value || 0)))
								}
								className={inputCls}
							/>
						</div>
						<div>
							<label className={labelCls}>Meta semanal (min)</label>
							<input
								type="number"
								min="0"
								value={weeklyGoal}
								onChange={(e) =>
									setWeeklyGoal(Math.max(0, Number(e.target.value || 0)))
								}
								className={inputCls}
							/>
						</div>
					</div>

					<label className="inline-flex items-center gap-2 mb-6">
						<input
							type="checkbox"
							checked={keepAwake}
							onChange={(e) => setKeepAwake(e.target.checked)}
							className="h-4 w-4"
						/>
						<span className="text-white/80 text-sm">
							Manter a tela ligada enquanto o timer estiver rodando
						</span>
					</label>

					{/* Salvar */}
					<div className="mt-6 flex items-center gap-4">
						<button
							type="button"
							onClick={saveAll}
							disabled={saving}
							className="px-5 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white font-semibold disabled:opacity-60"
						>
							{saving ? "Salvando..." : "Salvar preferências"}
						</button>
						{savedAt && (
							<span className="text-white/60 text-sm">
								Salvo às{" "}
								{savedAt.toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									second: "2-digit",
								})}
							</span>
						)}
					</div>
				</div>
			</main>
		</div>
	);
}
