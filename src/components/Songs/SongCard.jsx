export default function SongCard({ track }) {
  return (
    <div className="song-card">
      <p>
        <strong>{track?.trackName}</strong> — {track?.artist}
      </p>
    </div>
  );
}
