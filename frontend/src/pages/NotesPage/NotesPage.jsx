import { Navigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import FormInput from "../../components/FormInput/FormInput";
import Modal from "../../components/Modal/Modal";
import NoteCard from "../../components/NoteCard/NoteCard";
import Sidebar from "../../components/Sidebar/Sidebar";
import { useAuth } from "../../context/AuthContext";
import useNotes from "../../hooks/useNotes";
import { NOTE_MOODS, NOTE_VISIBILITIES } from "../../utils/constants";
import "./NotesPage.css";

export default function NotesPage() {
  const { session, logout } = useAuth();
  const notes = useNotes(session, logout);

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const {
    feed,
    changeFeed,
    filters,
    updateFilter,
    activeNotes,
    notesLoading,
    notesError,
    ownerNames,
    selectedNote,
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
  } = notes;

  return (
    <div className="app-shell">
      <header className="app-header surface">
        <div>
          <p className="eyebrow">NoteTheMood</p>
          <h1>Feed</h1>
        </div>

        <div className="header-actions">
          <Button variant="primary" onClick={createNewNote}>
            Add note
          </Button>
          <span className="pill">{session.name || "Member"}</span>
          <Button variant="ghost" onClick={logout}>
            Sign out
          </Button>
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
              <Button variant="ghost" onClick={refreshNotes}>
                Refresh
              </Button>
              <Button variant="primary" onClick={createNewNote}>
                Add note
              </Button>
            </div>
          </div>

          <div className="feed-toolbar">
            <FormInput
              type="text"
              className="input-compact"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search notes"
            />

            <FormInput
              as="select"
              className="input-compact"
              value={filters.mood}
              onChange={(event) => updateFilter("mood", event.target.value)}
            >
              <option value="">Mood</option>
              {NOTE_MOODS.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </FormInput>

            <FormInput
              as="select"
              className="input-compact"
              value={filters.sort}
              onChange={(event) => updateFilter("sort", event.target.value)}
            >
              <option value="-updatedAt">Newest</option>
              <option value="updatedAt">Oldest</option>
              <option value="title">Title A-Z</option>
              <option value="-title">Title Z-A</option>
            </FormInput>

            <Button variant="filter" className={feed === "all" ? "button-filter-active" : ""} onClick={() => changeFeed("all")}>
              All
            </Button>
            <Button variant="filter" className={feed === "mine" ? "button-filter-active" : ""} onClick={() => changeFeed("mine")}>
              Mine
            </Button>
          </div>

          <div className="feed-meta">
            <span>{activeNotes.length} notes</span>
            {isMyFeed ? (
              <FormInput
                as="select"
                className="input-compact input-narrow"
                value={filters.visibility}
                onChange={(event) => updateFilter("visibility", event.target.value)}
              >
                <option value="private,public">All</option>
                <option value="private">Private</option>
                <option value="public">Public</option>
              </FormInput>
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
              const noteId = note._id || note.id;
              const isOwner = session?.userId && String(note.user) === String(session.userId);
              const ownerId = note.user?._id || note.user?.id || note.user;
              const ownerName = isOwner ? "You" : ownerNames[ownerId] || "Loading...";
              const isSelected = noteId === selectedNote?._id;

              return (
                <NoteCard
                  key={noteId}
                  note={note}
                  ownerName={ownerName}
                  isOwner={isOwner}
                  isSelected={isSelected}
                  onOpen={openNote}
                  onEdit={beginEdit}
                />
              );
            })}
          </div>
        </section>

        <Sidebar>
          <section className="surface mini-panel">
            <div className="panel-top">
              <div>
                <p className="eyebrow">Create</p>
                <h2>New note</h2>
              </div>

              <Button variant="ghost" size="small" onClick={() => setComposerOpen((current) => !current)}>
                {composerOpen ? "Collapse" : "Expand"}
              </Button>
            </div>

            {noteMessage ? <div className="notice notice-soft">{noteMessage}</div> : null}

            {!composerOpen ? (
              <button className="composer-prompt" type="button" onClick={openComposer}>
                <span className="composer-plus">+</span>
                <span>Tap to add a note</span>
              </button>
            ) : (
              <form className="form compact-form" onSubmit={saveNote}>
                <FormInput
                  label="Title"
                  type="text"
                  className="input-compact"
                  value={noteForm.title}
                  onChange={(event) => updateNoteField("title", event.target.value)}
                  placeholder="Short title"
                  required
                />

                <FormInput
                  label="Body"
                  as="textarea"
                  className="textarea-compact"
                  rows="6"
                  value={noteForm.note}
                  onChange={(event) => updateNoteField("note", event.target.value)}
                  placeholder="Write something honest."
                />

                <div className="field-grid compact-grid">
                  <FormInput
                    label="Mood"
                    as="select"
                    className="input-compact"
                    value={noteForm.mood}
                    onChange={(event) => updateNoteField("mood", event.target.value)}
                    required
                  >
                    {NOTE_MOODS.map((mood) => (
                      <option key={mood} value={mood}>
                        {mood}
                      </option>
                    ))}
                  </FormInput>

                  <FormInput
                    label="Visibility"
                    as="select"
                    className="input-compact"
                    value={noteForm.visibility}
                    onChange={(event) => updateNoteField("visibility", event.target.value)}
                    required
                  >
                    {NOTE_VISIBILITIES.map((visibility) => (
                      <option key={visibility} value={visibility}>
                        {visibility}
                      </option>
                    ))}
                  </FormInput>
                </div>

                <div className="button-row">
                  <Button type="submit" disabled={noteSaving}>
                    {noteSaving ? "Saving..." : editorMode === "edit" ? "Update" : "Post"}
                  </Button>
                  {editorMode === "edit" ? (
                    <Button variant="danger" onClick={() => requestDelete(selectedNote)} disabled={noteSaving}>
                      Delete
                    </Button>
                  ) : null}
                  <Button
                    variant="ghost"
                    onClick={() => {
                      resetEditor();
                      setSelectedNote(null);
                      setNoteMessage("");
                    }}
                  >
                    Reset
                  </Button>
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
                  <span className="pill">
                    {selectedNote.updatedAt ? new Date(selectedNote.updatedAt).toLocaleDateString() : "just now"}
                  </span>
                </div>

                <div className="note-tags">
                  <span className="tag">{selectedNote.mood}</span>
                  <span className="tag tag-muted">{selectedNote.visibility}</span>
                </div>

                <p className="note-detail-body">{selectedNote.note || "No note body yet."}</p>

                {selectedNoteIsOwner ? (
                  <div className="button-row">
                    <Button variant="primary" onClick={() => beginEdit(selectedNote)}>
                      Edit
                    </Button>
                    <Button variant="danger" onClick={() => requestDelete(selectedNote)} disabled={noteSaving}>
                      Delete
                    </Button>
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
        </Sidebar>
      </main>

      <Modal
        open={Boolean(deleteTarget)}
        title="Delete note?"
        description="This will permanently remove the selected note."
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel={noteSaving ? "Deleting..." : "Delete"}
      >
        <p className="muted">
          You are deleting <strong>{deleteTarget?.title || "this note"}</strong>.
        </p>
      </Modal>
    </div>
  );
}
