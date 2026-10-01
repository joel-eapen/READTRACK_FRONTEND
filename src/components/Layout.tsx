import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../store/AuthContext";
import { Button } from "./ui";
import "./Layout.css";

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <div className="layout">
      <header className="topbar">
        <NavLink to="/" className="topbar__brand">
          READ<span>TRACK</span>
        </NavLink>

        <nav className="topbar__nav" aria-label="Primary">
          <NavLink
            to="/search"
            className={({ isActive }) =>
              `topbar__link label-caps ${isActive ? "is-active" : ""}`
            }
          >
            Search
          </NavLink>
          <NavLink
            to="/library"
            className={({ isActive }) =>
              `topbar__link label-caps ${isActive ? "is-active" : ""}`
            }
          >
            Library
          </NavLink>
        </nav>

        <div className="topbar__user">
          {user ? (
            <>
              <span className="topbar__email label-caps">{user.email}</span>
              <Button variant="neutral" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </>
          ) : null}
        </div>
      </header>

      <main className="layout__main">
        <Outlet />
      </main>

      <footer className="layout__footer label-caps">
        READTRACK — Brutalist Book Library
      </footer>
    </div>
  );
}
