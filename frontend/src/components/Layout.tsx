import { useEffect, useRef, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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

          <div className="profile-menu" ref={menuRef}>
            <button
              type="button"
              className="profile-trigger"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
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

            {menuOpen && (
              <div className="profile-popover" role="menu">
                <p>
                  <strong>Name:</strong> Rawan Asiri
                </p>
                <p>
                  <strong>Email:</strong> rawan.asiri@smartmonitor.local
                </p>
                <button type="button" className="profile-logout">
                  Logout
                </button>
              </div>
            )}
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
    </div>
  );
}
