import "./Footer.css";

export default function Footer() {
  // Shared footer shown on both pages so the app feels complete.
  return (
    <footer className="app-footer">
      <p>
        NoteTheMood Web App created by Alamicrodev. Checkout the github repo at{" "}
        <a
          href="https://github.com/Alamicrodev/NoteTheMood-MERNStack"
          target="_blank"
          rel="noreferrer"
        >
          NoteTheMood GithubRepo
        </a>
        .
      </p>
    </footer>
  );
}
