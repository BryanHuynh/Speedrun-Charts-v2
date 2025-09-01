export type CategoryVariablesType = {
	categoryId: string;
    name: string;
	default: string;
	isCategoryDependent: boolean;
	values: VariablesType[];
};

export type VariablesType = {
	id: string;
	name: string;
};
