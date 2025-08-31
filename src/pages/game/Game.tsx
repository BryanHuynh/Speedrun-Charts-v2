import { useParams } from "react-router-dom";

export default function Game() {
  const { id } = useParams(); // extract `id` from the URL

  return (
    <div>
      <h1 className="text-2xl font-bold">Game Page</h1>
      <p>Game ID: {id}</p>
    </div>
  );
}