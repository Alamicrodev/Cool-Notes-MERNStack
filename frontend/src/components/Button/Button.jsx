import "./Button.css";

const VARIANT_CLASSES = {
  primary: "button-primary",
  ghost: "button-ghost",
  secondary: "button-secondary",
  danger: "button-danger",
  filter: "button-filter",
};

const SIZE_CLASSES = {
  small: "button-small",
  default: "",
  block: "button-block",
};

export default function Button({ variant = "primary", size = "default", className = "", type = "button", ...props }) {
  // Keep the visual language consistent across the app.
  const classes = ["button", VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary, SIZE_CLASSES[size] || "", className]
    .filter(Boolean)
    .join(" ");

  return <button type={type} className={classes} {...props} />;
}
