import type { CategoryVariablesType } from "./DTO/category-variables";
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
		return { games: data?.data ?? [], prev, next };
	},

	async fetchGamesById(id: string): Promise<GamesType> {
		const res = await fetch(`https://www.speedrun.com/api/v1/games/${id}`);
		const data = await res.json();
		return data.data;
	},

	async fetchPlatformById(id: string): Promise<string> {
		const res = await fetch(`https://www.speedrun.com/api/v1/platforms/${id}`);
		const data = await res.json();
		return data.data.name;
	},

	async fetchGameCategoriesById(id: string): Promise<{ id: string; name: string }[]> {
		const res = await fetch(`https://www.speedrun.com/api/v1/games/${id}/categories`);
		const data = await res.json();
		const ret = data.data.map((category: { id: string; name: string }) => ({
			id: category.id,
			name: category.name,
		}));
		return ret;
	},

	async fetchCategoryVaiablesByCategoryId(id: string): Promise<CategoryVariablesType[]> {
		const res = await fetch(`https://www.speedrun.com/api/v1/categories/${id}/variables`);
		const data = await res.json().then((data) => data.data);
		return data.map(
			(res: {
				id: string;
				name: string;
				values: { values: { [key: string]: { label: string } } };
			}) => ({
				categoryId: res.id,
				name: res.name,
				values: Object.entries(res.values.values).map(([id, obj]) => ({
					id: id,
					name: obj.label,
				})),
			})
		);
	},
};
