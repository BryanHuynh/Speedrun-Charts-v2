import { Box, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { CategoryVariablesType } from "../services/DTO/category-variables";

export type CategoryVariablesSelectionProps = {
	categoryVariables: CategoryVariablesType[];
};

/**
 * Renders a MUI ToggleButtonGroup for each variable, allowing single selection per variable.
 */
const CategoryVariablesSelection: React.FC<CategoryVariablesSelectionProps> = ({
	categoryVariables,
}) => {
	return (
		<Box display="flex" gap={2}>
			{categoryVariables.map((categoryVariable, idx) => (
				<Box key={`${categoryVariable.categoryId}-${categoryVariable.name ?? idx}`.toString()}>
					<Typography>{categoryVariable.name}</Typography>
					<ToggleButtonGroup size="small" aria-label="Large sizes">
						{categoryVariable.values.map((value, i) => (
							<ToggleButton key={`${categoryVariable.categoryId}-${categoryVariable.name ?? idx}-${value.id}-${i}`} value={value.name}>
								{value.name}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
				</Box>
			))}
		</Box>
	);
};

export default CategoryVariablesSelection;
