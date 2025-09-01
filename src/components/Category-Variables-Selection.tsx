import {
	Box,
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
	console.log(categoryVariables);
	const [config, setConfig] = useState<{ [key: string]: string }>({});
	useEffect(() => {
		const assignDefaultsToConfig = () => {
			const temp_config: { [key: string]: string } = {};
			categoryVariables.forEach((variable) => {
				temp_config[variable.categoryId] = variable.default;
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
		<Box sx={{ display: "flex", flexWrap: "wrap" }} gap={2}>
			{categoryVariables.map((categoryVariable) => (
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
						{Object.keys(config).length > 0 && (
							<Select
								labelId={`Category-variable-select-label-${categoryVariable.categoryId}`}
								id={`variable-select-${categoryVariable.categoryId}`}
								label={categoryVariable.name}
								value={config[categoryVariable.categoryId]}
								onChange={(event) => handleChange(event, categoryVariable)}
							>
								{[{ id: "Any", name: "Any" }, ...categoryVariable.values].map(
									(value) => (
										<MenuItem key={value.id} value={value.id}>
											{value.name}
										</MenuItem>
									)
								)}
							</Select>
						)}
					</FormControl>
				</Box>
			))}
		</Box>
	);
};

export default CategoryVariablesSelection;
