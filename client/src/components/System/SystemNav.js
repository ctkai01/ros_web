import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./SystemNav.css";

const SystemNav = () => {
  const [isNavOpen, setIsNavOpen] = useState(false);
  const location = useLocation();
  const toggleNav = () => {
    setIsNavOpen(!isNavOpen);
  };

  const closeNav = () => {
    setIsNavOpen(false);
  };

  // Thêm divider sau các nhóm chức năng
  const shouldAddDivider = (index) => {
    return (
      index === 0 || index === 1 || index === 2 || index === 3 || index === 4
    );
  };

  const menuItems = [{ label: "Settings", path: "/system/settings" }];

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
      <div className={`system-nav nav-common ${isNavOpen ? "show" : ""}`}>
        <h2>System</h2>
        <nav>
          <ul>
            {menuItems.map((item, index) => (
              <React.Fragment key={index}>
                <li>
                  <Link
                    to={item.path}
                    className={location.pathname.startsWith(item.path) ? "active" : ""}
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

export default SystemNav;
