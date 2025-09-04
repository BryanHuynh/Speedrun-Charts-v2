import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { RunsType } from "../services/DTO/run-type";
import { Box } from "@mui/material";
import { SpeedRunApiService } from "../services/Speedrun-api-service";

type WRLineChartProps = {
	runs: RunsType;
};

function formatDurationSeconds(value?: number | null): string {
	if (value == null || !Number.isFinite(value)) return "";
	const total = Math.floor(value);
	const hours = Math.floor(total / 3600);
	const minutes = Math.floor((total % 3600) / 60);
	const seconds = total % 60;
	if (hours > 0)
		return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
	return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function formatDateTick(value: Date | number, showYear: boolean): string {
	const d = value instanceof Date ? value : new Date(value);
	const md = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(d);
	return showYear ? `${md} | ${d.getFullYear()}` : md;
}

export default function WRLineChart({ runs }: WRLineChartProps) {
	const [topPlayers, setTopPlayers] = React.useState<string[]>([]);
	const [keyToLabel, setKeyToLabel] = React.useState<Record<string, string>>({});
	const [points, setPoints] = React.useState<Record<string, number | Date | null>[]>([]);
	const [wrMarks, setWrMarks] = React.useState<Record<string, Set<number>>>({});
	React.useEffect(() => {
		const n = 3;
		if (!runs.run.length) return;

		// 1) Chronological stream of runs
		const sorted = [...runs.run].sort(
			(a, b) => new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime()
		);
		// Find every time the world record has been broken and, for each such date,
		// collect the previous top N unique teams (by best time so far) and the new WR team.
		// This yields a focused set of players to chart.
		let wrBest = Number.POSITIVE_INFINITY;
		const bestByTeam = new Map<string, number>(); // teamKey -> best time so far
		const keepTeams = new Set<string>();
		const wrByTeam = new Map<string, Set<number>>(); // teamKey -> set of WR break timestamps
		for (const run of sorted) {
			const t = run.times.realtime_t;
			if (!Number.isFinite(t) || t == 0) continue;
			const teamKey = [...run.player_ids].sort().join(" ");

			const isWRBreak = t < wrBest;
			if (isWRBreak) {
				// Snapshot previous top N teams before this new WR
				if (bestByTeam.size > 0 && n > 0) {
					const topN = [...bestByTeam.entries()]
						.sort((a, b) => a[1] - b[1])
						.slice(0, n)
						.map(([key]) => key);
					for (const k of topN) keepTeams.add(k);
				}
				// Include the WR team itself
				keepTeams.add(teamKey);
				// Record the timestamp of this WR for marking on the chart
				const ts = new Date(run.submitted_date).getTime();
				if (!wrByTeam.has(teamKey)) wrByTeam.set(teamKey, new Set<number>());
				wrByTeam.get(teamKey)!.add(ts);
				wrBest = t;
			}

			// Update best time for this team
			const prevBest = bestByTeam.get(teamKey);
			if (prevBest === undefined || t < prevBest) bestByTeam.set(teamKey, t);
		}
		setTopPlayers([...keepTeams]);
		// Persist WR marks per team for use in showMark
		const wrObj: Record<string, Set<number>> = {};
		for (const [k, v] of wrByTeam.entries()) wrObj[k] = v;
		setWrMarks(wrObj);
	}, [runs]);

	React.useEffect(() => {
		if (!topPlayers.length) return;
		const buildLabels = async () => {
			const entries = await Promise.all(
				topPlayers.map(async (teamKey) => {
					const ids = teamKey.split(" ").filter(Boolean);
					const names = await Promise.all(
						ids.map((id) => SpeedRunApiService.fetchUsernameFromUserId(id))
					);
					return [teamKey, names.join(" + ")] as const;
				})
			);
			setKeyToLabel(Object.fromEntries(entries));
		};
		buildLabels();
	}, [topPlayers]);

	React.useEffect(() => {
		if (!topPlayers.length) return;
		const keys = new Set<string>();
		for (const run of runs.run) keys.add([...run.player_ids].sort().join(" "));
		const keyList = [...keys].sort().filter((key) => topPlayers.includes(key));

		const _pts = [...runs.run]
			.sort(
				(a, b) =>
					new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime()
			)
			.map((run) => {
				const k = [...run.player_ids].sort().join(" ");
				if (!topPlayers.includes(k)) return null;
				const row: Record<string, number | null | Date> = {
					submitted_date: new Date(run.submitted_date),
				};
				for (const key of keyList) {
					if (key == k) {
						row[key] = run.times.realtime_t;
					} else {
						row[key] = null;
					}
				}
				return row;
			})
			.filter((row) => row !== null);
		setPoints(_pts);
	}, [topPlayers, runs]);


	const { xMin, xMax, showYear } = React.useMemo(() => {
		if (!runs.run.length) return { xMin: undefined, xMax: undefined, showYear: false } as const;
		const times = runs.run.map((r) => new Date(r.submitted_date).getTime());
		const minT = Math.min(...times);
		const maxT = Math.max(...times);
		const minY = new Date(minT).getFullYear();
		const maxY = new Date(maxT).getFullYear();
		return { xMin: new Date(minT), xMax: new Date(maxT), showYear: minY !== maxY } as const;
	}, [runs]);

	
	return (
		<Box>
			{points.length > 0 && topPlayers.length > 0 && Object.keys(keyToLabel).length > 0 && (
				<LineChart
					dataset={points}
					xAxis={[
						{
							scaleType: "time",
							dataKey: "submitted_date",
							min: xMin,
							max: xMax,
							domainLimit: "strict",
							tickLabelPlacement: "middle",
							tickNumber: 6,
							valueFormatter: (v) => formatDateTick(v as Date | number, showYear),
						},
					]}
					yAxis={[{ valueFormatter: (v: number) => formatDurationSeconds(v) }]}
					series={Object.keys(keyToLabel).map((key) => ({
						dataKey: key,
						label: keyToLabel[key],
						connectNulls: true,
						curve: "stepAfter",
						strictStepCurve: true,
						showMark: (p) => {
							const pos = p.position as unknown as number | Date;
							const ts = pos instanceof Date ? pos.getTime() : Number(pos);
							return Boolean(wrMarks[key] && wrMarks[key].has(ts));
						},
						shape: "star",
						valueFormatter: (v, { dataIndex }) => {
							if (v == null) {
								let value = null;
								for (let i = dataIndex ?? 0; i >= 0; i--) {
									const pt = points[i][key];
									if (pt != null) {
										value = points[i][key];
										break;
									}
								}
								if (value == null) return null;
								return formatDurationSeconds(value as number);
							}

							return formatDurationSeconds(v as number) + "⬅️";
						},
					}))}
					height={600}
				/>
			) } 
		</Box>
	);
}
