'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import Seat from "../components/Seat";
import DeleteEventModal from "../components/DeleteEventModal";
import BookingModal from "../components/BookingModal";
import { FaPlus, FaTrash } from "react-icons/fa";

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
  row: string;
  column: number;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [newEvent, setNewEvent] = useState({
    name: "",
    date: "",
    time: "",
    description: "",
    venue: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    date: "",
    time: "",
    description: "",
    venue: "",
    password: "",
  });
  const [submitError, setSubmitError] = useState("");
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

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
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Failed to fetch events");
    }
  };

  const fetchSeats = async (date: string) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/seats?date=${date}`);
      setSeats(response.data);
    } catch (err) {
      setSubmitError("Failed to fetch seats");
    }
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

  const validateForm = () => {
    const newErrors = {
      name: "",
      date: "",
      time: "",
      description: "",
      venue: "",
      password: "",
    };
    let isValid = true;

    if (!newEvent.name.trim()) {
      newErrors.name = "Event name is required";
      isValid = false;
    } else if (newEvent.name.length < 3) {
      newErrors.name = "Event name must be at least 3 characters";
      isValid = false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!newEvent.date) {
      newErrors.date = "Date is required";
      isValid = false;
    } else if (!dateRegex.test(newEvent.date)) {
      newErrors.date = "Invalid date format (YYYY-MM-DD)";
      isValid = false;
    } else {
      const today = new Date().toISOString().split('T')[0];
      if (newEvent.date < today) {
        newErrors.date = "Date must be today or in the future";
        isValid = false;
      }
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!newEvent.time) {
      newErrors.time = "Time is required";
      isValid = false;
    } else if (!timeRegex.test(newEvent.time)) {
      newErrors.time = "Invalid time format (HH:MM)";
      isValid = false;
    }

    if (!newEvent.venue.trim()) {
      newErrors.venue = "Venue is required";
      isValid = false;
    } else if (newEvent.venue.length < 3) {
      newErrors.venue = "Venue must be at least 3 characters";
      isValid = false;
    }

    if (!newEvent.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (newEvent.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    }

    if (!newEvent.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (newEvent.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });

    // Real-time validation
    const newErrors = { ...errors };
    if (name === "name") {
      newErrors.name =
        !value.trim() ? "Event name is required" :
        value.length < 3 ? "Event name must be at least 3 characters" : "";
    } else if (name === "date") {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      const today = new Date().toISOString().split('T')[0];
      newErrors.date =
        !value ? "Date is required" :
        !dateRegex.test(value) ? "Invalid date format (YYYY-MM-DD)" :
        value < today ? "Date must be today or in the future" : "";
    } else if (name === "time") {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      newErrors.time =
        !value ? "Time is required" :
        !timeRegex.test(value) ? "Invalid time format (HH:MM)" : "";
    } else if (name === "venue") {
      newErrors.venue =
        !value.trim() ? "Venue is required" :
        value.length < 3 ? "Venue must be at least 3 characters" : "";
    } else if (name === "description") {
      newErrors.description =
        !value.trim() ? "Description is required" :
        value.length < 10 ? "Description must be at least 10 characters" : "";
    } else if (name === "password") {
      newErrors.password =
        !value ? "Password is required" :
        value.length < 6 ? "Password must be at least 6 characters" : "";
    }
    setErrors(newErrors);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/api/events", newEvent);
      setNewEvent({ name: "", date: "", time: "", description: "", venue: "", password: "" });
      setErrors({ name: "", date: "", time: "", description: "", venue: "", password: "" });
      await fetchEvents();
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Failed to create event");
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    setEventToDelete(eventId);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async (password: string) => {
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventToDelete}`, {
        data: { password },
      });
      setIsDeleteModalOpen(false);
      setEventToDelete(null);
      await fetchEvents();
      if (selectedEvent === events.find((e) => e._id === eventToDelete)?.date) {
        setSelectedEvent("");
        setSeats([]);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.error || "Failed to delete event");
    }
  };

  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="theater-container">
      <h1>Admin Dashboard</h1>
      {submitError && <p className="error-text active">{submitError}</p>}
      <div className="card">
        <h3>Create New Event</h3>
        <form onSubmit={handleCreateEvent} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              value={newEvent.name}
              onChange={handleInputChange}
              className={`input-field ${errors.name ? "input-error" : ""}`}
              required
              placeholder="Enter event name"
            />
            {/* <span className="input-label">Event Name</span> */}
            {errors.name && <p className="error-text active">{errors.name}</p>}
          </div>
          <div className="input-group">
            <input
              type="date"
              name="date"
              value={newEvent.date}
              onChange={handleInputChange}
              className={`input-field ${errors.date ? "input-error" : ""}`}
              required
            />
            {/* <span className="input-label">Date</span> */}
            {errors.date && <p className="error-text active">{errors.date}</p>}
          </div>
          <div className="input-group">
            <input
              type="time"
              name="time"
              value={newEvent.time}
              onChange={handleInputChange}
              className={`input-field ${errors.time ? "input-error" : ""}`}
              required
            />
            {/* <span className="input-label">Time</span> */}
            {errors.time && <p className="error-text active">{errors.time}</p>}
          </div>
          <div className="input-group">
            <input
              type="text"
              name="venue"
              value={newEvent.venue}
              onChange={handleInputChange}
              className={`input-field ${errors.venue ? "input-error" : ""}`}
              required
              placeholder="Enter venue"
            />
            {/* <span className="input-label">Venue</span> */}
            {errors.venue && <p className="error-text active">{errors.venue}</p>}
          </div>
          <div className="input-group" style={{ gridColumn: 'span 2' }}>
            <textarea
              name="description"
              value={newEvent.description}
              onChange={handleInputChange}
              className={`input-field ${errors.description ? "input-error" : ""}`}
              required
              placeholder="Enter event description"
              style={{ minHeight: '80px' }}
            />
            {/* <span className="input-label">Description</span> */}
            {errors.description && <p className="error-text active">{errors.description}</p>}
          </div>
          <div className="input-group">
            <input
              type="password"
              name="password"
              value={newEvent.password}
              onChange={handleInputChange}
              className={`input-field ${errors.password ? "input-error" : ""}`}
              required
              placeholder="Enter admin password"
            />
            {/* <span className="input-label">Admin Password</span> */}
            {errors.password && <p className="error-text active">{errors.password}</p>}
          </div>
          <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>
            <button
              type="submit"
              className="submit-btn"
              disabled={Object.values(errors).some((e) => e)}
            >
              <FaPlus style={{ marginRight: '10px' }} /> Create Event
            </button>
          </div>
        </form>
      </div>
      <div className="card">
        <h3>Upcoming Events</h3>
        <div className="event-grid">
          {events.map((event) => (
            <div key={event._id} className="event-card">
              <h4>{event.name}</h4>
              <p>Date: {event.date}</p>
              <p>Time: {event.time}</p>
              <p>Venue: {event.venue}</p>
              <p>Description: {event.description}</p>
              <button
                onClick={() => handleDeleteEvent(event._id)}
                className="cancel-btn btn-small"
              >
                <FaTrash style={{ marginRight: '10px' }} /> Delete
              </button>
            </div>
          ))}
        </div>
      </div>
      {selectedEvent && (
        <div className="card">
          <h3>Seat Bookings for {events.find((e) => e.date === selectedEvent)?.name}</h3>
          <div className="input-group">
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="input-field"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event._id} value={event.date}>
                  {event.name} - {event.date} {event.time}
                </option>
              ))}
            </select>
            <span className="input-label">Select Event</span>
          </div>
          <div className="seat-grid-container">
            <div className="door">DOOR</div>
            <div>
              <div className="column-row">
                {columns.map((col) => (
                  <div key={col} className="column-label">{col}</div>
                ))}
              </div>
              <div className="seat-grid">
                {rows.map((row) => (
                  <div key={row} className="seat-row">
                    <div className="row-label">{row}</div>
                    {columns.map((col) => {
                      const seatId = `${row}${col}`;
                      const seat = seats.find((s) => s.seatId === seatId);
                      return seat ? (
                        <Seat
                          key={seat.seatId}
                          seat={seat}
                          onClick={() => handleSeatClick(seat)}
                          isColumnSix={col === 6}
                        />
                      ) : (
                        <div
                          key={seatId}
                          className={`seat seat-available ${
                                        col === 6 ? "ml-gap" : ""
                                      }`}
                          aria-hidden="true"
                        >
                          {/* <FaCouch className="chair-icon" /> */}
                          <span className="seat-id">{seatId}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
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
          onDelete={confirmDeleteEvent}
        />
      )}
    </div>
  );
}