/**
 * songUtils.js
 * Utilities for handling song data.
 */

export const songDefaults = (song) => {
  if (!song) return null;
  return {
    ...song,
    title:            song.title            ?? "Unknown Title",
    artist_name:      song.artist_name      ?? "Unknown Artist",
    album_title:      song.album_title      ?? "Unknown Album",
    cover_url:        song.cover_url        || null,
    duration_seconds: song.duration_seconds ?? 0,
    play_count:       song.play_count       ?? 0,
    is_explicit:      song.is_explicit      ?? false,
  };
};

export const fmtDuration = (seconds) => {
  if (!seconds || isNaN(seconds)) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = String(Math.floor(seconds % 60)).padStart(2, "0");
  return `${m}:${s}`;
};

export const songListDefaults = (songs = []) => songs.map(songDefaults);
