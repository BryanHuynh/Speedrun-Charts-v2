import { useEffect, useState } from "react";
import { SpeedRunApiService, type GamesRequest } from "../../services/Speedrun-api-service";

export default function Game() {
	const [games, setGames] = useState<GamesRequest>();

	useEffect(() => {
		const fetchGames = async () => {
			await SpeedRunApiService.fetchGames().then((games) => setGames(games));
		};
		fetchGames();
	});

	return <div></div>;
}
