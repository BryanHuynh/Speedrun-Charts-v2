import type { GamesType } from "./DTO/games-type";

export type GamesRequest = {
	games: GamesType[];
	pagination_uri: string;
};

export const SpeedRunApiService = {
	fetchGames(size: number = 50): Promise<GamesRequest> {
		return fetch(`https://www.speedrun.com/api/v1/games?_bulk=yes&max=${size}`)
			.then((res) => res.json())
			.then((data) => {
				return {
					games: data.data,
					pagination_uri: data.pagination.links[0].uri,
				};
			});
	},
};
