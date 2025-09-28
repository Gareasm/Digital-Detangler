import React from "react";

function ScoreBar({ label, score }) {
  // Color coding based on score
  let color;
  if (score >= 8) color = "lawngreen";
  else if (score >= 6) color = "limegreen";
  else if (score >= 4) color = "gold";
  else if (score >= 2) color = "crimson";
  else color = "darkred";

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div style={{ fontFamily: "arial", marginBottom: "0.25rem", fontWeight: "bold" }}>
        {label}: {score}/10
      </div>
      <div style={{
        background: "#333",
        borderRadius: "6px",
        overflow: "hidden",
        height: "20px",
        width: "100%",
      }}>
        <div style={{
          background: color,
          width: `${(score / 10) * 100}%`,
          height: "100%",
          transition: "width 0.5s ease"
        }} />
      </div>
    </div>
  );
}

export default ScoreBar;
