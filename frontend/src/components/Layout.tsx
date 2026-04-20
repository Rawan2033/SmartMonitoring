import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import SolarScene from "./SolarScene";

type LayoutProps = {
  children: React.ReactNode;
};

const navItems = [
  { to: "/dashboard", label: "Dashboard Overview" },
  { to: "/historical", label: "Historical Data" },
  { to: "/awareness", label: "EDS Awareness" },
  { to: "/hub", label: "EDS Hub" },
  { to: "/settings", label: "Settings" }
];

export default function Layout({ children }: LayoutProps): JSX.Element {
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!profileOpen) return;

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        setProfileOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [profileOpen]);

  return (
    <div className="app-shell">
      <header className="topbar">
        <span className="topbar-glow glow-a" />
        <span className="topbar-glow glow-b" />

        <div className="topbar-left">
          <h1>Smart Monitoring Platform</h1>
          <p>Electrodynamic Self-Cleaning System for Solar Panels</p>
          <div className="topbar-meta">
            <span className="meta-chip live">Live Monitoring</span>
            <span className="meta-chip ai">AI Insights</span>
            <span className="meta-chip clean">EDS Active</span>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-scene">
            <SolarScene className="topbar-scene-visual" />
          </div>

          <div className="profile-menu">
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setProfileOpen(true)}
              aria-expanded={profileOpen}
              aria-haspopup="dialog"
            >
              <span className="profile-avatar" aria-hidden>
                <svg viewBox="0 0 24 24" role="img">
                  <path d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.26 4.26 0 0 0 12 12Zm0 2.25c-4.25 0-7.75 2.14-7.75 4.75A.75.75 0 0 0 5 19.75h14a.75.75 0 0 0 .75-.75c0-2.61-3.5-4.75-7.75-4.75Z" />
                </svg>
              </span>
              <span className="profile-text">
                <strong>Rawan Asiri</strong>
                <small>Project Admin</small>
              </span>
            </button>
          </div>
        </div>
      </header>

      <nav className="navbar">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="main-content">{children}</main>

      {profileOpen && (
        <div className="profile-modal-backdrop" onClick={() => setProfileOpen(false)}>
          <article
            className="profile-modal modal-enter"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <header className="profile-modal-head">
              <div className="profile-modal-identity">
                <span className="profile-modal-avatar" aria-hidden>
                  <svg viewBox="0 0 24 24" role="img">
                    <path d="M12 12a4.25 4.25 0 1 0-4.25-4.25A4.26 4.26 0 0 0 12 12Zm0 2.25c-4.25 0-7.75 2.14-7.75 4.75A.75.75 0 0 0 5 19.75h14a.75.75 0 0 0 .75-.75c0-2.61-3.5-4.75-7.75-4.75Z" />
                  </svg>
                </span>
                <div>
                  <h3 id="profile-modal-title">Rawan Asiri</h3>
                  <p>Project Admin</p>
                </div>
              </div>
              <button type="button" className="profile-modal-close" onClick={() => setProfileOpen(false)}>
                X
              </button>
            </header>

            <div className="profile-modal-content">
              <div className="profile-detail-grid">
                <div className="profile-detail-card">
                  <small>Name</small>
                  <p>Rawan Asiri</p>
                </div>
                <div className="profile-detail-card">
                  <small>Email</small>
                  <p>rawan.asiri@smartmonitor.local</p>
                </div>
                <div className="profile-detail-card">
                  <small>Role</small>
                  <p>Project Admin</p>
                </div>
                <div className="profile-detail-card">
                  <small>Workspace</small>
                  <p>Smart Monitoring Platform</p>
                </div>
              </div>

              <div className="profile-modal-note">
                <strong>Active session</strong>
                <p>You are signed in with access to dashboard controls, historical review, and runtime settings.</p>
              </div>

              <div className="profile-modal-actions">
                <button type="button" className="profile-secondary" onClick={() => setProfileOpen(false)}>
                  Close
                </button>
                <button type="button" className="profile-logout">
                  Logout
                </button>
              </div>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

