import { useEffect, useState } from "react";
import { loadSession, saveSession, clearSession, type Session } from "./session";
import { getAppSettings, type AppSettings } from "./api";
import { getCurrentRoute, navigate, type Route } from "./route";
import LandingPage from "./pages/LandingPage";
import JoinPage, { type JoinResult } from "./pages/JoinPage";
import JoinConfirmPage from "./pages/JoinConfirmPage";
import LoginPage from "./pages/LoginPage";
import BoardPage from "./pages/BoardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import AdminPage from "./pages/AdminPage";
import NavBar from "./components/NavBar";
import CountdownBanner from "./components/CountdownBanner";

type View = "board" | "leaderboard";
type LoggedOutView = "landing" | "join" | "joinConfirm" | "login";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [view, setView] = useState<View>("board");
  const [loggedOutView, setLoggedOutView] = useState<LoggedOutView>("landing");
  const [joinResult, setJoinResult] = useState<JoinResult | null>(null);
  const [route, setRoute] = useState<Route>(getCurrentRoute());
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(loadSession());
    setReady(true);

    getAppSettings()
      .then(setSettings)
      .catch(() => {
        /* fall back to defaults rendered below if settings can't load */
      });

    const onPopState = () => setRoute(getCurrentRoute());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  function handleLogin(next: Session) {
    saveSession(next);
    setSession(next);
    setView("board");
    setLoggedOutView("landing");
    setJoinResult(null);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
    setLoggedOutView("landing");
  }

  function goTo(nextRoute: Route) {
    navigate(nextRoute);
    setRoute(nextRoute);
  }

  if (!ready) return null;

  if (route === "admin") {
    return <AdminPage onBack={() => goTo("home")} />;
  }

  const title = settings?.title ?? "QA Winter Wellness Challenge";
  const kicker = settings?.kicker ?? "Pause Every Day";
  const footerNote = settings?.footer_note ?? "Complete all 25 challenges during Winter! (June to August)";

  return (
    <div className="app-shell">
      <header className="app-header">
        <p className="app-kicker">{kicker}</p>
        <h1 className="app-title">{title}</h1>
        <CountdownBanner endDate={settings?.challenge_end_date ?? ""} />
      </header>

      {session && (
        <NavBar view={view} onChangeView={setView} username={session.username} onLogout={handleLogout} />
      )}

      <main className="app-main">
        {!session ? (
          loggedOutView === "landing" ? (
            <LandingPage
              onJoin={() => setLoggedOutView("join")}
              onLogin={() => setLoggedOutView("login")}
              signupsOpen={settings?.signups_open !== "false"}
            />
          ) : loggedOutView === "join" ? (
            <JoinPage
              onJoined={(result) => {
                setJoinResult(result);
                setLoggedOutView("joinConfirm");
              }}
              onBack={() => setLoggedOutView("landing")}
            />
          ) : loggedOutView === "joinConfirm" && joinResult ? (
            <JoinConfirmPage
              result={joinResult}
              onContinue={() =>
                handleLogin({
                  participantId: joinResult.participantId,
                  pin: joinResult.pin,
                  username: joinResult.username,
                })
              }
            />
          ) : (
            <LoginPage onLogin={handleLogin} onBack={() => setLoggedOutView("landing")} />
          )
        ) : view === "board" ? (
          <BoardPage session={session} />
        ) : (
          <LeaderboardPage />
        )}
      </main>

      <footer className="app-footer">
        <p>{title}</p>
        <p>{footerNote}</p>
        <p>
          <a
            href="admin"
            className="admin-link"
            onClick={(e) => {
              e.preventDefault();
              goTo("admin");
            }}
          >
            Admin
          </a>
        </p>
      </footer>
    </div>
  );
}
