import { Link as RouterLink } from "react-router-dom";
import type { GamesType } from "../services/DTO/games-type";
import { Card, CardActionArea, CardContent, CardMedia, Typography } from "@mui/material";

type GameCardProps = {
	game: GamesType;
};

export function GameCard({ game }: GameCardProps) {
    return (
        <Card sx={{ height: "100%", width: 1}}>
            <CardActionArea component={RouterLink} to={`/game/${game.id}`}>
                <CardMedia
                    component="img"
                    height="192"
                    image={`https://www.speedrun.com/static/game/${game.id}/cover.jpg?v=${game.id}`}
                    alt={game.names.international}
                />
                <CardContent>
                    <Typography variant="subtitle1" fontWeight={100} gutterBottom>
                        {game.names.international}
                    </Typography>
                </CardContent>
            </CardActionArea>
        </Card>
    );
}
