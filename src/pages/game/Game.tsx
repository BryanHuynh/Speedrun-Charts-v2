import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import type { GamesType } from "../../services/DTO/games-type";
import { SpeedRunApiService } from "../../services/Speedrun-api-service";
import GameCategorySelection from "../../components/Game-Category-Selection";
import { Box, Button, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import type { CategoryVariablesType } from "../../services/DTO/category-variables";
import CategoryVariablesSelection from "../../components/Category-Variables-Selection";
import WRLineChart from "../../components/WR-Line-Chart";
import type { RunsType } from "../../services/DTO/run-type";

export default function Game() {
	const { id } = useParams(); // extract `id` from the URL

	const [game, setGame] = useState<GamesType>();
	const [platforms, setPlatforms] = useState<string[]>();
	const [category, setCategory] = useState<string>();
	const [categoryVariables, setCategoryVariables] = useState<CategoryVariablesType[]>([]);
	const [runs, setRuns] = useState<RunsType>();
	const variableAssignmentRef = useRef<{ [key: string]: string }>({});
	const [loading, setLoading] = useState<boolean>(false);

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

	useEffect(() => {
		setCategoryVariables([]);
		setRuns(undefined);
	}, [category]);

	useEffect(() => {
		async function fetchCategoryVariables() {
			if (category == undefined) return;
			const res = await SpeedRunApiService.fetchCategoryVaiablesByCategoryId(category);
			setCategoryVariables(res);
		}
		fetchCategoryVariables();
	}, [category]);

	const handleGenerate = () => {
		if (!game || !category) return;
		setRuns(undefined);
		setLoading(true);
		SpeedRunApiService.fetchRuns(game.id, category, variableAssignmentRef.current)
			.then(setRuns)
			.then(() => setLoading(false));
	};

	return (
		<Box>
			{game && (
				<Paper variant="outlined" sx={{ p: 3, mb: 2 }}>
					<Stack direction="row" spacing={2} alignItems="flex-start">
						<Box
							component="img"
							sx={{ height: 192, width: "auto", borderRadius: 1, objectFit: "cover" }}
							src={`https://www.speedrun.com/static/game/${id}/cover.jpg?v=${id}`}
							alt={game.names.international}
						/>
						<Box textAlign="left">
							<Typography variant="h6" fontWeight={600} gutterBottom>
								{game.names.international}
							</Typography>
							<Typography variant="subtitle1">{game.released}</Typography>
							<Typography variant="subtitle1">{platforms?.join(", ")}</Typography>
						</Box>
					</Stack>
				</Paper>
			)}
			{game && (
				<Paper variant="outlined" sx={{ p: 3 }}>
					<GameCategorySelection gameId={game.id} onSelectCategory={setCategory} />
					{categoryVariables.length > 0 && (
						<Box>
							<CategoryVariablesSelection
								categoryVariables={categoryVariables}
								configRef={variableAssignmentRef}
							/>
						</Box>
					)}
					{category && (
						<Button variant="contained" onClick={handleGenerate}>
							Generate Graph
						</Button>
					)}
				</Paper>
			)}
			{loading && <CircularProgress sx={{ mt: 5 }} />}
			{runs && runs.run && runs.run.length == 0 && (
				<Box
					sx={{
						height: 100,
						alignContent: "center",
					}}
				>
					<Typography variant="h4" component="h1">
						There are no speedruns available for this category and or filter set
					</Typography>
				</Box>
			)}
			{runs && <WRLineChart runs={runs} />}
		</Box>
	);
}
