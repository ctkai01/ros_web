import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import "./NavigateBar.css";
// Import các ảnh icon
import { ReactComponent as DashboardIcon } from "../../assets/icons/dashboard.svg";
import { ReactComponent as SetupIcon } from "../../assets/icons/setup.svg";
import { ReactComponent as MonitoringIcon } from "../../assets/icons/monitoring.svg";
import { ReactComponent as SystemIcon } from "../../assets/icons/system.svg";
import { ReactComponent as HelpIcon } from "../../assets/icons/help.svg";
import { ReactComponent as LogoutIcon } from "../../assets/icons/logout.svg";
import { ReactComponent as AIFeaturesIcon } from "../../assets/icons/ai.svg";
import collapseIcon from "../../assets/icons/collapse.png";
import expandIcon from "../../assets/icons/expand.png";

const NavigateBar = ({ onLogout, onNavToggle }) => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const toggleNav = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const newState = !isNavOpen;
    console.log(
      "NavigateBar: Toggling navigation from",
      isNavOpen,
      "to",
      newState
    );
    setIsNavOpen(newState);
    if (onNavToggle) {
      onNavToggle(newState);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      e.stopPropagation();
      toggleNav();
    }
  };

  // Handle touch events to prevent page reload
  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchEnd = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleNav();
  };

  const isActive = (path) => {
    if (path === "/monitoring") {
      return location.pathname.startsWith("/monitoring");
    }
    if (path === "/setup") {
      return location.pathname.startsWith("/setup");
    }

    if (path === "/ai-features") {
      return location.pathname.startsWith("/ai-features");
    }


    if (path === "/system") {
      return location.pathname.startsWith("/system");
    }
    return location.pathname === path;
  };

  // Thêm divider sau các nút chính
  const shouldAddDivider = (index) => {
    return (
      index === 0 || index === 1 || index === 2 || index === 3 || index === 4
    );
  };

  const menuItems = [
    { icon: DashboardIcon, label: "DASHBOARD", path: "/dashboard" },
    { icon: SetupIcon, label: "SETUP", path: "/setup" },
    { icon: MonitoringIcon, label: "MONITORING", path: "/monitoring" },
    { icon: AIFeaturesIcon, label: "AI LIST", path: "/ai-features" },
    { icon: SystemIcon, label: "SYSTEM", path: "/system" },
    { icon: HelpIcon, label: "HELP", path: "/help" },
    { icon: LogoutIcon, label: "LOGOUT", path: "/logout", onClick: onLogout },
  ];

  return (
    <div className="page-container" onMouseDown={(e) => e.preventDefault()}>
      <nav className={`navigate-sidebar ${isNavOpen ? "open" : ""}`}>
        <ul className="nav-menu" onMouseDown={(e) => e.preventDefault()}>
          <li className="nav-item">
            <div
              className="nav-link toggle-nav"
              role="button"
              tabIndex={0}
              onClick={toggleNav}
              onKeyDown={handleKeyDown}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              aria-label={
                isNavOpen ? "Collapse navigation" : "Expand navigation"
              }
              aria-expanded={isNavOpen}
            >
              <span className="nav-icon">
                <img
                  src={isNavOpen ? collapseIcon : expandIcon}
                  alt={isNavOpen ? "Collapse" : "Expand"}
                  className="icon-image"
                />
              </span>
            </div>
          </li>
          {menuItems.map((item, index) => (
            <React.Fragment key={index}>
              <li className="nav-item">
                {item.onClick ? (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.onClick();
                      return false;
                    }}
                    className="nav-link"
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      item.onClick();
                    }}
                  >
                    <span className="nav-icon">
                      <item.icon className="icon-image" />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(item.path);
                    }}
                    className={`nav-link ${
                      isActive(item.path) ? "active" : ""
                    }`}
                    onMouseDown={(e) => e.preventDefault()}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      navigate(item.path);
                    }}
                  >
                    <span className="nav-icon">
                      <item.icon className="icon-image" />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                )}
              </li>
              {shouldAddDivider(index) && <div className="nav-divider" />}
            </React.Fragment>
          ))}
        </ul>
      </nav>
    </div>
  );
};

export default NavigateBar;
