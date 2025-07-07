"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FaBell } from "react-icons/fa";
import axios from "axios";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
  totalSeats: number;
}

export default function Header() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<Event[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/events/recent");
        setNotifications(response.data);
      } catch (error) {
        console.error("Failed to fetch notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const handleViewDetails = (eventId: string) => {
    router.push(`/?eventId=${eventId}`);
    setIsDropdownOpen(false);
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="logo-container">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2L2 7L12 12L22 7L12 2Z"
                fill="#0C7FF2"
              />
              <path
                d="M2 17L12 22L22 17"
                stroke="#0C7FF2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M2 12L12 17L22 12"
                stroke="#0C7FF2"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <span className="logo-text">MBAS</span>
        </div>
        <div className="nav-container">
          <nav className="nav">
            <a href="/" className="nav-link">Home</a>
            <a href="/admin" className="nav-link">Admin</a>
            <a href="/about" className="nav-link">About</a>
          </nav>
          <div className="notification-container">
            <button className="notification-btn" onClick={toggleDropdown}>
              <FaBell className="notification-icon" />
              {notifications.length > 0 && (
                <span className="notification-badge">{notifications.length}</span>
              )}
            </button>
            {isDropdownOpen && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <p className="notification-item">No new events</p>
                ) : (
                  notifications.map((event) => (
                    <div key={event._id} className="notification-item">
                      <p>New event: {event.name}</p>
                      <p>
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {event.time}
                      </p>
                      <button
                        className="book-tickets-btn btn-small"
                        onClick={() => handleViewDetails(event._id)}
                      >
                        View Details
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <div
            // className="profile-picture"
            // style={{
            //   backgroundImage: `url("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80")`,
            // }}
          ></div>
        </div>
      </div>
    </header>
  );
}