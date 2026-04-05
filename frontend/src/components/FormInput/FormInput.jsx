import "./FormInput.css";

export default function FormInput({ label, as: Tag = "input", className = "", wrapperClassName = "", children, ...props }) {
  const controlClassName = [Tag === "textarea" ? "textarea" : "input", className].filter(Boolean).join(" ");
  const fieldClassName = ["field", wrapperClassName].filter(Boolean).join(" ");
  const needsChildren = Tag !== "input" && Tag !== "textarea";

  // One wrapper keeps labels, selects, and textareas aligned the same way.
  return (
    <label className={fieldClassName}>
      {label ? <span>{label}</span> : null}
      <Tag className={controlClassName} {...props}>
        {needsChildren ? children : null}
      </Tag>
    </label>
  );
}
