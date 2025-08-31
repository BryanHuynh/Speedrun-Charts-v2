import { useEffect, useState } from "react";
import { SpeedRunApiService, type GamesRequest } from "../../services/Speedrun-api-service";
import { GameCard } from "../../components/Game-Card";
import { SearchGames } from "../../components/Search-Games";

export default function Game() {
	const [games, setGames] = useState<GamesRequest>();

	useEffect(() => {
		const fetchGames = async () => {
			await SpeedRunApiService.fetchGames().then((games) => setGames(games));
		};
		fetchGames();
	}, []);

	return (
		<div className="p-4">
			<div className="my-5">
				<SearchGames setGames={setGames}/>
			</div>
			<div className="grid grid-cols-4 gap-4">
				{games &&
					games.games.map((game) => (
						<div
							key={game.id}
							className="rounded-lg border border-neutral-700 bg-neutral-800/40 p-4 hover:bg-neutral-800 transition-colors"
						>
							<GameCard game={game} />
						</div>
					))}
			</div>
			<div className="mt-6 flex justify-center gap-3">
				<button
					onClick={async () => {
						if (!games?.prev) return;
						try {
							const res = await SpeedRunApiService.fetchGamesByUri(games.prev);
							setGames(res);
							window.scrollTo(0, 0);
						} catch (error) {
							console.error("Error fetching previous games:", error);
						}
					}}
					className="rounded border border-blue-600 px-4 py-2 text-blue-100 hover:bg-blue-600 hover:text-white disabled:opacity-50"
					disabled={!games?.prev}
				>
					Previous
				</button>
				<button
					onClick={async () => {
						if (!games?.next) return;
						try {
							const res = await SpeedRunApiService.fetchGamesByUri(games.next);
							setGames(res);
							window.scrollTo(0, 0);
						} catch (error) {
							console.error("Error fetching next games:", error);
						}
					}}
					className="rounded border border-blue-600 px-4 py-2 text-blue-100 hover:bg-blue-600 hover:text-white disabled:opacity-50"
					disabled={!games?.next}
				>
					Next
				</button>
			</div>
		</div>
	);
}
