import React from "react";
import { useUser } from "../context/UserContext";
import Playlist from "../components/music/playlist/Playlist";
import Favourites from "../components/music/favourites/Favourites";

const Home = ({ setSongId }) => {
  const { user } = useUser();

  // Show loading message if user data isn't available
  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-gray-400 animate-pulse">Loading user data...</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <Playlist setSongId={setSongId}  />
      <Favourites />
    </div>
  );
};

export default Home;
