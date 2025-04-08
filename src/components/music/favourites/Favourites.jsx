import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { FiPlay, FiX, FiHeart, FiClock, FiMusic } from "react-icons/fi";
import { useUser } from "../../../context/UserContext";
import { usePlayer } from "../../../context/PlayerContext";
import ApiService from "../../../services/ApiService";

const Favourites = () => {
  const [favourites, setFavourites] = useState([]);
  const [favoritesUpdated, setFavoritesUpdated] = useState(false);
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

        const response = await axios.get(`${ApiService.getBaseUrl()}/favourites/${email}`);
        const queueIds = response.data.favourites;

        if (!queueIds || queueIds.length === 0) {
          setFavourites([]);
          return;
        }

        const detailedQueue = await Promise.all(
          queueIds.map(async (id) => {
            try {
              const songRes = await axios.get(`${ApiService.getBaseUrl()}/music/songs/${id}`);
              return {
                id,
                title: songRes.data.title,
                artist: songRes.data.artist,
                coverimage: songRes.data.coverimage || "/default-album.jpg",
                duration: songRes.data.duration || 0
              };
            } catch (err) {
              console.error(`Error loading song ${id}:`, err);
              return null;
            }
          })
        );

        setFavourites(detailedQueue.filter(song => song !== null));
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Failed to load favourites. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavourites();
  }, [email, favoritesUpdated]);

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
      await axios.post(`${ApiService.getBaseUrl()}/favourites/remove`, {
        email:email, songIds: [id] 
      });
      setFavoritesUpdated(prev => !prev); // Trigger refresh
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
    <div className="mx-auto max-w-8xl px-4 lg:px-8">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-red-500">
            Favourites
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">Your most loved tracks</p>
        </div>
        <span className="text-xs sm:text-sm px-3 py-1 bg-gray-800 rounded-full text-gray-300">
          {favourites.length} {favourites.length === 1 ? 'Song' : 'Songs'}
        </span>
      </header>

      {error ? (
        <div className="text-center py-8 text-red-400">
          <FiX className="text-4xl mb-3 inline-block" />
          <p className="text-sm md:text-base">{error}</p>
        </div>
      ) : loading ? (
        <div className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="animate-pulse flex-shrink-0 w-40 h-56 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : favourites.length === 0 ? (
        <div className="text-center py-20">
          <FiHeart className="text-6xl text-pink-500 mb-6 mx-auto" />
          <h3 className="text-xl md:text-2xl font-medium text-gray-300 mb-3">
            No Favourites Yet
          </h3>
          <p className="text-gray-500 max-w-md mx-auto text-sm md:text-base">
            Add songs to your favourites and they will appear here!
          </p>
        </div>
      ) : (
        <motion.div 
          className="flex overflow-x-auto pb-4 gap-4 scrollbar-hide hover:scrollbar-default"
          layout
        >
          {favourites.map((song) => (
            <motion.div
              key={song.id}
              layout
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="group flex-shrink-0 w-40 bg-gray-900 rounded-lg shadow-md p-3 relative"
            >
              <div className="relative">
                <img 
                  src={song.coverimage} 
                  alt={song.title} 
                  className="w-full h-40 rounded-md object-cover"
                  onError={(e) => { 
                    e.target.src = "/default-album.jpg";
                    e.target.onerror = null;
                  }}
                />
                <button
                  onClick={() => playSong(song.id)}
                  className="absolute bottom-2 right-2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <FiPlay className="text-black w-5 h-5" />
                </button>
              </div>
              <div className="mt-3 space-y-1">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-gray-400 truncate">{song.artist}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDuration(song.duration)}</span>
                  <FiHeart className="text-pink-500" />
                </div>
              </div>
              <button
                onClick={() => removeFavourite(song.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-400 p-1 rounded-full hover:bg-gray-800/80 transition-all"
                aria-label="Remove from favourites"
              >
                <FiX className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default Favourites;