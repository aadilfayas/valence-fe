import { useState, useRef, useEffect, useCallback } from "react";

// valence and energy may arrive as 0-1 (Spotify native) or -1 to 1 (backend-normalized).
function toBarPct(val) {
  if (val == null) return 0;
  const normalized = val < 0 ? (val + 1) / 2 : Math.min(val, 1);
  return Math.max(0, Math.min(1, normalized)) * 100;
}

function formatTime(sec) {
  if (!isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function SongCard({ track, active, stepNumber, onClick }) {
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);

  const openUrl = `https://open.spotify.com/track/${track.spotifyTrackId}`;
  const hasPreview = !!track.previewUrl;

  // Reset playback state whenever the displayed track changes
  useEffect(() => {
    setPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
  }, [track.spotifyTrackId]);

  const togglePlay = useCallback(
    (e) => {
      e.stopPropagation();
      if (!hasPreview) {
        window.open(openUrl, "_blank", "noopener,noreferrer");
        return;
      }
      const audio = audioRef.current;
      if (!audio) return;
      if (playing) audio.pause();
      else audio.play().catch(() => {});
    },
    [playing, hasPreview, openUrl],
  );

  const handleScrub = useCallback((e) => {
    e.stopPropagation();
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(
      0,
      Math.min(1, (e.clientX - rect.left) / rect.width),
    );
    audio.currentTime = ratio * audio.duration;
  }, []);

  return (
    <div
      className={`song-card${active ? " song-card--active" : ""}${playing ? " song-card--playing" : ""}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick?.()}
      aria-pressed={active}
    >
      {/* Hidden audio element — only mounted when a preview URL is available */}
      {hasPreview && (
        <audio
          ref={audioRef}
          src={track.previewUrl}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => {
            setPlaying(false);
            setProgress(0);
            setCurrentTime(0);
          }}
          onTimeUpdate={() => {
            const a = audioRef.current;
            if (!a) return;
            setCurrentTime(a.currentTime);
            setProgress(a.duration ? a.currentTime / a.duration : 0);
          }}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration ?? 0)}
        />
      )}

      {/* Header: step badge + animated Now Playing pill */}
      <div className="song-card-header">
        <span className="song-card-step">{stepNumber}</span>
        {playing && (
          <span className="song-card-playing">
            <span className="song-card-eq" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            Now Playing
          </span>
        )}
      </div>

      {/* Play / Pause + track info */}
      <div className="song-card-player">
        <button
          className={`song-card-play-btn${playing ? " song-card-play-btn--playing" : ""}`}
          onClick={togglePlay}
          aria-label={
            playing
              ? "Pause"
              : hasPreview
                ? "Play 30s preview"
                : "Open in Spotify"
          }
        >
          {playing ? (
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <rect x="6" y="4" width="4" height="16" rx="1.5" />
              <rect x="14" y="4" width="4" height="16" rx="1.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
              <path d="M8 5.14v13.72a1 1 0 0 0 1.5.86l10.5-6.86a1 1 0 0 0 0-1.72L9.5 4.28A1 1 0 0 0 8 5.14z" />
            </svg>
          )}
        </button>
        <div className="song-card-info">
          <p className="song-card-title">{track.trackName}</p>
          <p className="song-card-artist">
            {track.artist?.split(";").join(", ")}
          </p>
        </div>
      </div>

      {/* Scrubber — shown only when a preview URL is available */}
      {hasPreview ? (
        <div className="song-card-scrubber-row">
          <span className="song-card-time">{formatTime(currentTime)}</span>
          <div
            className="song-card-scrubber"
            onClick={handleScrub}
            role="slider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            aria-label="Seek"
          >
            <div
              className="song-card-scrubber-fill"
              style={{ width: `${progress * 100}%` }}
            />
            <div
              className="song-card-scrubber-thumb"
              style={{ left: `${progress * 100}%` }}
            />
          </div>
          <span className="song-card-time song-card-time--right">
            {formatTime(duration)}
          </span>
        </div>
      ) : (
        <p className="song-card-no-preview">
          30s preview unavailable &mdash;{" "}
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="song-card-link"
            onClick={(e) => e.stopPropagation()}
          >
            listen on Spotify ↗
          </a>
        </p>
      )}

      {/* Full track link, visible only alongside a working scrubber */}
      {hasPreview && (
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="song-card-link"
          onClick={(e) => e.stopPropagation()}
        >
          Open full track in Spotify ↗
        </a>
      )}

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
