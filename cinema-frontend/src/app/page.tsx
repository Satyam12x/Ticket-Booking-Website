"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Seat from "./components/Seat";
import BookingModal from "./components/BookingModal";
import "./globals.css";
import { FaSpinner } from "react-icons/fa";

interface SeatData {
  seatId: string;
  row: number; // Fixed to match backend
  column: string; // Fixed to match backend
  status: "available" | "booked";
  price: number;
  bookedBy?: { name: string; email: string; phone: string };
}

interface Event {
  _id: string;
  name: string;
  date: string;
}

export default function Home() {
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");
  const [events, setEvents] = useState<Event[]>([]);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Fetch events
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/events");
        setEvents(response.data);
        if (response.data.length > 0) {
          setSelectedDate(response.data[0].date);
        }
      } catch (err) {
        setError("Failed to fetch events. Ensure the backend is running.");
      }
    };
    fetchEvents();
  }, []);

  // Fetch seats for selected date
  useEffect(() => {
    if (!selectedDate) return;
    const fetchSeats = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `http://localhost:5000/api/seats?date=${selectedDate}`
        );
        if (response.data.length === 0) {
          setError("No seats found for the selected event.");
        } else {
          setSeats(
            response.data.sort((a: SeatData, b: SeatData) =>
              a.seatId.localeCompare(b.seatId)
            )
          );
          setError(null);
        }
      } catch (error: any) {
        setError(
          error.response?.data?.error || "Failed to load seats. Ensure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };
    fetchSeats();
  }, [selectedDate]);

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
        <h1>Book Your Show</h1>

        <div className="flex justify-center mb-8">
          <div className="input-group">
            <label className="input-label">Select Event</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input-field"
              aria-label="Select event"
            >
              <option value="">Select an event</option>
              {events.map((event) => (
                <option key={event._id} value={event.date}>
                  {event.name} ({event.date})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="legend">
          <div className="legend-item">
            <div className="legend-box avail">
              <i className="fas fa-chair"></i>
            </div>
            <span>Available</span>
          </div>
          <div className="legend-item">
            <div className="legend-box booked">
              <i className="fas fa-chair"></i>
            </div>
            <span>Booked</span>
          </div>
        </div>

        <div className="flex justify-center mb-8">
          <h3>Standard Seats (₹ 300)</h3>
        </div>

        {selectedDate && <div className="stage">SCREEN</div>}

        {loading && (
          <div className="text-center text-navy my-6">
            <FaSpinner className="spinner" />
            Loading seats...
          </div>
        )}

        {error && <div className="text-red-500 text-center my-6">{error}</div>}

        {!loading && !error && seats.length === 0 && selectedDate && (
          <div className="text-center text-navy my-6">
            No seats available for this event.
          </div>
        )}

        {selectedDate && (
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
        )}

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
            bookingDate={selectedDate}
            onClose={() => {
              setShowBookingModal(false);
              setSelectedSeat(null);
            }}
          />
        )}
      </div>
    </main>
  );
}