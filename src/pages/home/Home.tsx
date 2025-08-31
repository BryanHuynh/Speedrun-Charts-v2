import { Link } from "react-router-dom";

function Home() {
    return (
        <div className="min-h-screen flex items-center justify-center text-center">
            <div>
                <h1 className="text-2xl font-bold mb-4">Welcome to Speedrun Charts!</h1>
                <p>This application allows you to view and analyze speedrun data.</p>
                <p className="mt-4">
                    To get started, you can browse games or search for specific runs.
                </p>
                <Link to="/game" className="text-blue-600 mt-4 inline-block">
                    Go to Game Page
                </Link>
            </div>
        </div>
    );
}

export default Home;
