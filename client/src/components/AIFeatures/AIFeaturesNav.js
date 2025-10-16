import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "./AIFeaturesNav.css";

const AIFeaturesNav = () => {
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
  // Thêm divider sau các nhóm chức năng
  const shouldAddDivider = (index) => {
    return (
      index === 0 || index === 1 || index === 2 || index === 3 || index === 4
    );
  };

  const menuItems = [{ label: "Follow-Me", path: "/ai-features/follow-me" }];

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
      <div className={`ai-features-nav nav-common ${isNavOpen ? "show" : ""}`}>
        <h2>AI Features</h2>
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

export default AIFeaturesNav;
