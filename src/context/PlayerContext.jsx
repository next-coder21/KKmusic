// context/PlayerContext.js
import { createContext, useState, useContext } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [queueUpdated, setQueueUpdated] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);

  return (
    <PlayerContext.Provider value={{
      queue,
      setQueue,
      queueUpdated,
      setQueueUpdated,
      currentSongId,
      setCurrentSongId
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);