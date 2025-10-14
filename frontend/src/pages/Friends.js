import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Friends() {
	const { backendUser } = useAuth();
	const [friends, setFriends] = useState([]);
	const [requests, setRequests] = useState([]);
	const [searchQuery, setSearchQuery] = useState("");
	const [searchResults, setSearchResults] = useState([]);
	const [tab, setTab] = useState("friends");

	const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

	useEffect(() => {
		loadFriends();
		loadRequests();
	}, []);

	const loadFriends = async () => {
		try {
			const response = await axios.get(`${API_URL}/friends`);
			setFriends(response.data);
		} catch (error) {
			console.error("Erro ao carregar amigos:", error);
		}
	};

	const loadRequests = async () => {
		try {
			const response = await axios.get(`${API_URL}/friends/requests`);
			setRequests(response.data);
		} catch (error) {
			console.error("Erro ao carregar pedidos:", error);
		}
	};

	const searchUsers = async () => {
		if (!searchQuery.trim()) return;
		try {
			const response = await axios.get(
				`${API_URL}/users/search?query=${searchQuery}`,
			);
			setSearchResults(response.data);
		} catch (error) {
			console.error("Erro ao buscar usuários:", error);
		}
	};

	const sendRequest = async (friendId) => {
		try {
			await axios.post(`${API_URL}/friends/request/${friendId}`);
			alert("Pedido enviado!");
			setSearchResults([]);
			setSearchQuery("");
		} catch (error) {
			alert(error.response?.data?.detail || "Erro ao enviar pedido");
		}
	};

	const acceptRequest = async (requestId) => {
		try {
			await axios.put(`${API_URL}/friends/accept/${requestId}`);
			loadFriends();
			loadRequests();
		} catch (error) {
			console.error("Erro ao aceitar pedido:", error);
		}
	};

	const rejectRequest = async (requestId) => {
		try {
			await axios.delete(`${API_URL}/friends/reject/${requestId}`);
			loadRequests();
		} catch (error) {
			console.error("Erro ao rejeitar pedido:", error);
		}
	};

	const removeFriend = async (friendId) => {
		if (!window.confirm("Remover amigo?")) return;
		try {
			await axios.delete(`${API_URL}/friends/${friendId}`);
			loadFriends();
		} catch (error) {
			console.error("Erro ao remover amigo:", error);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<header className="bg-black/30 backdrop-blur-md border-b border-white/10">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link to="/dashboard" className="text-white hover:text-cyan-400">
						← Voltar
					</Link>
					<h1 className="text-2xl font-bold text-white">👥 Amigos</h1>
					<div></div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="flex gap-4 mb-6">
					<button
						type="button"
						onClick={() => setTab("friends")}
						className={`px-4 py-2 rounded-lg transition ${tab === "friends" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Meus Amigos ({friends.length})
					</button>
					<button
						type="button"
						onClick={() => setTab("requests")}
						className={`px-4 py-2 rounded-lg transition ${tab === "requests" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Pedidos ({requests.length})
					</button>
					<button
						type="button"
						onClick={() => setTab("search")}
						className={`px-4 py-2 rounded-lg transition ${tab === "search" ? "bg-cyan-500 text-white" : "bg-gray-700 text-gray-300"}`}
					>
						Buscar
					</button>
				</div>

				{tab === "search" && (
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6">
						<div className="flex gap-3">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Buscar por nome, email ou nick#tag"
								className="flex-1 bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
								onKeyPress={(e) => e.key === "Enter" && searchUsers()}
							/>
							<button
								type="button"
								onClick={searchUsers}
								className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition"
							>
								Buscar
							</button>
						</div>
						{searchResults.length > 0 && (
							<div className="mt-4 space-y-2">
								{searchResults.map((user) => (
									<div
										key={user.id}
										className="flex justify-between items-center bg-gray-700/30 p-3 rounded-lg"
									>
										<div>
											<p className="text-white font-semibold">{user.name}</p>
											<p className="text-gray-400 text-sm">{user.nick_tag}</p>
										</div>
										<button
											type="button"
											onClick={() => sendRequest(user.id)}
											className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg transition text-sm"
										>
											Adicionar
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{tab === "friends" && (
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
						{friends.length === 0 ? (
							<p className="text-gray-400 text-center py-8">
								Você ainda não tem amigos
							</p>
						) : (
							<div className="space-y-3">
								{friends.map((friend) => (
									<div
										key={friend.id}
										className="flex justify-between items-center bg-gray-700/30 p-4 rounded-lg"
									>
										<div>
											<p className="text-white font-semibold">{friend.name}</p>
											<p className="text-gray-400 text-sm">{friend.nick_tag}</p>
											<p className="text-cyan-400 text-sm">
												Nível {friend.level} • {friend.xp} XP
											</p>
										</div>
										<button
											type="button"
											onClick={() => removeFriend(friend.id)}
											className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition text-sm border border-red-500/30"
										>
											Remover
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{tab === "requests" && (
					<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
						{requests.length === 0 ? (
							<p className="text-gray-400 text-center py-8">
								Nenhum pedido pendente
							</p>
						) : (
							<div className="space-y-3">
								{requests.map((request) => (
									<div
										key={request.request_id}
										className="flex justify-between items-center bg-gray-700/30 p-4 rounded-lg"
									>
										<div>
											<p className="text-white font-semibold">
												{request.user.name}
											</p>
											<p className="text-gray-400 text-sm">
												{request.user.nick_tag}
											</p>
										</div>
										<div className="flex gap-2">
											<button
												type="button"
												onClick={() => acceptRequest(request.request_id)}
												className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition text-sm"
											>
												Aceitar
											</button>
											<button
												type="button"
												onClick={() => rejectRequest(request.request_id)}
												className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg transition text-sm border border-red-500/30"
											>
												Rejeitar
											</button>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</main>
		</div>
	);
}
