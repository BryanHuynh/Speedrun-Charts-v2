import { Link as RouterLink, Route, Routes } from "react-router-dom";
import "./App.css";
import Home from "./pages/home/Home";
import GameSelectionPage from "./pages/gameSelection/GameSelectionPage";
import Game from "./pages/game/Game";
import {
	AppBar,
	Toolbar,
	Container,
	Link,
	Stack,
	createTheme,
	ThemeProvider,
	CssBaseline,
	useColorScheme,
	IconButton,
} from "@mui/material";
import RouteTitle from "./route-title";
import { LightMode, DarkMode } from "@mui/icons-material";
import { useEffect, useMemo, useState } from "react";

const makeTheme = (mode: "light" | "dark") =>
	createTheme({
		palette: { mode },
	});

function App() {
	const [mode, setMode] = useState<"light" | "dark">("dark");

	const theme = useMemo(() => makeTheme(mode), [mode]);

	return (
		<div>
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<AppBar position="static" color="default" elevation={1}>
					<Toolbar>
						<Container maxWidth="lg" sx={{ px: 0 }}>
							<Stack
								direction="row"
								spacing={3}
								alignItems="center"
								justifyContent="center"
							>
								<Link
									component={RouterLink}
									to="/"
									color="primary.main"
									underline="hover"
								>
									Home
								</Link>
								<Link
									component={RouterLink}
									to="/game"
									color="primary.main"
									underline="hover"
								>
									Games
								</Link>
							</Stack>
						</Container>
						<IconButton
							onClick={() => setMode((m) => (m === "light" ? "dark" : "light"))}
						>
							{mode === "light" ? <DarkMode /> : <LightMode />}
						</IconButton>
					</Toolbar>
				</AppBar>

				<Container component="main" maxWidth="lg" sx={{ py: 2 }}>
					<Routes>
						<Route path="/" element={<Home />} />
						<Route
							path="/game"
							element={
								<>
									<RouteTitle title="Speedrun Charts | Browse Games"></RouteTitle>
									<GameSelectionPage />
								</>
							}
						/>
						<Route path="/game/:id" element={<Game />} />
					</Routes>
				</Container>
			</ThemeProvider>
		</div>
	);
}

export default App;
