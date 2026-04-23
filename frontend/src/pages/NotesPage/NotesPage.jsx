import { useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import Button from "../../components/Button/Button";
import Footer from "../../components/Footer/Footer";
import FormInput from "../../components/FormInput/FormInput";
import Modal from "../../components/Modal/Modal";
import NoteCard from "../../components/NoteCard/NoteCard";
import { useAuth } from "../../context/AuthContext";
import useNotes from "../../hooks/useNotes";
import { NOTE_MOODS, NOTE_VISIBILITIES } from "../../utils/constants";
import "./NotesPage.css";

export default function NotesPage() {

  // get session info from authContext
  // get logout function from authContext because we have to logout on the NotesPage. 
  const { session, logout } = useAuth();

  // useNotes is a custom hook to minimize the complexitity here, check it out. 
  // we import all stateVars and functions from it below.
  const notes = useNotes(session, logout);  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);    //state to track side pane open/close
  const noteBodyRef = useRef(null);    //ref to textarea inside composer, ref will be added using a useEffect below. 

  // setting isMobile state based on window width:
  // also checks first if window exists (for nextjs proof code)
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 720px)").matches : false  
  );


  // get important, state and functions from useNotes hook output 
  const {
    feed,          
    changeFeed,
    filters,
    updateFilter,
    activeNotes,
    notesLoading,
    notesError,
    ownerNames,
    composerOpen,
    editingNoteId,
    noteForm,
    noteSaving,
    deleteTarget,
    openComposer,
    closeComposer,
    beginEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
    saveNote,
    updateNoteField,
    cancelEdit,
  } = notes;


  // function to handle composer toggle. 
  // we just get the function, we execute it later. 
  const handleComposerToggle = composerOpen ? closeComposer : openComposer;
  // function to get feed title based on current feed. 
  const feedTitle = feed === "mine" ? "Private feed" : "Public feed";

 
  //side pane for mobile view 
  function closeMobileMenu() {
    setMobileMenuOpen(false);
  }
  function toggleMobileMenu() {
    setMobileMenuOpen((current) => !current);
  }


  //changing feed for the mobile view 
  function switchFeed(nextFeed) {
    changeFeed(nextFeed);
    closeMobileMenu();
  }


  //to handle composer toggle in the side pane for mobile view/
  function handleMobileComposerToggle() {
    closeMobileMenu();

    if (composerOpen) {
      closeComposer();
      return;
    }

    openComposer();
  }



  useEffect(() => {
    //ssr guard 
    if (typeof window === "undefined") {
      return undefined;
    }

    // media.matches is true if the screen is currently ≤720px.
    // updateMobile just updates the state, pushing that boolean into state var.
    const media = window.matchMedia("(max-width: 720px)");
    const updateMobile = () => setIsMobile(media.matches);
    updateMobile(); //just runs that function 

    
    // if media.addEventListner is supported 
    // only in modern browsers
    if (media.addEventListener) {
      // media represents a live connection to a CSS media query, remember @media etc.
      // we defined that media query above.  
      media.addEventListener("change", updateMobile);  
      return () => media.removeEventListener("change", updateMobile);
      //we return clean up function here and end the effect. 
    }

    // this code only runs when the above one can't run in older browsers.
    // "change" is the only event it answered to, so its default. 
    // even now "change" is the only thing it answers to 
    media.addListener(updateMobile);  
    return () => media.removeListener(updateMobile);
  }, []);


  //creates ref to text area. 
  useEffect(() => {
    const textarea = noteBodyRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "auto";
    textarea.style.height = `${Math.max(textarea.scrollHeight, 140)}px`;
  }, [noteForm.note, composerOpen]);


  //if no session go to login/signup page
  if (!session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="app-shell notes-shell">
      <header className="app-header notes-header">
        <div className="brand-lockup">
          <p className="brand-wordmark">NOTETHEMOOD</p>
        </div>


        <div className="header-actions">
          <button
            type="button"
            className="menu-toggle"
            onClick={toggleMobileMenu}
            aria-label="Open menu"
            aria-expanded={mobileMenuOpen}
          >
            <span />
            <span />
          </button>
          <span className="header-user">{session.name || "Member"}</span>
          <Button variant="ghost" size="small" onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <main className="notes-grid">
        {/* feed selecter, filter and new entry button */}
        {/* only shows if not not on mobile*/}
        {!isMobile ? (
          <aside className="surface notes-rail notes-rail-left">

            {/* feed selector(mine, all)  */}
            <div className="rail-section">
              <div className="rail-nav">
                <button
                  type="button"
                  className={feed === "all" ? "rail-nav-item rail-nav-active" : "rail-nav-item"}
                  onClick={() => changeFeed("all")}
                >
                  Public feed
                </button>
                <button
                  type="button"
                  className={feed === "mine" ? "rail-nav-item rail-nav-active" : "rail-nav-item"}
                  onClick={() => changeFeed("mine")}
                >
                  Personal feed
                </button>
              </div>
            </div>
            {/* feel selector ended */}

             {/* Entries count */}
            <div className="rail-section">
              <p className="rail-label">Entries</p>
              <strong className="rail-count">{activeNotes.length}</strong>
            </div>

            {/* Filters */}
            <div className="rail-section">
              <p className="rail-label">Filters</p>
              <div className="rail-filters">
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
                  <option value="">Any mood</option>  
                  {/* value is the data passed from the form in the submission */}
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
                  <option value="title">Title</option>
                  <option value="-title">Title desc</option>
                </FormInput>

                {feed === "mine" ? (
                  <FormInput
                    as="select"
                    className="input-compact"
                    value={filters.visibility}
                    onChange={(event) => updateFilter("visibility", event.target.value)}
                  >
                    <option value="private,public">All notes</option>
                    <option value="private">Private notes</option>
                    <option value="public">Public notes</option>
                  </FormInput>
                ) : null}
              </div>
            </div>
            {/* End of Filters */}

             {/* New Entry/Close Entry button  */}
            <Button variant="secondary" className="rail-action" onClick={handleComposerToggle}>
              {composerOpen ? "Close entry" : "New entry"}
            </Button>
          </aside>
        ) : null}

        {/* Notes actual feed & composer */}
        <section className="notes-center">
          <div className="feed-header">
            <p className="feed-kicker">Feed</p>
            <h1>{feedTitle}</h1>
          </div>

          {/* Shows composer form if open */}
          {composerOpen ? (
            <section className="surface composer-stage">
              <form className="composer-form composer-form-entry" onSubmit={saveNote}>
                <div className="composer-form-head">
                  <div>
                    <p className="composer-kicker">New entry</p>
                    <h2>{noteForm.title || "Untitled note"}</h2>
                  </div>

                  <div className="composer-actions">
                    <Button type="submit" disabled={noteSaving}>
                      {noteSaving ? "Saving..." : "Save entry"}
                    </Button>
                    <Button variant="ghost" onClick={closeComposer} disabled={noteSaving}>
                      Close entry
                    </Button>
                  </div>
                </div>

                <div className="composer-grid">
                  <FormInput
                    type="text"
                    className="input-compact"
                    value={noteForm.title}
                    onChange={(event) => updateNoteField("title", event.target.value)}
                    placeholder="Title"
                    required
                  />
                  <FormInput
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

                <FormInput
                  as="textarea"
                  className="textarea-entry textarea-entry-auto"
                  rows="4"
                  ref={noteBodyRef}
                  value={noteForm.note}
                  onChange={(event) => updateNoteField("note", event.target.value)}
                  placeholder="Write your note..."
                />
              </form>
            </section>
          ) : null}

          
          {/* actual notes feed  */}
          <section className="notes-feed">
            {/* if notes loading or error show that */}
            {notesLoading ? <div className="empty-state">Loading notes...</div> : null}
            {notesError ? <div className="notice notice-error">{notesError}</div> : null}

            {!notesLoading && !activeNotes.length ? (
              <div className="empty-state">
                <p>No notes yet. Add one when you are ready.</p>
              </div>
            ) : null}

            {/* going through each note */}
            {activeNotes.map((note) => {
              const noteId = note._id || note.id;
              const isOwner = session?.userId && String(note.user) === String(session.userId);
              const ownerId = note.user?._id || note.user?.id || note.user;
              const ownerName = isOwner ? "You" : ownerNames[ownerId] || "Loading...";
              const isEditing = noteId === editingNoteId;

              return (
                // NoteCard component has in-state edit ability.
                <NoteCard
                  key={noteId}
                  note={note}         //object:has note title and other info
                  ownerName={ownerName}
                  isOwner={isOwner}
                  isEditing={isEditing}
                  form={noteForm}       //noteForm has the values of the noteForm if enters editing mode
                  moods={NOTE_MOODS}
                  visibilities={NOTE_VISIBILITIES}
                  noteSaving={noteSaving}       //if the note is in saving/updating/deleting state, if so we can do things
                  onEdit={beginEdit}
                  onFieldChange={updateNoteField}
                  onSave={saveNote}
                  onCancel={cancelEdit}
                  onDelete={() => requestDelete(note)}
                />
              );
            })}
          </section>
        </section>
        {/* End of Notes actual feed and composer */}
      </main>

      {/* Shows only if mobile menu open */}
      {mobileMenuOpen ? (
        // overlay used to dim/cover the entire page to open the side pane
        // also clicking it closes the side page
        <div className="mobile-menu-overlay" role="presentation" onClick={closeMobileMenu}>
          <div
            className="surface mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            // stop propagation: if I am clicked don't think overlay is clicked, even tho am its child
            onClick={(event) => event.stopPropagation()}
            // prevents side pane from closing anytime its clicked anywhere(even on empty spaces).
          >

            {/* user name and close button in side pane */}
            <div className="mobile-menu-head">
              <div>
                <p className="rail-label">Menu</p>
                <strong className="mobile-menu-user">{session.name || "Member"}</strong>
              </div>

              <Button variant="ghost" size="small" onClick={closeMobileMenu}>
                Close
              </Button>
            </div>


            {/* entries count in side pane */}
            <div className="mobile-menu-group">
              <p className="rail-label">Entries</p>
              <strong className="rail-count">{activeNotes.length}</strong>
            </div>

            {/* feeds choser in side pane */}
            <div className="mobile-menu-group">
              <p className="rail-label">Feeds</p>
              <div className="rail-nav">
                <button
                  type="button"
                  className={feed === "all" ? "rail-nav-item rail-nav-active" : "rail-nav-item"}
                  onClick={() => switchFeed("all")}
                >
                  Public feed
                </button>
                <button
                  type="button"
                  className={feed === "mine" ? "rail-nav-item rail-nav-active" : "rail-nav-item"}
                  onClick={() => switchFeed("mine")}
                >
                  Personal feed
                </button>
              </div>
            </div>

            {/* Essentially filters in side pane */}
            <div className="mobile-menu-group">
              <p className="rail-label">Filters</p>
              <div className="mobile-menu-filters">
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
                  <option value="">Any mood</option>
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
                  <option value="title">Title</option>
                  <option value="-title">Title desc</option>
                </FormInput>

                {feed === "mine" ? (
                  <FormInput
                    as="select"
                    className="input-compact"
                    value={filters.visibility}
                    onChange={(event) => updateFilter("visibility", event.target.value)}
                  >
                    <option value="private,public">All notes</option>
                    <option value="private">Private notes</option>
                    <option value="public">Public notes</option>
                  </FormInput>
                ) : null}
              </div>
            </div>
            {/* end of filters in side pane */}

           
           {/* open/close composer button in side pane */}
            <div className="mobile-menu-group">
              <Button variant="secondary" className="rail-action" onClick={handleMobileComposerToggle}>
                {composerOpen ? "Close entry" : "New entry"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      
      {/* Footer Component having info that it was built by alamicrodev */}
      <Footer />

      {/* Modal component to confirm/cancel Delete */}
      {/* It passes the cancel and confirm Delete functions */}
      <Modal
        open={Boolean(deleteTarget)}   //only shows if delete target exists
        title="Delete note?"
        description="This will remove the note permanently."
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        confirmLabel={noteSaving ? "Deleting..." : "Delete"}  //label of the delete button
      >
        <p className="muted">
          You are deleting <strong>{deleteTarget?.title || "this note"}</strong>.
        </p>
      </Modal>
    </div>
  );
}
