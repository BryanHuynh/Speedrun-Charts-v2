import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { GamesType } from "../../services/DTO/games-type";
import { SpeedRunApiService } from "../../services/Speedrun-api-service";
import GameCategorySelection from "../../components/Game-Category-Selection";

export default function Game() {
	const { id } = useParams(); // extract `id` from the URL

	const [game, setGame] = useState<GamesType>();
	const [platforms, setPlatforms] = useState<string[]>();
	const [category, setCategory] = useState<string>();

	useEffect(() => {
		async function fetchGame() {
			if (id == undefined) return;
			const res = await SpeedRunApiService.fetchGamesById(id);
			setGame(res);
		}
		fetchGame();
	}, []);

	useEffect(() => {
		async function fetchPlatform() {
			if (!game) return;
			setPlatforms(
				await Promise.all(
					game.platforms.map((id: string) => SpeedRunApiService.fetchPlatformById(id))
				)
			);
		}
		if (!game) return;
		fetchPlatform();
	}, [game]);

	return (
		<div className="container">
			{game && (
				<div className="w-full border-2 border-amber-100 flex flex-row gap-5 p-5 rounded-md">
					<img
						src={`https://www.speedrun.com/static/game/${id}/cover.jpg?v=${id}`}
						alt={game.names.international}
						className="h-48 w-fit rounded-md object-cover"
					/>
					<div className="flex flex-col text-left">
						<span className="mt-2 text-lg font-semibold">
							{game.names.international}
						</span>
						<span className="mt-2 text-lg font-semibold">{game.released}</span>
						<span className="mt-2 text-lg font-semibold">{platforms?.join(", ")}</span>
					</div>
				</div>
			)}
			{game && (
				<div className="w-full border-2 border-amber-100 flex flex-row gap-5 p-5 rounded-md">
					<GameCategorySelection gameId={game.id} onSelectCategory={setCategory} />
				</div>
			)}
		</div>
	);
}
