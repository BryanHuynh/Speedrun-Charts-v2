import React, { useEffect, useState } from "react";
import { FormControl, InputLabel, Select, MenuItem, Box } from "@mui/material";
import { SpeedRunApiService } from "../services/Speedrun-api-service";

interface GameCategorySelectionProps {
	gameId: string;
	onSelectCategory: (category: string) => void;
}

const GameCategorySelection: React.FC<GameCategorySelectionProps> = ({
	gameId,
	onSelectCategory,
}) => {
	const [selectedCategory, setSelectedCategory] = useState<string>("");
	const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
	useEffect(() => {
		async function fetchCategories() {
			setCategories(await SpeedRunApiService.fetchGameCategoriesById(gameId));
		}
		fetchCategories();
	}, []);

	const handleChange = (event: { target: { value: string; }; }) => {
		const category = event.target.value as string;
		setSelectedCategory(category);
		onSelectCategory(category);
	};

	return (
		<Box sx={{ minWidth: 120, marginBottom: 2 }}>
			<FormControl fullWidth>
				<InputLabel id="category-select-label">Category</InputLabel>
				<Select
					labelId="category-select-label"
					id="category-select"
					value={selectedCategory}
					label="Category"
					onChange={handleChange}
				>
					{categories.map((category) => (
						<MenuItem key={category.id} value={category.id}>
							{category.name}
						</MenuItem>
					))}
				</Select>
			</FormControl>
		</Box>
	);
};

export default GameCategorySelection;
