import { Link, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import Game from "./pages/game/Game";

function App() {
	return (
		<div className="p-4">
			<nav className="space-x-4 mb-4">
				<Link to="/" className="text-blue-600">
					Home
				</Link>
				<Link to="/game" className="text-blue-600">
					Games
				</Link>
			</nav>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/game" element={<Game />} />
			</Routes>
		</div>
	);
}

export default App;
