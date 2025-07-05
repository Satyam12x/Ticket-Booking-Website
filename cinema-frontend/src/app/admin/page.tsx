'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import Seat from "../components/Seat";
import BookingModal from "../components/BookingModal";
import DeleteEventModal from "../components/DeleteEventModal";
import { FaPlus, FaTrash, FaTicketAlt } from "react-icons/fa";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
}

interface SeatData {
  _id: string;
  seatId: string;
  row: number;
  column: string;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    description: "",
    venue: "",
    password: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/events");
      setEvents(response.data);
      if (response.data.length > 0 && !selectedEvent) {
        setSelectedEvent(response.data[0].date);
      }
    } catch (err) {
      setError("Failed to fetch events");
    }
  };

  const fetchSeats = async (date: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/seats?date=${date}`);
      setSeats(response.data);
    } catch (err) {
      setError("Failed to fetch seats");
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post("http://localhost:5000/api/events", newEvent);
      setNewEvent({ name: "", date: "", time: "", description: "", venue: "", password: "" });
      fetchEvents();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event");
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchEvents();
    setSelectedEvent("");
    setSeats([]);
  };

  useEffect(() => {
    if (selectedEvent) {
      fetchSeats(selectedEvent);
    }
  }, [selectedEvent]);

  const handleSeatClick = (seat: SeatData) => {
    if (seat.status === "available") {
      setSelectedSeat(seat.seatId);
      setIsBookingModalOpen(true);
    }
  };

  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="theater-container">
      <h1>Admin Dashboard</h1>
      <div className="card">
        <h3>Create New Event</h3>
        {error && <p className="error-text">{error}</p>}
        <form style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <input
              type="text"
              value={newEvent.name}
              onChange={(e) => setNewEvent({ ...newEvent, name: e.target.value })}
              className="input-field"
              required
              placeholder="Enter event name"
            />
            <span className="input-label">Event Name</span>
          </div>
          <div className="input-group">
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
              className="input-field"
              required
            />
            <span className="input-label">Date</span>
          </div>
          <div className="input-group">
            <input
              type="time"
              value={newEvent.time}
              onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
              className="input-field"
              required
            />
            <span className="input-label">Time</span>
          </div>
          <div className="input-group">
            <input
              type="text"
              value={newEvent.venue}
              onChange={(e) => setNewEvent({ ...newEvent, venue: e.target.value })}
              className="input-field"
              required
              placeholder="Enter venue"
            />
            <span className="input-label">Venue</span>
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <textarea
              value={newEvent.description}
              onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
              className="input-field"
              required
              placeholder="Enter event description"
              style={{ minHeight: '80px' }}
            />
            <span className="input-label">Description</span>
          </div>
          <div className="input-group">
            <input
              type="password"
              value={newEvent.password}
              onChange={(e) => setNewEvent({ ...newEvent, password: e.target.value })}
              className="input-field"
              required
              placeholder="Enter admin password"
            />
            <span className="input-label">Admin Password</span>
          </div>
          <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
            <button type="submit" className="submit-btn">
              <FaPlus style={{ marginRight: '10px' }} /> Create Event
            </button>
          </div>
        </form>
      </div>
      <div className="card">
        <h3>Upcoming Events</h3>
        {events.length === 0 ? (
          <p style={{ color: '#6b7280' }}>No upcoming events.</p>
        ) : (
          <div className="event-grid">
            {events.map((event) => (
              <div key={event._id} className="event-card">
                <h3 style={{ fontSize: '1.25rem', marginBottom: '10px' }}>{event.name}</h3>
                <p>Date: {event.date}</p>
                <p>Time: {event.time}</p>
                <p>Venue: {event.venue}</p>
                <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  Description: {event.description}
                </p>
                <button
                  onClick={() => handleDeleteEvent(event._id)}
                  className="cancel-btn btn-small"
                  style={{ marginTop: '10px' }}
                >
                  <FaTrash style={{ marginRight: '10px' }} /> Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="card">
        <h3>Manage Seats</h3>
        <div className="input-group">
          <select
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            className="input-field"
          >
            <option value="">Select an event</option>
            {events.map((event) => (
              <option key={event._id} value={event.date}>
                {event.name} - {event.date} {event.time} at {event.venue}
              </option>
            ))}
          </select>
          <span className="input-label">Select Event</span>
        </div>
        {selectedEvent && (
          <div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '15px' }}>Seat Layout</h3>
            <div className="stage">STAGE</div>
            <div className="seat-grid-container">
              <div className="door">DOOR</div>
              <div>
                <div className="column-row">
                  {columns.map((col) => (
                    <div key={col} className="column-label">{col}</div>
                  ))}
                </div>
                <div className="seat-grid">
                  {Array.from({ length: 10 }, (_, row) => (
                    <div key={row + 1} className="seat-row">
                      <div className="row-label">{row + 1}</div>
                      {columns.map((col) => {
                        const seat = seats.find((s) => s.seatId === `${col}${row + 1}`);
                        return seat ? (
                          <Seat
                            key={seat.seatId}
                            seat={seat}
                            onClick={() => handleSeatClick(seat)}
                          />
                        ) : null;
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button
                onClick={() => {
                  const availableSeat = seats.find((seat) => seat.status === "available");
                  if (availableSeat) handleSeatClick(availableSeat);
                }}
                className="proceed-btn btn-small"
                disabled={!seats.some((seat) => seat.status === "available")}
              >
                <FaTicketAlt style={{ marginRight: '10px' }} /> Book Seat
              </button>
            </div>
          </div>
        )}
      </div>
      {isBookingModalOpen && selectedSeat && (
        <BookingModal
          seatId={selectedSeat}
          price={300}
          quantity={1}
          onClose={() => setIsBookingModalOpen(false)}
          bookingDate={selectedEvent}
        />
      )}
      {isDeleteModalOpen && eventToDelete && (
        <DeleteEventModal
          eventId={eventToDelete}
          onClose={() => setIsDeleteModalOpen(false)}
          onDeleteSuccess={handleDeleteSuccess}
        />
      )}
    </div>
  );
}