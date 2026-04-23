import Button from "../Button/Button";
import "./Modal.css";

//most code here is simple to understand so little to no comments

export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
}) {
  if (!open) {
    return null;
  }

  return (
    // Overalay covers/dims all the other content 
    // by clicking it you essentially trigger closing the model.
    <div className="modal-overlay" role="presentation" onClick={onClose}>
      <div
        className="modal-panel surface"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(event) => event.stopPropagation()}  //stop propagation: any click on me should not be considered click on overlay.  
                                                      //otherwise it will close the modal. 
      >

        <div className="modal-header">
          <div>
            {title ? <h3 id="modal-title">{title}</h3> : null}
            {description ? <p>{description}</p> : null}
          </div>

          <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
            x
          </button>
        </div>

        <div className="modal-body">{children}</div>

        <div className="modal-footer">
          <Button variant="ghost" onClick={onClose}>
            {cancelLabel}
          </Button>
          {onConfirm ? (
            <Button variant="danger" onClick={onConfirm}>
              {confirmLabel}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
