export default function MessageBubble({ role, text }) {
  return (
    <div className={`message-bubble ${role === "user" ? "user" : "agent"}`}>
      <p>{text}</p>
    </div>
  );
}
