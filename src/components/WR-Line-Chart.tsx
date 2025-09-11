import * as React from "react";
import Plot from "react-plotly.js";
import type { Data } from "plotly.js";
import type { RunsType } from "../services/DTO/run-type";
import { Box, useTheme } from "@mui/material";
import { SpeedRunApiService } from "../services/Speedrun-api-service";

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

export default function WRLineChart({ runs, wrRunsOnly = true, releaseYear }: WRLineChartProps) {
	const [topPlayersAndRuns, setTopPlayersAndRuns] = React.useState<
		Record<string, { time: number; date: Date }[]>
	>({});
	const [playersWRProgression, setPlayersWRProgression] =
		React.useState<Record<string, Set<number>>>();

	const theme = useTheme().palette.mode;

	const [keyToLabel, setKeyToLabel] = React.useState<Record<string, string>>({});


	React.useEffect(() => {
		const n = 5;
		if (!runs.run.length) return;

		// 1) Chronological stream of runs
		const sorted = [...runs.run]
			.sort((a, b) => new Date(a.submitted).getTime() - new Date(b.submitted).getTime())
			.filter((run) => new Date(run.submitted).getFullYear() >= releaseYear);

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
						date: new Date(run.submitted),
					});
				} else {
					keepTeamRuns[teamKey] = [{ time: t, date: new Date(run.submitted) }];
				}

				// Record the timestamp of this WR for marking on the chart
				const ts = new Date(run.submitted);
				if (!wrByTeam.has(teamKey)) wrByTeam.set(teamKey, new Set<number>());
				wrByTeam.get(teamKey)!.add(+ts);
				wrBest = t;
			}

			// Update best time for this team
			const prevBest = bestByTeamRuns.get(teamKey);
			if (prevBest === undefined || t < prevBest.time)
				bestByTeamRuns.set(teamKey, { time: t, date: new Date(run.submitted) });
		}
		// setTopPlayersAndRuns(keepTeamRuns);
		const savedTeamNames = Object.keys(keepTeamRuns);
		for(const run of sorted) {
			const teamKey = [...run.player_ids].sort().join(" ");
			if(savedTeamNames.includes(teamKey)) {
				const runData = { time: run.times.realtime_t, date: new Date(run.submitted) };
				if(keepTeamRuns[teamKey] && keepTeamRuns[teamKey].includes(runData)) {
					keepTeamRuns[teamKey].concat(runData);
				}
			}
		}

		setTopPlayersAndRuns(keepTeamRuns);

		// // Persist WR marks per team for use in showMark
		const wrObj: Record<string, Set<number>> = {};
		for (const [k, v] of wrByTeam.entries()) wrObj[k] = v;
		setPlayersWRProgression(wrObj);
	}, [releaseYear, runs, wrRunsOnly]);

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

	const points = React.useMemo(() => {
		if (!topPlayersAndRuns) return;
		const keyList = Object.keys(topPlayersAndRuns);
		return Object.entries(topPlayersAndRuns)
			.flatMap(([team, runsArr]) => runsArr.map(({ time, date }) => ({ team, time, date })))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((run) => {
				const row: Record<string, number | null | Date> = {
					date: new Date(run.date),
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
	}, [topPlayersAndRuns, wrRunsOnly]);

	const { yTicks, yTicksFormated } = React.useMemo(() => {
		if (!runs.run.length) return { yTicks: undefined, yTicksFormated: undefined };
		const times = Object.values(topPlayersAndRuns).flatMap((runsArr) =>
			runsArr.map(({ time }) => time.valueOf())
		);

		const minT = Math.min(...times);
		const maxT = Math.max(...times);

		const nTicks = 7;
		const offset = Math.ceil((maxT - minT) / nTicks);
		const ticks = [minT];
		const ticksFormatted = [formatDurationSeconds(minT)];
		let sum = minT || 0;
		for (let i = minT; i <= maxT; i++) {
			sum += offset;
			ticks.push(sum);
			ticksFormatted.push(formatDurationSeconds(sum));
		}
		return { yTicks: ticks, yTicksFormated: ticksFormatted };
	}, [runs.run.length, topPlayersAndRuns]);

	// Build Plotly traces from dataset
	const plotX = React.useMemo(() => (points ? points.map((p) => p.date as Date) : []), [points]);

	const dateLabelMap = React.useMemo(() => {
		// Map each WR date to the team label for hover text
		const map = new Map<string, string>();
		Object.entries(topPlayersAndRuns).forEach(([teamKey, arr]) => {
			const label = keyToLabel[teamKey] ?? teamKey;
			arr.forEach(({ date }) => {
				map.set(new Date(date).toString(), label);
			});
		});
		return map;
	}, [topPlayersAndRuns, keyToLabel]);

	const playerWRProgressionMarkers = React.useMemo<Record<string, null | Date | string>[]>(() => {
		const keyList = Object.keys(topPlayersAndRuns);
		return Object.entries(topPlayersAndRuns)
			.flatMap(([team, runsArr]) => runsArr.map(({ time, date }) => ({ team, time, date })))
			.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
			.map((run) => {
				const row: Record<string, null | Date | string> = {
					date: run.date,
				};
				if (wrRunsOnly) {
					row["run"] = "star";
				} else {
					for (const key of keyList) {
						row[key] =
							key == run.team &&
							playersWRProgression &&
							playersWRProgression[key] &&
							playersWRProgression[key].has(+run.date)
								? "star"
								: "circle";
					}
				}

				return row;
			});
	}, [topPlayersAndRuns, wrRunsOnly, playersWRProgression]);

	const traces = React.useMemo<Data[]>(() => {
		if (!points) return [];
		const common = {
			mode: "lines+markers",
			connectgaps: true,
			line: { shape: "hv" }, // step-after style
		};

		if (wrRunsOnly) {
			const y = points.map((p) => (p["run"] as number) ?? null);
			const text = points.map((p, i) => {
				const d = (p.date as Date).toString();
				const lbl = dateLabelMap.get(d) ?? "WR Break";
				const val = y[i];
				return val == null ? "" : `${lbl}: ${formatDurationSeconds(val)}`;
			});
			return [
				{
					x: plotX,
					y,
					text,
					type: "scatter",
					name: "WR Break",
					marker: { symbol: "star", size: 16 },
					...common,
					hovertemplate: "%{text}<br>%{x}",
				} as Data,
			];
		}

		// Per-team traces
		return Object.keys(keyToLabel).map((key) => {
			const y = points.map((p) => p[key] as number);
			const markers = playerWRProgressionMarkers.map((p) => p[key]);
			const markerSizes = playerWRProgressionMarkers.map((p) => (p[key] == "star" ? 12 : 8));
			const text = y.map((v) =>
				v == null ? "" : `${keyToLabel[key]}: ${formatDurationSeconds(v)}`
			);
			return {
				x: plotX,
				y: y,
				text,
				type: "scatter",
				name: keyToLabel[key],
				marker: { symbol: markers, size: markerSizes },
				...common,
				hovertemplate: "%{text}<br>%{x}",
			} as Data;
		});
	}, [points, wrRunsOnly, keyToLabel, plotX, dateLabelMap, playerWRProgressionMarkers]);

	const graphColorPallet = React.useMemo(
		() =>
			theme == "dark"
				? {
						paper_bgcolor: "#1e1e1e",
						plot_bgcolor: "#1e1e1e",
						font: "#f0f0f0",
						axis_grid: "#444",
						axis_zeroline: "#666",
				  }
				: {
						paper_bgcolor: "#ffffffff",
						plot_bgcolor: "#ffffffff",
						font: "#1e1e1e",
						axis_grid: "#cfd8dc",
						axis_zeroline: "#cfd8dc",
				  },
		[theme]
	);
	const layout = React.useMemo<Partial<Plotly.Layout>>(
		() => ({
			height: 600,
			dragmode: "pan",
			margin: { l: 60, r: 20, t: 20, b: 50 },
			paper_bgcolor: graphColorPallet.plot_bgcolor,
			plot_bgcolor: graphColorPallet.paper_bgcolor,
			font: { color: graphColorPallet.font },
			xaxis: {
				gridcolor: graphColorPallet.axis_grid,
				zerolinecolor: graphColorPallet.axis_zeroline,
				autorange: true,
				type: "date",
				tickmode: "array",
				nticks: 6,
			},
			yaxis: {
				gridcolor: graphColorPallet.axis_grid,
				zerolinecolor: graphColorPallet.axis_zeroline,
				autorange: true,
				tickmode: "array",
				tickvals: yTicks,
				ticktext: yTicksFormated,
			},
			showlegend: true,
		}),
		[yTicks, yTicksFormated]
	);

	return (
		<Box>
			{points && topPlayersAndRuns && Object.keys(keyToLabel).length > 0 && (
				<div>
					<Plot
						data={traces}
						layout={layout}
						useResizeHandler
						style={{ width: "100%", height: 600 }}
						config={{
							scrollZoom: true,
							displayModeBar: "hover",
						}}
					/>
				</div>
			)}
		</Box>
	);
}
