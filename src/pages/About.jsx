import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./About.css";

const FALLBACK_PLAYLIST_ID = "0P7UZefx9FG6U9nGTeOTMc";

const ANIM_MODES = ["sonar", "particles", "waveform", "off"];
const ANIM_LABELS = {
  sonar: "Sonar",
  particles: "Particles",
  waveform: "Waveform",
  off: "Off",
};

// ── Sonar rings ──────────────────────────────────────────────────────────────
function SonarCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const ringsRef = useRef([]);
  const spawnRing = useCallback(() => {
    ringsRef.current.push({ born: performance.now() });
  }, []);

  useEffect(() => {
    spawnRing();
    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      ctx.clearRect(0, 0, w, h);
      const now = performance.now();
      const cx = w / 2,
        cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy) * 1.05;
      const breathe = Math.pow(
        Math.sin(((now / 1000) * Math.PI) / 2.5) * 0.5 + 0.5,
        2.5,
      );
      const envelope = 0.04 + breathe * 0.18;
      const speed = 62;
      ringsRef.current = ringsRef.current.filter(
        (r) => ((now - r.born) / 1000) * speed < maxR,
      );
      for (const ring of ringsRef.current) {
        const age = (now - ring.born) / 1000;
        const r = age * speed;
        const alpha = (1 - r / maxR) * envelope;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74,143,194,${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    const iv = setInterval(spawnRing, 3800);
    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(iv);
    };
  }, [spawnRing]);

  return <canvas ref={canvasRef} className="about-canvas" />;
}

// ── Floating particles ────────────────────────────────────────────────────────
function ParticlesCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0,
      h = 0;
    const COUNT = 80;
    const pts = [];

    function resize() {
      w = canvas.width = canvas.parentElement.offsetWidth;
      h = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < COUNT; i++) {
      pts.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.28,
        r: Math.random() * 1.4 + 0.4,
      });
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      for (const p of pts) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(74,143,194,0.45)";
        ctx.fill();
      }
      // connect nearby
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const dx = pts[i].x - pts[j].x,
            dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(pts[i].x, pts[i].y);
            ctx.lineTo(pts[j].x, pts[j].y);
            ctx.strokeStyle = `rgba(74,143,194,${0.12 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="about-canvas" />;
}

// ── Waveform ──────────────────────────────────────────────────────────────────
function WaveformCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let w = 0,
      h = 0;

    function resize() {
      w = canvas.width = canvas.parentElement.offsetWidth;
      h = canvas.height = canvas.parentElement.offsetHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const t = performance.now() / 1000;
      const WAVES = [
        { amp: 28, freq: 0.007, speed: 0.6, alpha: 0.12 },
        { amp: 18, freq: 0.012, speed: 1.1, alpha: 0.08 },
        { amp: 10, freq: 0.02, speed: 1.7, alpha: 0.05 },
      ];
      for (const wave of WAVES) {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y =
            h / 2 +
            wave.amp * Math.sin(x * wave.freq + t * wave.speed) +
            wave.amp *
              0.4 *
              Math.sin(x * wave.freq * 2.3 - t * wave.speed * 0.7);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = `rgba(74,143,194,${wave.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(draw);
    }
    rafRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="about-canvas" />;
}

function AnimBackground({ mode }) {
  if (mode === "sonar") return <SonarCanvas />;
  if (mode === "particles") return <ParticlesCanvas />;
  if (mode === "waveform") return <WaveformCanvas />;
  return null;
}

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
  const [animMode, setAnimMode] = useState("sonar");

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/spotify/featured-playlist`)
      .then((r) => r.json())
      .then((d) => {
        if (d.playlistId) setPlaylistId(d.playlistId);
      })
      .catch(() => {});
  }, []);

  const cycleAnim = () => {
    setAnimMode((prev) => {
      const idx = ANIM_MODES.indexOf(prev);
      return ANIM_MODES[(idx + 1) % ANIM_MODES.length];
    });
  };

  return (
    <div className="about-root">
      <AnimBackground mode={animMode} />

      {/* ── Top bar ── */}
      <div className="about-topbar">
        <button className="about-back" onClick={() => navigate(-1)}>
          ← back
        </button>
        <button className="about-anim-toggle" onClick={cycleAnim}>
          <span className="about-anim-toggle-dot" data-mode={animMode} />
          {ANIM_LABELS[animMode]}
        </button>
      </div>

      <main className="about-main">
        {/* ══ LEFT COLUMN ══ */}
        <div className="about-col about-col--left">
          {/* Identity */}
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

          <div className="about-rule" />

          {/* Bio */}
          <p className="about-bio">
            3+ years building production-grade systems for financial services
            and enterprise product teams. I write code the way I write verse
            &mdash; deliberate, layered, with nothing wasted.
          </p>
          <p className="about-bio">
            Valence is a portfolio project that maps emotion onto music using
            lexicon-based NLP and Russell&rsquo;s Circumplex Model. Your mood is
            a coordinate. The path out is a playlist.
          </p>

          <div className="about-rule" />

          {/* Stack */}
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

          {/* Links */}
          <div className="about-section">
            <p className="about-section-label">find me</p>
            <div className="about-links">
              <a
                href="https://github.com/aadilf"
                className="about-link"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
              <span className="about-link-sep" />
              <a
                href="https://linkedin.com/in/aadilfayas"
                className="about-link"
                target="_blank"
                rel="noreferrer"
              >
                LinkedIn
              </a>
            </div>
          </div>

          {/* Perzival shout-out */}
          <div className="about-perzival">
            <div className="about-perzival-inner">
              <span className="about-perzival-glyph">✦</span>
              <div className="about-perzival-text">
                <p className="about-perzival-name">Perzival</p>
                <p className="about-perzival-note">
                  College friend and teammate from the original Valence project.
                  He co-architected the early prototype and kept the coffee
                  flowing through many late-night debugging sessions — this
                  project carries a few of his fingerprints.
                </p>
              </div>
            </div>
          </div>

          {/* Easter egg */}
          <div className="about-egg">
            <span className="about-egg-label">easter egg unlocked</span>
            <p className="about-egg-hint">
              A quiet nod to Perzival — college friend and original teammate:
              Val<em>e</em>nce &thinsp;&times;3
            </p>
          </div>
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="about-col about-col--right">
          {/* Valence concept card */}
          <div className="about-concept-card">
            <p className="about-section-label">the idea</p>
            <h2 className="about-concept-heading">Mood is a coordinate.</h2>
            <p className="about-concept-body">
              Russell&rsquo;s Circumplex Model places every emotion on a 2D
              plane defined by <span className="about-accent">valence</span>{" "}
              (pleasant ↔ unpleasant) and{" "}
              <span className="about-accent">arousal</span> (activated ↔
              deactivated). Valence walks you from where you are to where you
              want to be &mdash; one song at a time.
            </p>
            <div className="about-va-grid">
              {[
                { q: "Q1", label: "Happy", hint: "+V +A", cls: "q1" },
                { q: "Q2", label: "Angry", hint: "−V +A", cls: "q2" },
                { q: "Q3", label: "Sad", hint: "−V −A", cls: "q3" },
                { q: "Q4", label: "Calm", hint: "+V −A", cls: "q4" },
              ].map(({ q, label, hint, cls }) => (
                <div key={q} className={`about-va-cell about-va-cell--${cls}`}>
                  <span className="about-va-q">{q}</span>
                  <span className="about-va-label">{label}</span>
                  <span className="about-va-hint">{hint}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Spotify player */}
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
                height="420"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
