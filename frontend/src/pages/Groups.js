import axios from "axios";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function Groups() {
	const [groups, setGroups] = useState([]);
	const [groupName, setGroupName] = useState("");
	const [groupDescription, setGroupDescription] = useState("");

	const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

	useEffect(() => {
		loadGroups();
	}, []);

	const loadGroups = async () => {
		try {
			const response = await axios.get(`${API_URL}/groups`);
			setGroups(response.data);
		} catch (error) {
			console.error("Erro ao carregar grupos:", error);
		}
	};

	const createGroup = async () => {
		if (!groupName.trim()) return;
		try {
			await axios.post(`${API_URL}/groups`, {
				name: groupName,
				description: groupDescription,
			});
			setGroupName("");
			setGroupDescription("");
			loadGroups();
		} catch (error) {
			alert("Erro ao criar grupo");
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900">
			<header className="bg-black/30 backdrop-blur-md border-b border-white/10">
				<div className="container mx-auto px-6 py-4 flex justify-between items-center">
					<Link to="/dashboard" className="text-white hover:text-cyan-400">
						← Voltar
					</Link>
					<h1 className="text-2xl font-bold text-white">
						👨‍👩‍👧‍👦 Grupos de Estudo
					</h1>
					<div></div>
				</div>
			</header>

			<main className="container mx-auto px-6 py-8 max-w-4xl">
				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 mb-6">
					<h3 className="text-lg font-semibold text-white mb-4">
						Criar Novo Grupo
					</h3>
					<div className="space-y-3">
						<input
							type="text"
							value={groupName}
							onChange={(e) => setGroupName(e.target.value)}
							placeholder="Nome do grupo"
							className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
						/>
						<textarea
							value={groupDescription}
							onChange={(e) => setGroupDescription(e.target.value)}
							placeholder="Descrição"
							rows="3"
							className="w-full bg-gray-700/50 text-white px-4 py-2 rounded-lg border border-gray-600 focus:border-cyan-500 focus:outline-none"
						/>
						<button
							type="button"
							onClick={createGroup}
							className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg transition"
						>
							Criar Grupo
						</button>
					</div>
				</div>

				<div className="bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6">
					<h3 className="text-lg font-semibold text-white mb-4">Meus Grupos</h3>
					{groups.length === 0 ? (
						<p className="text-gray-400 text-center py-8">
							Você não está em nenhum grupo
						</p>
					) : (
						<div className="space-y-3">
							{groups.map((group) => (
								<div key={group.id} className="bg-gray-700/30 p-4 rounded-lg">
									<h4 className="text-white font-semibold text-lg">
										{group.name}
									</h4>
									<p className="text-gray-400 text-sm mb-2">
										{group.description}
									</p>
									<p className="text-cyan-400 text-sm">
										{group.members.length} membros
									</p>
								</div>
							))}
						</div>
					)}
				</div>
			</main>
		</div>
	);
}
