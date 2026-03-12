import { useState, useCallback } from "react";
import { getRecommendations } from "../../services/mood";

// ── Helpers ──────────────────────────────────────────────────────────────────

function getEmotion(valence, arousal) {
  if (valence == null || arousal == null) return "Unknown";
  if (valence >= 0 && arousal >= 0) return "Happy";
  if (valence < 0 && arousal >= 0) return "Angry";
  if (valence < 0 && arousal < 0) return "Sad";
  return "Calm";
}

const EMOTION_COLORS = {
  Happy: { bg: "rgba(74, 194, 120, 0.1)", text: "rgba(74, 194, 120, 0.85)" },
  Angry: { bg: "rgba(248, 113, 113, 0.1)", text: "rgba(248, 113, 113, 0.85)" },
  Sad: { bg: "rgba(148, 130, 200, 0.1)", text: "rgba(148, 130, 200, 0.85)" },
  Calm: { bg: "rgba(74, 143, 194, 0.1)", text: "rgba(74, 143, 194, 0.85)" },
  Unknown: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.3)" },
};

function ScoreBar({ label, value }) {
  const pct = value != null ? Math.round(((value + 1) / 2) * 100) : 50;
  return (
    <div className="mh-bar-row">
      <span className="mh-bar-label">{label}</span>
      <div className="mh-bar-track">
        <div className="mh-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="mh-bar-value">
        {value != null ? value.toFixed(2) : "—"}
      </span>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="mh-card mh-card--skeleton" aria-hidden="true">
      <div className="mh-skeleton mh-skeleton--header" />
      <div className="mh-skeleton mh-skeleton--text" />
      <div className="mh-skeleton mh-skeleton--bars" />
    </div>
  );
}

function SpotifyIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

export default function MoodHistory({
  sessions = [],
  loading = false,
  error = null,
  page = 0,
  totalPages = 0,
  onPageChange,
}) {
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [recsMap, setRecsMap] = useState({});
  const [loadingRecs, setLoadingRecs] = useState(new Set());

  const toggleExpand = useCallback(
    async (sessionId) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(sessionId)) {
          next.delete(sessionId);
        } else {
          next.add(sessionId);
        }
        return next;
      });

      // Fetch recommendations on first expand only
      if (!recsMap[sessionId]) {
        setLoadingRecs((prev) => new Set(prev).add(sessionId));
        try {
          const recs = await getRecommendations(sessionId);
          setRecsMap((prev) => ({ ...prev, [sessionId]: recs ?? [] }));
        } catch {
          setRecsMap((prev) => ({ ...prev, [sessionId]: [] }));
        } finally {
          setLoadingRecs((prev) => {
            const next = new Set(prev);
            next.delete(sessionId);
            return next;
          });
        }
      }
    },
    [recsMap],
  );

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mh-list">
        {[...Array(4)].map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mh-empty">
        <p className="mh-empty-icon">⚠</p>
        <p className="mh-empty-title">{error}</p>
        <p className="mh-empty-sub">Please try refreshing the page.</p>
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────

  if (sessions.length === 0) {
    return (
      <div className="mh-empty">
        <p className="mh-empty-icon">◎</p>
        <p className="mh-empty-title">No sessions yet</p>
        <p className="mh-empty-sub">
          Head back to the home page, describe how you&rsquo;re feeling, and
          your first mood session will appear here.
        </p>
      </div>
    );
  }

  // ── Session list ───────────────────────────────────────────────────────────

  return (
    <>
      <div className="mh-list">
        {sessions.map((s) => {
          const emotion = getEmotion(s.valence, s.arousal);
          const goalEmotion = getEmotion(s.goalValence, s.goalArousal);
          const colors = EMOTION_COLORS[emotion] ?? EMOTION_COLORS.Unknown;
          const date = s.createdAt
            ? new Date(s.createdAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })
            : "—";
          const time = s.createdAt
            ? new Date(s.createdAt).toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";

          const isExpanded = expandedIds.has(s.sessionId);
          const recs = recsMap[s.sessionId];
          const isLoadingRecs = loadingRecs.has(s.sessionId);

          return (
            <div
              key={s.sessionId}
              className={`mh-card${isExpanded ? " mh-card--expanded" : ""}`}
            >
              {/* ── Card header ── */}
              <div className="mh-card-header">
                <div className="mh-card-meta">
                  <span className="mh-card-date">{date}</span>
                  {time && <span className="mh-card-time">{time}</span>}
                </div>
                <span
                  className="mh-emotion-pill"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {emotion}
                </span>
              </div>

              {/* ── Raw text excerpt ── */}
              {s.rawText && (
                <p className="mh-card-text">
                  &ldquo;
                  {s.rawText.length > 120
                    ? s.rawText.slice(0, 120) + "…"
                    : s.rawText}
                  &rdquo;
                </p>
              )}

              {/* ── VA score bars ── */}
              <div className="mh-scores">
                <div className="mh-scores-col">
                  <p className="mh-scores-heading">Current</p>
                  <ScoreBar label="Valence" value={s.valence} />
                  <ScoreBar label="Arousal" value={s.arousal} />
                </div>
                <div className="mh-scores-divider" />
                <div className="mh-scores-col">
                  <p className="mh-scores-heading">
                    Goal &mdash;{" "}
                    <span style={{ color: EMOTION_COLORS[goalEmotion]?.text }}>
                      {goalEmotion}
                    </span>
                  </p>
                  <ScoreBar label="Valence" value={s.goalValence} />
                  <ScoreBar label="Arousal" value={s.goalArousal} />
                </div>
              </div>

              {/* ── Expand toggle ── */}
              <button
                className="mh-expand-btn"
                onClick={() => toggleExpand(s.sessionId)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? "Hide tracks" : "View tracks"}
                <span
                  className={`mh-expand-arrow${isExpanded ? " mh-expand-arrow--up" : ""}`}
                >
                  ▾
                </span>
              </button>

              {/* ── Recommendations drawer ── */}
              {isExpanded && (
                <div className="mh-tracks">
                  {isLoadingRecs && (
                    <div className="mh-tracks-loading">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="mh-skeleton mh-skeleton--track"
                        />
                      ))}
                    </div>
                  )}

                  {!isLoadingRecs && recs && recs.length === 0 && (
                    <p className="mh-tracks-empty">
                      No recommendations for this session.
                    </p>
                  )}

                  {!isLoadingRecs && recs && recs.length > 0 && (
                    <ol className="mh-track-list">
                      {recs.map((track, idx) => (
                        <li
                          key={track.spotifyTrackId ?? idx}
                          className="mh-track-row"
                        >
                          <span className="mh-track-num">{idx + 1}</span>
                          <div className="mh-track-info">
                            <span className="mh-track-name">
                              {track.trackName}
                            </span>
                            <span className="mh-track-artist">
                              {track.artist}
                            </span>
                          </div>
                          <a
                            href={`https://open.spotify.com/track/${track.spotifyTrackId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mh-track-link"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`Open ${track.trackName} on Spotify`}
                          >
                            <SpotifyIcon />
                          </a>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="mh-pagination">
          <button
            className="mh-page-btn"
            disabled={page === 0}
            onClick={() => onPageChange?.(page - 1)}
            aria-label="Previous page"
          >
            ←
          </button>
          <span className="mh-page-info">
            {page + 1}
            <span className="mh-page-sep"> / </span>
            {totalPages}
          </span>
          <button
            className="mh-page-btn"
            disabled={page >= totalPages - 1}
            onClick={() => onPageChange?.(page + 1)}
            aria-label="Next page"
          >
            →
          </button>
        </div>
      )}
    </>
  );
}
