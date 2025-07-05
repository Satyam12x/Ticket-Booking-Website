'use client';
import { useState, useEffect } from "react";
import axios from "axios";
import Seat from "./components/Seat";
import BookingModal from "./components/BookingModal";
import { FaTicketAlt } from "react-icons/fa";

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

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
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

  const selectedEventDetails = events.find((event) => event.date === selectedEvent);
  const columns = ['A', 'B', 'C', 'D', 'E', 'F'];

  return (
    <div className="theater-container">
      <h1>Book Your Seats</h1>
      {error && <p className="error-text">{error}</p>}
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
          <div style={{ marginTop: '15px' }}>
            <h3>{selectedEventDetails.name}</h3>
            <p style={{ color: '#6b7280', marginBottom: '5px' }}>Date: {selectedEventDetails.date}</p>
            <p style={{ color: '#6b7280', marginBottom: '5px' }}>Time: {selectedEventDetails.time}</p>
            <p style={{ color: '#6b7280', marginBottom: '5px' }}>Venue: {selectedEventDetails.venue}</p>
            <p style={{ color: '#6b7280' }}>Description: {selectedEventDetails.description}</p>
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
      {isBookingModalOpen && selectedSeat && (
        <BookingModal
          seatId={selectedSeat}
          price={300}
          quantity={1}
          onClose={() => setIsBookingModalOpen(false)}
          bookingDate={selectedEvent}
        />
      )}
    </div>
  );
}