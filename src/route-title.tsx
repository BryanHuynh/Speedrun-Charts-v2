import { useEffect } from "react";
import { useLocation } from "react-router-dom";

type RouteTitleProps = {
	title: string;
};
const RouteTitle = ({ title }: RouteTitleProps) => {
	const { pathname } = useLocation();

	useEffect(() => {
		document.title = title;
	}, [pathname, title]);

	return null;
};

export default RouteTitle;
