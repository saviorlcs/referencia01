import React, { useEffect, useMemo, useState } from "react";

export default function CycleMap({
	items = [],
	activeId,
	onSelect,
	showLegend = false,
	colorOverrides = {},
	onChangeColor,
}) {
	const R = 120;
	const STROKE = 28;
	const C = 2 * Math.PI * R;

	// sem espaçamento entre fatias
	const gapLen = 0;

	const total = Math.max(
		1,
		items.reduce((s, it) => s + Math.max(0, Number(it.plannedMin) || 0), 0),
	);

	// muda quando composição OU progresso muda → reanima
	const itemsKey = useMemo(
		() =>
			items.map((it) => `${it.id}:${it.plannedMin}:${it.studiedMin}`).join("|"),
		[items],
	);

	const palette = useMemo(() => {
		return items.map((it, i) => {
			const k = String(it.id);
			const c = colorOverrides[k] || it.color;
			if (c) return c;
			const h = (i * 137.508) % 360;
			return `hsl(${h} 85% 55%)`;
		});
	}, [items, colorOverrides]);

	let offset = 0;
	const segments = items.map((it, i) => {
		const frac = Math.max(0, Number(it.plannedMin) || 0) / total;
		const len = frac * C;
		const seg = { id: String(it.id), i, len, offset, color: palette[i] };
		offset += len + gapLen;
		return seg;
	});

	const activeIndex = Math.max(
		0,
		items.findIndex((x) => String(x.id) === String(activeId)),
	);
	const activeName = items[activeIndex]?.name || "";
	const activeColor = palette[activeIndex] || "#fff";

	// ---- reveal animation ----
	const [revealed, setRevealed] = useState(false);
	const [revealKey, setRevealKey] = useState(0);
	useEffect(() => {
		setRevealed(false);
		setRevealKey((k) => k + 1); // muda a key das fatias
		const t = setTimeout(() => setRevealed(true), 25);
		return () => clearTimeout(t);
	}, [itemsKey, activeId]);

	return (
		<div className="w-full flex items-center justify-center">
			<svg viewBox="0 0 300 300" width="100%" style={{ maxWidth: 520 }}>
				<title>Cycle Map</title>
				<g transform="translate(150,150) rotate(-90)">
					{segments.map((s) => (
						<circle
							key={`${s.id}-${revealKey}`}
							r={R}
							cx="0"
							cy="0"
							fill="none"
							stroke={s.color}
							strokeWidth={STROKE}
							strokeLinecap="butt"
							strokeDasharray={revealed ? `${s.len} ${C - s.len}` : `0 ${C}`}
							strokeDashoffset={-s.offset}
							style={{
								transition:
									"stroke-dasharray .8s ease, stroke-dashoffset .8s ease, stroke .25s ease",
								cursor: onSelect ? "pointer" : "default",
								willChange: "stroke-dasharray, stroke-dashoffset",
							}}
							onClick={() => onSelect?.(items[s.i].id)}
						/>
					))}
				</g>
				<g transform="translate(150,150)">
					<text
						x="0"
						y="-6"
						textAnchor="middle"
						fontSize="24"
						fontWeight="800"
						fill={activeColor}
						style={{ filter: "drop-shadow(0 1px 6px rgba(0,0,0,.25))" }}
					>
						{activeName}
					</text>
					<text
						x="0"
						y="18"
						textAnchor="middle"
						fontSize="14"
						fill="rgba(255,255,255,.85)"
					>
						{`${items[activeIndex]?.studiedMin ?? 0} / ${items[activeIndex]?.plannedMin ?? 0} min`}
					</text>
				</g>
			</svg>
		</div>
	);
}
