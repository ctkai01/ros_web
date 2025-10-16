import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Login";
import NavigateBar from "./components/NavigateBar/NavigateBar";
import Header from "./components/Header/Header";
import Monitoring from "./components/Monitoring/Monitoring";
import Setup from "./components/Setup/Setup";
import Dashboard from "./components/Dashboard/Dashboard";
import { MissionProvider } from "./contexts/MissionContext";
import "./App.css";
import AIFeatures from "./components/AIFeatures";
function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [isNavOpen, setIsNavOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    const savedLoginState = localStorage.getItem("isLoggedIn");

    if (savedToken && savedUser && savedLoginState) {
      setUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    } else {
      // Nếu thiếu bất kỳ thông tin nào, đăng xuất
      handleLogout();
    }
  }, []);

  // Set dynamic viewport height
  useEffect(() => {
    const setViewportHeight = () => {
      const vh = window.innerHeight;
      document.documentElement.style.setProperty(
        "--viewport-height",
        `${vh}px`
      );

      // Add dynamic-height class to containers
      const appContent = document.querySelector(".app-content");
      const setupContainer = document.querySelector(".setup-container");

      if (appContent) appContent.classList.add("dynamic-height");
      if (setupContainer) setupContainer.classList.add("dynamic-height");
    };

    // Set initial height
    setViewportHeight();

    // Update on resize and orientation change
    window.addEventListener("resize", setViewportHeight);
    window.addEventListener("orientationchange", setViewportHeight);

    return () => {
      window.removeEventListener("resize", setViewportHeight);
      window.removeEventListener("orientationchange", setViewportHeight);
    };
  }, []);

  const handleLogin = (userData) => {
    console.log("Login successful:", {
      username: userData.user.name,
      hasAccessToken: !!userData.accessToken,
      hasRefreshToken: !!userData.refreshToken,
    });

    setUser(userData);
    setIsLoggedIn(true);

    // Store user data in localStorage
    localStorage.setItem("token", userData.accessToken);
    localStorage.setItem("refreshToken", userData.refreshToken);
    localStorage.setItem("userName", userData.user.username);
    localStorage.setItem("user", JSON.stringify(userData.user));
    localStorage.setItem("isLoggedIn", "true");

    // Verify data was stored
    console.log("LocalStorage state after login:", {
      hasToken: !!localStorage.getItem("token"),
      hasRefreshToken: !!localStorage.getItem("refreshToken"),
      isLoggedIn: localStorage.getItem("isLoggedIn"),
    });
  };

  const clearMapCache = () => {
    // Clear all map-related data from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("map_")) {
        localStorage.removeItem(key);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setIsLoggedIn(false);
    // Clear map cache first
    clearMapCache();
    // Clear authentication and user data
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("userName");
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
  };

  const handleNavToggle = (isOpen) => {
    console.log("App: Navigation toggle called with isOpen =", isOpen);
    setIsNavOpen(isOpen);
  };

  return (
    <MissionProvider>
      <Router>
        <div className="app">
          {isLoggedIn && <Header />}
          {!isLoggedIn ? (
            <Login onLogin={handleLogin} />
          ) : (
            <div className="app-content">
              <NavigateBar
                onLogout={handleLogout}
                user={user}
                onNavToggle={handleNavToggle}
              />
              <main className={`main-content ${isNavOpen ? "shifted" : ""}`}>
                <Routes>
                  <Route
                    path="/dashboard/*"
                    element={<Dashboard isNavOpen={isNavOpen} />}
                  />
                  <Route
                    path="/monitoring/*"
                    element={<Monitoring isNavOpen={isNavOpen} />}
                  />
                  <Route
                    path="/ai-features/*"
                    element={<AIFeatures isNavOpen={isNavOpen} />}
                  />
                  <Route
                    path="/setup/*"
                    element={<Setup isNavOpen={isNavOpen} />}
                  />
                  <Route path="/" element={<Navigate to="/dashboard" />} />
                  <Route
                    path="*"
                    element={
                      <div className="content-wrapper">
                        <h2>Welcome to Robot Control System</h2>
                        <p>
                          Please select an option from the navigation menu to
                          begin.
                        </p>
                      </div>
                    }
                  />
                </Routes>
              </main>
            </div>
          )}
        </div>
      </Router>
    </MissionProvider>
  );
}

export default App;
