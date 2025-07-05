"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Seat from "../components/Seat";
import BookingModal from "../components/BookingModal";
import { FaSpinner, FaTrash } from "react-icons/fa";

interface Event {
  _id: string;
  name: string;
  date: string;
}

interface SeatData {
  seatId: string;
  row: number;
  column: string;
  status: "available" | "booked";
  price: number;
  bookedBy?: { name: string; email: string; phone: string };
}

export default function AdminPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [newEvent, setNewEvent] = useState({ name: "", date: "" });
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch upcoming events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const response = await axios.get("http://localhost:5000/api/events");
        setEvents(response.data);
        setError(null);
      } catch (err) {
        setError("Failed to fetch events. Ensure the backend is running.");
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  // Fetch seats for selected event
  useEffect(() => {
    if (!selectedEvent) return;
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/seats?date=${selectedEvent}`
        );
        setSeats(
          response.data.sort((a: SeatData, b: SeatData) =>
            a.seatId.localeCompare(b.seatId)
          )
        );
        setError(null);
      } catch (err) {
        setError("Failed to fetch seats for the selected event.");
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [selectedEvent]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.name || !newEvent.date || !password) {
      setError("Event name, date, and password are required.");
      return;
    }
    try {
      const response = await axios.post("http://localhost:5000/api/events", {
        name: newEvent.name,
        date: newEvent.date,
        password,
      });
      setEvents([...events, response.data.event]);
      setNewEvent({ name: "", date: "" });
      setPassword("");
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create event.");
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!password) {
      setError("Password is required to delete an event.");
      return;
    }
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        data: { password },
      });
      setEvents(events.filter((event) => event._id !== eventId));
      if (selectedEvent === events.find((e) => e._id === eventId)?.date) {
        setSelectedEvent(null);
        setSeats([]);
      }
      setPassword("");
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete event.");
    }
  };

  const handleSeatSelect = (seatId: string) => {
    setSelectedSeat(seatId);
    setSelectedQuantity(1);
  };

  const handleProceedToBook = () => {
    setShowBookingModal(true);
  };

  const rows = ["A", "B", "C", "D", "E", "F"];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-200 py-12">
      <div className="theater-container">
        <h1>Admin Dashboard</h1>

        <h3>Upcoming Events</h3>
        {loading && (
          <div className="text-center text-navy my-6">
            <FaSpinner className="spinner" />
            Loading events...
          </div>
        )}
        {error && <div className="text-red-500 text-center my-6">{error}</div>}
        {!loading && !error && events.length === 0 && (
          <div className="text-center text-navy my-6">
            No upcoming events found.
          </div>
        )}
        {!loading && events.length > 0 && (
          <div className="mb-8">
            {events.map((event) => (
              <div
                key={event._id}
                className="flex justify-between items-center bg-white p-4 mb-2 rounded-lg shadow-md"
              >
                <div>
                  <p className="font-semibold">{event.name}</p>
                  <p>Date: {event.date}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedEvent(event.date)}
                    className="proceed-btn"
                  >
                    Book Seats
                  </button>
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="cancel-btn"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <h3>Create New Event</h3>
        <form onSubmit={handleCreateEvent} className="mb-8">
          <div className="input-group">
            <label className="input-label">Event Name</label>
            <input
              type="text"
              value={newEvent.name}
              onChange={(e) =>
                setNewEvent({ ...newEvent, name: e.target.value })
              }
              className="input-field"
              placeholder="Enter event name"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Event Date</label>
            <input
              type="date"
              value={newEvent.date}
              onChange={(e) =>
                setNewEvent({ ...newEvent, date: e.target.value })
              }
              className="input-field"
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          <div className="input-group">
            <label className="input-label">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Enter admin password"
            />
          </div>
          <button type="submit" className="submit-btn">
            Create Event
          </button>
        </form>

        {selectedEvent && (
          <>
            <h3>Book Seats for Event on {selectedEvent}</h3>
            <div className="stage">SCREEN</div>
            {loading && (
              <div className="text-center text-navy my-6">
                <FaSpinner className="spinner" />
                Loading seats...
              </div>
            )}
            {error && (
              <div className="text-red-500 text-center my-6">{error}</div>
            )}
            {!loading && !error && seats.length === 0 && (
              <div className="text-center text-navy my-6">
                No seats available for this event.
              </div>
            )}
            <div className="seat-grid-container">
              <div className="seat-grid">
                <div className="column-row">
                  {columns.map((col) => (
                    <div key={col} className="column-label">
                      {col}
                    </div>
                  ))}
                </div>
                {rows.map((row) => (
                  <div key={row} className="seat-row">
                    <div className="row-label">{row}</div>
                    {columns.map((col) => {
                      const seatId = `${row}${col}`;
                      const seat = seats.find((s) => s.seatId === seatId);
                      return seat ? (
                        <Seat
                          key={seatId}
                          seat={seat}
                          onSelect={handleSeatSelect}
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
                          <i className="fas fa-chair chair-icon"></i>
                          <span className="seat-id">{seatId}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {selectedSeat && (
              <div className="dynamic-modal">
                <h3 className="text-lg font-semibold text-navy mb-3">
                  Seat Details
                </h3>
                <p className="mb-2">Row: {selectedSeat[0]}</p>
                <p className="mb-2">Seat: {selectedSeat.slice(1)}</p>
                <p className="mb-2">
                  Price: ₹{seats.find((s) => s.seatId === selectedSeat)?.price || 300}
                </p>
                <div className="mb-3 input-group">
                  <label className="input-label">Quantity (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={selectedQuantity}
                    onChange={(e) => setSelectedQuantity(Number(e.target.value))}
                    className="input-field"
                    aria-label="Select quantity"
                    placeholder="Enter quantity"
                  />
                </div>
                <p className="mb-3 font-semibold">
                  Total: ₹{(seats.find((s) => s.seatId === selectedSeat)?.price || 300) * selectedQuantity}
                </p>
                <button onClick={handleProceedToBook} className="proceed-btn">
                  <i className="fas fa-ticket-alt"></i> Proceed to Book
                </button>
              </div>
            )}
            {showBookingModal && selectedSeat && (
              <BookingModal
                seatId={selectedSeat}
                price={seats.find((s) => s.seatId === selectedSeat)?.price || 300}
                quantity={selectedQuantity}
                bookingDate={selectedEvent}
                onClose={() => {
                  setShowBookingModal(false);
                  setSelectedSeat(null);
                }}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}