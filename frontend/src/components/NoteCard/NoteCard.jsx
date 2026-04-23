import Button from "../Button/Button";
import FormInput from "../FormInput/FormInput";
import "./NoteCard.css";
import { formatDate } from "../../utils/notes";

export default function NoteCard({
  note,    
  ownerName,
  isOwner,
  isEditing,
  form,
  moods,
  visibilities,
  noteSaving,
  onEdit,
  onFieldChange,
  onSave,
  onCancel,
  onDelete,
}) {
  const noteTitle = note.title || "Untitled note";

  // Inline editing keeps the feed compact and avoids a separate detail panel.
  return (
    <article className={`note-card ${isEditing ? "note-card-editing" : ""}`}>

      {/* if isEditing we show the editing form with buttons */}
      {isEditing ? (
        <form className="note-editor" onSubmit={onSave}>
          <div className="note-card-head">
            <div>
              <p className="note-meta">
                {ownerName} · {formatDate(note.updatedAt)}
              </p>
              <h3>{noteTitle}</h3>
            </div>
          </div>

          <div className="field-grid compact-grid">
            <FormInput
              label="Title"
              type="text"
              className="input-compact"
              value={form.title}
              onChange={(event) => onFieldChange("title", event.target.value)}
              placeholder="Short title"
              required
            />

            <FormInput
              label="Mood"
              as="select"
              className="input-compact"
              value={form.mood}
              onChange={(event) => onFieldChange("mood", event.target.value)}
              required
            >
              {moods.map((mood) => (
                <option key={mood} value={mood}>
                  {mood}
                </option>
              ))}
            </FormInput>
          </div>

          <FormInput
            label="Body"
            as="textarea"
            className="textarea-compact"
            rows="6"
            value={form.note}
            onChange={(event) => onFieldChange("note", event.target.value)}
            placeholder="Write something honest."
          />

          <FormInput
            label="Visibility"
            as="select"
            className="input-compact"
            value={form.visibility}
            onChange={(event) => onFieldChange("visibility", event.target.value)}
            required
          >
            {visibilities.map((visibility) => (
              <option key={visibility} value={visibility}>
                {visibility}
              </option>
            ))}
          </FormInput>

          <div className="button-row">
            {/* if note is saving we disable save button and show "saving..."" */}
            <Button type="submit" disabled={noteSaving}>
              {noteSaving ? "Saving..." : "Save note"} 
            </Button>
            <Button variant="ghost" onClick={onCancel} disabled={noteSaving}>
              Cancel
            </Button>

            <Button variant="danger" onClick={onDelete} disabled={noteSaving}>
              Delete
            </Button>
          </div>
        </form>
      ) : (

        // note body if note editing 
        <>
          <div className="note-card-head">
            <div>
              <p className="note-meta">
                {ownerName} · {formatDate(note.updatedAt)} · {note.mood} · {note.visibility}
              </p>
              <h3>{noteTitle}</h3>
            </div>

            {/* if is owner we show the edit button */}
            {isOwner ? (
              <Button variant="ghost" size="small" onClick={() => onEdit(note)}>
                Edit
              </Button>
            ) : null}
          </div>

          <p className="note-body">{note.note || "No note body yet."}</p>
        </>
      )}
    </article>
  );
}
