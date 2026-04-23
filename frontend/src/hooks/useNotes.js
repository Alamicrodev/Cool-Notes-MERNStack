import { useCallback, useEffect, useState } from "react";
import api from "../api";
import { EMPTY_FILTERS, EMPTY_NOTE_FORM } from "../utils/constants";
import { buildNoteQuery, normalizeId } from "../utils/notes";


//basially a function for controlled inputs in forms but allows dynamic setters. 
function applyFieldUpdate(setter) {
  return (field, value) => setter((current) => ({ ...current, [field]: value }));
}


export default function useNotes(session, onUnauthorized) {

  // Feed state variables
  const [feed, setFeed] = useState("all");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [publicNotes, setPublicNotes] = useState([]);
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState({ public: false, mine: false });
  const [notesError, setNotesError] = useState("");  //comeback here 
  const [ownerNames, setOwnerNames] = useState({});  //comeback here 

  // Inline editing/creating of a note state variables
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState(null);
  const [noteForm, setNoteForm] = useState(EMPTY_NOTE_FORM);
  const [noteSaving, setNoteSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // derived variables from state
  const isMyFeed = feed === "mine";                           //is personfeed or public feed
  const activeNotes = isMyFeed ? myNotes : publicNotes;       //so mynotes should be active or public notes should be active
  const notesLoading = isMyFeed ? loading.mine : loading.public;   //which notes are loading 
  const updateFilter = applyFieldUpdate(setFilters);               //controlled inputs for filter form
  const updateNoteField = applyFieldUpdate(setNoteForm);           //controlled inputs for note form 

  function resetForm() {                //updates state
    setNoteForm(EMPTY_NOTE_FORM);       //clears note form by changing controlled inputs
  }

  function closeComposer() {            //updates state
    setComposerOpen(false);             //closes note creator form
    resetForm();                        //clears note creator form
    setDeleteTarget(null);              
  }

  function cancelEdit() {               //updates state
    setEditingNoteId(null);             
    resetForm();                        //clears note creator(editor) form
    setDeleteTarget(null);              
  }

  const resetEditor = useCallback(() => {      //use callback persists the memory address of the function, on every rerender
    setComposerOpen(false);                    //prevents children components(who get resetEditor as a prop) from re-rendering every time NotePage re-renders. 
    setEditingNoteId(null);                    //if not null then we know we are editing a note
    setNoteForm(EMPTY_NOTE_FORM);              
    setDeleteTarget(null);
  }, []);                        

  function changeFeed(nextFeed) {    //updates feed state
    setFeed(nextFeed);               //used to change feed 
    resetEditor();                   //comeback here
    setNotesError("");
  }

  function openComposer() {
    setEditingNoteId(null);             //change state: open creator form 
    setComposerOpen(true);              
    resetForm();                        //clear its content 
    setNotesError("");                  
  }



  //loads notes from api call 
  //to set myNotes or publicNotes state var's.
  const loadFeedNotes = useCallback(async ({ silent = false } = {}) => {     //if no obj > default = empty obj
    if (!silent) {                                                           //if obj and no silent > silent default = false 
      setNotesError("");
      setLoading((current) => ({ ...current, [isMyFeed ? "mine" : "public"]: true }));   // if no silent flag, set loading mine or loading public (depending on which feed is open)
    }       

    try {
      //buildNoteQuery is used to build query, in the utils. 
      //isMyFeed tells whether to include public/private filter (because its not needed when its public feed)
      const query = buildNoteQuery(filters, isMyFeed);    
                                                           
      //checking what kind of data to get 
      const data = isMyFeed
        ? await api.getMyNotes(session?.userId, session?.token, query) //getMyNotes from api module.
        : await api.getPublicNotes(query);             //getPublicNotes incase of Public feed.

      if (isMyFeed) {
        setMyNotes(data.notes || []);    //update myNotes State variable
      } else {
        setPublicNotes(data.notes || []);  
      }
    } catch (error) {
      setNotesError(error.message);    //if there is error in api call, update the error state var
    } finally { 
      if (!silent) {
        //finally at the end, after either success or error, update the loading state.
        setLoading((current) => ({ ...current, [isMyFeed ? "mine" : "public"]: false }));
      }
    }
  }, [filters, isMyFeed, session?.token, session?.userId]);  //only remount the function when any of these change.


  // refreshes notes but does not show "loading" state.
  // could be for let's say after editing a note/creating new note/deleting a note.
  async function refreshNotes() {
    await loadFeedNotes({ silent: true });
  }

  
  //Side Effect: sets feed to public if no userid/session
  //technically useless tbh because there's security already preventing this
  useEffect(() => {
    if (!session?.userId && feed === "mine") {
      setFeed("all");
      resetEditor();
    }
  }, [feed, resetEditor, session?.userId]);

  
  //Side Effect:
  //loads feed notes on any change in feed(my, public), filters, or session etc.
  useEffect(() => {
    if (isMyFeed && (!session?.token || !session?.userId)) {
      setMyNotes([]);
      return undefined;
    }

    let ignore = false;

    async function run() {
      if (!ignore) {
        await loadFeedNotes();  //makes api calls etc
      }
    }

    run();

    return () => {
      ignore = true;
    };
  }, [feed, isMyFeed, loadFeedNotes, session?.token, session?.userId, filters]);




  // sideEffect to populate ownerNames state variable. 
  // it is an object that maps userId to userName, helping us put ownerName for each note. 
  useEffect(() => {
    // activeNotes is basically either personalNotes or PublicNotes
    // extract the userId of each note's owner 
    // filter it using filter method, boolean function converts to boolean so values that are falsee("", null, undefined) get filterd out.
    // then it is put in a new set, to only get unique values 
    // then it is spread so it becomes an array
    // then it is filtered again to only get values that are not already in 
    // ownerNames state variable
    const idsToLoad = [...new Set(activeNotes.map((note) => normalizeId(note.user)).filter(Boolean))].filter(
      (userId) => !ownerNames[userId]
    );

    // if 0 idsToLoad we end function
    if (!idsToLoad.length) {
      return undefined;
    }

    // ignore flag for clean up function 
    let ignore = false;

    // loads owner names from id's making api call
    async function loadOwners() {
      const updates = {};

      // promise.all waits for all internal promises(async requests).
      // to complete before moving on. 
      await Promise.all(
        //async makes code asyncronous, so for each userId, request is sent simultaneously.
        idsToLoad.map(async (userId) => {  
          try {
            const data = await api.getUser(userId);
            updates[userId] = data?.user?.name || "Unknown";
          } catch (error) {
            updates[userId] = "Unknown";
          }
        })
      );

      //updating owner names with userids, only if the ignore flag is false.
      if (!ignore) {
        setOwnerNames((current) => ({ ...current, ...updates }));
      }
    }
    loadOwners();   //calling the above function.

    return () => {
      ignore = true;   //cleanup to prevent stale data. 
    };
  }, [activeNotes, ownerNames]);  



  // change state: Instate-edit a note record.
  function beginEdit(noteRecord) {     
    const noteId = normalizeId(noteRecord);

    if (!noteId) {
      return;
    }

    setEditingNoteId(noteId);
    setNoteForm({
      title: noteRecord.title || "",
      note: noteRecord.note || "",
      mood: noteRecord.mood || "normal",
      visibility: noteRecord.visibility || "public",
    });
    setComposerOpen(false);
    setDeleteTarget(null);
  }

  // change state: request a note for deletion. 
  // potentially shows a confirm modal
  function requestDelete(noteRecord) {
    setDeleteTarget(noteRecord);
  }

  // change state: cancel delete 
  function cancelDelete() {
    setDeleteTarget(null);
  }

  // change state: confirm delete and delete note
  // CRUD(Delete)
  async function confirmDelete() {
    const targetId = normalizeId(deleteTarget);

    //return if no session 
    if (!session?.token || !targetId) {
      return;
    }

    setNoteSaving(true);   //state variable to track if a note is in saving state (user just pressed save/update/delete)

    try {
      await api.deleteNote(targetId, session.token);
      await refreshNotes();            
      resetEditor();           
    } catch (error) {
      if (error.status === 401) {     
        onUnauthorized?.();          //comebackhere, don't remember what this is            
      }
      setNotesError(error.message);     
    } finally {
      setNoteSaving(false);      //state variable to track if a note is in saving state (user just pressed save/update/delete)
      setDeleteTarget(null);     //clear delete target state var
    }
  }


  // change state, save note, save edited note
  // CRUD(Create and Update)
  async function saveNote(event) {
    event.preventDefault();

    if (!session?.token) {
      setNotesError("Please sign in to save notes.");
      return;
    }

    setNoteSaving(true);
    setNotesError("");

    try {   // if case is updating note, update it else create it 
      if (editingNoteId) {
        await api.updateNote(editingNoteId, noteForm, session.token);
      } else {
        await api.createNote(noteForm, session.token);
      }

      await refreshNotes();   //refresh, after creating/updating
      resetEditor();
    } catch (error) {
      if (error.status === 401) {
        //onUnauthorized is simply the logout function, being passed in from authContext() 
        onUnauthorized?.();     //if exists, then execute it  
      }
      setNotesError(error.message);
    } finally {
      setNoteSaving(false);      //noteSaving state tells react if a note is currently saving/updating or deleting, so we can update labels based on that. 
    }
  }

  return {
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
    isMyFeed,
    openComposer,
    refreshNotes,
    beginEdit,
    requestDelete,
    cancelDelete,
    confirmDelete,
    saveNote,
    updateNoteField,
    setComposerOpen,
    closeComposer,
    cancelEdit,
  };
}
