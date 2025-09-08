export type CategoryVariablesType = {
	categoryId: string;
	name: string;
	default: string;
	values: VariablesType[];
	isFilter: boolean;
};

export type VariablesType = {
	id: string;
	name: string;
};
