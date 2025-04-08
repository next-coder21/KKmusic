import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { 
  Play, Pause, Volume2, VolumeX, 
  Shuffle, Repeat, ListMusic, 
  Heart, SkipBack, SkipForward, 
  Loader2, X
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import ApiService from "../../services/ApiService";
import toast from "react-hot-toast";

const Player = () => {
  // Player state
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showMobileQueue, setShowMobileQueue] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const queueRef = useRef(null);
  const { user } = useUser();
  const { queue, setQueue, currentSongId, queueUpdated, setFavoritesUpdated } = usePlayer();
  const email = user?.email;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format time helper
  const formatTime = useCallback((seconds) => {
    const validSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    return `${Math.floor(validSeconds / 60)}:${(validSeconds % 60).toString().padStart(2, '0')}`;
  }, []);

  // Close queue when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (queueRef.current && !queueRef.current.contains(event.target)) {
        setShowQueue(false);
        setShowMobileQueue(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch queue from API
  useEffect(() => {
    let isMounted = true;
    const fetchQueue = async () => {
      try {
        if (!email) return;
        
        const response = await axios.get(`${ApiService.getBaseUrl()}/queue/${email}`);
        const queueIds = response.data.queue;
        
        const detailedQueue = await Promise.all(
          queueIds.map(async (id) => {
            try {
              const songRes = await axios.get(`${ApiService.getBaseUrl()}/music/songs/${id}`);
              return {
                id,
                title: songRes.data.title,
                artist: songRes.data.artist,
                coverimage: songRes.data.coverimage || '/default-album.jpg',
                duration: songRes.data.duration || 180 // Default 3 minutes
              };
            } catch (err) {
              console.error(`Error loading song ${id}:`, err);
              return null;
            }
          })
        );
        
        if (isMounted) {
          const filteredQueue = detailedQueue.filter(Boolean);
          setQueue(filteredQueue);
          
          if (currentSongId) {
            const index = filteredQueue.findIndex(song => song.id === currentSongId);
            if (index !== -1) setCurrentIndex(index);
          }
        }
      } catch (err) {
        console.error("Queue load error:", err);
      }
    };

    fetchQueue();
    return () => { isMounted = false };
  }, [email, queueUpdated, currentSongId, setQueue]);

  // Handle track loading
  useEffect(() => {
    const loadTrack = async () => {
      if (queue.length > 0 && currentIndex >= 0 && currentIndex < queue.length) {
        try {
          setIsLoading(true);
          setError(null);
          const newSong = queue[currentIndex];
          setSong(newSong);
          setDuration(newSong.duration);
          setCurrentTime(0);
          setProgress(0);

          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.src = `${ApiService.getBaseUrl()}/music/stream/${newSong.id}`;
            
            await new Promise((resolve) => {
              const handleCanPlay = () => {
                audioRef.current.removeEventListener('canplay', handleCanPlay);
                resolve();
              };
              audioRef.current.addEventListener('canplay', handleCanPlay);
            });

            if (queue.length > 0) {
              await audioRef.current.play();
              setIsPlaying(true);
            }
          }
        } catch (err) {
          setError("Playback failed. Click play to retry.");
          setIsPlaying(false);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadTrack();
  }, [currentIndex, queue]);

  // Add this useEffect to check if current song is in favorites
useEffect(() => {
  const checkFavoriteStatus = async () => {
    if (!user?.email || !song?.id) return;
    
    try {
      const response = await axios.get(`${ApiService.getBaseUrl()}/favourites/${user.email}`);
      const favoriteIds = response.data.favourites || [];
      setIsFavorite(favoriteIds.includes(song.id));
    } catch (err) {
      console.error("Error checking favorite status:", err);
    }
  };

  checkFavoriteStatus();
}, [user, song]);

  // Audio controls
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.loop = isLooping;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isLooping, isMuted]);

  // Play/pause handler
  const handlePlayPause = async () => {
    if (!audioRef.current || isLoading) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        await audioRef.current.play();
        setError(null);
      }
      setIsPlaying(!isPlaying);
    } catch (err) {
      setError("Playback failed. Click play to retry.");
      setIsPlaying(false);
    }
  };

  // Track navigation
  const handleTrackChange = (direction) => {
    if (queue.length === 0 || isLoading) return;

    let newIndex;
    if (isShuffling) {
      do {
        newIndex = Math.floor(Math.random() * queue.length);
      } while (newIndex === currentIndex && queue.length > 1);
    } else {
      newIndex = (currentIndex + direction + queue.length) % queue.length;
    }
    setCurrentIndex(newIndex);
  };

  // Metadata handler
  const handleMetadataLoad = () => {
    if (audioRef.current?.readyState > 0) {
      const audioDuration = audioRef.current.duration;
      if (Number.isFinite(audioDuration) && audioDuration > 0) {
        setDuration(audioDuration);
      }
    }
  };

  // Progress updates
  const updateProgress = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);
      if (duration > 0) {
        setProgress((time / duration) * 100);
      }
    }
  };

  // Seek handler
  const handleProgressChange = (e) => {
    const newProgress = e.target.value;
    const newTime = (newProgress / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(newProgress);
      setCurrentTime(newTime);
    }
  };

  // Favorite handler
  // const handleFavorite = async () => {
  //   if (!user?.email || !song?.id) {
  //     setError("User not logged in or song missing.");
  //     return;
  //   }
  
  //   setIsFavoriting(true);
  
  //   try {
  //     await axios.post(`${ApiService.getBaseUrl()}/favourites/add`, {
  //       email: user.email,
  //       songIds: [song.id]
  //     });
  
  //     setIsFavorite(!isFavorite);
  //   } catch (err) {
  //     console.error("Error updating favorites:", err);
  //     setError("Failed to update favorites");
  //   } finally {
  //     setIsFavoriting(false);
  //   }
  // };

  const handleFavorite = async () => {
    if (!user?.email || !song?.id) {
      setError("User not logged in or song missing.");
      return;
    }
  
    setIsFavoriting(true);
  
    try {
      if (isFavorite) {
        // Correct DELETE request
        await axios.post(`${ApiService.getBaseUrl()}/favourites/remove`, {

            email: user.email, 
            songIds: [song.id] 
          
        });
        toast.success(`${song.title} removed from favorites`);
      } else {
        await axios.post(`${ApiService.getBaseUrl()}/favourites/add`, {
          email: user.email,
          songIds: [song.id]
        });
        toast.success(`${song.title} added to favorites`);
      }
  
      setIsFavorite(!isFavorite);
      setFavoritesUpdated(prev => !prev); // Update favorites state globally
    } catch (err) {
      console.error("Error updating favorites:", err);
      setError("Failed to update favorites");
      toast.error("Failed to update favorites");
    } finally {
      setIsFavoriting(false);
    }
  };

  // Error retry handler
  const handleRetry = async () => {
    setError(null);
    await handlePlayPause();
  };

  // QueueList component
  const QueueList = ({ mobile = false }) => (
    <div 
      ref={queueRef}
      className={`${
        mobile ? 
        "fixed inset-x-0 bottom-20 rounded-t-2xl h-[60vh] pb-4" :
        "absolute bottom-20 right-0 w-80 rounded-xl"
      } bg-gray-800/95 backdrop-blur-lg shadow-2xl border border-white/10 overflow-y-auto z-50 transition-all`}
    >
      <div className="sticky top-0 bg-gray-800/90 p-3 flex justify-between items-center border-b border-white/10">
        <h3 className="text-sm font-bold text-white">Queue ({queue.length})</h3>
        <button 
          onClick={() => mobile ? setShowMobileQueue(false) : setShowQueue(false)}
          className="text-gray-400 hover:text-white p-1"
        >
          <X size={18} />
        </button>
      </div>
      <div className="p-3 space-y-1">
        {queue.length > 0 ? (
          queue.map((track, index) => (
            <button
              key={`${track.id}-${index}`}
              onClick={() => {
                if (index !== currentIndex) setCurrentIndex(index);
                setShowQueue(false);
                setShowMobileQueue(false);
              }}
              className={`w-full p-3 rounded-lg flex items-center justify-between text-sm ${
                index === currentIndex 
                  ? "bg-cyan-500/20"
                  : "hover:bg-gray-700/50"
              } transition-colors`}
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <img 
                  src={track.coverimage} 
                  alt="Album cover" 
                  className="w-10 h-10 rounded-md object-cover"
                  onError={(e) => e.target.src = '/default-album.jpg'}
                />
                <div className="text-left min-w-0">
                  <p className="text-white truncate">{track.title}</p>
                  <p className="text-xs text-cyan-400 truncate">{track.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">
                  {formatTime(track.duration)}
                </span>
                {index === currentIndex && (
                  <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-4">Queue is empty</p>
        )}
      </div>
    </div>
  );

  // ControlButton component
  const ControlButton = ({ 
    icon: Icon, 
    onClick, 
    active = false, 
    disabled = false, 
    mobile = false,
    ariaLabel 
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`p-2 rounded-full ${
        mobile ? "text-2xl" : "text-lg"
      } ${
        active ? "text-cyan-400 bg-cyan-900/20" : "text-gray-300 hover:bg-gray-800/30"
      } transition-colors disabled:opacity-50 disabled:pointer-events-none`}
    >
      <Icon size={mobile ? 12 : 20} />
    </button>
  );

  // Error display
  if (error) {
    return (
      <div className="w-full p-3 bg-red-800/90 backdrop-blur-lg rounded-lg flex items-center justify-between text-sm animate-slide-up">
        <span className="truncate flex-1">{error}</span>
        <div className="flex gap-2 ml-3">
          <button 
            className="px-3 py-1 bg-red-900/30 rounded-full hover:bg-red-900/40 text-xs"
            onClick={handleRetry}
          >
            Retry
          </button>
          <button 
            className="px-3 py-1 bg-red-900/30 rounded-full hover:bg-red-900/40 text-xs"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className=" bg-gray-900/95 backdrop-blur-lg border-t border-white/5">
      {/* Audio element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleMetadataLoad}
        onTimeUpdate={updateProgress}
        onEnded={() => queue.length > 0 && handleTrackChange(1)}
        onError={() => setError("Playback failed")}
        onWaiting={() => setIsBuffering(true)}
        onPlaying={() => setIsBuffering(false)}
      />

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between px-6 py-3 h-24 gap-4">
        {song ? (
          <>
            {/* Left Section - Song Info */}
            <div className="flex items-center gap-4 flex-1 max-w-[30%]">
              <img 
                src={song.coverimage} 
                alt="Album art" 
                className="w-14 h-14 rounded-lg object-cover shadow-lg"
                onError={(e) => e.target.src = '/default-album.jpg'}
              />
              <div className="min-w-0">
                <h3 className="text-base font-medium text-white truncate">{song.title}</h3>
                <p className="text-sm text-cyan-400 truncate">{song.artist}</p>
              </div>
              <button 
                onClick={handleFavorite}
                className="text-red-400 hover:text-red-300 transition-colors ml-2"
                disabled={isFavoriting}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center gap-3 flex-1 max-w-[40%]">
              <div className="flex items-center gap-3">
                <ControlButton 
                  icon={Shuffle} 
                  onClick={() => setIsShuffling(!isShuffling)}
                  active={isShuffling}
                  disabled={isLoading || queue.length <= 1}
                  ariaLabel="Toggle shuffle"
                />
                <ControlButton 
                  icon={SkipBack} 
                  onClick={() => handleTrackChange(-1)}
                  disabled={isLoading || queue.length === 0}
                  ariaLabel="Previous track"
                />
                <button
                  onClick={handlePlayPause}
                  className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
                  disabled={isLoading || isBuffering}
                  aria-label={isPlaying ? "Pause" : "Play"}
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={24} className="text-white" />
                  ) : (
                    <Play size={24} className="text-white pl-0.5" />
                  )}
                </button>
                <ControlButton 
                  icon={SkipForward} 
                  onClick={() => handleTrackChange(1)}
                  disabled={isLoading || queue.length === 0}
                  ariaLabel="Next track"
                />
                <ControlButton 
                  icon={Repeat} 
                  onClick={() => setIsLooping(!isLooping)}
                  active={isLooping}
                  ariaLabel="Toggle repeat"
                />
              </div>

              {/* Progress Bar */}
              <div className="w-full flex items-center gap-3 text-sm text-gray-400">
                <span>{formatTime(currentTime)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="flex-1 h-2 bg-gray-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                  disabled={isLoading}
                  aria-label="Track progress"
                />
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Section - Volume & Queue */}
            <div className="flex items-center gap-4 flex-1 max-w-[30%] justify-end">
              <div className="flex items-center gap-2 w-36">
                <Volume2 size={20} className="text-gray-300" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                  aria-label="Volume control"
                />
              </div>
              {queue.length > 0 && (
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-gray-300 hover:text-cyan-400 p-2 rounded-full hover:bg-gray-800/30 relative"
                  aria-label="Show queue"
                >
                  <ListMusic size={20} />
                  {showQueue && <QueueList />}
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="w-full text-center text-gray-400 text-sm">
            {isLoading ? "Loading..." : "Select a song to play"}
          </div>
        )}
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex flex-col p-3 gap-3">
        {song ? (
          <>
            {/* Song Info & Progress */}
            <div className="flex items-center gap-3">
              <img 
                src={song.coverimage} 
                alt="Album art" 
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => e.target.src = '/default-album.jpg'}
              />
              <div className="flex-1">
                <h3 className="text-sm font-medium text-white truncate">{song.title}</h3>
                <p className="text-xs text-cyan-400 truncate">{song.artist}</p>
                <div className="w-full flex items-center gap-2 text-xs text-gray-400 mt-1">
                  <span>{formatTime(currentTime)}</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={progress}
                    onChange={handleProgressChange}
                    className="flex-1 h-1 bg-gray-800 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-400"
                    disabled={isLoading}
                    aria-label="Track progress"
                  />
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              <button 
                onClick={handleFavorite}
                className="text-red-400 hover:text-red-300"
                disabled={isFavoriting}
                aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <Heart size={20} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-between">
              <ControlButton 
                icon={Shuffle} 
                onClick={() => setIsShuffling(!isShuffling)}
                active={isShuffling}
                mobile
                ariaLabel="Toggle shuffle"
              />
              <ControlButton 
                icon={Repeat} 
                onClick={() => setIsLooping(!isLooping)}
                active={isLooping}
                mobile
                ariaLabel="Toggle repeat"
              />
              <ControlButton 
                icon={SkipBack} 
                onClick={() => handleTrackChange(-1)}
                mobile
                ariaLabel="Previous track"
              />
              <button
                onClick={handlePlayPause}
                className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50 disabled:pointer-events-none"
                disabled={isLoading || isBuffering}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading || isBuffering ? (
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause size={24} className="text-white" />
                ) : (
                  <Play size={24} className="text-white pl-0.5" />
                )}
              </button>
              <ControlButton 
                icon={SkipForward} 
                onClick={() => handleTrackChange(1)}
                mobile
                ariaLabel="Next track"
              />
              
               <button 
                  onClick={() => setShowMobileQueue(!showMobileQueue)}
                  className="text-gray-300 hover:text-cyan-400 p-2 rounded-full hover:bg-gray-800/30"
                  aria-label="Show queue"
                >
                  <ListMusic size={12} />
                  {showMobileQueue && <QueueList mobile />}
                </button>
            </div>


            
          </>
        ) : (
          <div className="text-center text-gray-400 text-sm py-4">
            {isLoading ? "Loading..." : "No song selected"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;