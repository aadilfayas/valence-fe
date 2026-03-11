import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { register as registerRequest } from "../services/auth";
import "./Register.css";

// ── Radial oscilloscope canvas ───────────────────────────────────────────────
// Bars radiate outward from a central ring — like tuning into a frequency
function RadialWaveCanvas() {
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

    // Breathing envelope: ~5s cycle, deep silence at trough
    const breathe = Math.pow(Math.sin(now * Math.PI / 2.5) * 0.5 + 0.5, 2.5);
    const envelope = 0.03 + breathe * 0.52;

    const barCount = 160;
    const baseR = Math.min(w, h) * 0.13;
    const maxBarH = Math.min(w, h) * 0.21;
    const minBarH = Math.min(w, h) * 0.008;

    ctx.lineCap = "round";

    for (let i = 0; i < barCount; i++) {
      // Start at the top (-π/2) and go clockwise
      const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
      const phase = (i / barCount) * Math.PI * 2;

      const primary = Math.sin(phase * 4 - now * 1.3) * 0.50;
      const ripple  = Math.sin(phase * 9 - now * 2.5) * 0.28;
      const micro   = Math.sin(phase * 17 + now * 0.7) * 0.10;
      const amplitude = (primary + ripple + micro + 1) / 2;

      const barH = minBarH + amplitude * (maxBarH - minBarH);

      const x1 = cx + Math.cos(angle) * baseR;
      const y1 = cy + Math.sin(angle) * baseR;
      const x2 = cx + Math.cos(angle) * (baseR + barH);
      const y2 = cy + Math.sin(angle) * (baseR + barH);

      // Slow positional shimmer around the ring
      const shimmer = 0.5 + 0.5 * Math.cos(phase * 2 - now * 0.4);
      const alpha = envelope * (0.35 + shimmer * 0.55);

      const grad = ctx.createLinearGradient(x1, y1, x2, y2);
      grad.addColorStop(0,   `rgba(38, 80, 122,  ${alpha * 0.35})`);
      grad.addColorStop(0.5, `rgba(60, 115, 170, ${alpha})`);
      grad.addColorStop(1,   `rgba(110, 170, 215,${alpha * 0.65})`);

      ctx.lineWidth = 1.8;
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // Faint base ring
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(60, 110, 160, ${envelope * 0.12})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    rafRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="register-canvas" />;
}
// ─────────────────────────────────────────────────────────────────────────────

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await registerRequest(email, password, displayName);
      login(data.token, data.user);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-root">
      <RadialWaveCanvas />

      <div className="register-card">
        <p className="register-wordmark">
          Val<span>e</span>nce
        </p>
        <p className="register-tagline">Find your frequency</p>

        <h2>Create Account</h2>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <p className="register-error">{error}</p>}

          <div className="register-field">
            <label htmlFor="displayName">Display Name</label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="how the world knows you"
            />
          </div>

          <div className="register-field">
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

          <div className="register-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="register-submit" disabled={loading}>
            {loading ? "Creating account…" : "Register"}
          </button>
        </form>

        <p className="register-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
