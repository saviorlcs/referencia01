// hash estável a partir do id/nome (não muda entre sessões)
function hashStr(s) {
	let h = 2166136261 >>> 0;
	for (let i = 0; i < s.length; i++) {
		h ^= s.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

// gera HSL usando o “ângulo dourado” → boa separação de cores
export function colorFromKey(key) {
	const h = hashStr(String(key));
	const hue = (h * 137.508) % 360; // distribui no círculo cromático
	const sat = 62 + (h % 14); // 62–75%
	const lig = 48 + (h % 10); // 48–57% (evita muito claro/escuro)
	return `hsl(${hue}deg ${sat}% ${lig}%)`;
}
