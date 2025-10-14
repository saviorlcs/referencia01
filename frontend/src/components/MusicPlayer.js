import React, { useState } from "react";

const MUSIC_PRESETS = [
	{
		id: "lofi1",
		name: "Lofi Hip Hop",
		url: "https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1&loop=1",
	},
	{
		id: "piano1",
		name: "Piano Relaxante",
		url: "https://www.youtube.com/embed/lTRiuFIWV54?autoplay=1&loop=1",
	},
	{
		id: "jazz1",
		name: "Jazz Suave",
		url: "https://www.youtube.com/embed/Dx5qFachd3A?autoplay=1&loop=1",
	},
	{
		id: "study1",
		name: "Study Music",
		url: "https://www.youtube.com/embed/5qap5aO4i9A?autoplay=1&loop=1",
	},
	{
		id: "ambient1",
		name: "Ambient Nature",
		url: "https://www.youtube.com/embed/eKFTSSKCzWA?autoplay=1&loop=1",
	},
];

export default function MusicPlayer() {
	const [isOpen, setIsOpen] = useState(false);
	const [selectedMusic, setSelectedMusic] = useState(null);
	const [customUrl, setCustomUrl] = useState("");

	const handleSelectMusic = (preset) => {
		setSelectedMusic(preset.url);
	};

	const handleCustomUrl = () => {
		if (customUrl.includes("youtube.com") || customUrl.includes("youtu.be")) {
			let videoId = "";
			if (customUrl.includes("youtu.be/")) {
				videoId = customUrl.split("youtu.be/")[1].split("?")[0];
			} else if (customUrl.includes("watch?v=")) {
				videoId = customUrl.split("watch?v=")[1].split("&")[0];
			}
			if (videoId) {
				setSelectedMusic(
					`https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1`,
				);
				setCustomUrl("");
			}
		}
	};

	return (
		<div className="fixed bottom-4 left-4 z-50">
			{!isOpen ? (
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-full shadow-lg transition flex items-center gap-2"
				>
					🎵 Música
				</button>
			) : (
				<div className="bg-gray-800 rounded-xl border border-gray-700 shadow-2xl p-4 w-80">
					<div className="flex justify-between items-center mb-4">
						<h3 className="text-white font-semibold">🎵 Player de Música</h3>
						<button
							type="button"
							onClick={() => {
								setIsOpen(false);
								setSelectedMusic(null);
							}}
							className="text-gray-400 hover:text-white"
						>
							✕
						</button>
					</div>

					{selectedMusic ? (
						<div className="space-y-3">
							<iframe
								title="Embedded content"
								width="100%"
								height="200"
								src={selectedMusic}
								frameBorder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowFullScreen
								className="rounded-lg"
							></iframe>
							<button
								type="button"
								onClick={() => setSelectedMusic(null)}
								className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition"
							>
								⏹️ Parar
							</button>
						</div>
					) : (
						<div className="space-y-3">
							<div className="space-y-2">
								<p className="text-gray-400 text-sm">Escolha um preset:</p>
								{MUSIC_PRESETS.map((preset) => (
									<button
										type="button"
										key={preset.id}
										onClick={() => handleSelectMusic(preset)}
										className="w-full bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-lg transition text-left"
									>
										{preset.name}
									</button>
								))}
							</div>

							<div className="pt-3 border-t border-gray-700">
								<p className="text-gray-400 text-sm mb-2">
									Ou cole URL do YouTube:
								</p>
								<div className="flex gap-2">
									<input
										type="text"
										value={customUrl}
										onChange={(e) => setCustomUrl(e.target.value)}
										placeholder="https://youtube.com/..."
										className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
										onKeyPress={(e) => e.key === "Enter" && handleCustomUrl()}
									/>
									<button
										type="button"
										onClick={handleCustomUrl}
										className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg transition"
									>
										▶️
									</button>
								</div>
							</div>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
