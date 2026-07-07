import AuthCard from "./components/AuthCard";
import AdminPanel from "./components/AdminPanel";
import VoterPanel from "./components/VoterPanel";
import { useAuth } from "./context/AuthContext";

export default function App() {
  const { user, token, loading, logout } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const kioskMode = params.get("kiosk") === "1";
  const initialElectionId = params.get("electionId") || "";
  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.username;

  if (loading) {
    return (
      <main className="app-shell center-view">
        <div className="loader" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell auth-view">
        <div className="aurora-bg" />
        <AuthCard />
      </main>
    );
  }

  if (kioskMode) {
    return (
      <main className="app-shell kiosk-view">
        <div className="hero-strip">
          <div>
            <p className="eyebrow">Assisted Voting Booth</p>
            <h1>School Election Voting</h1>
            <p>Click one candidate tile to cast a vote.</p>
          </div>
          <button className="secondary-btn" onClick={logout} type="button">
            Logout
          </button>
        </div>

        <VoterPanel token={token} initialElectionId={initialElectionId} kioskMode />
      </main>
    );
  }

  return (
    <main className="app-shell dashboard-view">
      <div className="hero-strip">
        <div>
          <p className="eyebrow">Digital Polling Platform</p>
          <h1>Welcome, {displayName}</h1>
          <p>{user.is_admin ? "Admin Control Center" : "Student Voting Dashboard"}</p>
        </div>
        <button className="secondary-btn" onClick={logout} type="button">
          Logout
        </button>
      </div>

      {user.is_admin ? <AdminPanel token={token} /> : <VoterPanel token={token} />}
    </main>
  );
}
