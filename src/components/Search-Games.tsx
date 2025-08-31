import { useEffect, useState } from "react";
import { SpeedRunApiService, type GamesRequest } from "../services/Speedrun-api-service";

interface SearchGamesProps {
	setGames: (games: GamesRequest) => void;
}

export function SearchGames({ setGames }: SearchGamesProps) {
	const [searchTerm, setSearchTerm] = useState("");

	useEffect(() => {
		async function searchGame(name: string) {
			const res = await SpeedRunApiService.fetchGamesByName(name);
			setGames(res);
		}
		searchGame(searchTerm);
	}, [searchTerm]);
	return (
		<div className="flex items-center space-x-2">
			<input
				type="text"
				placeholder="Search games..."
				value={searchTerm}
				onChange={(e) => setSearchTerm(e.target.value)}
				className="flex-grow rounded border border-neutral-700 bg-neutral-800/40 p-2 text-white placeholder-neutral-500 focus:border-blue-600 focus:outline-none"
			/>
		</div>
	);
}
