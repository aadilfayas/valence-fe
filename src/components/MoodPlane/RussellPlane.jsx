import { useMemo, useRef, useState, useEffect } from "react";
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Scatter } from "react-chartjs-2";

ChartJS.register(LinearScale, PointElement, LineElement, Tooltip, Legend);

// Custom plugin: draws crosshair axes + quadrant labels on the canvas
const quadrantPlugin = {
  id: "quadrantLabels",
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    if (!chartArea) return;

    const cx = scales.x.getPixelForValue(0);
    const cy = scales.y.getPixelForValue(0);

    ctx.save();

    // Centre crosshair
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.lineWidth = 1;
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(chartArea.left, cy);
    ctx.lineTo(chartArea.right, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx, chartArea.top);
    ctx.lineTo(cx, chartArea.bottom);
    ctx.stroke();

    // Quadrant labels
    ctx.font = "600 10px system-ui, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.20)";
    ctx.textAlign = "center";

    const pad = 14;
    ctx.fillText("HAPPY", (cx + chartArea.right) / 2, chartArea.top + pad);
    ctx.fillText("ANGRY", (chartArea.left + cx) / 2, chartArea.top + pad);
    ctx.fillText("SAD", (chartArea.left + cx) / 2, chartArea.bottom - pad + 4);
    ctx.fillText(
      "CALM",
      (cx + chartArea.right) / 2,
      chartArea.bottom - pad + 4,
    );

    ctx.restore();
  },
};

// Compute 5 evenly-spaced waypoints between two VA points
function interpolatePath(from, to, steps = 5) {
  return Array.from({ length: steps }, (_, i) => ({
    x: from.valence + (i / (steps - 1)) * (to.valence - from.valence),
    y: from.arousal + (i / (steps - 1)) * (to.arousal - from.arousal),
  }));
}

const TWEEN_DURATION = 700; // ms

export default function RussellPlane({
  currentMood,
  goalMood,
  recommendations,
  activeSongIndex,
}) {
  const hasMood = currentMood && goalMood;

  // rAF-driven animation: tracks the current rendered position of the blue dot
  const rafRef = useRef(null);
  const fromPosRef = useRef(null); // position at start of latest tween
  const [animatedDot, setAnimatedDot] = useState(null);

  useEffect(() => {
    // Reset animation when activeSongIndex is cleared
    if (activeSongIndex == null || !recommendations?.length) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      setAnimatedDot(null);
      fromPosRef.current = null;
      return;
    }

    const rec = recommendations[activeSongIndex];
    if (!rec) return;

    // Target is the song's position on the plane (energy proxies arousal)
    const target = { x: rec.valence, y: rec.energy };

    // Start from wherever the dot currently sits; fall back to initial mood
    const from =
      fromPosRef.current ??
      (currentMood
        ? { x: currentMood.valence, y: currentMood.arousal }
        : target);

    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    const startTime = performance.now();

    function animate(now) {
      const t = Math.min((now - startTime) / TWEEN_DURATION, 1);
      // Ease-in-out cubic
      const ease = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      const pos = {
        x: from.x + (target.x - from.x) * ease,
        y: from.y + (target.y - from.y) * ease,
      };

      fromPosRef.current = pos;
      setAnimatedDot({ ...pos });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    }

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // currentMood intentionally omitted — we don't want to restart tween on mood set
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSongIndex, recommendations]);

  const data = useMemo(() => {
    if (!hasMood) return { datasets: [] };

    const path = interpolatePath(currentMood, goalMood);
    const dotPos = animatedDot ?? {
      x: currentMood.valence,
      y: currentMood.arousal,
    };

    return {
      datasets: [
        {
          label: "Path",
          data: path,
          showLine: true,
          borderColor: "rgba(255,255,255,0.18)",
          borderWidth: 1.5,
          borderDash: [5, 4],
          backgroundColor: "rgba(255,255,255,0.22)",
          pointRadius: 2.5,
          pointHoverRadius: 4,
          order: 3,
        },
        {
          label: "Current Mood",
          data: [dotPos],
          backgroundColor: "#4a8fc2",
          borderColor: "rgba(74,143,194,0.4)",
          borderWidth: 2,
          pointRadius: 9,
          pointHoverRadius: 11,
          order: 1,
        },
        {
          label: "Goal",
          data: [{ x: goalMood.valence, y: goalMood.arousal }],
          backgroundColor: "#4ade80",
          borderColor: "rgba(74,222,128,0.4)",
          borderWidth: 2,
          pointRadius: 9,
          pointHoverRadius: 11,
          order: 2,
        },
      ],
    };
    // animatedDot drives the blue dot position at ~60fps during a tween
  }, [currentMood, goalMood, hasMood, animatedDot]);

  // Disable Chart.js internal animation — we drive all movement via rAF
  const options = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 1,
      animation: false,
      scales: {
        x: {
          min: -1,
          max: 1,
          title: {
            display: true,
            text: "Valence →",
            color: "rgba(255,255,255,0.35)",
            font: { size: 11 },
          },
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(255,255,255,0.28)",
            font: { size: 10 },
            maxTicksLimit: 5,
          },
          border: { color: "rgba(255,255,255,0.08)" },
        },
        y: {
          min: -1,
          max: 1,
          title: {
            display: true,
            text: "Arousal →",
            color: "rgba(255,255,255,0.35)",
            font: { size: 11 },
          },
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(255,255,255,0.28)",
            font: { size: 10 },
            maxTicksLimit: 5,
          },
          border: { color: "rgba(255,255,255,0.08)" },
        },
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label(ctx) {
              const { label } = ctx.dataset;
              const { x, y } = ctx.parsed;
              return `${label}  V: ${x.toFixed(2)}  A: ${y.toFixed(2)}`;
            },
          },
          backgroundColor: "rgba(4,6,12,0.88)",
          borderColor: "rgba(255,255,255,0.06)",
          borderWidth: 1,
          titleColor: "rgba(255,255,255,0.6)",
          bodyColor: "rgba(255,255,255,0.45)",
          padding: 10,
        },
      },
    }),
    [],
  );

  if (!hasMood) {
    return (
      <div className="russell-plane russell-plane--empty">
        <Scatter
          data={{ datasets: [] }}
          options={options}
          plugins={[quadrantPlugin]}
        />
        <p className="russell-plane-hint">
          Complete the chat to see your mood plotted here.
        </p>
      </div>
    );
  }

  return (
    <div className="russell-plane">
      <Scatter data={data} options={options} plugins={[quadrantPlugin]} />
    </div>
  );
}
