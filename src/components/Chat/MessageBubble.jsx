import { useState, useEffect } from "react";

export default function MessageBubble({ role, text }) {
  const isAgent = role !== "user";
  const [displayed, setDisplayed] = useState(isAgent ? "" : text);

  useEffect(() => {
    if (!isAgent) {
      setDisplayed(text);
      return;
    }
    setDisplayed("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(interval);
    }, 18);
    return () => clearInterval(interval);
  }, [text, isAgent]);

  return (
    <div className={`message-bubble ${isAgent ? "agent" : "user"}`}>
      <p>{displayed}</p>
    </div>
  );
}
