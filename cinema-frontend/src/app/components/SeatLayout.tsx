"use client";
import "./SeatLayout.css";
import { FaChevronLeft } from "react-icons/fa";
import Seat from "./Seat";
import BookingModal from "./BookingModal";
import Loader from "./loader";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

interface SeatData {
  _id: string;
  seatId: string;
  row: string;
  column: number;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

const rows = ["A", "B", "C", "D", "E", "F"];
const columns = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

export default function SeatLayout() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<SeatData[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const eventIdFromQuery = searchParams.get("eventId");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get("http://localhost:5000/api/events");
        const fetchedEvents = response.data;
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0) {
          const initialEventId = eventIdFromQuery || fetchedEvents[0]._id;
          setSelectedEvent(initialEventId);
          const event = fetchedEvents.find((e: Event) => e._id === initialEventId);
          if (event) {
            await fetchSeats(event.date);
          }
        }
      } catch (err) {
        setError("Failed to fetch events");
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [eventIdFromQuery]);

  const fetchSeats = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/seats?date=${date}`);
      setSeats(response.data);
      setError("");
    } catch (err) {
      setError("Failed to fetch seats");
    } finally {
      setIsLoading(false);
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
    if (event) fetchSeats(event.date);
    setSelectedSeat(null);
    setIsBookingModalOpen(false);
  };

  const getSeatGrid = () => {
    const totalSeats = events.find((e) => e._id === selectedEvent)?.totalSeats || 0;
    if (!totalSeats) return [];
    const seatsPerRow = Math.min(columns.length, 10);
    const totalRows = Math.min(rows.length, Math.ceil(totalSeats / seatsPerRow));
    const grid: SeatData[][] = [];

    let seatIndex = 0;
    for (let i = 0; i < totalRows; i++) {
      const row: SeatData[] = [];
      for (let j = 0; j < seatsPerRow && seatIndex < totalSeats; j++) {
        const seatId = `${rows[i]}${columns[j]}`;
        const seat = seats.find((s) => s.seatId === seatId);
        row.push(
          seat || {
            _id: seatId,
            seatId,
            row: rows[i],
            column: columns[j],
            price: 300,
            status: "available",
            bookedBy: null,
          }
        );
        seatIndex++;
      }
      grid.push(row);
    }
    return grid;
  };

  return (
    <>
      <Loader isLoading={isLoading} />
      {!isLoading && (
        <div className="seat-layout-container">
          <header className="seat-header">
            <button
              onClick={() => router.push("/")}
              className="back-btn"
              aria-label="Go back to booking page"
            >
              <FaChevronLeft size={18} />
            </button>
            <h2 className="seat-title">CHOOSE YOUR PREFERRED SEATS</h2>
            <p className="seat-subtitle">
              Select a seat for {events.find((e) => e._id === selectedEvent)?.name || "the event"}
            </p>
            <div className="event-select-container">
              <select
                value={selectedEvent}
                onChange={handleEventChange}
                className="booking-select"
                aria-label="Select an event"
                disabled={isLoading}
              >
                {events.length === 0 ? (
                  <option value="">No events available</option>
                ) : (
                  events.map((event) => (
                    <option key={event._id} value={event._id}>
                      {event.name} - {new Date(event.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        timeZone: "UTC",
                      })}
                    </option>
                  ))
                )}
              </select>
            </div>
          </header>

          {error && <p className="error-text">{error}</p>}

          <div className="seat-info">
            <p><strong>Total Seats:</strong> {events.find((e) => e._id === selectedEvent)?.totalSeats || "Loading..."}</p>
            <p><strong>Available Seats:</strong> {seats.filter(s => s.status === "available").length}</p>
          </div>

          <div className="seat-card">
            <div className="stage-curve">
              <span className="stage-text">STAGE</span>
            </div>
            <div className="door-label">DOOR</div>

            <div className="column-row">
              {columns.slice(0, Math.min(columns.length, 10)).map((col) => (
                <div key={col} className="column-label">{col}</div>
              ))}
            </div>

            <div className="seat-grid">
              {getSeatGrid().map((row, rowIndex) => (
                <div key={rows[rowIndex]} className="seat-row">
                  <div className="row-label">{rows[rowIndex]}</div>
                  {row.map((seat, colIndex) => (
                    <Seat
                      key={seat.seatId}
                      seat={seat}
                      onClick={() => handleSeatClick(seat)}
                      isColumnSix={columns[colIndex] === 6}
                      isSelected={seat.seatId === selectedSeat}
                    />
                  ))}
                </div>
              ))}
            </div>
            <div className="seat-line"></div>

            <div className="seat-legend">
              <div className="legend-item">
                <div className="legend-box avail" />
                <span>Available</span>
              </div>
              <div className="legend-item">
                <div className="legend-box booked" />
                <span>Booked</span>
              </div>
            </div>
          </div>

          {isBookingModalOpen && selectedSeat && (
            <BookingModal
              seatId={selectedSeat}
              price={seats.find((s) => s.seatId === selectedSeat)?.price || 300}
              quantity={1}
              onClose={() => {
                setIsBookingModalOpen(false);
                setSelectedSeat(null);
              }}
              bookingDate={events.find((evt) => evt._id === selectedEvent)?.date || ""}
              onBookingSuccess={handleBookingSuccess}
              eventId={selectedEvent}
            />
          )}
        </div>
      )}
    </>
  );
}