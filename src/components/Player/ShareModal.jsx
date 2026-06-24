import React, { useEffect, useState, useRef } from "react";
import { X, Share2, MessageCircle, Download, Play, Pause, Film, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ApiService from "../../services/ApiService";
import { API_CONFIG } from "../../config";
import toast from "react-hot-toast";

const audioCtxRef = { context: null, source: null, dest: null };

export default function ShareModal({ isOpen, onClose, song, lyrics, currentTime }) {
  const [selectedLines,   setSelectedLines]   = useState([]);
  const [selectionStart,  setSelectionStart]  = useState(-1);
  const [manualStartTime, setManualStartTime] = useState(0);
  const [step, setStep] = useState(1);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isPrelistening, setIsPrelistening] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0);

  const videoAudioRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const absoluteStartTimeRef = useRef(0);
  const hasLyrics = lyrics?.lines && lyrics.lines.length > 0;

  useEffect(() => {
    if (isOpen) {
      setStep(1); setSelectionStart(-1); setSelectedLines([]);
      setIsVideoPlaying(false); setIsPrelistening(false); setVideoTime(0); setIsRecording(false);
      setManualStartTime(currentTime);
      if (hasLyrics) {
         const idx = lyrics.lines.findIndex(l => l.time >= currentTime);
         if (idx !== -1) handleSelectStart(idx);
      } else {
         absoluteStartTimeRef.current = currentTime;
      }
    } else {
      stopRecordingAndPlayback();
      if (audioCtxRef.source) {
        try { audioCtxRef.source.disconnect(); } catch {}
        audioCtxRef.source = null;
        audioCtxRef.dest = null;
      }
    }
  }, [isOpen]);

  const handleSelectStart = (startIndex) => {
    if (!lyrics?.lines) return;
    const startLine = lyrics.lines[startIndex];
    const range = lyrics.lines.filter(l => l.time >= startLine.time && l.time <= startLine.time + 30);
    setSelectionStart(startIndex);
    setSelectedLines(range || []);
    absoluteStartTimeRef.current = startLine.time;
    setVideoTime(startLine.time);
  };

  const handleManualTimeChange = (e) => {
    const val = parseFloat(e.target.value);
    setManualStartTime(val);
    absoluteStartTimeRef.current = val;
    setVideoTime(val);
    if (isPrelistening && videoAudioRef.current) {
       videoAudioRef.current.currentTime = val;
    }
  };

  const togglePrelisten = () => {
     if (!videoAudioRef.current) return;
     if (isPrelistening) {
        videoAudioRef.current.pause();
        setIsPrelistening(false);
     } else {
        videoAudioRef.current.currentTime = manualStartTime;
        videoAudioRef.current.play().catch(() => {});
        setIsPrelistening(true);
     }
  };

  const stopRecordingAndPlayback = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    if (videoAudioRef.current) { videoAudioRef.current.pause(); videoAudioRef.current.currentTime = absoluteStartTimeRef.current; }
    setIsVideoPlaying(false); setIsRecording(false); setIsPrelistening(false);
  };

  useEffect(() => {
    let animationFrame;
    const syncLoop = () => {
       if (videoAudioRef.current && (isVideoPlaying || isRecording || isPrelistening)) {
          const t = videoAudioRef.current.currentTime;
          setVideoTime(t);
          if (isRecording) setRecordProgress(Math.min(((t - absoluteStartTimeRef.current) / 30) * 100, 100));
          if (t >= absoluteStartTimeRef.current + 30) { stopRecordingAndPlayback(); return; }
          animationFrame = requestAnimationFrame(syncLoop);
       }
    };
    if (isVideoPlaying || isRecording || isPrelistening) animationFrame = requestAnimationFrame(syncLoop);
    return () => cancelAnimationFrame(animationFrame);
  }, [isVideoPlaying, isRecording, isPrelistening]);

  const toggleVideoPlay = () => {
    if (!videoAudioRef.current || isRecording) return;
    if (isVideoPlaying) stopRecordingAndPlayback();
    else { videoAudioRef.current.currentTime = absoluteStartTimeRef.current; videoAudioRef.current.play().catch(() => {}); setIsVideoPlaying(true); }
  };

  const formatTime = (seconds) => {
     const m = Math.floor(seconds/60); const s = Math.floor(seconds%60);
     return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const drawWrappedText = (ctx, text, x, y, maxWidth, fontSize, fontColor) => {
    ctx.font = `900 ${fontSize}px Inter, sans-serif`; ctx.fillStyle = fontColor;
    const words = text.split(' '); let line = ''; let currentY = y;
    for (let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + ' '; let metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line.toUpperCase(), x, currentY); line = words[n] + ' '; currentY += fontSize * 1.25;
      } else { line = testLine; }
    }
    ctx.fillText(line.toUpperCase(), x, currentY); return currentY;
  };

  const renderFrame = (ctx, time, coverImg) => {
    const w = 720, h = 1280; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, w, h);
    if (coverImg) {
       ctx.globalAlpha = 0.25; const scale = Math.max(w / coverImg.width, h / coverImg.height);
       ctx.drawImage(coverImg, (w - coverImg.width * scale) / 2, (h - coverImg.height * scale) / 2, coverImg.width * scale, coverImg.height * scale);
       ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.fillRect(0,0,w,h); ctx.globalAlpha = 1.0;
       const artW = 440; ctx.strokeStyle = "#CCFF00"; ctx.lineWidth = 4; ctx.strokeRect((w-artW)/2, 140, artW, artW);
       ctx.drawImage(coverImg, (w-artW)/2, 140, artW, artW);
    }
    ctx.textAlign = "center"; ctx.fillStyle = "#fff"; ctx.font = "900 32px Inter"; ctx.fillText(song.title.toUpperCase(), w/2, 650);
    ctx.fillStyle = "#CCFF00"; ctx.font = "900 22px Inter"; ctx.fillText(song.artist_name.toUpperCase(), w/2, 690);
    if (hasLyrics) {
      let startY = 780;
      selectedLines.slice(0, 5).forEach((l, i) => {
         const isActive = time >= l.time && (i === selectedLines.length - 1 || time < (selectedLines[i+1]?.time || (l.time + 10)));
         startY = drawWrappedText(ctx, l.text, w/2, startY, w - 140, isActive ? 34 : 26, isActive ? "#fff" : "rgba(255,255,255,0.06)") + 50;
      });
    } else { ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.font = "900 24px Inter"; ctx.fillText(`${formatTime(absoluteStartTimeRef.current)} — ${formatTime(absoluteStartTimeRef.current + 30)}`, w/2, 850); }
    ctx.textAlign = "center"; ctx.fillStyle = "rgba(255,255,255,0.05)"; ctx.font = "900 120px Inter"; ctx.fillText("MUVE𝄞", w/2, h - 100);
  };

  const handleExportVideo = async () => {
    if (!videoAudioRef.current) return;
    try {
      setIsRecording(true); setRecordProgress(0); chunksRef.current = [];
      const coverImg = new Image(); coverImg.crossOrigin = "anonymous"; coverImg.src = song.cover_url;
      await new Promise(r => coverImg.onload = r);

      const canvas = document.createElement("canvas"); canvas.width = 720; canvas.height = 1280;
      const ctx = canvas.getContext("2d");

      if (!audioCtxRef.context) {
         audioCtxRef.context = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (!audioCtxRef.source) {
         audioCtxRef.source = audioCtxRef.context.createMediaElementSource(videoAudioRef.current);
         audioCtxRef.dest = audioCtxRef.context.createMediaStreamDestination();
         audioCtxRef.source.connect(audioCtxRef.dest);
         audioCtxRef.source.connect(audioCtxRef.context.destination);
      }

      const combinedStream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...audioCtxRef.dest.stream.getAudioTracks()]);
      const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm;codecs=vp9,opus', videoBitsPerSecond: 6000000 });
      recorderRef.current = recorder; recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
         const blob = new Blob(chunksRef.current, { type: 'video/webm' });
         const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${song.title}_STORY.mp4`; a.click();
         toast.success("Identity Story Exported! Atmosphere Validated.");
      };

      videoAudioRef.current.currentTime = absoluteStartTimeRef.current;
      videoAudioRef.current.play(); recorder.start();

      const drawLoop = () => { if (recorder.state === "inactive") return; renderFrame(ctx, videoAudioRef.current.currentTime, coverImg); requestAnimationFrame(drawLoop); };
      drawLoop();
    } catch (err) {
      console.error(err);
      toast.error("Export Protocol Failure. Re-centering audio nodes...");
      setIsRecording(false);
    }
  };

  const ST = {
      overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(40px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" },
      modal: { width: "100%", maxWidth: 450, background: "#000", border: "4px solid #CCFF00", position: "relative", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 40px)", overflow: "hidden" },
      card: { width: "100%", background: "#050505", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column", padding: "40px", flex: 1, justifyContent: "center" },
      btn: { padding: "14px 24px", border: "none", background: "#CCFF00", fontWeight: 900, textTransform: "uppercase", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, flex: 1, justifyContent: "center" }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={ST.overlay}>
          <audio ref={videoAudioRef} src={`${API_CONFIG.STREAM_URL}/${song.id}`} crossOrigin="anonymous" />
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} style={ST.modal}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
               <span style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 10, color: "#CCFF00" }}>Story Generator V3</span>
               <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#fff" }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {step === 1 ? (
                <div style={{ padding: 40 }}>
                   <p style={{ fontWeight: 900, textTransform: "uppercase", fontSize: 10, opacity: 0.4, marginBottom: 20, color: "#fff" }}>{hasLyrics ? "Synchronizing Lyrics Segment" : "Synchronizing Time segment"}</p>
                   {hasLyrics ? (
                     <div style={{ maxHeight: 350, overflowY: "auto", border: "1px solid rgba(255,255,255,0.05)", background: "#050505", padding: 10 }} className="scrollbar-hide">
                        {lyrics.lines.map((l, i) => (
                          <div key={i} onClick={() => handleSelectStart(i)} style={{ padding: 12, cursor: "pointer", background: i >= selectionStart && i < (selectionStart + (selectedLines.length || 0)) ? "rgba(204,255,0,0.05)" : "transparent", transition: "0.2s" }}>
                            <p style={{ fontWeight: 900, fontSize: 11, textTransform: "uppercase", margin: 0, color: i >= selectionStart && i < (selectionStart + (selectedLines.length || 0)) ? "#CCFF00" : "#fff", opacity: i >= selectionStart && i < (selectionStart + (selectedLines.length || 0)) ? 1 : 0.3 }}>{l.text}</p>
                          </div>
                        ))}
                     </div>
                   ) : (
                     <div style={{ padding: 24, background: "#111", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 4 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                           <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                              <button onClick={togglePrelisten} style={{ width: 44, height: 44, borderRadius: "50%", background: "#CCFF00", border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                                 {isPrelistening ? <Pause size={20} color="#000" fill="#000" /> : <Play size={20} color="#000" fill="#000" style={{ marginLeft: 3 }} />}
                              </button>
                              <div>
                                 <span style={{ color: "#fff", fontWeight: 900, fontSize: 10, textTransform: "uppercase", display: "block" }}>Prelisten Selection</span>
                                 <span style={{ color: "#CCFF00", fontWeight: 900, fontSize: 10 }}>{formatTime(manualStartTime)} — {formatTime(manualStartTime+30)}</span>
                              </div>
                           </div>
                        </div>
                        <input type="range" min="0" max="300" step="1" value={manualStartTime} onChange={handleManualTimeChange} style={{ width: "100%", accentColor: "#CCFF00", cursor: "pointer" }} />
                     </div>
                   )}
                   <button style={{ ...ST.btn, marginTop: 40, width: "100%" }} onClick={() => { stopRecordingAndPlayback(); setStep(2); }}>GENERATE IDENTIY</button>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column" }}>
                   <div style={ST.card}>
                      {isRecording && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.95)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14 }}>
                           <Loader2 className="animate-spin" color="#CCFF00" size={40} />
                           <span style={{ color: "#CCFF00", fontWeight: 900, fontSize: 10, textTransform: "uppercase" }}>Exporting Full Atmosphere...</span>
                           <div style={{ width: 100, height: 2, background: "rgba(255,255,255,0.1)", position: "relative" }}>
                              <div style={{ position: "absolute", inset: 0, background: "#CCFF00", width: `${recordProgress}%` }} />
                           </div>
                        </div>
                      )}
                      <div style={{ position: "absolute", inset: 0, opacity: 0.15 }}>
                         <img src={song.cover_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                      </div>
                      <div style={{ position: "relative", textAlign: "center", width: "100%" }}>
                          <div style={{ border: "2px solid #CCFF00", width: 160, height: 160, margin: "0 auto 30px", overflow: "hidden" }}>
                             <img src={song.cover_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="" />
                          </div>
                          <div style={{ marginBottom: 30 }}>
                             <p style={{ color: "#fff", fontWeight: 900, margin: 0, textTransform: "uppercase", fontSize: 14 }}>{song.title}</p>
                             <p style={{ color: "#CCFF00", fontWeight: 900, margin: 0, textTransform: "uppercase", fontSize: 11 }}>{song.artist_name}</p>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                             {hasLyrics ? (
                               selectedLines.slice(0, 5).map((l, i) => {
                                  const isActive = videoTime >= l.time && (i === selectedLines.length - 1 || videoTime < (selectedLines[i+1]?.time || (l.time + 10)));
                                  return (
                                     <motion.p key={i} animate={{ opacity: isActive ? 1 : 0.05 }}
                                       style={{ fontWeight: 900, fontSize: 22, textTransform: "uppercase", textAlign: "center", margin: 0, color: "#fff" }}>
                                       {l.text}
                                     </motion.p>
                                  );
                               })
                             ) : (
                               <p style={{ color: "rgba(255,255,255,0.1)", fontWeight: 900, fontSize: 14, textTransform: "uppercase" }}>Atmospheric Sound Segment</p>
                             )}
                          </div>
                          <div style={{ marginTop: 60, display: "flex", justifyContent: "center" }}>
                             <span style={{ color: "rgba(255,255,255,0.04)", fontWeight: 900, textTransform: "uppercase", fontSize: 60, letterSpacing: "-0.08em" }}>MUVE𝄞</span>
                          </div>
                          <div style={{ position: "absolute", bottom: -24, right: 0, width: 44, height: 44, background: "#CCFF00", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} onClick={toggleVideoPlay}>
                             {isVideoPlaying ? <Pause size={22} color="#000" fill="#000" /> : <Play size={22} color="#000" fill="#000" />}
                          </div>
                      </div>
                      <div style={{ position: "absolute", bottom: 0, left: 0, height: 4, background: "#CCFF00", width: `${((videoTime - absoluteStartTimeRef.current)/30) * 100}%`, transition: "width 0.1s" }} />
                   </div>
                   <div style={{ padding: "24px 30px", background: "#fff", display: "flex", gap: 12, borderTop: "4px solid #000" }}>
                      <button style={{ ...ST.btn, background: "#000", color: "#fff" }} onClick={() => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent("Check it on Muve!")}`)}>SHARE</button>
                      <button style={ST.btn} onClick={handleExportVideo}>DOWNLOAD STORY</button>
                   </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
