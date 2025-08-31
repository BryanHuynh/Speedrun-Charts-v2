import { useEffect, useState } from "react";
import { SpeedRunApiService, type GamesRequest } from "../../services/Speedrun-api-service";
import { GameCard } from "../../components/Game-Card";
import { SearchGames } from "../../components/Search-Games";
import { Box, Button, Stack } from "@mui/material";
import Grid from "@mui/material/Grid";

export default function GameSelectionPage() {
	const [games, setGames] = useState<GamesRequest>();

	useEffect(() => {
		const fetchGames = async () => {
			await SpeedRunApiService.fetchGames().then((games) => setGames(games));
		};
		fetchGames();
	}, []);

	return (
		<Box>
			<Box my={3}>
				<SearchGames setGames={setGames} />
			</Box>
			<Grid container spacing={2} columns={4}>
				{games &&
					games.games.map((game) => (
						<Grid size={{ xs: 1 }} key={game.id}>
							<GameCard game={game} />
						</Grid>
					))}
			</Grid>
			<Stack direction="row" justifyContent="center" spacing={2} mt={4}>
				<Button
					variant="outlined"
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
					disabled={!games?.prev}
				>
					Previous
				</Button>
				<Button
					variant="outlined"
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
					disabled={!games?.next}
				>
					Next
				</Button>
			</Stack>
		</Box>
	);
}
