import api from "./api";

export const login = async (email, password) => {
  const response = await api.post("/api/auth/login", { email, password });
  return response.data; // { token, user }
};

export const register = async (email, password, displayName) => {
  const response = await api.post("/api/auth/register", {
    email,
    password,
    displayName,
  });
  return response.data;
};
