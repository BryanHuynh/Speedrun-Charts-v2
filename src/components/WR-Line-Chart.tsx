import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";
import type { RunsType } from "../services/DTO/run-type";
import { Box } from "@mui/material";
import { SpeedRunApiService } from "../services/Speedrun-api-service";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs from "dayjs";

type WRLineChartProps = {
	runs: RunsType;
	wrRunsOnly?: boolean;
	releaseYear: number;
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

const seriesStrategy = {
	connectNulls: true,
	curve: "stepAfter" as const,
	strictStepCurve: true,
} as const;

export default function WRLineChart({ runs, wrRunsOnly = true, releaseYear }: WRLineChartProps) {
	const [topPlayersAndRuns, setTopPlayersAndRuns] = React.useState<
		Record<string, { time: number; date: Date }[]>
	>({});
	const [keyToLabel, setKeyToLabel] = React.useState<Record<string, string>>({});
	const [points, setPoints] = React.useState<Record<string, number | Date | null>[]>([]);
	React.useEffect(() => {
		const n = 5;
		if (!runs.run.length) return;

		// 1) Chronological stream of runs
		const sorted = [...runs.run]
			.sort(
				(a, b) =>
					new Date(a.submitted_date).getTime() - new Date(b.submitted_date).getTime()
			)
			.filter((run) => new Date(run.submitted_date).getFullYear() >= releaseYear);

		// Find every time the world record has been broken and, for each such date,
		// collect the previous top N unique teams (by best time so far) and the new WR team.
		// This yields a focused set of players to chart.
		let wrBest = Number.POSITIVE_INFINITY;
		const bestByTeamRuns = new Map<string, { time: number; date: Date }>(); // teamKey -> best time so far
		const keepTeamRuns: Record<string, { time: number; date: Date }[]> = {};
		const wrByTeam = new Map<string, Set<number>>(); // teamKey -> set of WR break timestamps
		for (const run of sorted) {
			const t = run.times.realtime_t;
			if (!Number.isFinite(t) || t == 0) continue;
			const teamKey = [...run.player_ids].sort().join(" ");
			if (teamKey == "") continue;

			const isWRBreak = t < wrBest;
			if (isWRBreak) {
				// Snapshot previous top N teams before this new WR
				if (!wrRunsOnly) {
					const topN = [...bestByTeamRuns]
						.map(([team, { time, date }]) => ({ team, time, date }))
						.sort((a, b) => a.time - b.time)
						.slice(0, n);
					topN.forEach(({ team }) => {
						const prev = bestByTeamRuns.get(team);
						if (prev?.time && prev?.date) {
							if (keepTeamRuns[team]) {
								keepTeamRuns[team] = keepTeamRuns[team].concat({
									time: prev.time,
									date: new Date(prev.date),
								});
							} else {
								keepTeamRuns[team] = [
									{ time: prev.time, date: new Date(prev.date) },
								];
							}
						}
					});
				}

				// Include the WR team itself
				if (keepTeamRuns[teamKey]) {
					keepTeamRuns[teamKey] = keepTeamRuns[teamKey].concat({
						time: t,
						date: new Date(run.submitted_date),
					});
				} else {
					keepTeamRuns[teamKey] = [{ time: t, date: new Date(run.submitted_date) }];
				}

				// Record the timestamp of this WR for marking on the chart
				const ts = new Date(run.submitted_date).getTime();
				if (!wrByTeam.has(teamKey)) wrByTeam.set(teamKey, new Set<number>());
				wrByTeam.get(teamKey)!.add(ts);
				wrBest = t;
			}

			// Update best time for this team
			const prevBest = bestByTeamRuns.get(teamKey);
			if (prevBest === undefined || t < prevBest.time)
				bestByTeamRuns.set(teamKey, { time: t, date: new Date(run.submitted_date) });
		}
		setTopPlayersAndRuns(keepTeamRuns);
		// // Persist WR marks per team for use in showMark
		const wrObj: Record<string, Set<number>> = {};
		for (const [k, v] of wrByTeam.entries()) wrObj[k] = v;
	}, [runs]);

	React.useEffect(() => {
		if (!topPlayersAndRuns) return;
		const buildLabels = async () => {
			const entries = await Promise.all(
				Object.keys(topPlayersAndRuns).map(async (teamKey) => {
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
	}, [topPlayersAndRuns]);

	React.useEffect(() => {
		if (!topPlayersAndRuns) return;
		const keyList = Object.keys(topPlayersAndRuns);
		const _pts = Object.entries(topPlayersAndRuns)
			.flatMap(([team, runsArr]) => runsArr.map(({ time, date }) => ({ team, time, date })))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((run) => {
				const row: Record<string, number | null | Date> = {
					submitted_date: new Date(run.date),
				};
				if (wrRunsOnly) {
					row["run"] = run.time;
				} else {
					for (const key of keyList) {
						row[key] = key === run.team ? run.time : null;
					}
				}

				return row;
			});
		setPoints(_pts);
	}, [topPlayersAndRuns, runs, wrRunsOnly]);

	const { xMin, xMax, showYear } = React.useMemo(() => {
		if (!runs.run.length) return { xMin: undefined, xMax: undefined, showYear: false } as const;
		const times = Object.values(topPlayersAndRuns).flatMap((runsArr) =>
			runsArr.map(({ date }) => date.valueOf())
		);
		const minT = Math.min(...times);
		const maxT = Math.max(...times);
		const minY = new Date(minT).getFullYear();
		const maxY = new Date(maxT).getFullYear();
		return { xMin: new Date(minT), xMax: new Date(maxT), showYear: minY !== maxY } as const;
	}, [runs, topPlayersAndRuns]);

	const [viewMin, setViewMin] = React.useState<Date | null>(null);
	const [viewMax, setViewMax] = React.useState<Date | null>(null);
	const [yMin, setYMin] = React.useState<number>();
	const [yMax, setYMax] = React.useState<number>();

	React.useEffect(() => {
		console.log(xMin, xMax, viewMin, viewMax);
		if ((!xMin && !xMax) || (!viewMin && !viewMax)) return;
		const _xMin = viewMin ?? xMin;
		const _xMax = viewMax ?? xMax;
		const times = Object.values(topPlayersAndRuns).flatMap((runsArr) =>
			runsArr.filter((run) => run.date >= _xMin && run.date <= _xMax).map((run) => run.time)
		);
		setYMin(Math.min(...times));
		setYMax(Math.max(...times));
	}, [xMin, xMax, viewMin, viewMax]);

	const valueFormatter = (v: number | null, dataIndex: number, key: string) => {
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
	};

	const wrValueFormatter = (v: number | null, dataIndex: number) => {
		const date = new Date(points[dataIndex].submitted_date as Date).toString();
		const team = Object.entries(topPlayersAndRuns)
			.flatMap(([team, runsArr]) =>
				runsArr.map(({ time, date }) => ({
					team,
					time,
					date,
				}))
			)
			.filter((team) => new Date(team.date).toString() == date);
		const teamName = team[0] ? keyToLabel[team[0].team] : "";
		return `${teamName}: ${formatDurationSeconds(v as number)} ⬅️`;
	};

	return (
		<Box>
			{points.length > 0 && topPlayersAndRuns && Object.keys(keyToLabel).length > 0 && (
				<div>
					<LineChart
						dataset={points}
						xAxis={[
							{
								scaleType: "time",
								dataKey: "submitted_date",
								min: viewMin ?? xMin,
								max: viewMax ?? xMax,
								domainLimit: "strict",
								tickLabelPlacement: "middle",
								tickNumber: 6,
								valueFormatter: (v) => formatDateTick(v as Date | number, showYear),
							},
						]}
						yAxis={[
							{
								valueFormatter: (v: number) => formatDurationSeconds(v),
								min: yMin,
								max: yMax,
							},
						]}
						series={
							wrRunsOnly
								? [
										{
											dataKey: "run",
											label: "WR Break",
											valueFormatter: (v, { dataIndex }) =>
												wrValueFormatter(v, dataIndex),
											shape: "star",
											...seriesStrategy,
										},
								  ]
								: Object.keys(keyToLabel).map((key) => ({
										dataKey: key,
										label: keyToLabel[key],
										shape: "circle",
										valueFormatter: (v, { dataIndex }) =>
											valueFormatter(v, dataIndex, key),
										...seriesStrategy,
								  }))
						}
						height={600}
					/>

					<LocalizationProvider dateAdapter={AdapterDayjs}>
						<Box display="flex" flexDirection="row" justifyContent={"space-around"}>
							<DatePicker
								label="From Date"
								value={dayjs(viewMin ?? xMin)}
								minDate={dayjs(xMin)}
								maxDate={dayjs(viewMax ?? xMax)}
								onChange={(val) => {
									if (!val) return;
									setViewMin(val.toDate());
								}}
							/>
							<DatePicker
								label="To Date"
								value={dayjs(viewMax ?? xMax)}
								minDate={dayjs(viewMin ?? xMin)}
								maxDate={dayjs(xMax)}
								onChange={(val) => {
									if (!val) return;
									setViewMax(val.toDate());
								}}
							/>
						</Box>
					</LocalizationProvider>
				</div>
			)}
		</Box>
	);
}
