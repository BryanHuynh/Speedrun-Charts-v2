import * as React from "react";
import { LineChart } from "@mui/x-charts/LineChart";

export default function WRLineChart() {
	return (
		<LineChart
			xAxis={[{ data: [2018, 2019, 2020, 2021, 2022, 2023] }]}
			series={[
				{
					data: [320, 305, 299, 295, 290, 285], // WR times over years
					label: "World Record (seconds)",
				},
				{
					data: [420, 405, 399, 395, 390, 385], // WR times over years
					label: "World Record (seconds)",
				},
			]}
			height={600}
		/>
	);
}
