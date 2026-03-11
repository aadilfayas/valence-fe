// Derive an emotion label from valence + arousal scores (Russell quadrant)
function getEmotion(valence, arousal) {
  if (valence == null || arousal == null) return "Unknown";
  if (valence >= 0 && arousal >= 0) return "Happy";
  if (valence < 0 && arousal >= 0) return "Angry";
  if (valence < 0 && arousal < 0) return "Sad";
  return "Calm";
}

// Map emotion to a subtle accent colour pill
const EMOTION_COLORS = {
  Happy: { bg: "rgba(74, 194, 120, 0.1)", text: "rgba(74, 194, 120, 0.85)" },
  Angry: { bg: "rgba(248, 113, 113, 0.1)", text: "rgba(248, 113, 113, 0.85)" },
  Sad: { bg: "rgba(148, 130, 200, 0.1)", text: "rgba(148, 130, 200, 0.85)" },
  Calm: { bg: "rgba(74, 143, 194, 0.1)", text: "rgba(74, 143, 194, 0.85)" },
  Unknown: { bg: "rgba(255,255,255,0.05)", text: "rgba(255,255,255,0.3)" },
};

function ScoreBar({ label, value }) {
  // value is expected in [-1, 1]; normalise to [0, 100]% for the bar
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

export default function MoodHistory({ sessions = [] }) {
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

  return (
    <div className="mh-list">
      {sessions.map((s) => {
        const emotion = getEmotion(s.valenceScore, s.arousalScore);
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

        return (
          <div key={s.id} className="mh-card">
            {/* Card header */}
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

            {/* Raw text excerpt */}
            {s.rawText && (
              <p className="mh-card-text">
                &ldquo;
                {s.rawText.length > 120
                  ? s.rawText.slice(0, 120) + "…"
                  : s.rawText}
                &rdquo;
              </p>
            )}

            {/* VA scores */}
            <div className="mh-scores">
              <div className="mh-scores-col">
                <p className="mh-scores-heading">Current</p>
                <ScoreBar label="Valence" value={s.valenceScore} />
                <ScoreBar label="Arousal" value={s.arousalScore} />
              </div>
              <div className="mh-scores-divider" />
              <div className="mh-scores-col">
                <p className="mh-scores-heading">
                  Goal &mdash;{" "}
                  <span style={{ color: EMOTION_COLORS[goalEmotion].text }}>
                    {goalEmotion}
                  </span>
                </p>
                <ScoreBar label="Valence" value={s.goalValence} />
                <ScoreBar label="Arousal" value={s.goalArousal} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
