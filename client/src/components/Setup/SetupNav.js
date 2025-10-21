import React, { useState } from "react";

import { Link, useLocation } from "react-router-dom";
import "./SetupNav.css";

const SetupNav = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };
  // Add divider after function groups
  const shouldAddDivider = (index) => {
    return index === 0 || index === 1 || index === 2;
  };

  const menuItems = [
    { label: "Schedule", path: "/setup/schedule" },
    { label: "Robots", path: "/setup/robots" },
    { label: "Elevators", path: "/setup/elevators" },
    { label: "Missions", path: "/setup/missions" },
    { label: "Maps", path: "/setup/maps" },
    { label: "Sounds", path: "/setup/sounds" },
    { label: "Footprints", path: "/setup/footprints" },
    { label: "Transitions", path: "/setup/transitions" },
    { label: "Users", path: "/setup/users" },
    { label: "User groups", path: "/setup/user-groups" },
    { label: "Paths", path: "/setup/paths" },
    { label: "Path guides", path: "/setup/path-guides" },
  ];

  return (
    <>
      <button
        className={`nav-toggle ${isNavOpen ? "collapsed" : ""}`}
        onClick={toggleNav}
        aria-label={isNavOpen ? "Close navigation" : "Open navigation"}
      />
      <div
        className={`nav-overlay ${isNavOpen ? "show" : ""}`}
        onClick={closeNav}
      />
      <div className={`setup-nav nav-common ${isNavOpen ? "show" : ""}`}>
        <h2>Setup</h2>
        <nav>
          <ul>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <li>
                  <Link
                    to={item.path}
                    className={location.pathname === item.path ? "active" : ""}
                  >
                    {item.label}
                    <span className="arrow">›</span>
                  </Link>
                </li>
                {shouldAddDivider(index) && <div className="nav-divider" />}
              </React.Fragment>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default SetupNav;
