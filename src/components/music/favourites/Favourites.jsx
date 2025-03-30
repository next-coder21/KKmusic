import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiPlay, FiX, FiHeart, FiClock, FiMusic } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { usePlayer } from "../../../context/PlayerContext";
import ApiService from "../../../services/ApiService";

const Favourites = () => {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const email = user?.email;

  useEffect(() => {
    if (!email) return;

    const fetchFavourites = async () => {
      try {
        setLoading(true);
        setError("");

        // Get favorite song IDs
        const response = await axios.get(`${ApiService.getBaseUrl()}/favourites/${email}`);
        const queueIds = response.data.favourites;

        // Fetch detailed information for each song
        const detailedQueue = await Promise.all(
          queueIds.map(async (id) => {
            try {
              const songRes = await axios.get(`${ApiService.getBaseUrl()}/music/songs/${id}`);
              return {
                id,
                title: songRes.data.title,
                artist: songRes.data.artist,
                coverimage: songRes.data.coverimage,
                duration: songRes.data.duration || 0
              };
            } catch (err) {
              console.error(`Error loading song ${id}:`, err);
              return null;
            }
          })
        );

        // Filter out failed requests
        const validSongs = detailedQueue.filter(song => song !== null);
        setFavourites(validSongs);

      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load favorites. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [email]);

  const playSong = async (id) => {
    if (!email) return;
    try {
      await axios.post(`${ApiService.getBaseUrl()}/queue/add`, {
        email,
        songIds: [id],
        album: false
      });
      setCurrentSongId(id);
      setQueueUpdated(prev => !prev);
    } catch (err) {
      console.error("Play error:", err);
    }
  };

  const removeFavourite = async (id) => {
    if (!email) return;
    
        try {
            await axios.post(`${ApiService.getBaseUrl()}/favourites/add`, {
              email: user.email,
              songIds: [id]
            });
      setFavourites(favourites.filter(song => song.id !== id));
    } catch (err) {
      console.error("Remove error:", err);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mx-auto max-w-8xl px-4 ">
      <header className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-500">
          Favourites
        </h1>
        <span className="text-sm px-3 py-1 bg-gray-800 rounded-full text-gray-300">
          {favourites.length} {favourites.length === 1 ? 'Song' : 'Songs'}
        </span>
      </header>

      {error ? (
        <div className="text-center  text-red-400">
          <FiX className="text-4xl mb-3 inline-block" />
          <p>{error}</p>
        </div>
      ) : loading ? (
        <div className="space-x-4 flex overflow-x-auto">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse w-40 h-56 bg-gray-800 rounded-md"></div>
          ))}
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-20">
          
          <h3 className="text-2xl font-medium text-gray-300 mb-3">No Favourites Yet</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Add songs to your favourites and they will appear here!
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto whitespace-nowrap snap-x snap-mandatory flex space-x-4 ">
          {favourites.map((song) => (
            <motion.div
              key={song.id}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="w-40 flex-shrink-0 bg-gray-900 rounded-lg shadow-md p-3 cursor-pointer relative"
            >
              <div className="relative">
                <img 
                  src={song.coverimage || "/default-album.jpg"} 
                  alt={song.title} 
                  className="w-full h-40 rounded-md object-cover"
                  onError={(e) => { e.target.src = "/default-album.jpg"; }}
                />
                <button
                  onClick={() => playSong(song.id)}
                  className="absolute bottom-2 right-2 bg-white p-2 rounded-full shadow-md hover:bg-gray-200 transition"
                >
                  <FiPlay className="text-black w-5 h-5" />
                </button>
              </div>
              <div className="mt-2">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
              </div>
              <button
                onClick={() => removeFavourite(song.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-gray-800 transition-all"
              >
                <FiX className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favourites;
