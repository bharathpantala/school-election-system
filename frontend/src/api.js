const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

async function request(path, options = {}, token) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorData.detail || "Request failed");
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  appInfo: () => request("/"),
  signup: (data) => request("/auth/signup", { method: "POST", body: JSON.stringify(data) }),
  login: (data) => request("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  me: (token) => request("/auth/me", {}, token),

  electionTypes: () => request("/election-types"),
  listElections: (token) => request("/elections", {}, token),
  createElection: (data, token) =>
    request("/elections", { method: "POST", body: JSON.stringify(data) }, token),
  updateElection: (id, data, token) =>
    request(`/elections/${id}`, { method: "PUT", body: JSON.stringify(data) }, token),

  listCandidates: (electionId, token) => request(`/elections/${electionId}/candidates`, {}, token),
  addCandidate: (electionId, data, token) =>
    request(`/elections/${electionId}/candidates`, { method: "POST", body: JSON.stringify(data) }, token),
  castVote: (electionId, candidateId, token) =>
    request(
      `/elections/${electionId}/vote`,
      { method: "POST", body: JSON.stringify({ candidate_id: candidateId }) },
      token
    ),
  electionResults: (electionId, token) => request(`/elections/${electionId}/results`, {}, token),
};
