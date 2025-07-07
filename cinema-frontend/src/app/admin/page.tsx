"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Seat from "../components/Seat";
import BookingModal from "../components/BookingModal";
import { FaCouch } from "react-icons/fa";

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

export default function Admin() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    description: "",
    password: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    description: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      const response = await axios.get(
        `http://localhost:5000/api/seats?date=${date}`
      );
      setSeats(response.data);
    } catch (err) {
      setError("Failed to fetch seats");
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

  const handleBookingSuccess = () => {
    if (selectedEvent) {
      fetchSeats(selectedEvent);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const newErrors = { ...formErrors };
    if (name === "name") {
      newErrors.name =
        !value.trim() ? "Event name is required" :
        value.length < 2 ? "Event name must be at least 2 characters" : "";
    } else if (name === "date") {
      newErrors.date =
        !value ? "Date is required" :
        !/^\d{4}-\d{2}-\d{2}$/.test(value) ? "Invalid date format (YYYY-MM-DD)" : "";
    } else if (name === "time") {
      newErrors.time =
        !value ? "Time is required" :
        !/^\d{2}:\d{2}$/.test(value) ? "Invalid time format (HH:MM)" : "";
    } else if (name === "venue") {
      newErrors.venue =
        !value.trim() ? "Venue is required" :
        value.length < 2 ? "Venue must be at least 2 characters" : "";
    } else if (name === "description") {
      newErrors.description =
        !value.trim() ? "Description is required" :
        value.length < 10 ? "Description must be at least 10 characters" : "";
    } else if (name === "password") {
      newErrors.password =
        !value ? "Password is required" :
        value.length < 6 ? "Password must be at least 6 characters" : "";
    }
    setFormErrors(newErrors);
  };

  const validateForm = () => {
    const newErrors = {
      name: "",
      date: "",
      time: "",
      venue: "",
      description: "",
      password: "",
    };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Event name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Event name must be at least 2 characters";
      isValid = false;
    }

    if (!formData.date) {
      newErrors.date = "Date is required";
      isValid = false;
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
      newErrors.date = "Invalid date format (YYYY-MM-DD)";
      isValid = false;
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
      isValid = false;
    } else if (!/^\d{2}:\d{2}$/.test(formData.time)) {
      newErrors.time = "Invalid time format (HH:MM)";
      isValid = false;
    }

    if (!formData.venue.trim()) {
      newErrors.venue = "Venue is required";
      isValid = false;
    } else if (formData.venue.length < 2) {
      newErrors.venue = "Venue must be at least 2 characters";
      isValid = false;
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
      isValid = false;
    } else if (formData.description.length < 10) {
      newErrors.description = "Description must be at least 10 characters";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/events", formData);
      setFormData({
        name: "",
        date: "",
        time: "",
        venue: "",
        description: "",
        password: "",
      });
      fetchEvents();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || "Failed to create event");
      } else {
        setError("Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEventDetails = events.find(
    (event) => event.date === selectedEvent
  );
  const rows = ["A", "B", "C", "D", "E", "F"];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="theater-container">
      <h1 className="text-5xl">Admin Dashboard</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="event-form-container">
        <h2 className="form-title">Create Event</h2>
        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter event name"
              className={`form-input ${formErrors.name ? "input-error" : ""}`}
            />
            {formErrors.name && <p className="error-text active">{formErrors.name}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              placeholder="Select date"
              className={`form-input ${formErrors.date ? "input-error" : ""}`}
            />
            {formErrors.date && <p className="error-text active">{formErrors.date}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleInputChange}
              placeholder="Select time"
              className={`form-input ${formErrors.time ? "input-error" : ""}`}
            />
            {formErrors.time && <p className="error-text active">{formErrors.time}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Venue</label>
            <input
              type="text"
              name="venue"
              value={formData.venue}
              onChange={handleInputChange}
              placeholder="Enter venue"
              className={`form-input ${formErrors.venue ? "input-error" : ""}`}
            />
            {formErrors.venue && <p className="error-text active">{formErrors.venue}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter event description"
              className={`form-input ${formErrors.description ? "input-error" : ""}`}
            ></textarea>
            {formErrors.description && <p className="error-text active">{formErrors.description}</p>}
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter password"
              className={`form-input ${formErrors.password ? "input-error" : ""}`}
            />
            {formErrors.password && <p className="error-text active">{formErrors.password}</p>}
          </div>
          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || Object.values(formErrors).some((e) => e)}
            >
              {isSubmitting ? "Creating..." : "Create Event"}
            </button>
          </div>
        </form>
      </div>
      <div className="card">
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
        {selectedEventDetails && (
          <div style={{ marginTop: "15px" }}>
            <h3>{selectedEventDetails.name}</h3>
            <p style={{ color: "#6b7280", marginBottom: "5px" }}>
              Date: {selectedEventDetails.date}
            </p>
            <p style={{ color: "#6b7280", marginBottom: "5px" }}>
              Time: {selectedEventDetails.time}
            </p>
            <p style={{ color: "#6b7280", marginBottom: "5px" }}>
              Venue: {selectedEventDetails.venue}
            </p>
            <p style={{ color: "#6b7280" }}>
              Description: {selectedEventDetails.description}
            </p>
          </div>
        )}
      </div>
      {selectedEvent && (
        <div className="card">
          <h3>Seat Layout</h3>
          <div className="stage">STAGE</div>
          <div className="seat-grid-container">
            <div className="door">DOOR</div>
            <div>
              <div className="column-row">
                {columns.map((col) => (
                  <div key={col} className="column-label">
                    {col}
                  </div>
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
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}