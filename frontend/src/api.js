function getApiBase() {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/v1/`;
  }

  return "http://localhost:3000/api/v1/";
}

function joinApiUrl(base, path) {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const normalizedPath = path.startsWith("/") ? path.slice(1) : path;
  return new URL(normalizedPath, normalizedBase);
}

async function request(path, options = {}) {
  const { method = "GET", token, body, query } = options;
  const url = joinApiUrl(getApiBase(), path);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, value);
      }
    });
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(url.toString(), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const raw = await response.text();
  let data = null;

  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch (error) {
      data = { msg: raw };
    }
  }

  if (!response.ok) {
    const error = new Error(data?.msg || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

const api = {
  login: (body) => request("/auth/login", { method: "POST", body }),
  register: (body) => request("/auth/register", { method: "POST", body }),
  getPublicNotes: (query) => request("/notes", { query }),
  getMyNotes: (userId, token, query) => request(`/notes/profile/${userId}`, { token, query }),
  getNote: (noteId, token) => request(`/notes/note/${noteId}`, { token }),
  createNote: (body, token) => request("/notes/note", { method: "POST", body, token }),
  updateNote: (noteId, body, token) => request(`/notes/note/${noteId}`, { method: "PATCH", body, token }),
  deleteNote: (noteId, token) => request(`/notes/note/${noteId}`, { method: "DELETE", token }),
  getUser: (userId) => request(`/users/user/${userId}`),
};

export default api;
