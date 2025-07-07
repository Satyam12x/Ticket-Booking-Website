"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa";
import Link from "next/link";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
}

export default function Header() {
  const [newEvents, setNewEvents] = useState<Event[]>([]);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  useEffect(() => {
    const lastChecked = localStorage.getItem("lastEventCheck")
      ? new Date(localStorage.getItem("lastEventCheck")!)
      : new Date();

    const fetchNewEvents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/events");
        const events = response.data;
        const recentEvents = events.filter(
          (event: Event) => new Date(event.date) > lastChecked
        );
        setNewEvents(recentEvents);
        localStorage.setItem("lastEventCheck", new Date().toISOString());
      } catch (err) {
        console.error("Failed to fetch events for notifications:", err);
      }
    };

    fetchNewEvents();
    const interval = setInterval(fetchNewEvents, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

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
            <Link href="/" className="nav-link">Home</Link>
            <Link href="/admin" className="nav-link">Admin</Link>
          </nav>
          <button
            className="notification-btn"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
          >
            <FaBell className="notification-icon" />
            {newEvents.length > 0 && (
              <span className="notification-badge">{newEvents.length}</span>
            )}
          </button>
          <div
            className="profile-picture"
            style={{
              backgroundImage: `url("https://via.placeholder.com/40")`,
            }}
          ></div>
          {isNotificationOpen && (
            <div className="notification-dropdown">
              {newEvents.length === 0 ? (
                <p className="notification-item">No new events</p>
              ) : (
                newEvents.map((event) => (
                  <p key={event._id} className="notification-item">
                    New Event: {event.name} on {event.date} at {event.time}
                  </p>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}