import api from "./api";

export const getChatQuestions = async () => {
  const res = await api.get("/api/mood/chat/questions");
  return res.data;
};

export const analyzeMood = async (message) => {
  const res = await api.post("/api/mood/analyze", { message });
  return res.data; // { valence, arousal, emotion, matchedWords }
};

export const createMoodSession = async ({
  userId,
  feelingMessage,
  triggerMessage,
  goalMessage,
}) => {
  const res = await api.post("/api/mood/session", {
    userId,
    feelingMessage,
    triggerMessage,
    goalMessage,
  });
  return res.data; // { sessionId }
};

export const getMoodSessions = async (userId, page = 0, size = 10) => {
  const res = await api.get("/api/mood/sessions", {
    params: { userId, page, size },
  });
  return res.data; // Page<MoodSessionHistoryResponse>
};
