// src/App.js

import axios from "axios";
import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import Dashboard from "@/pages/Dashboard";
import Friends from "@/pages/Friends";
import Groups from "@/pages/Groups";
// Páginas
import Login from "@/pages/Login";
import Rankings from "@/pages/Rankings";
import Settings from "@/pages/Settings";
import Shop from "@/pages/Shop";
import TestHarness from "./TestHarness";

// Mantém axios em sincronia com o usuário
function AuthAxiosBridge() {
	const { backendUser } = useAuth();

	useEffect(() => {
		axios.defaults.baseURL = `${process.env.REACT_APP_BACKEND_URL}/api`;
		axios.defaults.withCredentials = true;

		if (backendUser?.token) {
			axios.defaults.headers.common["Authorization"] =
				`Bearer ${backendUser.token}`;
		} else {
			delete axios.defaults.headers.common["Authorization"];
		}
	}, [backendUser]);

	return null;
}

function LoadingScreen() {
	return (
		<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<div className="text-white text-center">
				<div className="animate-spin rounded-full h-16 w-16 border-b-4 border-cyan-400 mx-auto mb-4"></div>
				<p className="text-xl font-semibold">Carregando...</p>
			</div>
		</div>
	);
}

function PrivateRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return <LoadingScreen />;
	return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
	const { isAuthenticated, loading } = useAuth();
	if (loading) return <LoadingScreen />;
	return isAuthenticated ? <Navigate to="/dashboard" /> : children;
}

export default function App() {
	return (
		<AuthProvider>
			<AuthAxiosBridge />
			<Routes>
				<Route path="/login" element={<Login />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/shop" element={<Shop />} />
				<Route path="/friends" element={<Friends />} />
				<Route path="/rankings" element={<Rankings />} />
				<Route path="/groups" element={<Groups />} />
				<Route path="/settings" element={<Settings />} />
				<Route path="/" element={<Navigate to="/dashboard" />} />
				<Route path="*" element={<Navigate to="/dashboard" />} />
			</Routes>
		</AuthProvider>
	);
}
