export default function MoodHistory({ sessions = [] }) {
  return (
    <div className="mood-history">
      <h2>Mood History</h2>
      {sessions.length === 0 ? (
        <p>No sessions yet.</p>
      ) : (
        <ul>
          {sessions.map((s) => (
            <li key={s.id}>
              {new Date(s.createdAt).toLocaleDateString()} — {s.emotion}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
