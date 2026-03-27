// context/PlayerContext.js
import { createContext, useState, useContext, useEffect, useRef } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  const [queue, setQueue] = useState([]);
  const [queueUpdated, setQueueUpdated] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [isPlaying,     setIsPlaying]     = useState(false);
  const [currentTime,   setCurrentTime]   = useState(0);
  const [duration,      setDuration]      = useState(0);

  return (
    <PlayerContext.Provider value={{
      queue, setQueue,
      queueUpdated, setQueueUpdated,
      currentSongId, setCurrentSongId,
      currentIndex, setCurrentIndex,
      isPlaying, setIsPlaying,
      currentTime, setCurrentTime,
      duration, setDuration
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);