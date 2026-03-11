import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Home() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="home-page">
      <header>
        <h1>Valence</h1>
        <div>
          <span>Hello, {user?.displayName || user?.email}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <main>
        <p>Chat with the mood assistant to get started.</p>
      </main>
    </div>
  );
}
