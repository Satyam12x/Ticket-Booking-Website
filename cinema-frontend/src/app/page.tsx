"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import Seat from "./components/Seat";
import BookingModal from "./components/BookingModal";
import { FaCouch } from "react-icons/fa";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  venue: string;
  description: string;
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
      const fetchedEvents = response.data;
      setEvents(fetchedEvents);
      if (fetchedEvents.length > 0) {
        setSelectedEvent(fetchedEvents[0]._id);
        fetchSeats(fetchedEvents[0].date);
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

  const handleEventChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const eventId = e.target.value;
    setSelectedEvent(eventId);
    const event = events.find((evt) => evt._id === eventId);
    if (event) {
      fetchSeats(event.date);
    }
  };

  const handleSeatClick = (seat: SeatData) => {
    if (seat.status === "available") {
      setSelectedSeat(seat.seatId);
      setIsBookingModalOpen(true);
    }
  };

  const handleBookingSuccess = () => {
    const event = events.find((evt) => evt._id === selectedEvent);
    if (event) {
      fetchSeats(event.date);
    }
  };

  const selectedEventDetails = events.find((event) => event._id === selectedEvent);
  const rows = ["A", "B", "C", "D", "E", "F"];
  const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <div className="theater-container">
      <h1 className="text-5xl">Book Your Tickets</h1>
      {error && <p className="error-text">{error}</p>}
      <div className="event-details-container">
        <div className="event-select-container">
          <select
            value={selectedEvent}
            onChange={handleEventChange}
            className="event-select"
          >
            {events.length === 0 ? (
              <option value="">No events available</option>
            ) : (
              events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name}
                </option>
              ))
            )}
          </select>
        </div>
        {selectedEventDetails ? (
          <div>
            <p className="event-details-header">Event Details</p>
            <p className="event-details-subtitle">Select your seats for the event</p>
            <div className="event-details-grid">
              <div className="event-details-row">
                <p className="event-details-label">Event Name</p>
                <p className="event-details-value">{selectedEventDetails.name}</p>
              </div>
              <div className="event-details-row">
                <p className="event-details-label">Date</p>
                <p className="event-details-value">
                  {new Date(selectedEventDetails.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="event-details-row">
                <p className="event-details-label">Time</p>
                <p className="event-details-value">{selectedEventDetails.time}</p>
              </div>
              <div className="event-details-row">
                <p className="event-details-label">Venue</p>
                <p className="event-details-value">{selectedEventDetails.venue}</p>
              </div>
            </div>
          </div>
        ) : (
          <p className="no-events">No events available</p>
        )}
      </div>
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
      {isBookingModalOpen && selectedSeat && (
        <BookingModal
          seatId={selectedSeat}
          price={300}
          quantity={1}
          onClose={() => setIsBookingModalOpen(false)}
          bookingDate={events.find((evt) => evt._id === selectedEvent)?.date || ""}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}