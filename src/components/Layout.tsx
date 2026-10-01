import { NavLink, Outlet } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import "./Layout.css";

export function Layout() {
  const { user } = useUser();

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
            <span className="topbar__email label-caps">
              {user.primaryEmailAddress?.emailAddress ?? user.username}
            </span>
          ) : null}
          <UserButton
            afterSignOutUrl="/signin"
            appearance={{
              elements: {
                avatarBox: {
                  border: "3px solid #111827",
                  borderRadius: "4px",
                },
              },
            }}
          />
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
