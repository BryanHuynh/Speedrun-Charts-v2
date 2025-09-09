import type { CategoryVariablesType } from "./DTO/category-variables";
import type { GamesType } from "./DTO/games-type";
import type { RunsType, RunType } from "./DTO/run-type";

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
	scope: {
		type: string;
	};
	values: {
		default: string;
		values: { [key: string]: { label: string } };
	};
	links: {
		rel: string;
		uri: string;
	}[];
};

type srcRunsData = {
	id: string;
	game: string;
	level: string;
	category: string;
	players: {
		rel: string;
		id: string;
		uri: string;
	}[];
	date: string;
	times: {
		primary: string | null;
		primary_t: number;
		realtime: string | null;
		realtime_t: number;
		realtime_noloads: string | null;
		realtime_noloads_t: number;
		ingame: string | null;
		ingame_t: number;
	};
	values: { [key: string]: string };
};

type srcPagination = {
	offset: number;
	max: number;
	size: number;
	links: {
		rel: string;
		uri: string;
	}[];
};

export const SpeedRunApiService = {
	async fetchGames(size: number = 50): Promise<GamesRequest> {
		const res = await fetch(
			`https://www.speedrun.com/api/v1/games?&max=20&orderby=released&direction=desc`
		);
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
			`https://www.speedrun.com/api/v1/games?name=${name.replace(
				" ",
				"%20"
			)}&orderby=similarity&direction=desc`
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
			.then((data) =>
				data.filter(
					(variable: SrcCategoryVariables) =>
						variable.category ||
						variable.scope.type == "full-game" ||
						(variable.category == null && !variable["is-subcategory"])
				)
			)
			.then((data) => {
				return data.map((variable: SrcCategoryVariables) => {
					const isFilter = variable.category == null && !variable["is-subcategory"];

					return {
						categoryId: variable.id,
						name: variable.name,
						default: isFilter ? "" : variable.values.default,
						isFilter,
						values: isFilter
							? [{ id: "", name: "Any" }]
							: Object.keys(variable.values.values).map((id) => ({
									id,
									name: variable.values.values[id].label,
							  })),
					};
				});
			});
		return data;
	},

	async fetchUsernameFromUserId(id: string): Promise<string> {
		const res = await fetch(`https://www.speedrun.com/api/v1/users/${id}`);
		if (!res.ok) throw Error("unable to fetch id for user");
		const json = await res.json();
		return json.data.names.international
			? json.data.names.international
			: json.data.names.japanese;
	},

	async fetchRuns(
		gameId: string,
		category: string,
		filters: { [key: string]: string }
	): Promise<RunsType> {
		const base = "https://www.speedrun.com/api/v1/runs";
		let out: RunType[] = [];
		const max_bulk = 200;
		let uri = `${base}?game=${gameId}&category=${category}&status=verified&orderby=date&direction=desc&max=${max_bulk}`;
		for (;;) {
			const res = await fetch(uri);
			if (!res.ok) break;
			const json = await res.json();
			let data: srcRunsData[] = json.data;
			const pagination: srcPagination = json.pagination;

			data = data.filter((run) => {
				const run_values = run.values;
				return Object.keys(filters).reduce((prev, curr) => {
					if (filters[curr] && run_values[curr] != filters[curr]) return false;
					return prev && true;
				}, true);
			});
			const _data = data.map((run) => ({
				id: run.id,
				date: run.date,
				player_ids: run.players.map((player) => player.id),
				times: {
					primary: run.times.primary,
					primary_t: run.times.primary_t,
					realtime: run.times.realtime,
					realtime_t: run.times.realtime_t,
					realtime_noloads: run.times.realtime_noloads,
					realtime_noloads_t: run.times.realtime_noloads_t,
					ingame: run.times.ingame,
					ingame_t: run.times.ingame_t,
				},
			}));
			out = out.concat(_data);
			const next = pagination.links.find((link) => link.rel == "next");
			if (!next) break;
			uri = next.uri;
		}

		return {
			game: gameId,
			category: category,
			run: out,
		};
	},
};
