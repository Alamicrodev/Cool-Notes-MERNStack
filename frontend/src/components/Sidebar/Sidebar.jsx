import "./Sidebar.css";

export default function Sidebar({ children }) {
  // The sidebar keeps the editor and preview stacked in one predictable column.
  return <aside className="sidebar-column">{children}</aside>;
}
