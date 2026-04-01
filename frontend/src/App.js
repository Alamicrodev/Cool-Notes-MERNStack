import { useEffect, useMemo, useState } from "react";
import api from "./api";
import "./App.css";

const MOODS = [
  "stressed",
  "fear",
  "calm",
  "cool",
  "nervous",
  "lovable",
  "mixed emotions",
  "romance",
  "normal",
  "passion",
  "relaxed",
  "very happy",
];

const VISIBILITIES = ["private", "public"];
const SESSION_KEY = "notethemood.session";

const EMPTY_AUTH = { name: "", email: "", password: "" };
const EMPTY_NOTE = { title: "", note: "", mood: "normal", visibility: "public" };
const EMPTY_FILTERS = { search: "", mood: "", sort: "-updatedAt", visibility: "private,public" };

function loadSession() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function saveSession(session) {
  if (typeof window === "undefined") {
    return;
  }

  if (session) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

function normalizeId(value) {
  return value?._id || value?.id || String(value || "");
}

function formatDate(value) {
  if (!value) {
    return "just now";
  }

  return new Date(value).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function excerpt(value, length = 140) {
  if (!value) {
    return "No note body yet.";
  }

  return value.length > length ? `${value.slice(0, length).trim()}...` : value;
}

function buildQuery(filters, includeVisibility = false) {
  const query = {};

  if (filters.search.trim()) {
    query.search = filters.search.trim();
  }

  if (filters.mood) {
    query.mood = filters.mood;
  }

  if (filters.sort) {
    query.sort = filters.sort;
  }

  if (includeVisibility && filters.visibility) {
    query.visibility = filters.visibility;
  }

  return query;
}

function App() {
  const [session, setSession] = useState(() => loadSession());
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState(EMPTY_AUTH);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [feed, setFeed] = useState("all");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [publicNotes, setPublicNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [publicLoading, setPublicLoading] = useState(false);
  const [myLoading, setMyLoading] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [ownerNames, setOwnerNames] = useState({});

  const [selectedNote, setSelectedNote] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("new");
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");

  const isMyFeed = feed === "mine";
  const activeNotes = isMyFeed ? myNotes : publicNotes;
  const notesLoading = isMyFeed ? myLoading : publicLoading;
  const selectedNoteId = useMemo(() => normalizeId(selectedNote), [selectedNote]);
  const selectedOwnerId = normalizeId(selectedNote?.user);
  const selectedOwner = selectedOwnerId
    ? selectedOwnerId === session?.userId
      ? "You"
      : ownerNames[selectedOwnerId] || "Loading..."
    : "Unknown";

  useEffect(() => {
    saveSession(session);
  }, [session]);

  useEffect(() => {
    if (!session && feed === "mine") {
      setFeed("all");
    }
  }, [feed, session]);

  useEffect(() => {
    if (feed !== "all") {
      return undefined;
    }

    let ignore = false;

    async function loadPublicNotes() {
      setPublicLoading(true);
      setNotesError("");

      try {
        const data = await api.getPublicNotes(buildQuery(filters));
        if (!ignore) {
          setPublicNotes(data.notes || []);
        }
      } catch (error) {
        if (!ignore) {
          setNotesError(error.message);
        }
      } finally {
        if (!ignore) {
          setPublicLoading(false);
        }
      }
    }

    loadPublicNotes();

    return () => {
      ignore = true;
    };
  }, [feed, filters]);

  useEffect(() => {
    if (!session?.token || !session?.userId || feed !== "mine") {
      setMyNotes([]);
      return undefined;
    }

    let ignore = false;

    async function loadMyNotes() {
      setMyLoading(true);
      setNotesError("");

      try {
        const data = await api.getMyNotes(session.userId, session.token, buildQuery(filters, true));
        if (!ignore) {
          setMyNotes(data.notes || []);
        }
      } catch (error) {
        if (!ignore) {
          setNotesError(error.message);
        }
      } finally {
        if (!ignore) {
          setMyLoading(false);
        }
      }
    }

    loadMyNotes();

    return () => {
      ignore = true;
    };
  }, [feed, session?.token, session?.userId, filters]);

  useEffect(() => {
    const idsToLoad = [...new Set(activeNotes.map((note) => normalizeId(note.user)).filter(Boolean))].filter(
      (userId) => !ownerNames[userId]
    );

    if (!idsToLoad.length) {
      return undefined;
    }

    let ignore = false;

    async function loadOwners() {
      const updates = {};

      await Promise.all(
        idsToLoad.map(async (userId) => {
          try {
            const data = await api.getUser(userId);
            updates[userId] = data?.user?.name || "Unknown";
          } catch (error) {
            updates[userId] = "Unknown";
          }
        })
      );

      if (!ignore) {
        setOwnerNames((current) => ({ ...current, ...updates }));
      }
    }

    loadOwners();

    return () => {
      ignore = true;
    };
  }, [activeNotes, ownerNames]);

  function logout() {
    setSession(null);
    setFeed("all");
    setSelectedNote(null);
    setComposerOpen(false);
    setEditorMode("new");
    setNoteForm(EMPTY_NOTE);
    setNoteMessage("");
    setAuthForm(EMPTY_AUTH);
  }

  async function submitAuth(event) {
    event.preventDefault();
    setAuthLoading(true);
    setAuthError("");

    try {
      const payload =
        authMode === "register"
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const data = authMode === "register" ? await api.register(payload) : await api.login(payload);
      const profile = await api.getUser(data.userId);

      setSession({
        token: data.token,
        userId: data.userId,
        name: profile?.user?.name || authForm.name || "Member",
      });
      setFeed("all");
      setAuthForm(EMPTY_AUTH);
      setSelectedNote(null);
      setComposerOpen(false);
      setEditorMode("new");
      setNoteForm(EMPTY_NOTE);
      setNoteMessage("");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthLoading(false);
    }
  }

  function updateAuth(field, value) {
    setAuthForm((current) => ({ ...current, [field]: value }));
  }

  function updateFilters(field, value) {
    setFilters((current) => ({ ...current, [field]: value }));
  }

  function updateNote(field, value) {
    setNoteForm((current) => ({ ...current, [field]: value }));
  }

  function openComposer() {
    setComposerOpen(true);
  }

  function createNewNote() {
    setSelectedNote(null);
    setEditorMode("new");
    setComposerOpen(true);
    setNoteForm(EMPTY_NOTE);
    setNoteMessage("");
  }

  async function refreshNotes() {
    try {
      if (isMyFeed) {
        if (!session?.token || !session?.userId) {
          return;
        }
        const data = await api.getMyNotes(session.userId, session.token, buildQuery(filters, true));
        setMyNotes(data.notes || []);
      } else {
        const data = await api.getPublicNotes(buildQuery(filters));
        setPublicNotes(data.notes || []);
      }
    } catch (error) {
      setNotesError(error.message);
    }
  }

  async function openNote(note) {
    const noteId = normalizeId(note);
    if (!noteId) {
      return;
    }

    try {
      const data = await api.getNote(noteId, session?.token);
      const record = data.note;
      const ownedByMe = session?.userId && String(record.user) === String(session.userId);

      setSelectedNote(record);
      setNoteForm({
        title: record.title || "",
        note: record.note || "",
        mood: record.mood || "normal",
        visibility: record.visibility || "public",
      });
      setEditorMode(ownedByMe ? "edit" : "view");
      setComposerOpen(false);
      setNoteMessage(ownedByMe ? "Editing note." : "Viewing note.");
    } catch (error) {
      setNoteMessage(error.message);
    }
  }

  function beginEdit(noteRecord) {
    setSelectedNote(noteRecord);
    setNoteForm({
      title: noteRecord.title || "",
      note: noteRecord.note || "",
      mood: noteRecord.mood || "normal",
      visibility: noteRecord.visibility || "public",
    });
    setEditorMode("edit");
    setComposerOpen(true);
    setNoteMessage("Editing note.");
  }

  async function saveNote(event) {
    event.preventDefault();

    if (!session?.token) {
      setNoteMessage("Please sign in to save notes.");
      return;
    }

    if (editorMode === "view") {
      setNoteMessage("This note is read-only.");
      return;
    }

    setNoteSaving(true);
    setNoteMessage("");

    try {
      if (editorMode === "edit" && selectedNoteId) {
        await api.updateNote(selectedNoteId, noteForm, session.token);
        setNoteMessage("Note updated.");
      } else {
        await api.createNote(noteForm, session.token);
        setNoteMessage("Note created.");
      }

      await refreshNotes();
      setSelectedNote(null);
      setComposerOpen(false);
      setEditorMode("new");
      setNoteForm(EMPTY_NOTE);
    } catch (error) {
      if (error.status === 401) {
        logout();
      }
      setNoteMessage(error.message);
    } finally {
      setNoteSaving(false);
    }
  }

  async function deleteNote() {
    if (!session?.token || !selectedNoteId) {
      return;
    }

    if (!window.confirm("Delete this note?")) {
      return;
    }

    setNoteSaving(true);
    setNoteMessage("");

    try {
      await api.deleteNote(selectedNoteId, session.token);
      setNoteMessage("Note deleted.");
      await refreshNotes();
      setSelectedNote(null);
      setComposerOpen(false);
      setEditorMode("new");
      setNoteForm(EMPTY_NOTE);
    } catch (error) {
      if (error.status === 401) {
        logout();
      }
      setNoteMessage(error.message);
    } finally {
      setNoteSaving(false);
    }
  }

  if (!session) {
    return (
      <div className="auth-screen">
        <div className="auth-shell">
          <div className="auth-copy">
            <p className="eyebrow">NoteTheMood</p>
            <h1>Minimal notes for clear thinking.</h1>
            <p>
              Sign in or create an account to manage private notes, or browse public notes without
              getting pulled into a cluttered interface.
            </p>
          </div>

          <section className="surface auth-card">
            <div className="segmented auth-segmented">
              <button
                type="button"
                className={authMode === "login" ? "segmented-active" : ""}
                onClick={() => setAuthMode("login")}
              >
                Sign in
              </button>
              <button
                type="button"
                className={authMode === "register" ? "segmented-active" : ""}
                onClick={() => setAuthMode("register")}
              >
                Sign up
              </button>
            </div>

            <form className="form" onSubmit={submitAuth}>
              {authMode === "register" ? (
                <label className="field">
                  <span>Name</span>
                  <input
                    className="input"
                    type="text"
                    value={authForm.name}
                    onChange={(event) => updateAuth("name", event.target.value)}
                    placeholder="Your name"
                    required
                  />
                </label>
              ) : null}

              <label className="field">
                <span>Email</span>
                <input
                  className="input"
                  type="email"
                  value={authForm.email}
                  onChange={(event) => updateAuth("email", event.target.value)}
                  placeholder="you@example.com"
                  required
                />
              </label>

              <label className="field">
                <span>Password</span>
                <input
                  className="input"
                  type="password"
                  value={authForm.password}
                  onChange={(event) => updateAuth("password", event.target.value)}
                  placeholder="At least 8 characters"
                  required
                />
              </label>

              {authError ? <div className="notice notice-error">{authError}</div> : null}

              <button className="button button-primary" type="submit" disabled={authLoading}>
                {authLoading ? "Working..." : authMode === "register" ? "Create account" : "Sign in"}
              </button>
            </form>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header surface">
        <div>
          <p className="eyebrow">NoteTheMood</p>
          <h1>Feed</h1>
        </div>

        <div className="header-actions">
          <button className="button button-primary" type="button" onClick={createNewNote}>
            Add note
          </button>
          <span className="pill">{session.name || "Member"}</span>
          <button className="button button-ghost" type="button" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <main className="workspace feed-layout">
        <section className="surface feed-panel">
          <div className="feed-top">
            <div>
              <p className="eyebrow">Public feed</p>
              <h2>{isMyFeed ? "Your notes" : "Browse public notes"}</h2>
            </div>

            <div className="feed-top-actions">
              <button className="button button-ghost" type="button" onClick={refreshNotes}>
                Refresh
              </button>
              <button className="button button-primary" type="button" onClick={createNewNote}>
                Add note
              </button>
            </div>
          </div>

          <div className="feed-toolbar">
            <input
              className="input input-compact"
              type="text"
              value={filters.search}
              onChange={(event) => updateFilters("search", event.target.value)}
              placeholder="Search notes"
            />

            <select
              className="input input-compact"
              value={filters.mood}
              onChange={(event) => updateFilters("mood", event.target.value)}
            >
              <option value="">Mood</option>
              {MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </select>

            <select
              className="input input-compact"
              value={filters.sort}
              onChange={(event) => updateFilters("sort", event.target.value)}
            >
              <option value="-updatedAt">Newest</option>
              <option value="updatedAt">Oldest</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
            </select>

            <button
              className={`button button-filter ${feed === "all" ? "button-filter-active" : ""}`}
              type="button"
              onClick={() => setFeed("all")}
            >
              All
            </button>
            <button
              className={`button button-filter ${feed === "mine" ? "button-filter-active" : ""}`}
              type="button"
              onClick={() => setFeed("mine")}
              disabled={!session}
            >
              Mine
            </button>
          </div>

          <div className="feed-meta">
            <span>{activeNotes.length} notes</span>
            {isMyFeed ? (
              <select
                className="input input-compact input-narrow"
                value={filters.visibility}
                onChange={(event) => updateFilters("visibility", event.target.value)}
              >
                <option value="private,public">All</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </select>
            ) : (
              <span className="muted">Public browsing</span>
            )}
          </div>

          <div className="notes-list">
            {notesLoading ? <div className="empty-state">Loading notes...</div> : null}
            {notesError ? <div className="notice notice-error">{notesError}</div> : null}
            {!notesLoading && !activeNotes.length ? (
              <div className="empty-state">
                <h3>No notes yet</h3>
                <p>Try a different filter or add a note.</p>
              </div>
            ) : null}

            {activeNotes.map((note) => {
              const noteId = normalizeId(note);
              const isOwner = session?.userId && String(note.user) === String(session.userId);
              const ownerId = normalizeId(note.user);
              const owner = isOwner ? "You" : ownerNames[ownerId] || "Loading...";
              const isSelected = noteId === selectedNoteId;

              return (
                <article key={noteId} className={`note-card note-post ${isSelected ? "note-card-selected" : ""}`}>
                  <button className="note-card-main" type="button" onClick={() => openNote(note)}>
                    <div className="note-card-head">
                      <div className="post-avatar">{(note.title || "?").slice(0, 1).toUpperCase()}</div>
                      <div className="post-body">
                        <div className="post-title-row">
                          <div>
                            <h3>{note.title}</h3>
                            <p className="note-meta">
                              {owner} · {formatDate(note.updatedAt)}
                            </p>
                          </div>
                          <div className="note-tags">
                            <span className="tag">{note.mood}</span>
                            <span className="tag tag-muted">{note.visibility}</span>
                          </div>
                        </div>
                        <p className="note-preview">{excerpt(note.note)}</p>
                      </div>
                    </div>
                  </button>

                  {isOwner ? (
                    <div className="note-actions">
                      <button
                        className="button button-secondary button-small"
                        type="button"
                        onClick={() => beginEdit(note)}
                      >
                        Edit
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="sidebar-column">
          <section className="surface mini-panel">
            <div className="panel-top">
              <div>
                <p className="eyebrow">Create</p>
                <h2>New note</h2>
              </div>

              <button
                className="button button-ghost button-small"
                type="button"
                onClick={() => setComposerOpen((current) => !current)}
              >
                {composerOpen ? "Collapse" : "Expand"}
              </button>
            </div>

            {noteMessage ? <div className="notice notice-soft">{noteMessage}</div> : null}

            {!composerOpen ? (
              <button className="composer-prompt" type="button" onClick={openComposer}>
                <span className="composer-plus">+</span>
                <span>Tap to add a note</span>
              </button>
            ) : (
              <form className="form compact-form" onSubmit={saveNote}>
                <label className="field">
                  <span>Title</span>
                  <input
                    className="input input-compact"
                    type="text"
                    value={noteForm.title}
                    onChange={(event) => updateNote("title", event.target.value)}
                    placeholder="Short title"
                    required
                  />
                </label>

                <label className="field">
                  <span>Body</span>
                  <textarea
                    className="textarea textarea-compact"
                    rows="6"
                    value={noteForm.note}
                    onChange={(event) => updateNote("note", event.target.value)}
                    placeholder="Write something honest."
                  />
                </label>

                <div className="field-grid compact-grid">
                  <label className="field">
                    <span>Mood</span>
                    <select
                      className="input input-compact"
                      value={noteForm.mood}
                      onChange={(event) => updateNote("mood", event.target.value)}
                      required
                    >
                      {MOODS.map((mood) => (
                        <option key={mood} value={mood}>
                          {mood}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>Visibility</span>
                    <select
                      className="input input-compact"
                      value={noteForm.visibility}
                      onChange={(event) => updateNote("visibility", event.target.value)}
                      required
                    >
                      {VISIBILITIES.map((visibility) => (
                        <option key={visibility} value={visibility}>
                          {visibility}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="button-row">
                  <button className="button button-primary" type="submit" disabled={noteSaving}>
                    {noteSaving ? "Saving..." : editorMode === "edit" ? "Update" : "Post"}
                  </button>
                  {editorMode === "edit" ? (
                    <button className="button button-danger" type="button" onClick={deleteNote} disabled={noteSaving}>
                      Delete
                    </button>
                  ) : null}
                  <button
                    className="button button-ghost"
                    type="button"
                    onClick={() => {
                      setComposerOpen(false);
                      setEditorMode("new");
                      setNoteForm(EMPTY_NOTE);
                      setNoteMessage("");
                    }}
                  >
                    Reset
                  </button>
                </div>
              </form>
            )}
          </section>

          <section className="surface mini-panel">
            <div className="panel-top">
              <div>
                <p className="eyebrow">Selected</p>
                <h2>{selectedNote ? selectedNote.title : "Nothing open"}</h2>
              </div>
            </div>

            {selectedNote ? (
              <div className="note-detail">
                <div className="note-detail-meta">
                  <span className="pill">{selectedOwner}</span>
                  <span className="pill">{formatDate(selectedNote.updatedAt)}</span>
                </div>
                <div className="note-tags">
                  <span className="tag">{selectedNote.mood}</span>
                  <span className="tag tag-muted">{selectedNote.visibility}</span>
                </div>
                <p className="note-detail-body">{selectedNote.note || "No note body yet."}</p>
                {selectedOwnerId === session.userId ? (
                  <div className="button-row">
                    <button
                      className="button button-primary"
                      type="button"
                      onClick={() => beginEdit(selectedNote)}
                    >
                      Edit
                    </button>
                    <button className="button button-danger" type="button" onClick={deleteNote} disabled={noteSaving}>
                      Delete
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="empty-state">
                <h3>Open a note</h3>
                <p>Tap a card in the feed to preview it here.</p>
              </div>
            )}
          </section>
        </aside>
      </main>
    </div>
  );
}

export default App;
