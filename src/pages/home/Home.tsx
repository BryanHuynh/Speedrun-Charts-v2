import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";

function Home() {
	return (
		<Box
			minHeight="80vh"
			display="flex"
			alignItems="center"
			justifyContent="center"
			textAlign="center"
		>
			<Stack spacing={2} alignItems="center">
				<Box
					component="img"
                    className="logo"
					alt="speedrun charts logo"
					src="/public/chart.svg"
				/>
				<Typography variant="h4" fontWeight={700} gutterBottom>
					Welcome to Speedrun Charts!
				</Typography>
				<Typography>
					This application allows you to view and analyze speedrun data.
				</Typography>
				<Typography>
					To get started, you can browse games or search for specific runs.
				</Typography>
				<Button
					component={RouterLink}
					to="/game"
					variant="contained"
					color="primary"
					sx={{ mt: 1 }}
				>
					Go to Game Page
				</Button>
			</Stack>
		</Box>
	);
}

export default Home;
