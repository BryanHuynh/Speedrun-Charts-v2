export type RunsType = {
	game: string;
	category: string;
	run: RunType[];
};

export type RunType = {
	id: string;
	date: string;
	submitted: string;
	player_ids: string[];
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
};
