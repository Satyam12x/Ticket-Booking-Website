"use client";
import { useState } from "react";
import { FaBell } from "react-icons/fa";

export default function Header() {
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const notifications = [
    "New booking for The Music Festival",
    "Event The Comedy Show is sold out",
    "New user registered",
  ];

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M24 45.8096C19.6865 45.8096 15.4698 44.5305 11.8832 42.134C8.29667 39.7376 5.50128 36.3314 3.85056 32.3462C2.19985 28.361 1.76794 23.9758 2.60947 19.7452C3.451 15.5145 5.52816 11.6284 8.57829 8.5783C11.6284 5.52817 15.5145 3.45101 19.7452 2.60948C23.9758 1.76795 28.361 2.19986 32.3462 3.85057C36.3314 5.50129 39.7376 8.29668 42.134 11.8833C44.5305 15.4698 45.8096 19.6865 45.8096 24L24 24L24 45.8096Z"
                fill="currentColor"
              ></path>
            </svg>
          </div>
          <h2 className="logo-text">MBAS</h2>
        </div>
        <div className="nav-container">
          <nav className="nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/explore" className="nav-link">Explore</a>
            <a href="/create" className="nav-link">Create</a>
            <a href="/my-events" className="nav-link">My Events</a>
          </nav>
          <button
            className="notification-btn"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <FaBell className="notification-icon" />
            {notifications.length > 0 && (
              <span className="notification-badge">{notifications.length}</span>
            )}
          </button>
          {isNotificationOpen && (
            <div className="notification-dropdown">
              {notifications.map((notification, index) => (
                <div key={index} className="notification-item">
                  {notification}
                </div>
              ))}
            </div>
          )}
          <div
            className="profile-picture"
            style={{ backgroundImage: `url("https://via.placeholder.com/40")` }}
          ></div>
        </div>
      </div>
    </header>
  );
}