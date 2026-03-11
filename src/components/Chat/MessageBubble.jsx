export default function MessageBubble({ message, isUser }) {
  return (
    <div className={`message-bubble ${isUser ? "user" : "agent"}`}>
      <p>{message.text}</p>
    </div>
  );
}
