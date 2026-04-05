import Button from "../Button/Button";
import "./NoteCard.css";
import { excerpt, formatDate } from "../../utils/notes";

export default function NoteCard({ note, ownerName, isOwner, isSelected, onOpen, onEdit }) {
  // Each card behaves like a compact social post preview.
  return (
    <article className={`note-card note-post ${isSelected ? "note-card-selected" : ""}`}>
      <button className="note-card-main" type="button" onClick={() => onOpen(note)}>
        <div className="note-card-head">
          <div className="post-avatar">{(note.title || "?").slice(0, 1).toUpperCase()}</div>
          <div className="post-body">
            <div className="post-title-row">
              <div>
                <h3>{note.title}</h3>
                <p className="note-meta">
                  {ownerName} - {formatDate(note.updatedAt)}
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
          <Button variant="secondary" size="small" onClick={() => onEdit(note)}>
            Edit
          </Button>
        </div>
      ) : null}
    </article>
  );
}
