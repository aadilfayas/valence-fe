import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MoodHistory from "../components/Dashboard/MoodHistory";
import { getMoodSessions } from "../services/mood";
import "./Dashboard.css";

// ── Particle-drift canvas ────────────────────────────────────────────────────
// Tiny dots float slowly upward — data-like, distinct from sonar / soundwave.
function ParticleCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const particlesRef = useRef([]);

  useEffect(() => {
    function makeParticle(w, h, fromBottom = false) {
      return {
        x: Math.random() * w,
        y: fromBottom ? h + Math.random() * 40 : Math.random() * h,
        r: 0.6 + Math.random() * 1.1,
        speed: 0.12 + Math.random() * 0.22,
        alpha: 0.04 + Math.random() * 0.14,
      };
    }

    function draw() {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");

      const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        particlesRef.current = Array.from({ length: 90 }, () =>
          makeParticle(w, h),
        );
      }

      ctx.clearRect(0, 0, w, h);

      for (const p of particlesRef.current) {
        p.y -= p.speed;
        if (p.y < -4) {
          Object.assign(p, makeParticle(w, h, true));
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(74, 143, 194, ${p.alpha})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return <canvas ref={canvasRef} className="dashboard-canvas" />;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    getMoodSessions(user.id, page, 8)
      .then((data) => {
        setSessions(data?.content ?? []);
        setTotalPages(data?.totalPages ?? 0);
        setTotalElements(data?.totalElements ?? 0);
      })
      .catch((err) => {
        if (err.response?.status !== 401) {
          setError("Could not load sessions.");
        }
      })
      .finally(() => setLoading(false));
  }, [user, page]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-root">
      <ParticleCanvas />

      {/* ── Sticky header ── */}
      <header className="dashboard-header">
        <p className="dashboard-wordmark">
          Val<span>e</span>nce
        </p>
        <nav className="dashboard-nav">
          <Link to="/" className="dashboard-nav-link">
            Home
          </Link>
          <span className="dashboard-nav-divider" />
          <span className="dashboard-nav-user">
            {user?.displayName || user?.email}
          </span>
          <button className="dashboard-logout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </nav>
      </header>

      {/* ── Main ── */}
      <main className="dashboard-main">
        <div className="dashboard-hero">
          <p className="dashboard-hero-label">Your journey so far.</p>
          <h1 className="dashboard-hero-title">Mood History</h1>
          <p className="dashboard-hero-sub">
            Every session you&rsquo;ve had with Valence &mdash; your starting
            state, your goal, and the songs that bridged them.
          </p>
          {!loading && !error && totalElements > 0 && (
            <p className="dashboard-session-count">
              {totalElements} session{totalElements !== 1 ? "s" : ""}
            </p>
          )}
        </div>

        <section className="dashboard-section">
          <MoodHistory
            sessions={sessions}
            loading={loading}
            error={error}
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </section>
      </main>
    </div>
  );
}
