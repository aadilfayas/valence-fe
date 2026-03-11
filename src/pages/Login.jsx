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

    // Resize to fill parent
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

    for (let i = 0; i < barCount; i++) {
      const x = (i + 0.5) * gap;

      // Primary slow wave + fast ripple + small noise layer
      const phase = (i / barCount) * Math.PI * 2;
      const primary = Math.sin(phase * 3 - now * 1.6) * 0.55;
      const ripple = Math.sin(phase * 7 - now * 2.8) * 0.25;
      const noise = Math.sin(phase * 13 + now * 0.9) * 0.1;
      const amplitude = (primary + ripple + noise + 1) / 2; // 0–1

      const maxBarH = h * 0.38;
      const minBarH = h * 0.015;
      const barH = minBarH + amplitude * (maxBarH - minBarH);

      // Distance from center for opacity falloff
      const distRatio = Math.abs(x - cx) / cx;
      const alpha = 0.75 - distRatio * 0.5;

      // Gradient: violet at tip → transparent base
      const grad = ctx.createLinearGradient(x, cy - barH, x, cy + barH);
      grad.addColorStop(0, `rgba(167, 139, 250, ${alpha})`);
      grad.addColorStop(0.45, `rgba(139, 92, 246, ${alpha * 0.6})`);
      grad.addColorStop(0.5, `rgba(109, 40, 217, ${alpha * 0.15})`);
      grad.addColorStop(0.55, `rgba(139, 92, 246, ${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(167, 139, 250, ${alpha})`);

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
