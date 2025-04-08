// context/PlayerContext.js
import { createContext, useState, useContext } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [queueUpdated, setQueueUpdated] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [favoritesUpdated, setFavoritesUpdated] = useState(false);

  return (
    <PlayerContext.Provider value={{
      queue,
      setQueue,
      queueUpdated,
      setQueueUpdated,
      currentSongId,
      setCurrentSongId,
      favoritesUpdated,
      setFavoritesUpdated
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);