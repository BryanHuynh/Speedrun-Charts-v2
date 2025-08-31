import type { GamesType } from "./DTO/games-type";

export type GamesRequest = {
	games: GamesType[];
	prev: string | null;
	next: string | null;
};

function mapPagination(data: { pagination: { links: { rel?: string; uri?: string }[] } }): {
	prev: string | null;
	next: string | null;
} {
	const links: Array<{ rel?: string; uri?: string }> = Array.isArray(data?.pagination?.links)
		? data.pagination.links
		: [];
	const findUri = (rel: string): string | null => {
		const found = links.find((l) => l?.rel === rel)?.uri;
		return typeof found === "string" ? found : null;
	};
	return { prev: findUri("prev"), next: findUri("next") };
}

export const SpeedRunApiService = {
	async fetchGames(size: number = 50): Promise<GamesRequest> {
		const res = await fetch(`https://www.speedrun.com/api/v1/games?_bulk=yes&max=${size}`);
		const data = await res.json();
		const { prev, next } = mapPagination(data);
		return { games: data?.data ?? [], prev, next };
	},

	async fetchGamesByUri(uri: string): Promise<GamesRequest> {
		const res = await fetch(uri);
		const data = await res.json();
		const { prev, next } = mapPagination(data);
		return { games: data?.data ?? [], prev, next };
	},

	async fetchGamesByName(name: string): Promise<GamesRequest> {
		const res = await fetch(
			`https://www.speedrun.com/api/v1/games?name=${name.replace(" ", "_")}`
		);
		const data = await res.json();
		const { prev, next } = mapPagination(data);
		console.log(data);
		return { games: data?.data ?? [], prev, next };
	},
};
