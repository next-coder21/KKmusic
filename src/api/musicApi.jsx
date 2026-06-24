/**
 * musicApi.jsx
 * Legacy stub — kept for import compatibility.
 * All audio streaming MUST use the /auth/music/stream/:id proxy so the server
 * can resolve Google Drive tokens server-side.  Never use direct Drive URLs or
 * the old /stream/* path here.
 */
import { API_CONFIG } from "../config";

// NOTE: this file is not used by any active component.
// Stream URLs are built in PlayerContext / Player.jsx as:
//   `${API_CONFIG.STREAM_URL}/${songId}`  →  /auth/music/stream/:id

export const fetchSongs = async () => {
  // Stub — real song data comes from GET /auth/music/songs via http.js
  return [];
};
