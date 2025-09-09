import {
	Box,
	Divider,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	type SelectChangeEvent,
} from "@mui/material";
import type { CategoryVariablesType } from "../services/DTO/category-variables";
import React, { useEffect, useState } from "react";

export type CategoryVariablesSelectionProps = {
	categoryVariables: CategoryVariablesType[];
	configRef: React.RefObject<{ [key: string]: string }>;
};

const CategoryVariablesSelection: React.FC<CategoryVariablesSelectionProps> = ({
	categoryVariables,
	configRef,
}) => {
	const [config, setConfig] = useState<{ [key: string]: string }>({});
	useEffect(() => {
		const assignDefaultsToConfig = () => {
			const temp_config: { [key: string]: string } = {};
			categoryVariables.forEach((variable) => {
				temp_config[variable.categoryId] = variable.isFilter ? "" : variable.default;
			});
			setConfig(temp_config);
		};
		assignDefaultsToConfig();
	}, [categoryVariables]);

	useEffect(() => {
		configRef.current = config;
	}, [config, configRef]);

	const handleChange = (event: SelectChangeEvent, categoryVariable: CategoryVariablesType) => {
		const category = categoryVariable.categoryId;
		const value = event.target.value as string;
		setConfig((prev) => ({
			...prev,
			[category]: value,
		}));
	};

	return (
		<Box sx={{ display: "flex", flexDirection: "column" }} gap={2}>
			{/* Non-filter group */}
			<Box sx={{ display: "flex", flexWrap: "wrap" }} gap={2}>
				{categoryVariables
					.filter((cv) => !cv.isFilter)
					.map((categoryVariable) => (
						<Box key={categoryVariable.categoryId}>
							<FormControl
								fullWidth
								sx={{ minWidth: "250px", width: "fit-content", marginBottom: 2 }}
							>
								<InputLabel
									id={`Category-variable-select-label-${categoryVariable.categoryId}`}
								>
									{categoryVariable.name}
								</InputLabel>
								{Object.keys(config).length && (
									<Select
										labelId={`Category-variable-select-label-${categoryVariable.categoryId}`}
										id={`variable-select-${categoryVariable.categoryId}`}
										label={categoryVariable.name}
										value={config[categoryVariable.categoryId]}
										onChange={(event) => handleChange(event, categoryVariable)}
									>
										{categoryVariable.values.map((value) => (
											<MenuItem key={value.id} value={value.id}>
												{value.name}
											</MenuItem>
										))}
									</Select>
								)}
							</FormControl>
						</Box>
					))}
			</Box>

			{/* Divider between groups if both exist */}
			{categoryVariables.some((cv) => !cv.isFilter) &&
				categoryVariables.some((cv) => cv.isFilter) && <Divider />}

			{/* Filter group */}
			<Box sx={{ display: "flex", flexWrap: "wrap" }} gap={2}>
				{categoryVariables
					.filter((cv) => cv.isFilter)
					.map((categoryVariable) => (
						<Box key={categoryVariable.categoryId}>
							<FormControl
								fullWidth
								sx={{ minWidth: "250px", width: "fit-content", marginBottom: 2 }}
							>
								<InputLabel
									id={`Category-variable-select-label-${categoryVariable.categoryId}`}
								>
									{categoryVariable.name}
								</InputLabel>
								{Object.keys(config).length && (
									<Select
										labelId={`Category-variable-select-label-${categoryVariable.categoryId}`}
										id={`variable-select-${categoryVariable.categoryId}`}
										label={categoryVariable.name}
										value={config[categoryVariable.categoryId]}
										onChange={(event) => handleChange(event, categoryVariable)}
									>
										{categoryVariable.values.map((value) => (
											<MenuItem key={value.id} value={value.id}>
												{value.name}
											</MenuItem>
										))}
									</Select>
								)}
							</FormControl>
						</Box>
					))}
			</Box>
		</Box>
	);
};

export default CategoryVariablesSelection;
