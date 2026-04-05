import { useEffect, useState } from "react";
import api from "../api";
import { EMPTY_FILTERS, EMPTY_NOTE_FORM } from "../utils/constants";
import { buildNoteQuery, normalizeId } from "../utils/notes";

function applyFieldUpdate(setter) {
  return (field, value) => setter((current) => ({ ...current, [field]: value }));
}

export default function useNotes(session, onUnauthorized) {
  const [feed, setFeed] = useState("all");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [publicNotes, setPublicNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState({ public: false, mine: false });
  const [notesError, setNotesError] = useState("");
  const [ownerNames, setOwnerNames] = useState({});
  const [selectedNote, setSelectedNote] = useState(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [editorMode, setEditorMode] = useState("new");
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteMessage, setNoteMessage] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const isMyFeed = feed === "mine";
  const activeNotes = isMyFeed ? myNotes : publicNotes;
  const notesLoading = isMyFeed ? loading.mine : loading.public;
  const selectedNoteId = normalizeId(selectedNote);
  const selectedOwnerId = normalizeId(selectedNote?.user);
  const selectedOwner = selectedOwnerId
    ? selectedOwnerId === session?.userId
      ? "You"
      : ownerNames[selectedOwnerId] || "Loading..."
    : "Unknown";
  const selectedNoteIsOwner =
    Boolean(session?.userId && selectedOwnerId) && String(selectedOwnerId) === String(session.userId);

  const updateFilter = applyFieldUpdate(setFilters);
  const updateNoteField = applyFieldUpdate(setNoteForm);

  function resetEditor() {
    // Reset the compose state without touching the selected feed.
    setComposerOpen(false);
    setEditorMode("new");
    setNoteForm(EMPTY_NOTE_FORM);
    setDeleteTarget(null);
  }

  function changeFeed(nextFeed) {
    // Switching feeds should close the editor so the layout stays clean.
    setFeed(nextFeed);
    setSelectedNote(null);
    setComposerOpen(false);
    setEditorMode("new");
    setNoteMessage("");
    setDeleteTarget(null);
  }

  function openComposer() {
    setComposerOpen(true);
    setNoteMessage("");
  }

  function createNewNote() {
    setSelectedNote(null);
    setEditorMode("new");
    setNoteForm(EMPTY_NOTE_FORM);
    setComposerOpen(true);
    setNoteMessage("");
    setDeleteTarget(null);
  }

  async function refreshNotes() {
    try {
      if (isMyFeed) {
        if (!session?.token || !session?.userId) {
          return;
        }

        const data = await api.getMyNotes(session.userId, session.token, buildNoteQuery(filters, true));
        setMyNotes(data.notes || []);
      } else {
        const data = await api.getPublicNotes(buildNoteQuery(filters));
        setPublicNotes(data.notes || []);
      }
    } catch (error) {
      setNotesError(error.message);
    }
  }

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
      setLoading((current) => ({ ...current, public: true }));
      setNotesError("");

      try {
        const data = await api.getPublicNotes(buildNoteQuery(filters));
        if (!ignore) {
          setPublicNotes(data.notes || []);
        }
      } catch (error) {
        if (!ignore) {
          setNotesError(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading((current) => ({ ...current, public: false }));
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
      setLoading((current) => ({ ...current, mine: true }));
      setNotesError("");

      try {
        const data = await api.getMyNotes(session.userId, session.token, buildNoteQuery(filters, true));
        if (!ignore) {
          setMyNotes(data.notes || []);
        }
      } catch (error) {
        if (!ignore) {
          setNotesError(error.message);
        }
      } finally {
        if (!ignore) {
          setLoading((current) => ({ ...current, mine: false }));
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
      setDeleteTarget(null);
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
    setDeleteTarget(null);
    setNoteMessage("Editing note.");
  }

  function requestDelete(noteRecord) {
    setDeleteTarget(noteRecord || selectedNote);
    setNoteMessage("Confirm delete to remove this note.");
  }

  function cancelDelete() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    const target = deleteTarget || selectedNote;
    const targetId = normalizeId(target);

    if (!session?.token || !targetId) {
      return;
    }

    setNoteSaving(true);
    setNoteMessage("");

    try {
      await api.deleteNote(targetId, session.token);
      setNoteMessage("Note deleted.");
      await refreshNotes();
      setSelectedNote(null);
      resetEditor();
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized?.();
      }
      setNoteMessage(error.message);
    } finally {
      setNoteSaving(false);
      setDeleteTarget(null);
    }
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
      resetEditor();
    } catch (error) {
      if (error.status === 401) {
        onUnauthorized?.();
      }
      setNoteMessage(error.message);
    } finally {
      setNoteSaving(false);
    }
  }

  return {
    feed,
    changeFeed,
    filters,
    updateFilter,
    publicNotes,
    myNotes,
    activeNotes,
    notesLoading,
    notesError,
    ownerNames,
    selectedNote,
    selectedNoteId,
    selectedOwnerId,
    selectedOwner,
    selectedNoteIsOwner,
    composerOpen,
    editorMode,
    noteForm,
    noteSaving,
    noteMessage,
    deleteTarget,
    isMyFeed,
    openComposer,
    createNewNote,
    refreshNotes,
    openNote,
    beginEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
    saveNote,
    updateNoteField,
    setComposerOpen,
    setSelectedNote,
    setNoteMessage,
    resetEditor,
  };
}
