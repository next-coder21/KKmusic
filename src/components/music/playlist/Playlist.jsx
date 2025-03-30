import React, { useEffect, useState } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "../../../context/UserContext";
import { usePlayer } from "../../../context/PlayerContext";
import { FiPlay, FiX, FiClock, FiMusic } from "react-icons/fi";
import ApiService from "../../../services/ApiService";

const Playlist = () => {
  const [songs, setSongs] = useState([]);
  const [openedAlbum, setOpenedAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();
  const { setCurrentSongId, setQueueUpdated } = usePlayer();
  const email = user?.email;

  useEffect(() => {
    const fetchSongs = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${ApiService.getBaseUrl()}/music/songs`);
        setSongs(data);
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSongs();
  }, []);

  // Group songs by album
  const albums = songs.reduce((acc, song) => {
    const album = song.album || "Various";
    if (!acc[album]) acc[album] = [];
    acc[album].push(song);
    return acc;
  }, {});

  // Play single song
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

  // Play full album
  const playAlbum = async (album) => {
    if (!email) return;
    try {
      await axios.post(`${ApiService.getBaseUrl()}/queue/add`, {
        email,
        songIds: albums[album].map(s => s.id),
        album: true
      });
      setCurrentSongId(albums[album][0].id);
      setQueueUpdated(prev => !prev);
    } catch (err) {
      console.error("Album error:", err);
    }
  };

  // Format duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mx-auto max-w-8xl"> {/* Added pb-24 for player space */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            Music Library
          </h1>
          <p className="text-sm text-gray-400 mt-1">Browse your music collection</p>
        </div>
        <span className="text-sm px-3 py-1 bg-gray-800 rounded-full text-gray-300">
          {Object.keys(albums).length} {Object.keys(albums).length === 1 ? 'Album' : 'Albums'}
        </span>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full aspect-square bg-gray-800 rounded-xl" />
              <div className="mt-2 h-4 bg-gray-800 rounded w-3/4" />
              <div className="mt-1 h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-9 gap-4"
          layout
        >
          {Object.entries(albums).map(([album, tracks]) => (
            <motion.div
              key={album}
              className="group"
              layout
              transition={{ duration: 0.2 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="relative">
                {/* Album Card */}
                <div
                  className="w-40 aspect-square rounded-xl overflow-hidden cursor-pointer relative shadow-lg"
                  onClick={() => setOpenedAlbum(album)}
                  onDoubleClick={() => playAlbum(album)}
                >
                  <img
                    src={tracks[0]?.coverimage || "/default-album.jpg"}
                    alt={album}
                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                    <div className="w-full">
                      <p className="font-medium text-white truncate">{album}</p>
                      <p className="text-xs text-gray-300">{tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}</p>
                    </div>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        playAlbum(album);
                      }}
                      className="absolute right-4 top-4 bg-cyan-600 hover:bg-cyan-700 p-2 rounded-full shadow-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <FiPlay className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Album Detail Panel */}
      <AnimatePresence>
        {openedAlbum && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 z-40"
              onClick={() => setOpenedAlbum(null)}
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: "spring", damping: 30, stiffness: 400 }}
              className="fixed top-0 right-0 h-[calc(100vh-80px)] w-full max-w-md bg-gray-900 border-l border-gray-800 shadow-2xl p-6 z-50 mt-20" // Added mt-20 to account for navbar
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white line-clamp-2">
                      {openedAlbum}
                    </h2>
                    <p className="text-gray-400 mt-1">
                      {albums[openedAlbum]?.[0]?.artist || 'Unknown Artist'}
                    </p>
                  </div>
                  <button
                    onClick={() => setOpenedAlbum(null)}
                    className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-4 mb-6">
                  <button
                    onClick={() => playAlbum(openedAlbum)}
                    className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <FiPlay className="text-lg" />
                    Play Album
                  </button>
                </div>

                <div className="border-t border-gray-800 pt-4 flex-1 overflow-hidden flex flex-col">
                  <div className="flex items-center text-gray-400 text-xs uppercase tracking-wider mb-2 px-2">
                    <div className="w-8"><FiMusic className="opacity-0" /></div>
                    <div className="flex-1">Title</div>
                    <div className="w-12 text-center"><FiClock /></div>
                  </div>
                  <div className="overflow-y-auto flex-1 pr-2 -mr-2">
                    {albums[openedAlbum]?.map((track, index) => (
                      <motion.div
                        key={track.id}
                        whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                        whileTap={{ scale: 0.98 }}
                        className="flex items-center p-2 rounded-lg cursor-pointer transition-colors"
                        onClick={() => playSong(track.id)}
                      >
                        <div className="w-8 text-center text-gray-400 text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {track.title}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {track.artist}
                          </p>
                        </div>
                        <div className="text-xs text-gray-400 w-12 text-center">
                          {formatDuration(track.duration)}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {!loading && Object.keys(albums).length === 0 && (
        <div className="text-center py-20">
          <div className="text-6xl mb-6">🎵</div>
          <h3 className="text-2xl font-medium text-gray-300 mb-3">
            Your library is empty
          </h3>
          <p className="text-gray-500 max-w-md mx-auto">
            Start by uploading your music collection or connect your streaming service
          </p>
          <button className="mt-6 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-full transition-colors">
            Add Music
          </button>
        </div>
      )}
    </div>
  );
};

export default Playlist;