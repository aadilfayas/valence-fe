import { useRef, useEffect, useCallback, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChatWindow from "../components/Chat/ChatWindow";
import "./Home.css";

// ── Sonar-ping canvas ────────────────────────────────────────────────────────
// Concentric rings expand from the centre, fading as they grow.
// Visually distinct from the auth-page animations (soundwave / radial).
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
      const nowSec = now / 1000;
      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.sqrt(cx * cx + cy * cy) * 1.05;

      // Breathing envelope — same 5-second cycle as the login soundwave
      const breathe = Math.pow(
        Math.sin((nowSec * Math.PI) / 2.5) * 0.5 + 0.5,
        2.5,
      );
      const envelope = 0.03 + breathe * 0.17;

      const speed = 62; // px per second (was 110)

      ringsRef.current = ringsRef.current.filter(
        (ring) => ((now - ring.born) / 1000) * speed < maxR,
      );

      for (const ring of ringsRef.current) {
        const age = (now - ring.born) / 1000;
        const r = age * speed;
        const alpha = (1 - r / maxR) * envelope;

        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(74, 143, 194, ${alpha})`;
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    const interval = setInterval(spawnRing, 3800);

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(interval);
    };
  }, [spawnRing]);

  return <canvas ref={canvasRef} className="home-canvas" />;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [_sessionId, setSessionId] = useState(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSessionCreated = (id) => {
    setSessionId(id);
  };

  return (
    <div className="home-root">
      <SonarCanvas />

      {/* ── Sticky header ── */}
      <header className="home-header">
        <p className="home-wordmark">
          Val<span>e</span>nce
        </p>
        <nav className="home-nav">
          <Link to="/dashboard" className="home-nav-link">
            History
          </Link>
          <span className="home-nav-divider" />
          <span className="home-nav-user">
            {user?.displayName || user?.email}
          </span>
          <button className="home-logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── Main content ── */}
      <main className="home-main">
        {/* Hero */}
        <div className="home-hero">
          <p className="home-hero-label">Your mood, mapped.</p>
          <h1 className="home-hero-title">
            What are you
            <br />
            feeling right now?
          </h1>
          <p className="home-hero-sub">
            Describe how you&rsquo;re feeling and Valence maps your emotion onto
            the mood plane, then guides you toward where you want to be &mdash;
            one song at a time.
          </p>
        </div>

        {/* Panel grid */}
        <div className="home-panels">
          {/* Left — chat */}
          <div className="home-panel home-panel--chat">
            <p className="home-panel-label">Mood Assistant</p>
            <ChatWindow onSessionCreated={handleSessionCreated} />
          </div>

          {/* Right — plane + songs stacked */}
          <div className="home-panel-stack">
            <div className="home-panel home-panel--plane">
              <p className="home-panel-label">Mood Plane</p>
              <p className="home-panel-empty">
                Russell&rsquo;s Circumplex renders here.
              </p>
            </div>
            <div className="home-panel home-panel--songs">
              <p className="home-panel-label">Recommendations</p>
              <p className="home-panel-empty">
                Your personalised path of songs appears here.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
