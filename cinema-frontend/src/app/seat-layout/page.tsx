"use client";
import "../components/SeatLayout.css";
import { FaChevronLeft } from "react-icons/fa";
import Seat from "../components/Seat";
import BookingModal from "../components/BookingModal";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
// import axios from "axios";
import { MdChair } from "react-icons/md";
import Loader from "../components/loader";

interface Event {
  _id: string;
  name?: string;
  date: string;
  time?: string;
  venue?: string;
  description?: string;
  totalSeats?: number;
}

interface SeatDetails {
  _id: string;
  seatId: string;
  row: string;
  column: number;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

export default function SeatLayout() {
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string>("");
  const [seats, setSeats] = useState<SeatDetails[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const eventIdFromQuery = searchParams.get("eventId");
  const from = searchParams.get("from"); 

  const backDestination = from === "admin" ? "admin" : "/";

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("http://localhost:5000/api/events", {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch events");
        }
        const fetchedEvents = await response.json();
        setEvents(fetchedEvents);
        if (fetchedEvents.length > 0) {
          const initialEventId = eventIdFromQuery || fetchedEvents[0]._id;
          setSelectedEvent(initialEventId);
          const event = fetchedEvents.find(
            (e: Event) => e._id === initialEventId
          );
          if (event) {
            await fetchSeats(event.date); 
          }
        }
      } catch (error) {
        setError(`Failed to fetch events: ${error}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvents();
  }, [eventIdFromQuery]);

  const fetchSeats = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/seats?date=${date}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error("Failed to fetch seats");
      }
      const data = await response.json();
      setSeats(data);
      setError("");
    } catch (error) {
      setError("Failed to fetch seats");
      console.error("Fetch seats error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeatClick = (seat: SeatDetails) => {
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

  const selectedEventDetails = events.find(
    (event) => event._id === selectedEvent
  );
  const columns = Array.from({ length: 10 }, (_, i) => i + 1);
  const rows = selectedEventDetails
    ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        .slice(0, Math.ceil((selectedEventDetails.totalSeats || 10) / 10))
        .split("")
    : [];

  return (
    <>
      <Loader isLoading={isLoading} />
      {!isLoading && (
        <div
          className="seat-layout-container"
          style={{ "--num-rows": rows.length } as React.CSSProperties}
        >
          <header className="seat-header">
            <Link
              href={backDestination}
              className="back-btn"
              aria-label={`Go back to ${
                from === "admin" ? "admin dashboard" : "booking page"
              }`}
            >
              <FaChevronLeft size={18} />
            </Link>
            <h2 className="seat-title">
              CHOOSE YOUR PREFERRED SEATS WITH EASE
            </h2>
            <p className="seat-subtitle">
              Enjoy a seamless booking experience tailored to your comfort
            </p>
          </header>

          {error && <p className="error-text">{error}</p>}
          <div className="seat-back">
            <div className="seat-card">
              <div className="stage-curve">
                <div className="stage-text">STAGE</div>
              </div>
              <div className="door-label">DOOR</div>

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
                    {columns
                      .slice(
                        0,
                        row === rows[rows.length - 1]
                          ? (selectedEventDetails?.totalSeats || 10) % 10 || 10
                          : 10
                      )
                      .map((col) => {
                        const seatId = `${row}${col}`;
                        const seat = seats.find((s) => s.seatId === seatId);
                        return seat ? (
                          <Seat
                            key={seat.seatId}
                            seat={seat}
                            onClick={() => handleSeatClick(seat)}
                            isColumnSix={col === 6}
                            isSelected={seat.seatId === selectedSeat}
                          />
                        ) : (
                          <div
                            key={seatId}
                            className="seat-placeholder"
                            aria-hidden="true"
                          />
                        );
                      })}
                  </div>
                ))}
              </div>
              <div className="seat-line"></div>

              <div className="seat-legend">
                <div className="legend-item">
                  <MdChair className="chair-icon legend-box avail" />
                  <span>Available</span>
                </div>
                <div className="legend-item">
                  <MdChair className="chair-icon legend-box booked" />
                  <span>Booked</span>
                </div>
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
              bookingDate={
                events.find((evt) => evt._id === selectedEvent)?.date || ""
              }
              onBookingSuccess={handleBookingSuccess}
              eventId={selectedEvent}
            />
          )}
        </div>
      )}
    </>
  );
}
