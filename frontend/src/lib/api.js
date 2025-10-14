// src/lib/api.js
import axios from "axios";

const ORIGIN =
	(process.env.REACT_APP_BACKEND_URL &&
		process.env.REACT_APP_BACKEND_URL.replace(/\/$/, "")) ||
	"http://localhost:4000";

console.log("[API] baseURL ->", `${ORIGIN}/api`);

export const api = axios.create({
	baseURL: `${ORIGIN}/api`,
	withCredentials: false, // sem cookies para simplificar CORS (pode voltar p/ true depois)
});

api.interceptors.response.use(
	(r) => r,
	(err) => {
		console.error(
			"[API ERROR]",
			err?.response?.status,
			err?.response?.data || err.message,
		);
		throw err;
	},
);
