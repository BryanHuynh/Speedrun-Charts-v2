import { Link, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import GameSelectionPage from "./pages/gameSelection/GameSelectionPage";
import Game from "./pages/game/Game";

function App() {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="top-0 z-50">
				<nav className="mx-auto max-w-6xl px-4 py-3 space-x-4">
					<Link to="/" className="text-blue-400 hover:text-blue-300">
						Home
					</Link>
					<Link to="/game" className="text-blue-400 hover:text-blue-300">
						Games
					</Link>
				</nav>
			</header>

			<main className="flex-1 w-full mx-auto max-w-6xl p-4">
				<Routes>
					<Route path="/" element={<Home />} />
					<Route path="/game" element={<GameSelectionPage />} />
					<Route path="/game/:id" element={<Game />} />
				</Routes>
			</main>
		</div>
	);
}

export default App;
