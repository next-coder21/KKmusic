import React from "react";
import Playlist from "../components/Playlist/Playlist";

const Ainfo = ({ setSongId }) => {
  return (
    <div className="p-4">
      <Playlist setSongId={setSongId} /> {/* Pass setSongId down */}
    </div>
  );
};

export default Ainfo;
