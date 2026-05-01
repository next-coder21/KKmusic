import { createContext, useState, useContext, useRef } from "react";

const PlayerContext = createContext();

export const PlayerProvider = ({ children }) => {
  // Single persistent audio element — shared across bar and panel modes
  const audioRef = useRef(null);

  // Queue & navigation
  const [queue, setQueue]               = useState([]);
  const [queueUpdated, setQueueUpdated] = useState(false);
  const [currentSongId, setCurrentSongId] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Playback
  const [isPlaying,  setIsPlaying]  = useState(false);
  // True only after the user explicitly clicks play in this browser tab
  const [userStarted, setUserStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration,   setDuration]   = useState(0);

  // Audio engine state (shared so both bar & panel stay in sync)
  const [isBuffering,     setIsBuffering]     = useState(false);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [localTime,       setLocalTime]       = useState(0);
  const [localProgress,   setLocalProgress]   = useState(0);
  const [song,            setSong]            = useState(null);

  // Player controls
  const [isShuffling, setIsShuffling] = useState(false);
  const [isLooping,   setIsLooping]   = useState(false);

  return (
    <PlayerContext.Provider value={{
      audioRef,
      queue, setQueue,
      queueUpdated, setQueueUpdated,
      currentSongId, setCurrentSongId,
      currentIndex, setCurrentIndex,
      isPlaying, setIsPlaying,
      userStarted, setUserStarted,
      currentTime, setCurrentTime,
      duration, setDuration,
      isBuffering, setIsBuffering,
      bufferedProgress, setBufferedProgress,
      localTime, setLocalTime,
      localProgress, setLocalProgress,
      song, setSong,
      isShuffling, setIsShuffling,
      isLooping, setIsLooping,
    }}>
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => useContext(PlayerContext);
