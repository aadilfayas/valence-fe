// valence and energy may arrive as 0-1 (Spotify native) or -1 to 1 (backend-normalized).
// We clamp to a 0-100% bar by treating any value <= 1 as-is, or normalizing [-1,1] → [0,1].
function toBarPct(val) {
  if (val == null) return 0;
  // If value is clearly in 0-1 range use directly, else normalize from -1..1
  const normalized = val < 0 ? (val + 1) / 2 : Math.min(val, 1);
  return Math.max(0, Math.min(1, normalized)) * 100;
}

export default function SongCard({ track, active, stepNumber, onClick }) {
  const embedUrl = `https://open.spotify.com/embed/track/${track.spotifyTrackId}?utm_source=generator&theme=0`;
  const openUrl = `https://open.spotify.com/track/${track.spotifyTrackId}`;

  return (
    <div
      className={`song-card${active ? " song-card--active" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-pressed={active}
    >
      <div className="song-card-header">
        <span className="song-card-step">{stepNumber}</span>
        {active && <span className="song-card-playing">Now Playing</span>}
      </div>

      <iframe
        src={embedUrl}
        title={`${track.trackName} by ${track.artist}`}
        className="song-card-embed"
        height="80"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
      />

      <div className="song-card-meta">
        <p className="song-card-title">{track.trackName}</p>
        <p className="song-card-artist">
          {track.artist?.split(";").join(", ")}
        </p>
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="song-card-link"
          onClick={(e) => e.stopPropagation()}
        >
          Open in Spotify ↗
        </a>
      </div>

      <div className="song-card-bars">
        <div className="song-card-bar-row">
          <span className="song-card-bar-label">Valence</span>
          <div
            className="song-card-bar"
            aria-label={`Valence ${track.valence?.toFixed(2)}`}
          >
            <div
              className="song-card-bar-fill song-card-bar-fill--valence"
              style={{ width: `${toBarPct(track.valence)}%` }}
            />
          </div>
          <span className="song-card-bar-value">
            {track.valence?.toFixed(2)}
          </span>
        </div>
        <div className="song-card-bar-row">
          <span className="song-card-bar-label">Energy</span>
          <div
            className="song-card-bar"
            aria-label={`Energy ${track.energy?.toFixed(2)}`}
          >
            <div
              className="song-card-bar-fill song-card-bar-fill--energy"
              style={{ width: `${toBarPct(track.energy)}%` }}
            />
          </div>
          <span className="song-card-bar-value">
            {track.energy?.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
