import { useState } from "react";

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState("");

  return (
    <input
      type="text"
      className="w-full p-2 border border-gray-500 rounded bg-gray-700 text-white"
      placeholder="Search songs..."
      value={query}
      onChange={(e) => {
        setQuery(e.target.value);
        onSearch(e.target.value);
      }}
    />
  );
}

export default SearchBar;
