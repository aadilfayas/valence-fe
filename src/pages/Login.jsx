import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login as loginRequest } from "../services/auth";
import "./Login.css";

// ── Soundwave canvas animation ──────────────────────────────────────────────
function SoundwaveCanvas() {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const { offsetWidth: w, offsetHeight: h } = canvas.parentElement;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }

    ctx.clearRect(0, 0, w, h);

    const now = performance.now() / 1000;
    const cx = w / 2;
    const cy = h / 2;
    const barCount = 90;
    const barWidth = 3;
    const gap = w / barCount;

    // Breathing envelope: slow 5s cycle, nearly vanishes at trough
    const breathe = Math.pow(Math.sin(now * Math.PI / 2.5) * 0.5 + 0.5, 2.5);
    const envelope = 0.03 + breathe * 0.55;

    for (let i = 0; i < barCount; i++) {
      const x = (i + 0.5) * gap;
      const phase = (i / barCount) * Math.PI * 2;

      const primary = Math.sin(phase * 3 - now * 1.6) * 0.55;
      const ripple = Math.sin(phase * 7 - now * 2.8) * 0.25;
      const noise = Math.sin(phase * 13 + now * 0.9) * 0.1;
      const amplitude = (primary + ripple + noise + 1) / 2;

      const maxBarH = h * 0.38;
      const minBarH = h * 0.015;
      const barH = minBarH + amplitude * (maxBarH - minBarH);

      const distRatio = Math.abs(x - cx) / cx;
      const alpha = envelope * (0.85 - distRatio * 0.52);

      // Steel blue-grey darkwave gradient
      const grad = ctx.createLinearGradient(x, cy - barH, x, cy + barH);
      grad.addColorStop(0,    `rgba(74, 143, 194, ${alpha})`);
      grad.addColorStop(0.45, `rgba(38, 82, 128,  ${alpha * 0.55})`);
      grad.addColorStop(0.5,  `rgba(16, 40, 72,   ${alpha * 0.07})`);
      grad.addColorStop(0.55, `rgba(38, 82, 128,  ${alpha * 0.55})`);
      grad.addColorStop(1,    `rgba(74, 143, 194, ${alpha})`);

      ctx.fillStyle = grad;
      const rx = barWidth / 2;
      ctx.beginPath();
      ctx.roundRect(x - rx, cy - barH, barWidth, barH * 2, rx);
      ctx.fill();
    }

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="login-canvas" />;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await loginRequest(email, password);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <SoundwaveCanvas />

      <div className="login-card">
        <p className="login-wordmark">
          Val<span>e</span>nce
        </p>
        <h2>Sign In</h2>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <p className="login-error">{error}</p>}

          <div className="login-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
          </div>

          <div className="login-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          No account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
}
