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
type SrcCategoryVariables = {
	id: string;
	name: string;
	category: string | null;
	"is-subcategory": boolean;
	values: {
		default: string;
		values: { [key: string]: { label: string } };
	};
	links: {
		rel: string;
		uri: string;
	}[];
};

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
		const data: CategoryVariablesType[] = await res
			.json()
			.then((data) => data.data)
			.then((data: SrcCategoryVariables[]) =>
				data.filter(
					(variable) =>
						variable.links.find((link) => link.rel == "category") ||
						!variable["is-subcategory"]
				)
			)
			.then((data) => {
				return data.map((variable) => ({
					categoryId: variable.id,
					name: variable.name,
					default: variable["is-subcategory"] ? variable.values.default : "",
					isCategoryDependent: variable["is-subcategory"],
					values: Object.entries(variable.values.values).map(([id, obj]) => ({
						id: id,
						name: obj.label,
					})),
				}));
			})
			.then((data) => {
				return data.sort((a, b) => (b.default != "" ? 1 : 0) - (a.default != "" ? 1 : 0));
			});
		return data;
	},
};
