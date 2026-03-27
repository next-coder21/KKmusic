import React from "react";

/**
 * Skeletons.jsx
 * Loading skeleton components for every major view.
 */

// Shared shimmer keyframe injected once
const shimmerStyle = `
  @keyframes kk-shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position:  400px 0; }
  }
`;
let shimmerInjected = false;
const injectShimmer = () => {
  if (shimmerInjected || typeof document === "undefined") return;
  const s = document.createElement("style");
  s.textContent = shimmerStyle;
  document.head.appendChild(s);
  shimmerInjected = true;
};

const Bone = ({ w = "100%", h = 16, r = 8, style = {} }) => {
  injectShimmer();
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          "linear-gradient(90deg, var(--bg-elevated,#16152a) 25%, var(--bg-secondary,#0f0e1a) 50%, var(--bg-elevated,#16152a) 75%)",
        backgroundSize: "400px 100%",
        animation: "kk-shimmer 1.4s ease-in-out infinite",
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export const SongCardSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "12px", borderRadius: "12px", background: "var(--bg-elevated,#16152a)", border: "1px solid var(--border,rgba(255,255,255,0.07))" }}>
    <Bone h={140} r={8} />
    <Bone w="70%" h={14} />
    <Bone w="50%" h={12} />
  </div>
);

export const SongCardSkeletonGrid = ({ count = 8 }) => (
  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "16px" }}>
    {Array.from({ length: count }).map((_, i) => <SongCardSkeleton key={i} />)}
  </div>
);

export const SongRowSkeleton = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: "8px", background: "var(--bg-secondary,#0f0e1a)" }}>
    <Bone w={44} h={44} r={6} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <Bone w="55%" h={13} />
      <Bone w="35%" h={11} />
    </div>
    <Bone w={40} h={12} r={4} />
  </div>
);

export const SongRowSkeletonList = ({ count = 6 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
    {Array.from({ length: count }).map((_, i) => <SongRowSkeleton key={i} />)}
  </div>
);

export const PlayerBarSkeleton = () => (
  <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "0 20px", height: "72px", background: "var(--player-bg,#0d0c1f)", borderTop: "1px solid var(--border,rgba(255,255,255,0.07))" }}>
    <Bone w={48} h={48} r={6} style={{ flexShrink: 0 }} />
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
      <Bone w="30%" h={12} />
      <Bone w="20%" h={10} />
    </div>
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      {[28, 36, 28].map((s, i) => <Bone key={i} w={s} h={s} r={s / 2} />)}
    </div>
    <Bone w="25%" h={4} r={2} />
  </div>
);

export const ProfileSkeleton = () => (
  <div style={{ display: "flex", flexDirection: "column", gap: 16, padding: "24px" }}>
    <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
      <Bone w={80} h={80} r={40} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <Bone w="40%" h={20} />
        <Bone w="25%" h={14} />
      </div>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
      {[0,1,2,3].map(i => <Bone key={i} h={64} r={10} />)}
    </div>
    <SongRowSkeletonList count={5} />
  </div>
);

export const AdminTableSkeleton = ({ cols = 5, rows = 8 }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "10px 16px", borderBottom: "1px solid var(--border,rgba(255,255,255,0.07))" }}>
      {Array.from({ length: cols }).map((_, i) => <Bone key={i} w="60%" h={12} />)}
    </div>
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border,rgba(255,255,255,0.04))" }}>
        {Array.from({ length: cols }).map((_, ci) => <Bone key={ci} w={ci === 0 ? "80%" : "55%"} h={13} />)}
      </div>
    ))}
  </div>
);
