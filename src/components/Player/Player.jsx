import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { 
  Play, Pause, Volume2, VolumeX, 
  Shuffle, Repeat, ListMusic, 
  Heart, SkipBack, SkipForward, 
  Loader2 
} from "lucide-react";
import { useUser } from "../../context/UserContext";
import { usePlayer } from "../../context/PlayerContext";
import ApiService from "../../services/ApiService";

const Player = () => {
  // Player state
  const [song, setSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isFavoriting, setIsFavoriting] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  
  // Refs and context
  const audioRef = useRef(null);
  const queueRef = useRef(null);
  const { user } = useUser();
  const { queue, setQueue, currentSongId, queueUpdated } = usePlayer();
  const email = user?.email;
  const [currentIndex, setCurrentIndex] = useState(0);

  // Format time helper
  const formatTime = (seconds) => {
    const validSeconds = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
    return `${Math.floor(validSeconds / 60)}:${(validSeconds % 60).toString().padStart(2, '0')}`;
  };

  // Close queue when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (queueRef.current && !queueRef.current.contains(event.target)) {
        setShowQueue(false);
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
                coverimage: songRes.data.coverimage,
                duration: songRes.data.duration || 0
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
      setDuration(audioRef.current.duration);
    }
  };

  // Progress updates
  const updateProgress = () => {
    if (audioRef.current && duration > 0) {
      setProgress((audioRef.current.currentTime / duration) * 100);
    }
  };

  // Seek handler
  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setProgress(e.target.value);
    }
  };

  // Favorite handler
  const handleFavorite = async () => {
    if (!user?.email || !song?.id) {
      setError("User not logged in or song missing.");
      return;
    }
  
    setIsFavoriting(true);
  
    try {
      await axios.post(`${ApiService.getBaseUrl()}/favourites/add`, {
        email: user.email,
        songIds: [song.id]
      });
  
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error("Error updating favorites:", err);
      setError("Failed to update favorites");
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
  const QueueList = () => (
    <div 
      ref={queueRef}
      className="fixed md:absolute bottom-16 md:bottom-20 right-0 w-full md:w-80 bg-gray-800/95 backdrop-blur-lg rounded-t-xl md:rounded-xl shadow-2xl border-t border-x border-white/10 max-h-60 overflow-y-auto z-50"
    >
      <div className="p-3 space-y-1">
        <h3 className="text-sm font-bold text-white mb-1">Queue ({queue.length})</h3>
        {queue.length > 0 ? (
          queue.map((track, index) => (
            <button
              key={`${track.id}-${index}`}
              onClick={() => {
                if (index !== currentIndex) {
                  setCurrentIndex(index);
                }
                setShowQueue(false);
              }}
              className={`w-full p-2 rounded-md flex items-center justify-between text-sm ${
                index === currentIndex 
                  ? "bg-cyan-500/20"
                  : "hover:bg-gray-700/50"
              } transition-colors`}
            >
              <div className="flex items-center gap-2">
                <img 
                  src={track.coverimage} 
                  alt="Album cover" 
                  className="w-8 h-8 rounded-sm object-cover"
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
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                )}
              </div>
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">Queue is empty</p>
        )}
      </div>
    </div>
  );

  // Error display
  if (error) {
    return (
      <div className="w-full p-2 bg-red-900/20 text-red-400 rounded-lg flex items-center justify-between text-sm">
        <span className="truncate">{error}</span>
        <div className="flex gap-1">
          <button 
            className="px-2 py-0.5 bg-red-900/30 rounded-md hover:bg-red-900/40 text-xs"
            onClick={() => setError(null)}
          >
            Dismiss
          </button>
          <button 
            className="px-2 py-0.5 bg-cyan-900/30 rounded-md hover:bg-cyan-900/40 text-cyan-400 text-xs"
            onClick={handleRetry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-900/95 backdrop-blur-lg border-t border-white/5">
      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between px-4 py-2 h-20 gap-4">
        {song ? (
          <>
            <audio
              ref={audioRef}
              onLoadedMetadata={handleMetadataLoad}
              onTimeUpdate={updateProgress}
              onEnded={() => queue.length > 0 && handleTrackChange(1)}
              onError={() => setError("Playback failed")}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
            />

            {/* Left Section */}
            <div className="flex items-center gap-3 flex-1 min-w-0 max-w-[30%]">
              <img 
                src={song.coverimage} 
                alt="Album art" 
                className="w-12 h-12 rounded-md object-cover"
              />
              <div className="min-w-0">
                <h3 className="text-sm font-medium text-white truncate">{song.title}</h3>
                <p className="text-xs text-cyan-400 truncate">{song.artist}</p>
              </div>
              <button 
                onClick={handleFavorite}
                className="text-red-400 hover:text-red-300 transition-colors"
                disabled={isFavoriting}
              >
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Center Controls */}
            <div className="flex flex-col items-center gap-2 flex-1 max-w-[40%]">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShuffling(!isShuffling)}
                  className={`p-2 rounded-md ${
                    isShuffling 
                      ? "text-cyan-400 bg-cyan-900/20" 
                      : "text-gray-300 hover:bg-gray-800/30"
                  }`}
                  disabled={isLoading || queue.length <= 1}
                >
                  <Shuffle size={16} />
                </button>
                
                <button 
                  onClick={() => handleTrackChange(-1)}
                  className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800/30"
                  disabled={isLoading || queue.length === 0}
                >
                  <SkipBack size={16} />
                </button>
                
                <button
                  onClick={handlePlayPause}
                  className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-105"
                  disabled={isLoading || isBuffering}
                >
                  {isLoading || isBuffering ? (
                    <Loader2 className="w-4 h-4 text-white animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={16} className="text-white" />
                  ) : (
                    <Play size={16} className="text-white pl-0.5" />
                  )}
                </button>
                
                <button 
                  onClick={() => handleTrackChange(1)}
                  className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800/30"
                  disabled={isLoading || queue.length === 0}
                >
                  <SkipForward size={16} />
                </button>
                
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-md ${
                    isLooping 
                      ? "text-purple-400 bg-purple-900/20" 
                      : "text-gray-300 hover:bg-gray-800/30"
                  }`}
                  disabled={isLoading}
                >
                  <Repeat size={16} />
                </button>
              </div>

              <div className="w-full flex items-center gap-2 text-xs text-gray-400">
                <span className="w-8">{formatTime(audioRef.current?.currentTime || 0)}</span>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progress}
                  onChange={handleProgressChange}
                  className="flex-1 h-1 bg-gray-800 rounded-full thumb:bg-cyan-400"
                  disabled={isLoading}
                />
                <span className="w-8">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3 flex-1 max-w-[30%] justify-end">
              <div className="flex items-center gap-2 w-28">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-300 hover:text-white p-1"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-20 h-1 bg-gray-800 rounded-full thumb:bg-cyan-400"
                />
              </div>
              
              {queue.length > 0 && (
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-gray-300 hover:text-cyan-400 p-2 rounded-md hover:bg-gray-800/30 relative"
                >
                  <ListMusic size={18} />
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
      <div className="md:hidden flex flex-col p-2 gap-2">
        {song && (
          <>
            <audio
              ref={audioRef}
              onLoadedMetadata={handleMetadataLoad}
              onTimeUpdate={updateProgress}
              onEnded={() => queue.length > 0 && handleTrackChange(1)}
              onError={() => setError("Playback failed")}
              onWaiting={() => setIsBuffering(true)}
              onPlaying={() => setIsBuffering(false)}
            />

            {/* Song Info */}
            <div className="flex items-center gap-2">
              <img 
                src={song.coverimage} 
                alt="Album art" 
                className="w-10 h-10 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-white truncate">{song.title}</h3>
                <p className="text-xs text-cyan-400 truncate">{song.artist}</p>
              </div>
              <button 
                onClick={handleFavorite}
                className="text-red-400 hover:text-red-300"
                disabled={isFavoriting}
              >
                <Heart size={16} fill={isFavorite ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="w-full flex items-center gap-2 text-xs text-gray-400">
              <span className="w-8">{formatTime(audioRef.current?.currentTime || 0)}</span>
              <input
                type="range"
                min="0"
                max="100"
                value={progress}
                onChange={handleProgressChange}
                className="flex-1 h-1 bg-gray-800 rounded-full thumb:bg-cyan-400"
                disabled={isLoading}
              />
              <span className="w-8">{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsShuffling(!isShuffling)}
                  className={`p-2 rounded-md ${
                    isShuffling 
                      ? "text-cyan-400 bg-cyan-900/20" 
                      : "text-gray-300 hover:bg-gray-800/30"
                  }`}
                >
                  <Shuffle size={16} />
                </button>
                <button 
                  onClick={() => handleTrackChange(-1)}
                  className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800/30"
                >
                  <SkipBack size={16} />
                </button>
              </div>

              <button
                onClick={handlePlayPause}
                className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-purple-500 rounded-full flex items-center justify-center hover:scale-105"
                disabled={isLoading || isBuffering}
              >
                {isLoading || isBuffering ? (
                  <Loader2 className="w-5 h-5 text-white animate-spin" />
                ) : isPlaying ? (
                  <Pause size={20} className="text-white" />
                ) : (
                  <Play size={20} className="text-white pl-0.5" />
                )}
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleTrackChange(1)}
                  className="p-2 text-gray-300 hover:text-white rounded-md hover:bg-gray-800/30"
                >
                  <SkipForward size={16} />
                </button>
                <button
                  onClick={() => setIsLooping(!isLooping)}
                  className={`p-2 rounded-md ${
                    isLooping 
                      ? "text-purple-400 bg-purple-900/20" 
                      : "text-gray-300 hover:bg-gray-800/30"
                  }`}
                >
                  <Repeat size={16} />
                </button>
              </div>
            </div>

            {/* Secondary Controls */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2 flex-1">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-gray-300 hover:text-white p-1"
                >
                  {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="flex-1 h-1 bg-gray-800 rounded-full thumb:bg-cyan-400"
                />
              </div>
              
              {queue.length > 0 && (
                <button 
                  onClick={() => setShowQueue(!showQueue)}
                  className="text-gray-300 hover:text-cyan-400 p-2 rounded-md hover:bg-gray-800/30"
                >
                  <ListMusic size={18} />
                  {showQueue && <QueueList />}
                </button>
              )}
            </div>
          </>
        )}

        {!song && (
          <div className="text-center text-gray-400 text-sm py-4">
            {isLoading ? "Loading..." : "No song selected"}
          </div>
        )}
      </div>
    </div>
  );
};

export default Player;