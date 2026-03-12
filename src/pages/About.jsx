import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";

const FALLBACK_PLAYLIST_ID = "0P7UZefx9FG6U9nGTeOTMc";

function SpotifyIcon() {
  return (
    <svg
      className="about-player-logo"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.516 17.308a.75.75 0 01-1.032.25c-2.824-1.727-6.38-2.118-10.566-1.16a.75.75 0 01-.336-1.461c4.583-1.05 8.514-.598 11.685 1.34a.75.75 0 01.25 1.031zm1.472-3.276a.937.937 0 01-1.288.308c-3.232-1.987-8.158-2.563-11.977-1.403a.938.938 0 01-.543-1.794c4.364-1.323 9.788-.682 13.5 1.602a.938.938 0 01.308 1.287zm.126-3.41c-3.876-2.302-10.274-2.514-13.974-1.39a1.124 1.124 0 01-.651-2.151c4.248-1.287 11.302-1.039 15.76 1.608a1.125 1.125 0 01-1.135 1.934z" />
    </svg>
  );
}

const STACK = [
  "Java 21",
  "Spring Boot",
  "Spring Security 6",
  "JWT",
  "PostgreSQL",
  "React 18",
  "Vite",
  "Chart.js",
  "Spotify API",
  "NRC-VAD Lexicon",
];

export default function About() {
  const navigate = useNavigate();
  const [playlistId, setPlaylistId] = useState(FALLBACK_PLAYLIST_ID);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spotify/featured-playlist`)
      .then((r) => r.json())
      .then((d) => {
        if (d.playlistId) setPlaylistId(d.playlistId);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="about-root">
      <button className="about-back" onClick={() => navigate(-1)}>
        ← back
      </button>

      <main className="about-main">
        {/* ── Identity block ── */}
        <div className="about-identity">
          <div className="about-avatar">∿</div>
          <div className="about-identity-text">
            <h1 className="about-name">Psychosomatic Poet</h1>
            <p className="about-role">Senior Full Stack Engineer</p>
            <p className="about-alias">
              3+ years in fintech &amp; enterprise product
            </p>
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="about-rule" />

        {/* ── Bio ── */}
        <p className="about-bio">
          3+ years building production-grade systems for financial services and
          enterprise product teams. I write code the way I write verse &mdash;
          deliberate, layered, with nothing wasted.
        </p>
        <p className="about-bio">
          Valence is a portfolio project that maps emotion onto music using
          lexicon-based NLP and Russell&rsquo;s Circumplex Model. Your mood is a
          coordinate. The path out is a playlist.
        </p>

        {/* ── Stack ── */}
        <div className="about-section">
          <p className="about-section-label">built with</p>
          <div className="about-tags">
            {STACK.map((t) => (
              <span key={t} className="about-tag">
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Links ── */}
        <div className="about-section">
          <p className="about-section-label">find me</p>
          <div className="about-links">
            <a
              href="https://github.com/aadilfayas"
              className="about-link"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <span className="about-link-sep" />
            <a
              href="https://linkedin.com/in/aadilf"
              className="about-link"
              target="_blank"
              rel="noreferrer"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* ── Spotify player ── */}
        <div className="about-player">
          <div className="about-player-header">
            <span className="about-player-dot" />
            <span className="about-player-label">currently listening</span>
            <SpotifyIcon />
          </div>
          <div className="about-player-frame">
            <iframe
              title="Spotify playlist"
              src={`https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`}
              width="100%"
              height="380"
              frameBorder="0"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </div>

        {/* ── Easter-egg acknowledgement ── */}
        <div className="about-egg">
          <span className="about-egg-label">easter egg unlocked</span>
          <p className="about-egg-hint">
            Val<em>e</em>nce &thinsp;&times;3
          </p>
        </div>
      </main>
    </div>
  );
}
