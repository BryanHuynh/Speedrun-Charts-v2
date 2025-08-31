import { Link } from "react-router-dom";
import type { GamesType } from "../services/DTO/games-type";

type GameCardProps = {
	game: GamesType;
};

export function GameCard({ game }: GameCardProps) {
	return (
		<Link
			to={`/game/${game.id}`}
			className="relative flex flex-col items-center justify-center rounded-lg p-4 shadow-md transition-all duration-300 hover:scale-105 hover:shadow-lg"
		>
			<img
				src={`https://www.speedrun.com/static/game/${game.id}/cover.jpg?v=${game.id}`}
				alt={game.names.international}
				className="h-48 w-full rounded-md object-cover"
			/>
			<h3 className="mt-2 text-lg font-semibold">{game.names.international}</h3>
		</Link>
	);
}
