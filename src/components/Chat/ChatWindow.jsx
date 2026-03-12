import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getChatQuestions,
  analyzeMood,
  createMoodSession,
} from "../../services/mood";
import MessageBubble from "./MessageBubble";

export default function ChatWindow({ onSessionCreated, onMoodAnalyzed }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [currentMood, setCurrentMood] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    const fallback = [
      "How are you feeling?",
      "What triggered it?",
      "What mood do you want to reach?",
    ];
    getChatQuestions()
      .then((qs) => {
        setQuestions(qs);
        setMessages([{ role: "bot", text: qs[0] }]);
      })
      .catch(() => {
        setQuestions(fallback);
        setMessages([{ role: "bot", text: fallback[0] }]);
      });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const answer = input.trim();
    setInput("");
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    // Append user message immediately
    setMessages((prev) => [...prev, { role: "user", text: answer }]);

    if (step < questions.length - 1) {
      const nextStep = step + 1;
      setStep(nextStep);

      // After the feeling message (step 0) — call analyzeMood to detect emotion
      if (step === 0) {
        setLoading(true);
        try {
          const analysis = await analyzeMood(answer);
          setCurrentMood(analysis);
          const emotionPhrase =
            `I sense ${analysis.emotion} energy in your words ` +
            `(Valence ${Number(analysis.valence).toFixed(2)}, ` +
            `Arousal ${Number(analysis.arousal).toFixed(2)}). ` +
            questions[nextStep];
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: emotionPhrase },
          ]);
        } catch {
          setMessages((prev) => [
            ...prev,
            { role: "bot", text: questions[nextStep] },
          ]);
        } finally {
          setLoading(false);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: questions[nextStep] },
        ]);
      }
    } else {
      // Final step — analyze goal message, then create session
      setLoading(true);
      setError(null);
      try {
        let goalMood = null;
        try {
          goalMood = await analyzeMood(answer);
        } catch {
          /* non-fatal — session still proceeds */
        }

        const sessionResponse = await createMoodSession({
          userId: user.id,
          feelingMessage: newAnswers[0],
          triggerMessage: newAnswers[1],
          goalMessage: newAnswers[2],
        });
        console.log("[Valence] createMoodSession response:", sessionResponse);
        const sessionId = sessionResponse?.sessionId;

        if (currentMood && goalMood) {
          onMoodAnalyzed?.({ currentMood, goalMood });
        }

        setMessages((prev) => [
          ...prev,
          {
            role: "bot",
            text: "Your mood has been mapped. Generating your path…",
          },
        ]);
        setDone(true);
        onSessionCreated?.(sessionId);
      } catch {
        setError("Something went wrong. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat-window">
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} text={msg.text} />
        ))}
        {loading && <MessageBubble role="bot" text="…" />}
        <div ref={bottomRef} />
      </div>
      {!done && (
        <div className="chat-input-row">
          <input
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your answer…"
            disabled={loading || questions.length === 0}
          />
          <button
            className="chat-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || loading || questions.length === 0}
          >
            Send
          </button>
        </div>
      )}
      {error && <p className="chat-error">{error}</p>}
    </div>
  );
}
