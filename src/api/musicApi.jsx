const API_BASE_URL = "http://localhost:5000"; // Backend URL

const songs = [
  { id: 1, title: "Iraivaa", artist: "Artist 1", url: `${API_BASE_URL}/stream/Iraivaa.mp3` }
];

export const fetchSongs = async () => {
  return new Promise((resolve) => setTimeout(() => resolve(songs), 1000));
};
