import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CycleMap from "@/components/CycleMap";
import { api } from "@/lib/api";
import MusicPlayer from "../components/MusicPlayer";
import { useAuth } from "../contexts/AuthContext";

// topo
const LS_TIMER_KEY = "timer_settings_v1";

// helper
const suggestedBreakFor = (studyMin) =>
	Math.max(0, Math.round((studyMin * ratioBreak) / Math.max(1, ratioStudy)));

const COLOR_KEY = "cycleColorOverrides_v1";
const LS_SUBJECTS_KEY = "study_subjects_v1";
const SUBJECT_COLORS = [
	"#FF69B4",
	"#FF8C42",
	"#00D4FF",
	"#9D4EDD",
	"#06FFA5",
	"#FFD23F",
	"#FF6B6B",
	"#4ECDC4",
];

const ALARM_SOUNDS = [
	{ id: "bell", name: "🔔 Sino" },
	{ id: "chime", name: "🎐 Carrilhão" },
	{ id: "digital", name: "💻 Digital" },
	{ id: "bird", name: "🐦 Pássaro" },
	{ id: "wood", name: "🪵 Madeira" },
	{ id: "kitchen", name: "🍳 Cozinha" },
	{ id: "analog", name: "⏰ Analógico" },
	{ id: "glass", name: "🔊 Vidro" },
	{ id: "soft", name: "🌸 Suave" },
	{ id: "piano", name: "🎹 Piano" },
];

// helper único (fora do componente) — NÃO duplicar
function pickNumber(obj, keys) {
	for (const k of keys) {
		const n = Number(obj?.[k]);
		if (!Number.isNaN(n) && n >= 0) return n;
	}
	return 0;
}

export default function Dashboard() {
	const { backendUser, logout } = useAuth();
	// Timer / proporção
	const [timerMode, setTimerMode] = useState("segments"); // "segments" | "ratio"
	const [ratioStudy, setRatioStudy] = useState(5);
	const [ratioBreak, setRatioBreak] = useState(1);
	const [breakLen, setBreakLen] = useState(10); // pausa corrente, em minutos

	// Preferências de tamanho de bloco (padrão 50:10)
	const LS_PREFS_KEY = "study_block_prefs_v1";
	const [studyBlockMin, setStudyBlockMin] = useState(50);
	const [breakBlockMin, setBreakBlockMin] = useState(10);

	// Sugestão de pausa (exibição/cálculo, não força o valor)
	const breakSuggestion = useMemo(() => {
		return Math.round(
			(Math.max(1, studyBlockMin) * Math.max(0, ratioBreak)) /
				Math.max(1, ratioStudy),
		);
	}, [studyBlockMin, ratioBreak, ratioStudy]);

	// ---------- STATE ----------
	const [subjects, setSubjects] = useState([]);
	const [colorOverrides, setColorOverrides] = useState({});
	const [quests, setQuests] = useState([]);
	const [currentTime, setCurrentTime] = useState(50 * 60);
	const [isRunning, setIsRunning] = useState(false);
	const [isBreak, setIsBreak] = useState(false);
	const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
	const [cycleNumber, setCycleNumber] = useState(1);
	const [newSubjectName, setNewSubjectName] = useState("");
	const [newSubjectMinutes, setNewSubjectMinutes] = useState(180);
	const [editingSubject, setEditingSubject] = useState(null);
	const [editingValue, setEditingValue] = useState("");
	const [draggedIndex, setDraggedIndex] = useState(null);
	const [selectedAlarm, setSelectedAlarm] = useState("bell");
	const [showAlarmMenu, setShowAlarmMenu] = useState(false);
	const [notificationPermission, setNotificationPermission] =
		useState("default");
	const [lastChunk, setLastChunk] = useState(50);

	// menu Resetar
	const [showResetMenu, setShowResetMenu] = useState(false);
	const resetMenuRef = useRef(null);

	const intervalRef = useRef(null);

	// dá uma aparência aleatória mas SEM repetição visível (golden angle)
	// se quiser um "seed" por página: some com um Math.random() fixado em useRef
	// gera cores únicas (sem repetição “visível”) usando golden-angle
	const autoColor = (index) => {
		const h = (index * 137.508) % 360;
		return `hsl(${h} 85% 55%)`;
	};

	// ---------- EFFECTS ----------
	useEffect(() => {
		const raw = localStorage.getItem(COLOR_KEY);
		if (raw) setColorOverrides(JSON.parse(raw));
	}, []);

	useEffect(() => {
		function onDocClick(e) {
			if (resetMenuRef.current && !resetMenuRef.current.contains(e.target)) {
				setShowResetMenu(false);
			}
		}
		if (showResetMenu) document.addEventListener("click", onDocClick);
		return () => document.removeEventListener("click", onDocClick);
	}, [showResetMenu]);

	useEffect(() => {
		const prefs = { studyBlockMin, breakBlockMin, ratioStudy, ratioBreak };
		localStorage.setItem(LS_PREFS_KEY, JSON.stringify(prefs));
		const save = async () => {
			try {
				await api.put(`/users/me/settings`, { block_prefs: prefs });
			} catch {
				/* se o Mongo não estiver ligado, continua no localStorage */
			}
		};
		save();
	}, [studyBlockMin, breakBlockMin, ratioStudy, ratioBreak]);

	useEffect(() => {
		loadUserSettings();
		loadQuests();
		generateQuestsIfNeeded();
		requestNotificationPermission();
	}, []);

	useEffect(() => {
		if (isRunning) {
			intervalRef.current = setInterval(() => {
				setCurrentTime((prev) => {
					if (prev <= 0) {
						handleTimerEnd();
						return 0;
					}
					return prev - 1;
				});
			}, 1000);
		} else if (intervalRef.current) {
			clearInterval(intervalRef.current);
		}
		return () => intervalRef.current && clearInterval(intervalRef.current);
	}, [isRunning]);

	useEffect(() => {
		const currentSubject = subjects[currentSubjectIndex];
		const timeStr = formatTime(currentTime);
		if (isBreak) document.title = `${timeStr} - Pausa | Ciclo de Estudos`;
		else if (currentSubject)
			document.title = `${timeStr} - ${currentSubject.name} | Ciclo de Estudos`;
		else document.title = "Ciclo de Estudos";
	}, [currentTime, isBreak, currentSubjectIndex, subjects]);
	// Se o tamanho da lista mudar e o índice ativo ficar inválido, volta pro 0
	useEffect(() => {
		if (!Array.isArray(subjects)) return;
		if (currentSubjectIndex < 0 || currentSubjectIndex >= subjects.length) {
			setCurrentSubjectIndex(0);
		}
	}, [subjects.length]); // observa só a mudança de tamanho
	// segundos/minutos “ao vivo” do pedaço atual
	const liveCurrentTargetMin = isBreak ? breakBlockMin : lastChunk;
	const liveCurrentSec =
		isRunning && subjects[currentSubjectIndex]
			? Math.max(0, liveCurrentTargetMin * 60 - currentTime)
			: 0;
	const liveCurrentMin = liveCurrentSec / 60;

	// ---------- HELPERS ----------
	const resolveColor = (s, idx) =>
		s?.color || colorOverrides?.[String(s?.id)] || autoColor(idx); // fallback bonito

	// quanto resta (min) de uma matéria
	const remainingOf = (s) =>
		Math.max(0, (s?.duration || 0) - (s?.consumed || 0));

	// próximo bloco de estudo usa o tamanho configurado
	// próximo pedaço de estudo
	const nextStudyChunk = (s) => {
		if (timerMode === "ratio") {
			// um blocão de estudo = o que resta
			return Math.max(1, remainingOf(s) || 0);
		}
		// segmentado: usa o tamanho configurado do bloco de estudo
		return Math.min(studyBlockMin, remainingOf(s) || studyBlockMin);
	};

	// encerra o pedaço atual (estudo): dá XP/coins pelo tempo REAL,
	// mas acrescenta no progresso o BLOCO cheio (50 ou o que for)
	const completeCurrentStudy = async ({ awardSeconds, creditMinutes }) => {
		const s = subjects[currentSubjectIndex];
		if (!s) return;

		showNotification("Bloco concluído", s.name);
		playSelectedAlarm();

		// 1) XP/coins pelo tempo realmente estudado
		try {
			await api.post(`/sessions`, {
				subject: s.name,
				duration: Math.max(0, Math.floor(awardSeconds)),
			});
		} catch {}

		// 2) Progresso da matéria: soma o bloco completo
		const updated = subjects.map((it, idx) =>
			idx === currentSubjectIndex
				? {
						...it,
						consumed: Math.min(
							(it.consumed || 0) + creditMinutes,
							it.duration || 0,
						),
					}
				: it,
		);
		setSubjects(updated);

		// 3) se ainda há minutos da matéria → entra em PAUSA (10min contam como progresso depois)
		// ao finalizar ESTUDO
		// ainda resta conteúdo → pausa
		if (remainingOf(updated[currentSubjectIndex]) > 0) {
			const len =
				timerMode === "ratio"
					? suggestedBreakFor(creditMinutes) // usa a razão 5:1 (ou a que estiver nas configs)
					: breakBlockMin; // modo segmentado usa o bloco configurado (ex.: 10)
			setIsBreak(true);
			setBreakLen(len);
			setCurrentTime(len * 60);
			setIsRunning(false);
			return;
		}

		// 4) acabou a matéria → avança
		if (currentSubjectIndex < updated.length - 1) {
			const next = updated[currentSubjectIndex + 1];
			setCurrentSubjectIndex(currentSubjectIndex + 1);
			setIsBreak(false);
			const ch = nextStudyChunk(next);
			setLastChunk(ch);
			setCurrentTime(ch * 60);
			setIsRunning(false);
		} else {
			// fim do ciclo
			setCycleNumber((n) => n + 1);
			try {
				await api.post(`/users/me/cycle-complete`);
			} catch {}
			const reset = updated.map((it) => ({ ...it, consumed: 0 }));
			setSubjects(reset);
			setCurrentSubjectIndex(0);
			setIsBreak(false);
			const ch = nextStudyChunk(reset[0] || { duration: 50, consumed: 0 });
			setLastChunk(ch);
			setCurrentTime(ch * 60);
			setIsRunning(false);
		}
	};

	// fim da PAUSA: credita +10min de progresso (sem XP) e volta ao estudo
	const completeBreak = () => {
		const updated = subjects.map((it, idx) =>
			idx === currentSubjectIndex
				? {
						...it,
						consumed: Math.min((it.consumed || 0) + breakLen, it.duration || 0),
					}
				: it,
		);
		setSubjects(updated);

		const cur = updated[currentSubjectIndex];
		if (remainingOf(cur) > 0) {
			setIsBreak(false);
			const ch = nextStudyChunk(cur);
			setLastChunk(ch);
			setCurrentTime(ch * 60);
		} else if (currentSubjectIndex < updated.length - 1) {
			const next = updated[currentSubjectIndex + 1];
			setCurrentSubjectIndex(currentSubjectIndex + 1);
			setIsBreak(false);
			const ch = nextStudyChunk(next);
			setLastChunk(ch);
			setCurrentTime(ch * 60);
		} else {
			setCycleNumber((n) => n + 1);
			const reset = updated.map((it) => ({ ...it, consumed: 0 }));
			setSubjects(reset);
			setCurrentSubjectIndex(0);
			setIsBreak(false);
			const ch = nextStudyChunk(reset[0] || { duration: 50, consumed: 0 });
			setLastChunk(ch);
			setCurrentTime(ch * 60);
		}
	};

	const requestNotificationPermission = async () => {
		if ("Notification" in window) {
			const permission = await Notification.requestPermission();
			setNotificationPermission(permission);
		}
	};

	const showNotification = (title, body) => {
		if (notificationPermission === "granted") {
			new Notification(title, {
				body,
				icon: "/favicon.ico",
				badge: "/favicon.ico",
			});
		}
	};

	const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

	// carregar preferências do usuário
	const LS_TIMER_KEY = "timer_settings_v1";

	const loadUserSettings = async () => {
		try {
			const { data: u } = await api.get(`/users/me`);

			// matérias
			if (Array.isArray(u?.study_subjects) && u.study_subjects.length > 0) {
				setSubjects(
					u.study_subjects.map((s) => ({ ...s, consumed: s.consumed || 0 })),
				);
			} else {
				const raw = localStorage.getItem(LS_SUBJECTS_KEY);
				if (raw) setSubjects(JSON.parse(raw));
			}

			// timer (modo/razão)
			const t = u?.timer_settings;
			if (t) {
				setTimerMode(t.mode || "segments");
				setRatioStudy(Number(t.ratioStudy ?? 5));
				setRatioBreak(Number(t.ratioBreak ?? 1));
				setBreakLen(Number(t.breakLen ?? 10));
			} else {
				const rawT = localStorage.getItem(LS_TIMER_KEY);
				if (rawT) {
					const v = JSON.parse(rawT);
					setTimerMode(v.mode || "segments");
					setRatioStudy(Number(v.ratioStudy ?? 5));
					setRatioBreak(Number(v.ratioBreak ?? 1));
					setBreakLen(Number(v.breakLen ?? 10));
				}
			}

			// preferências de tamanho de bloco
			const p = u?.block_prefs;
			if (p) {
				setStudyBlockMin(Number(p.studyBlockMin) || 50);
				setBreakBlockMin(Number(p.breakBlockMin) || 10);
			} else {
				const rawPrefs = localStorage.getItem(LS_PREFS_KEY);
				if (rawPrefs) {
					const j = JSON.parse(rawPrefs);
					setStudyBlockMin(Number(j.studyBlockMin) || 50);
					setBreakBlockMin(Number(j.breakBlockMin) || 10);
				}
			}

			if (u?.selected_alarm) setSelectedAlarm(u.selected_alarm);
		} catch (err) {
			// fallbacks locais
			const raw = localStorage.getItem(LS_SUBJECTS_KEY);
			if (raw) setSubjects(JSON.parse(raw));

			const rawT = localStorage.getItem(LS_TIMER_KEY);
			if (rawT) {
				const v = JSON.parse(rawT);
				setTimerMode(v.mode || "segments");
				setRatioStudy(Number(v.ratioStudy ?? 5));
				setRatioBreak(Number(v.ratioBreak ?? 1));
				setBreakLen(Number(v.breakLen ?? 10));
			}

			const rawPrefs = localStorage.getItem(LS_PREFS_KEY);
			if (rawPrefs) {
				const j = JSON.parse(rawPrefs);
				setStudyBlockMin(Number(j.studyBlockMin) || 50);
				setBreakBlockMin(Number(j.breakBlockMin) || 10);
			}

			console.warn(
				"loadUserSettings falhou; usando localStorage:",
				err?.response?.data || err,
			);
		}
	};

	// salva TIMER (modo/razão)
	useEffect(() => {
		const t = { mode: timerMode, ratioStudy, ratioBreak };
		localStorage.setItem(LS_TIMER_KEY, JSON.stringify(t));
		api.put(`/users/me/settings`, { timer_settings: t }).catch(() => {});
	}, [timerMode, ratioStudy, ratioBreak]);
	useEffect(() => {
		const t = { mode: timerMode, ratioStudy, ratioBreak, breakLen };
		localStorage.setItem(LS_TIMER_KEY, JSON.stringify(t));
		(async () => {
			try {
				await api.put(`/users/me/settings`, { timer_settings: t });
			} catch {}
		})();
	}, [timerMode, ratioStudy, ratioBreak, breakLen]);

	// salva PREFS de bloco
	useEffect(() => {
		const prefs = { studyBlockMin, breakBlockMin };
		localStorage.setItem(LS_PREFS_KEY, JSON.stringify(prefs));
		api.put(`/users/me/settings`, { block_prefs: prefs }).catch(() => {});
	}, [studyBlockMin, breakBlockMin]);

	// persistir matérias
	useEffect(() => {
		localStorage.setItem(LS_SUBJECTS_KEY, JSON.stringify(subjects));
		const save = async () => {
			try {
				await api.put(`/users/me/settings`, { study_subjects: subjects });
			} catch (err) {
				console.warn(
					"saveSubjectsToBackend falhou; ficou no localStorage:",
					err?.response?.data || err,
				);
			}
		};
		if (Array.isArray(subjects)) save();
	}, [subjects]);

	// quests
	const loadQuests = async () => {
		try {
			const { data } = await api.get(`/quests`);
			setQuests(Array.isArray(data) ? data : []);
		} catch (err) {
			console.warn("Erro ao carregar quests:", err?.response?.data || err);
			setQuests([]);
		}
	};

	const generateQuestsIfNeeded = async () => {
		try {
			await api.post(`/quests/generate`);
		} catch (err) {
			console.info("generateQuestsIfNeeded:", err?.response?.data || "ok");
		}
	};

	const resetQuests = async () => {
		const resetCost = 25;
		if ((backendUser?.coins || 0) < resetCost) {
			alert("Você precisa de C$ 25 para resetar as quests!");
			return;
		}
		if (!window.confirm(`Resetar quests custará C$ ${resetCost}. Confirmar?`))
			return;
		try {
			await api.post(`/quests/reset`);
			alert("Quests resetadas! Gerando novas quests...");
			await generateQuestsIfNeeded();
			await loadQuests();
		} catch (e) {
			alert(e?.response?.data?.detail || "Erro ao resetar quests");
		}
	};

	const playAlarm = () => {
		const beep = new Audio(
			"data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoG...",
		);
		beep.play();
	};

	// registra tempo parcial (XP/coins) antes de resets
	const awardPartialStudyIfNeeded = async () => {
		try {
			if (!isBreak && subjects[currentSubjectIndex]) {
				const studiedSec = Math.max(0, lastChunk * 60 - currentTime);
				if (studiedSec >= 30) {
					await api.post(`/sessions`, {
						subject: subjects[currentSubjectIndex].name,
						duration: studiedSec,
					});
				}
			}
		} catch (err) {
			console.warn(
				"Falha ao registrar tempo parcial:",
				err?.response?.data || err,
			);
		}
	};

	// ---------- RESET HANDLERS ----------
	const handleResetBlock = async () => {
		setIsRunning(false);
		await awardPartialStudyIfNeeded();
		setSubjects((prev) =>
			prev.map((s, i) =>
				i === currentSubjectIndex ? { ...s, consumed: 0 } : s,
			),
		);
		setIsBreak(false);
		const base = subjects[currentSubjectIndex]
			? { ...subjects[currentSubjectIndex], consumed: 0 }
			: { duration: 50, consumed: 0 };
		const ch = nextStudyChunk(base);
		setLastChunk(ch);
		setCurrentTime(ch * 60);
		setShowResetMenu(false);
	};

	const handleResetCycle = async () => {
		setIsRunning(false);
		await awardPartialStudyIfNeeded();
		setSubjects((prev) => prev.map((s) => ({ ...s, consumed: 0 })));
		setCurrentSubjectIndex(0);
		setIsBreak(false);
		const first = subjects[0]
			? { ...subjects[0], consumed: 0 }
			: { duration: 50, consumed: 0 };
		const ch = nextStudyChunk(first);
		setLastChunk(ch);
		setCurrentTime(ch * 60);
		setShowResetMenu(false);
	};

	// ---------- DERIVA DADOS PARA O MAPA ----------
	// ---- monta o array que o <CycleMap /> espera
	const contents = useMemo(() => {
		const arr = Array.isArray(subjects) ? subjects : [];
		const pickNumber = (obj, keys) => {
			for (const k of keys) {
				const n = Number(obj?.[k]);
				if (!Number.isNaN(n) && n >= 0) return n;
			}
			return 0;
		};

		return arr.map((s, idx) => ({
			id: String(s.id ?? s._id ?? idx),
			name: s.name ?? s.title ?? s.label ?? s.materia ?? `Bloco ${idx + 1}`,
			plannedMin: pickNumber(s, [
				"studyMinutes",
				"plannedMin",
				"minutes",
				"totalMinutes",
				"totalMin",
				"duration",
				"duracao",
				"time",
			]),
			studiedMin: pickNumber(s, [
				"studiedMinutes",
				"done",
				"doneMin",
				"progressMin",
				"elapsed",
				"consumed",
			]),
			color: resolveColor(s, idx),
		}));
	}, [subjects]);

	// <- MANTENHA ESTE BLOCO EXATAMENTE ABAIXO DE "contents"
	const idToIndex = useMemo(() => {
		const map = {};
		contents.forEach((c, i) => {
			map[String(c.id)] = i;
		});
		return map;
	}, [contents]);

	const handleChangeColor = (id, color) => {
		setColorOverrides((prev) => {
			const next = { ...prev, [id]: color };
			localStorage.setItem(COLOR_KEY, JSON.stringify(next));
			return next;
		});
	};

	// ---------- TIMER ----------
	const handleTimerEnd = async () => {
		setIsRunning(false);
		const s = subjects[currentSubjectIndex];

		if (!isBreak && s) {
			const studiedRealSec = Math.max(0, lastChunk * 60 - currentTime);
			const creditMin = nextStudyChunk(s); // bloco inteiro no progresso
			await completeCurrentStudy({
				awardSeconds: studiedRealSec,
				creditMinutes: creditMin,
			});
		} else {
			playSelectedAlarm();
			completeBreak(); // credita a PAUSA configurada
		}
	};

	// ir para o BLOCO anterior (não altera progresso; só troca o modo/timer)
	const goPrevBlock = () => {
		setIsRunning(false);
		const cur = subjects[currentSubjectIndex];
		if (!cur) return;

		if (isBreak) {
			setIsBreak(false);
			const ch = nextStudyChunk(cur);
			setLastChunk(ch);
			setCurrentTime(ch * 60);
		} else {
			setIsBreak(true);
			setBreakLen(breakBlockMin);
			setCurrentTime(breakBlockMin * 60);
		}
	};

	// ir para a MATÉRIA anterior (não mexe em progresso)
	const goPrevSubject = () => {
		if (currentSubjectIndex <= 0) return;
		const idx = currentSubjectIndex - 1;
		const prev = subjects[idx];
		if (!prev) return;

		setIsRunning(false);
		setIsBreak(false);
		setCurrentSubjectIndex(idx);

		const ch = nextStudyChunk(prev);
		setLastChunk(ch);
		setCurrentTime(ch * 60);
	};

	// pular para a PRÓXIMA MATÉRIA (apenas troca o foco)
	const skipToNextSubject = () => {
		setIsRunning(false);
		const idx = currentSubjectIndex + 1;
		if (idx >= subjects.length) return;

		const next = subjects[idx];
		setCurrentSubjectIndex(idx);
		setIsBreak(false);

		const ch = nextStudyChunk(next);
		setLastChunk(ch);
		setCurrentTime(ch * 60);
	};

	const startTimer = () => {
		if (subjects.length === 0 && !isBreak) {
			alert("Adicione pelo menos uma matéria!");
			return;
		}
		if (!isBreak) {
			const s = subjects[currentSubjectIndex];
			const chunk = nextStudyChunk(
				s || { duration: studyBlockMin, consumed: 0 },
			);
			setLastChunk(chunk);
			if (Math.round(currentTime / 60) !== chunk) setCurrentTime(chunk * 60);
		} else {
			if (currentTime !== breakBlockMin * 60)
				setCurrentTime(breakBlockMin * 60);
			setBreakLen(breakBlockMin);
		}

		setIsRunning(true);
	};

	// ---------- LISTA E CONTROLES ----------
	// ---------- LISTA E CONTROLES ----------
	const addSubject = () => {
		if (!newSubjectName.trim()) return;

		const totalMinutes = Math.max(0, parseInt(newSubjectMinutes, 10) || 0);
		const novo = {
			id: Date.now(),
			name: newSubjectName.trim(),
			duration: totalMinutes,
			consumed: 0,
			color: autoColor(subjects.length),
		};

		setSubjects((prev) => {
			const next = [...prev, novo];

			// se for a primeira matéria, já deixa selecionada e prepara o timer
			if (prev.length === 0) {
				setCurrentSubjectIndex(0);
				setIsBreak(false);
				const ch = nextStudyChunk(novo);
				setLastChunk(ch);
				setCurrentTime(ch * 60);
			}

			return next;
		});

		setNewSubjectName("");
		setNewSubjectMinutes(180);
	};

	const removeSubject = (id) => {
		setSubjects(subjects.filter((s) => s.id !== id));
		if (currentSubjectIndex >= subjects.length - 1) {
			setCurrentSubjectIndex(Math.max(0, subjects.length - 2));
		}
	};

	const updateSubjectColor = (id, newColor) => {
		setSubjects(
			subjects.map((s) => (s.id === id ? { ...s, color: newColor } : s)),
		);
	};

	const updateSubjectName = (id, newName) => {
		setSubjects(
			subjects.map((s) => (s.id === id ? { ...s, name: newName } : s)),
		);
		setEditingSubject(null);
	};

	const handleDragStart = (index) => setDraggedIndex(index);
	const handleDragOver = (e, index) => {
		e.preventDefault();
		if (draggedIndex === null || draggedIndex === index) return;
		const newSubjects = [...subjects];
		const draggedItem = newSubjects[draggedIndex];
		newSubjects.splice(draggedIndex, 1);
		newSubjects.splice(index, 0, draggedItem);
		setSubjects(newSubjects);
		setDraggedIndex(index);
	};
	const handleDragEnd = () => setDraggedIndex(null);

	const selectSubjectFromCircle = (index) => {
		if (!isRunning) {
			setCurrentSubjectIndex(index);
			setIsBreak(false);
			const ch = nextStudyChunk(subjects[index]);
			setLastChunk(ch);
			setCurrentTime(ch * 60);
		}
	};

	const selectAlarm = (alarmId) => {
		setSelectedAlarm(alarmId);
		localStorage.setItem("selected_alarm", alarmId);
		setShowAlarmMenu(false);
	};

	const formatTime = (seconds) => {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
	};

	// toca o som escolhido
	// === AUDIO (cole perto dos outros helpers do componente) ===
	const audioCtxRef = useRef(null);
	const getCtx = () =>
		audioCtxRef.current ||
		(audioCtxRef.current = new (
			window.AudioContext || window.webkitAudioContext
		)());

	// envelope simples
	const applyEnv = (
		g,
		t,
		{
			attack = 0.01,
			decay = 0.25,
			sustain = 0.6,
			release = 0.4,
			peak = 0.9,
			duration = 2.0,
		} = {},
	) => {
		g.gain.setValueAtTime(0.0001, t);
		g.gain.linearRampToValueAtTime(peak, t + attack);
		g.gain.linearRampToValueAtTime(peak * sustain, t + attack + decay);
		g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
	};

	// osc util
	const makeOsc = (ctx, type, freq) => {
		const o = ctx.createOscillator();
		o.type = type;
		o.frequency.value = freq;
		return o;
	};

	// ruído para madeira/pássaro
	const makeNoise = (ctx, seconds = 2) => {
		const buffer = ctx.createBuffer(
			1,
			ctx.sampleRate * seconds,
			ctx.sampleRate,
		);
		const data = buffer.getChannelData(0);
		for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
		const src = ctx.createBufferSource();
		src.buffer = buffer;
		return src;
	};

	// TOQUES com ~2s
	const playSelectedAlarm = (id = selectedAlarm) => {
		try {
			const ctx = getCtx();
			const master = ctx.createGain();
			master.gain.value = 0.9;
			master.connect(ctx.destination);

			const now = ctx.currentTime;
			const D = 2.05; // ~2s em todos

			switch (id) {
				// 🔔 Sino – “ding” metálico, 3 parciais que morrem lentamente
				case "bell": {
					[660, 880, 1320].forEach((f, i) => {
						const o = makeOsc(ctx, "sine", f);
						const g = ctx.createGain();
						o.connect(g);
						g.connect(master);
						applyEnv(g, now, {
							attack: 0.005,
							decay: 0.5,
							sustain: 0.3,
							duration: D - i * 0.2,
							peak: 0.9 / (i + 1),
						});
						o.start(now);
						o.stop(now + D);
					});
					break;
				}

				// 🎐 Carrilhão – dois “tings” cristalinos em arpejo
				case "chime": {
					const playChime = (t, base = 784) => {
						[base, (base * 4) / 3].forEach((f, i) => {
							const o = makeOsc(ctx, "triangle", f);
							const g = ctx.createGain();
							o.connect(g);
							g.connect(master);
							applyEnv(g, t + i * 0.02, {
								attack: 0.005,
								decay: 0.6,
								sustain: 0.25,
								duration: 1.0,
								peak: 0.7,
							});
							o.start(t);
							o.stop(t + 1.2);
						});
					};
					playChime(now);
					playChime(now + 0.6, 932); // repete um pouco mais agudo
					break;
				}

				// 💻 Digital – bipes quadrados, 3 passos
				case "digital": {
					const o = makeOsc(ctx, "square", 1200);
					const g = ctx.createGain();
					o.connect(g);
					g.connect(master);
					applyEnv(g, now, {
						attack: 0.005,
						decay: 0.15,
						sustain: 0.5,
						duration: D,
						peak: 0.6,
					});
					o.start(now);
					o.frequency.setValueAtTime(1200, now);
					o.frequency.setValueAtTime(1000, now + 0.6);
					o.frequency.setValueAtTime(800, now + 1.2);
					o.stop(now + D);
					break;
				}

				// 🐦 Pássaro – 3 chilros (sweeps com vibrato leve)
				case "bird": {
					const chirp = (t, f = 2500) => {
						const o = makeOsc(ctx, "sine", f);
						const g = ctx.createGain();
						o.connect(g);
						g.connect(master);
						applyEnv(g, t, {
							attack: 0.01,
							decay: 0.2,
							sustain: 0.3,
							duration: 0.5,
							peak: 0.4,
						});
						// sweep + vibrato
						o.frequency.exponentialRampToValueAtTime(f * 1.4, t + 0.2);
						const v = makeOsc(ctx, "sine", 6); // vibrato
						const vg = ctx.createGain();
						vg.gain.value = 20;
						v.connect(vg);
						vg.connect(o.frequency);
						v.start(t);
						v.stop(t + 0.5);
						o.start(t);
						o.stop(t + 0.5);
					};
					chirp(now);
					chirp(now + 0.45, 3000);
					chirp(now + 0.9, 2200);
					break;
				}

				// 🪵 Madeira – “toc” seco, 3 batidas
				case "wood": {
					const knock = (t) => {
						const src = makeNoise(ctx, 1);
						const bp = ctx.createBiquadFilter();
						bp.type = "bandpass";
						bp.frequency.value = 600;
						bp.Q.value = 8;
						const g = ctx.createGain();
						src.connect(bp);
						bp.connect(g);
						g.connect(master);
						applyEnv(g, t, {
							attack: 0.001,
							decay: 0.15,
							sustain: 0.0,
							duration: 0.18,
							peak: 0.9,
						});
						src.start(t);
						src.stop(t + 0.2);
					};
					knock(now);
					knock(now + 0.35);
					knock(now + 0.7);
					break;
				}

				// 🍳 Cozinha – dois “ding” de timer
				case "kitchen": {
					const ding = (t, f = 880) => {
						const o = makeOsc(ctx, "sine", f);
						const g = ctx.createGain();
						o.connect(g);
						g.connect(master);
						applyEnv(g, t, {
							attack: 0.005,
							decay: 0.5,
							sustain: 0.25,
							duration: 0.9,
							peak: 0.8,
						});
						o.start(t);
						o.stop(t + 1.1);
					};
					ding(now, 880);
					ding(now + 0.9, 988);
					break;
				}

				// ⏰ Analógico – “ring” tremulado (AM ~6Hz)
				case "analog": {
					const o = makeOsc(ctx, "triangle", 820);
					const g = ctx.createGain();
					o.connect(g);
					g.connect(master);
					const trem = makeOsc(ctx, "sine", 6);
					const tg = ctx.createGain();
					tg.gain.value = 0.6;
					trem.connect(tg);
					tg.connect(g.gain);
					g.gain.value = 0.4;
					applyEnv(g, now, {
						attack: 0.01,
						decay: 0.3,
						sustain: 0.7,
						duration: D,
						peak: 0.7,
					});
					o.start(now);
					o.stop(now + D);
					trem.start(now);
					trem.stop(now + D);
					break;
				}

				// 🔊 Vidro – agudo brilhante com overtones
				case "glass": {
					[1760, 2349, 3136].forEach((f, i) => {
						const o = makeOsc(ctx, "sine", f);
						const g = ctx.createGain();
						o.connect(g);
						g.connect(master);
						applyEnv(g, now, {
							attack: 0.003,
							decay: 0.6,
							sustain: 0.25,
							duration: D - i * 0.2,
							peak: 0.6 / (i + 1),
						});
						o.start(now);
						o.stop(now + D);
					});
					break;
				}

				// 🌸 Suave – um padzinho macio
				case "soft": {
					const o = makeOsc(ctx, "sine", 440);
					const g = ctx.createGain();
					o.connect(g);
					g.connect(master);
					applyEnv(g, now, {
						attack: 0.2,
						decay: 0.6,
						sustain: 0.7,
						duration: D,
						peak: 0.5,
					});
					o.start(now);
					o.stop(now + D);
					break;
				}

				// 🎹 Piano – acorde leve (C-E-G) com decaimento
				case "piano":
				default: {
					[261.63, 329.63, 392.0].forEach((f, i) => {
						const o = makeOsc(ctx, "sine", f);
						o.detune.value = i === 1 ? 5 : i === 2 ? -3 : 0;
						const g = ctx.createGain();
						o.connect(g);
						g.connect(master);
						applyEnv(g, now, {
							attack: 0.01,
							decay: 0.5,
							sustain: 0.2,
							duration: D,
							peak: 0.7 / (i + 0.8),
						});
						o.start(now);
						o.stop(now + D);
					});
				}
			}
		} catch (e) {
			console.warn("Audio erro:", e);
		}
	};

	// encerra o bloco atual, credita progresso e decide próximo passo
	const completeCurrentChunk = async ({ awardSeconds, creditMinutes }) => {
		const s = subjects[currentSubjectIndex];
		if (!s) return;

		// notificação + som
		showNotification("Bloco encerrado", `${s.name}`);
		playSelectedAlarm();

		// 1) credita XP/coins pelo tempo REAL estudado
		try {
			await api.post(`/sessions`, {
				subject: s.name,
				duration: Math.max(0, Math.floor(awardSeconds)),
			});
		} catch {}

		// 2) progride o conteúdo como se o BLOCO inteiro tivesse sido feito
		const updated = subjects.map((it, idx) =>
			idx === currentSubjectIndex
				? {
						...it,
						consumed: Math.min(
							(it.consumed || 0) + creditMinutes,
							it.duration || 0,
						),
					}
				: it,
		);
		setSubjects(updated);

		// 3) verifica se ainda restam minutos desta matéria → pausa de 10m
		const rest = remainingOf(updated[currentSubjectIndex]);
		if (rest > 0) {
			setIsBreak(true);
			setCurrentTime(breakBlockMin * 60);
			setIsRunning(false);
			return;
		}

		// 4) avança matéria ou ciclo
		if (currentSubjectIndex < updated.length - 1) {
			const next = updated[currentSubjectIndex + 1];
			setCurrentSubjectIndex(currentSubjectIndex + 1);
			setIsBreak(false);
			const chunkNext = nextStudyChunk(next);
			setLastChunk(chunkNext);
			setCurrentTime(chunkNext * 60);
			setIsRunning(false);
		} else {
			setCycleNumber((n) => n + 1);
			try {
				await api.post(`/users/me/cycle-complete`);
			} catch {}
			const reset = updated.map((it) => ({ ...it, consumed: 0 }));
			setSubjects(reset);
			setCurrentSubjectIndex(0);
			setIsBreak(false);
			const chunkFirst = nextStudyChunk(
				reset[0] || { duration: 50, consumed: 0 },
			);
			setLastChunk(chunkFirst);
			setCurrentTime(chunkFirst * 60);
			setIsRunning(false);
		}
	};

	// pular bloco (usa award REAL e crédito CHEIO no progresso)
	const skipCurrentBlock = async () => {
		const s = subjects[currentSubjectIndex];
		if (!s) return;

		if (!isBreak) {
			const studiedRealSec = Math.max(0, lastChunk * 60 - currentTime);
			const creditMin = nextStudyChunk(s);
			await completeCurrentChunk({
				awardSeconds: studiedRealSec,
				creditMinutes: creditMin,
			});
		} else {
			// se estiver na pausa e "pular", age como fim da pausa
			const rest2 = remainingOf(s);
			if (rest2 > 0) {
				setIsBreak(false);
				const ch = nextStudyChunk(s);
				setLastChunk(ch);
				setCurrentTime(ch * 60);
			} else if (currentSubjectIndex < subjects.length - 1) {
				const next = subjects[currentSubjectIndex + 1];
				setCurrentSubjectIndex(currentSubjectIndex + 1);
				setIsBreak(false);
				const ch2 = nextStudyChunk(next);
				setLastChunk(ch2);
				setCurrentTime(ch2 * 60);
			}
		}
	};

	const planFor = (s) => {
		if (!s) return [];
		if (timerMode === "ratio") {
			const study = remainingOf(s);
			const brk = suggestedBreakFor(study);
			return [
				...(study > 0 ? [{ kind: "study", min: study }] : []),
				...(brk > 0 ? [{ kind: "break", min: brk, suggested: true }] : []),
			];
		}

		// modo segmentado 50:10 (como estava)
		let left = remainingOf(s);
		const chips = [];
		while (left > 0) {
			const study = Math.min(50, left);
			chips.push({ kind: "study", min: study });
			left -= study;
			if (left > 0) chips.push({ kind: "break", min: 10 });
		}
		return chips;
	};

	// % do conteúdo e do ciclo já considerando o que está correndo agora
	// --- dados do item atual ---
	const currentSubject = subjects[currentSubjectIndex] || null;
	const currentRemaining = remainingOf(currentSubject);

	// % do conteúdo e do ciclo já considerando o que está rolando agora
	const totalStudyTime = subjects.reduce(
		(sum, s) => sum + (s.duration || 0),
		0,
	);

	const liveConsumedForCurrent =
		(currentSubject?.consumed || 0) + liveCurrentMin;

	const contentPct =
		currentSubject && (currentSubject.duration || 0) > 0
			? Math.round(
					Math.min(
						100,
						(liveConsumedForCurrent / currentSubject.duration) * 100,
					),
				)
			: 0;

	const totalConsumed = subjects.reduce((a, s) => a + (s.consumed || 0), 0);

	const cyclePct =
		totalStudyTime > 0
			? Math.round(
					Math.min(
						100,
						((totalConsumed + liveCurrentMin) / totalStudyTime) * 100,
					),
				)
			: 0;

	// ---------- RENDER ----------
	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<header className="bg-black/30 backdrop-blur-md border-b border-white/10">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<div>
						<h1 className="text-2xl font-bold text-white">
							Ciclo de Estudos 5:1 ⭐
						</h1>
						<p className="text-sm text-gray-400">Ciclo #{cycleNumber}</p>
					</div>

					<div className="flex items-center gap-6">
						<div className="flex items-center gap-3 text-white">
							<div className="text-sm">
								<span className="text-gray-400">Nv</span>
								<span className="ml-1 font-bold">
									{backendUser?.level || 1}
								</span>
							</div>
							<div className="bg-white/10 px-3 py-1 rounded-lg">
								<span className="text-yellow-400">💰</span>
								<span className="ml-1 font-semibold">
									C$ {backendUser?.coins || 0}
								</span>
							</div>
						</div>

						<div className="flex gap-3">
							<Link
								to="/shop"
								className="text-white hover:text-cyan-400 transition"
							>
								🛍️ Loja
							</Link>
							<Link
								to="/friends"
								className="text-white hover:text-cyan-400 transition"
							>
								👥 Amigos
							</Link>
							<Link
								to="/rankings"
								className="text-white hover:text-cyan-400 transition"
							>
								🏆 Rankings
							</Link>
							<Link
								to="/groups"
								className="text-white hover:text-cyan-400 transition"
							>
								👨‍👩‍👧‍👦 Grupos
							</Link>
							<Link
								to="/settings"
								className="text-white hover:text-cyan-400 transition"
							>
								⚙️
							</Link>
						</div>

						<div className="text-right text-white">
							<p className="text-xs text-gray-400">{backendUser?.nick_tag}</p>
							<p className="text-sm font-semibold">{backendUser?.name}</p>
						</div>

						<button
							type="button"
							onClick={logout}
							className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition border border-red-500/30"
						>
							Sair
						</button>
					</div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8">
				<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
					<div className="lg:col-span-2 space-y-6">
						{/* CARD DO TIMER */}
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8 relative">
							<div className="absolute top-4 left-4 bg-gradient-to-br from-yellow-400 to-yellow-600 p-3 rounded-lg shadow-lg">
								<span className="text-3xl">🏅</span>
							</div>

							<div className="absolute top-4 right-4">
								<button
									type="button"
									onClick={() => setShowAlarmMenu(!showAlarmMenu)}
									className="bg-gray-700/50 px-3 py-2 rounded-lg text-white hover:bg-gray-600/50 transition"
								>
									{ALARM_SOUNDS.find((a) => a.id === selectedAlarm)?.name ||
										"🔔 Alarme"}
								</button>
								{showAlarmMenu && (
									<div className="absolute right-0 mt-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 p-2 z-10 w-48">
										{ALARM_SOUNDS.map((alarm) => (
											<button
												type="button"
												key={alarm.id}
												onClick={() => {
													selectAlarm(alarm.id);
													playSelectedAlarm(alarm.id);
												}}
												className={`w-full text-left px-3 py-2 rounded hover:bg-gray-700 transition ${
													selectedAlarm === alarm.id
														? "bg-cyan-600 text-white"
														: "text-gray-300"
												}`}
											>
												{alarm.name}
											</button>
										))}
									</div>
								)}
							</div>

							<div className="text-center mt-8">
								<div className="mb-6">
									<h2 className="text-2xl font-bold text-white mb-2">
										{isBreak ? "☕ Descanso" : `📚 Estudo`}
									</h2>
									{!isBreak && subjects[currentSubjectIndex] && (
										<p className="text-cyan-400 text-xl font-semibold">
											{subjects[currentSubjectIndex].name}
										</p>
									)}
									<p className="text-gray-400 text-sm mt-1">
										{isBreak
											? `${breakBlockMin} min`
											: `${nextStudyChunk(subjects[currentSubjectIndex])} min`}
									</p>
								</div>

								<div className="text-8xl font-bold text-white mb-8">
									{formatTime(currentTime)}
								</div>

								<div className="flex gap-4 justify-center mb-6 flex-wrap">
									{/* Iniciar / Pausar (inalterado) */}
									{!isRunning ? (
										<button
											type="button"
											onClick={startTimer}
											className="bg-cyan-500 hover:bg-cyan-600 text-white px-8 py-3 rounded-lg font-semibold transition"
										>
											▶️ Iniciar
										</button>
									) : (
										<button
											type="button"
											onClick={() => setIsRunning(false)}
											className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-3 rounded-lg font-semibold transition"
										>
											⏸️ Pausar
										</button>
									)}

									{/* ANTERIOR: Bloco | Matéria */}
									<div className="flex gap-2">
										<button
											type="button"
											onClick={goPrevBlock}
											className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
										>
											◀️ Bloco
										</button>
										<button
											type="button"
											onClick={goPrevSubject}
											disabled={currentSubjectIndex === 0}
											className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600"
										>
											⏮️ Matéria
										</button>
									</div>

									{/* PULAR: Bloco | Matéria */}
									<div className="flex gap-2">
										<button
											type="button"
											onClick={async () => {
												setIsRunning(false);
												if (!isBreak) {
													const cur = subjects[currentSubjectIndex];
													if (!cur) return;
													const studiedRealSec = Math.max(
														0,
														lastChunk * 60 - currentTime,
													);
													const creditMin = nextStudyChunk(cur);
													await completeCurrentStudy({
														awardSeconds: studiedRealSec,
														creditMinutes: creditMin,
													});
												} else {
													// se estiver na pausa, pular = terminar a pausa agora (+10m no progresso)
													completeBreak();
												}
											}}
											className="bg-gray-700 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold transition"
										>
											⏭️ Bloco
										</button>

										<button
											type="button"
											onClick={skipToNextSubject}
											disabled={currentSubjectIndex >= subjects.length - 1}
											className="bg-gray-700 text-white px-6 py-3 rounded-lg font-semibold transition disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-600"
										>
											⏩ Matéria
										</button>

										{showResetMenu && (
											<div className="absolute right-0 mt-2 w-44 rounded-lg border border-gray-700 bg-gray-800 shadow-xl z-20 overflow-hidden">
												<button
													type="button"
													onClick={handleResetBlock}
													className="w-full text-left px-3 py-2 text-sm text-white hover:bg-gray-700"
												>
													Resetar Bloco
													<div className="text-xs text-gray-400">
														Zera só esta matéria
													</div>
												</button>
												<div className="h-px bg-gray-700" />
												<button
													type="button"
													onClick={handleResetCycle}
													className="w-full text-left px-3 py-2 text-sm text-red-300 hover:bg-gray-700"
												>
													Resetar Ciclo
													<div className="text-xs text-gray-400">
														Zera todas as matérias
													</div>
												</button>
											</div>
										)}
									</div>
								</div>

								{/* Chips + barras */}
								<div className="space-y-4">
									{!isBreak && currentSubject && (
										<>
											<p className="text-sm text-gray-300">
												<b>Blocos para {currentSubject.name}</b> (
												{currentRemaining} min restantes no total):
											</p>
											<div className="flex flex-wrap gap-2">
												{planFor(currentSubject).map((c, i) => (
													<span
														key={i}
														className={`px-3 py-1 rounded-full text-sm font-medium border ${
															c.kind === "study"
																? "bg-cyan-600/30 text-cyan-200 border-cyan-600/40"
																: "bg-gray-600/30 text-gray-200 border-gray-500/40"
														}`}
													>
														{c.kind === "study"
															? `Estudo ${c.min}m`
															: `Descanso ${c.min}m`}
													</span>
												))}
											</div>
										</>
									)}

									<div>
										<div className="flex justify-between text-sm text-gray-400 mb-1">
											<span>Progresso do conteúdo atual</span>
											<span>{contentPct}%</span>
										</div>
										<div className="w-full bg-gray-700 rounded-full h-2">
											<div
												className="h-2 rounded-full bg-cyan-500 transition-all duration-700"
												style={{ width: `${contentPct}%` }}
											/>
										</div>
									</div>

									<div>
										<div className="flex justify-between text-sm text-gray-400 mb-1">
											<span>Progresso do ciclo</span>
											<span>{cyclePct}%</span>
										</div>
										<div className="w-full bg-gray-700 rounded-full h-2">
											<div
												className="h-2 rounded-full bg-indigo-500 transition-all duration-700"
												style={{ width: `${cyclePct}%` }}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>

						{/* ADICIONAR BLOCOS + LISTA via CycleMap (só legenda) */}
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
							<h3 className="text-xl font-bold text-white mb-4">
								📚 Adicionar Blocos
							</h3>
							<p className="text-gray-400 text-sm mb-4">
								Digite o tempo total e dividiremos em blocos de 50:10
								automaticamente
							</p>
							<div className="flex gap-3 mb-4">
								<input
									type="text"
									value={newSubjectName}
									onChange={(e) => setNewSubjectName(e.target.value)}
									placeholder="Nome da matéria"
									className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
									onKeyDown={(e) => e.key === "Enter" && addSubject()}
								/>
								<input
									type="number"
									value={newSubjectMinutes}
									onChange={(e) => setNewSubjectMinutes(e.target.value)}
									min="60"
									max="600"
									step="60"
									placeholder="180 min"
									className="w-32 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
								/>
								<button
									type="button"
									onClick={addSubject}
									className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg font-semibold transition"
								>
									+ Adicionar
								</button>
							</div>
							<p className="text-gray-500 text-xs">
								Ex: 180 min = 3 blocos de 50 min + pausas de 10 min
							</p>

							{subjects.length === 0 ? (
								<p className="text-gray-400 text-center py-4 mt-4">
									Nenhum bloco adicionado
								</p>
							) : (
								<div className="mt-6">
									{/* Lista centralizada, com drag-n-drop e seleção */}
									{/* Lista ocupando toda a largura do card */}
									<ul className="w-full space-y-2">
										{subjects.map((s, index) => (
											<li
												key={s.id}
												draggable
												onDragStart={() => handleDragStart(index)}
												onDragOver={(e) => handleDragOver(e, index)}
												onDragEnd={handleDragEnd}
												className={`w-full rounded-lg border px-3 py-2 cursor-grab active:cursor-grabbing
        ${
					index === currentSubjectIndex
						? "bg-pink-500/15 border-pink-500/40"
						: "bg-gray-700/30 border-gray-600/30"
				}`}
												title="Arraste para reordenar"
												onClick={() => selectSubjectFromCircle(index)}
											>
												<div className="w-full flex items-center justify-between gap-3">
													{/* ESQUERDA: bolinha de cor + NOME (ou input se editando) */}
													<span className="flex items-center gap-3">
														<span className="relative w-4 h-4">
															{/* ponto sempre visível com a cor correta */}
															<span
																className="absolute inset-0 rounded-full ring-1 ring-white/20"
																style={{
																	backgroundColor: resolveColor(s, index),
																}}
															/>
															{/* color picker invisível por cima (captura o clique) */}
															<input
																type="color"
																value={resolveColor(s, index)}
																onChange={(e) => {
																	e.stopPropagation();
																	updateSubjectColor(s.id, e.target.value);
																}}
																className="absolute inset-0 opacity-0 cursor-pointer"
																title="Trocar cor"
															/>
														</span>

														{editingSubject === s.id ? (
															<input
																autoFocus
																value={editingValue}
																onChange={(e) =>
																	setEditingValue(e.target.value)
																}
																onClick={(e) => e.stopPropagation()}
																onBlur={() =>
																	updateSubjectName(
																		s.id,
																		editingValue.trim() || s.name,
																	)
																}
																onKeyDown={(e) => {
																	if (e.key === "Enter")
																		updateSubjectName(
																			s.id,
																			editingValue.trim() || s.name,
																		);
																	if (e.key === "Escape")
																		setEditingSubject(null);
																}}
																className="bg-gray-800/60 border border-gray-600 text-white text-sm px-2 py-1 rounded outline-none"
															/>
														) : (
															<span
																className={`text-sm ${
																	index === currentSubjectIndex
																		? "text-white font-semibold"
																		: "text-gray-300"
																}`}
															>
																{index + 1}. {s.name}
															</span>
														)}
													</span>

													{/* DIREITA: tempo + ações */}
													<span className="flex items-center gap-3">
														<span className="text-gray-400 text-xs">
															{s.consumed || 0} / {s.duration} min
														</span>

														<button
															type="button"
															className="text-xs px-2 py-1 rounded bg-gray-600/40 hover:bg-gray-600 text-white"
															onClick={(e) => {
																e.stopPropagation();
																setEditingSubject(s.id);
																setEditingValue(s.name || "");
															}}
															title="Editar nome"
														>
															Editar
														</button>

														<button
															type="button"
															className="text-xs px-2 py-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-200"
															onClick={(e) => {
																e.stopPropagation();
																if (window.confirm(`Remover "${s.name}"?`))
																	removeSubject(s.id);
															}}
															title="Excluir"
														>
															Excluir
														</button>
													</span>
												</div>
											</li>
										))}
									</ul>
								</div>
							)}
						</div>

						{/* QUESTS */}
						<div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6">
							<div className="flex justify-between items-center mb-4">
								<h3 className="text-xl font-bold text-white">
									🎯 Quests Semanais
								</h3>
								<button
									type="button"
									onClick={resetQuests}
									className="bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 px-3 py-1 rounded-lg transition border border-orange-500/30 text-sm"
								>
									Resetar (C$ 25)
								</button>
							</div>
							{quests.length === 0 ? (
								<p className="text-gray-400 text-center py-4">
									Gerando suas quests...
								</p>
							) : (
								<div className="space-y-3">
									{quests.map((quest) => (
										<div
											key={quest.id}
											className="bg-gray-700/30 p-4 rounded-lg"
										>
											<div className="flex justify-between items-start mb-2">
												<div>
													<p className="text-white font-semibold">
														{quest.title}
													</p>
													<p className="text-gray-400 text-sm">
														{quest.description}
													</p>
												</div>
												<span className="text-cyan-400 font-semibold">
													{quest.progress}/{quest.target}
												</span>
											</div>
											<div className="w-full bg-gray-700 rounded-full h-2 mb-2">
												<div
													className="bg-cyan-500 h-2 rounded-full"
													style={{
														width: `${Math.min((quest.progress / quest.target) * 100, 100)}%`,
													}}
												/>
											</div>
											<div className="flex justify-between text-sm">
												<span className="text-yellow-400">
													🏆 {quest.xp_reward} XP
												</span>
												<span className="text-yellow-400">
													💰 C$ {quest.coins_reward}
												</span>
											</div>
										</div>
									))}
								</div>
							)}
						</div>
					</div>

					{/* MAPA À DIREITA (sem legenda) */}
					{/* MAPA À DIREITA (mapa + lista embaixo) */}
					<div className="space-y-6">
						<div
							className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-6
                  flex flex-col"
						>
							{/* Mapa (parte de cima) */}
							<div className="shrink-0">
								<CycleMap
									items={contents}
									colorOverrides={colorOverrides}
									onChangeColor={handleChangeColor}
									activeId={String(subjects[currentSubjectIndex]?.id ?? "")}
									onSelect={(id) => {
										const idx = idToIndex[String(id)];
										if (idx != null) selectSubjectFromCircle(idx);
									}}
									showLegend={false} // mantém só o donut aqui
								/>
							</div>
						</div>
						{/* Lista de matérias (embaixo do mapa) */}
						<div className="mt-6 grow overflow-y-auto max-h-[420px]">
							<h4 className="text-sm font-semibold text-gray-300 mb-2">
								Matérias do ciclo
							</h4>

							<ul className="space-y-2">
								{contents.map((c, index) => (
									<li
										key={c.id}
										onClick={() => selectSubjectFromCircle(index)}
										className={`w-full rounded-lg border px-3 py-2 cursor-pointer
              ${
								index === currentSubjectIndex
									? "bg-cyan-500/15 border-cyan-500/40"
									: "bg-gray-700/30 border-gray-600/30 hover:bg-gray-700/40"
							}`}
									>
										<div className="flex items-center justify-between gap-3">
											<span className="flex items-center gap-3">
												<span
													className="inline-block w-3 h-3 rounded-full"
													style={{
														backgroundColor:
															subjects[index]?.color || "#9CA3AF",
													}}
												/>
												<span
													className={`text-sm ${
														index === currentSubjectIndex
															? "text-white font-semibold"
															: "text-gray-300"
													}`}
												>
													{index + 1}. {c.name}
												</span>
											</span>

											<span className="text-xs text-gray-400">
												{c.studiedMin} / {c.plannedMin} min
											</span>
										</div>
									</li>
								))}
							</ul>
						</div>
					</div>
				</div>
			</main>

			<MusicPlayer />

			<div className="fixed bottom-4 right-4 text-gray-500 text-xs opacity-50">
				Made by Lucas
			</div>
		</div>
	);
}
