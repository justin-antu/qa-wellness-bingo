interface NavBarProps {
  view: "board" | "leaderboard";
  onChangeView: (view: "board" | "leaderboard") => void;
  username: string;
  onLogout: () => void;
}

export default function NavBar({ view, onChangeView, username, onLogout }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-tabs">
        <button
          type="button"
          className={`navbar-tab ${view === "board" ? "navbar-tab-active" : ""}`}
          onClick={() => onChangeView("board")}
        >
          My Board
        </button>
        <button
          type="button"
          className={`navbar-tab ${view === "leaderboard" ? "navbar-tab-active" : ""}`}
          onClick={() => onChangeView("leaderboard")}
        >
          Leaderboard
        </button>
      </div>
      <div className="navbar-user">
        <span>Hi, {username}</span>
        <button type="button" className="link-button" onClick={onLogout}>
          Log out
        </button>
      </div>
    </nav>
  );
}
