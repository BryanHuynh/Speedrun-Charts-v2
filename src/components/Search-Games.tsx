import { useEffect, useState } from "react";
import { SpeedRunApiService, type GamesRequest } from "../services/Speedrun-api-service";
import { TextField, Stack } from "@mui/material";

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
        if(!searchTerm) return
		searchGame(searchTerm);
	}, [searchTerm]);
    return (
        <Stack direction="row" spacing={2} alignItems="center">
            <TextField
                fullWidth
                size="small"
                label="Search games"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
        </Stack>
    );
}
