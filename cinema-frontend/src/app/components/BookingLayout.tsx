"use client";
import "./BookingLayout.css";
import Image from "next/image";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "./AuthContext";
import ProtectedRoute from "./ProtectedRoute";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
}

function BookingLayout() {
  const { user, logout } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedEventDetails = events.find(
    (event) => event._id === selectedEvent
  );

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("http://localhost:5000/api/events", {
          cache: "no-store",
          credentials: "include",
        });
        if (!res.ok) {
          throw new Error("Failed to fetch events");
        }
        const fetchedEvents = await res.json();
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0) {
          setSelectedEvent(fetchedEvents[0]._id);
        }
      } catch (error) {
        setError("Failed to fetch events");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Failed to logout");
      }
      logout();
    } catch (error: any) {
      console.error("Logout error:", error.message);
    }
  };

  return (
    <div className="booking-layout">
      <div className="booking-left">
        <div className="header-group">
          <span className="booking-heading">Hello, {user?.name || "Guest"}</span>
          <button onClick={handleLogout} className="logout-button" aria-label="Logout">
            Logout
          </button>
        </div>
        <h2 className="booking-title">
          Made your show booking experience effortless!
        </h2>
        <p className="booking-description">
          Theatre show tickets, now simpler and faster than ever — so you can
          focus on the magic of the stage.
        </p>

        <div className="booking-group">
          <label className="booking-label">Select Event</label>
          <select
            className="booking-select"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            aria-label="Select an event"
            disabled={isLoading || events.length === 0}
          >
            {isLoading ? (
              <option value="">Loading events...</option>
            ) : events.length === 0 ? (
              <option value="">No future events available</option>
            ) : (
              events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name} -{" "}
                  {new Date(event.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </option>
              ))
            )}
          </select>
        </div>
        <div className="booking-group">
          <label className="booking-label">Show Details</label>
          {isLoading ? (
            <div className="spinner"></div>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : selectedEventDetails ? (
            <div className="event-details">
              <p>
                <strong>Date:</strong>{" "}
                {new Date(selectedEventDetails.date).toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </p>
              <p>
                <strong>Time:</strong> {selectedEventDetails.time}
              </p>
              <p>
                <strong>Venue:</strong> {selectedEventDetails.venue}
              </p>
              <p>
                <strong>Description:</strong> {selectedEventDetails.description}
              </p>
            </div>
          ) : (
            <p className="no-events">No future events available</p>
          )}
        </div>

        <Link
          href={`/seat-layout?eventId=${selectedEvent}`}
          className={`book-button ${
            !selectedEvent || isLoading || events.length === 0 ? "disabled" : ""
          }`}
          aria-label="Book Seats Now"
        >
          Book Seats Now
        </Link>
      </div>

      <div className="booking-right">
        <Image
          src="/theater.jpg"
          alt="Theater Scene"
          fill
          style={{ objectFit: "cover" }}
          onError={() => console.error("Failed to load theater image")}
        />
      </div>
    </div>
  );
}

export default function ProtectedBookingLayout() {
  return (
    <ProtectedRoute>
      <BookingLayout />
    </ProtectedRoute>
  );
}