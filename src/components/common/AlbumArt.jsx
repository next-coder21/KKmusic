import { useState } from "react";

// Derive a stable hue from any string so the same title always gets the same color
function titleHue(str = "") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % 360;
}

function initials(title = "") {
  return title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/**
 * AlbumArt
 *
 * Props:
 *   src        — cover_url (may be null/undefined/"")
 *   title      — album or song title used for placeholder initials + color
 *   size       — css value, default "100%"
 *   radius     — css value, default "8px"
 *   className  — extra class names
 *   style      — extra inline styles
 *   alt        — img alt text
 */
export default function AlbumArt({
  src,
  title = "",
  size = "100%",
  radius = "8px",
  className = "",
  style = {},
  alt = title,
}) {
  const [failed, setFailed] = useState(false);

  const hue   = titleHue(title);
  const bg    = `hsl(${hue}, 40%, 22%)`;
  const fg    = `hsl(${hue}, 80%, 72%)`;
  const label = initials(title) || "?";

  const base = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
    overflow: "hidden",
    ...style,
  };

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ ...base, objectFit: "cover", display: "block" }}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        ...base,
        background: bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      aria-label={alt}
      role="img"
    >
      <span
        style={{
          color: fg,
          fontWeight: 700,
          fontSize: `calc(${typeof size === "number" ? size + "px" : size} * 0.35)`,
          lineHeight: 1,
          userSelect: "none",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>
    </div>
  );
}
