import "../../components/BookingConfirmation.css";

interface EventDetails {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  totalSeats: number;
}

interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

interface SeatDetails {
  seatId: string;
  bookedBy: UserDetails;
}

interface SearchParams {
  seatId?: string | string[];
  bookingDate?: string;
  selectedEvent?: string;
}

async function getEventDetails(eventId: string): Promise<EventDetails> {
  if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
    throw new Error(`Invalid eventId format: ${eventId}`);
  }
  const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch event details: ${res.statusText}`);
  }
  const event = await res.json();
  if (!event || !event._id) {
    throw new Error(`No event found for eventId: ${eventId}`);
  }
  return event;
}

async function getSeatDetails(
  seatIds: string[],
  bookingDate: string
): Promise<SeatDetails[]> {
  if (!seatIds.every((id) => /^[A-Z][1-9][0-9]?$/.test(id))) {
    throw new Error(`Invalid seatId format in: ${seatIds.join(", ")}`);
  }
  if (!bookingDate || !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate)) {
    throw new Error(`Invalid bookingDate format: ${bookingDate}`);
  }

  const res = await fetch(
    `http://localhost:5000/api/seats/by-ids?seatIds=${seatIds.join(
      ","
    )}&date=${bookingDate}`,
    { cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Failed to fetch seat details: ${res.statusText}`);
  }

  const seats = await res.json();
  if (!seats.length || seats.length !== seatIds.length) {
    throw new Error(
      `Not all seats found for seatIds: ${seatIds.join(
        ", "
      )} and date: ${bookingDate}`
    );
  }
  if (!seats.every((seat: SeatDetails) => seat.bookedBy)) {
    throw new Error(
      `No bookedBy data found for some seats in: ${seatIds.join(", ")}`
    );
  }
  return seats;
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { seatId, bookingDate, selectedEvent } = searchParams;
  const seatIdArray = Array.isArray(seatId) ? seatId : seatId ? [seatId] : [];

  if (
    !seatIdArray.length ||
    !bookingDate ||
    !selectedEvent ||
    !/^[0-9a-fA-F]{24}$/.test(selectedEvent)
  ) {
    return (
      <div className="booking-confirmation-wrapper">
        <header className="booking-confirmation-header">
          <h1>Mukesh Bhati Acting School</h1>
        </header>
        <main className="booking-confirmation-main">
          <div className="error-message">
            <h2>Error</h2>
            <p>Missing or invalid booking details. Please try booking again.</p>
            <a href="/booking">
              <button>Try Again</button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  let eventData: EventDetails | null = null;
  let seatData: SeatDetails[] | null = null;

  try {
    [eventData, seatData] = await Promise.all([
      getEventDetails(selectedEvent),
      getSeatDetails(seatIdArray, bookingDate),
    ]);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    return (
      <div className="booking-confirmation-wrapper">
        <header className="booking-confirmation-header">
          <h1>Mukesh Bhati Acting School</h1>
        </header>
        <main className="booking-confirmation-main">
          <div className="error-message">
            <h2>Error</h2>
            <p>{errorMessage}</p>
            <a href="/booking">
              <button>Try Again</button>
            </a>
          </div>
        </main>
      </div>
    );
  }

  const dateObj = new Date(bookingDate);
  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const { name, email } = seatData[0].bookedBy;

  return (
    <div className="booking-confirmation-wrapper">
      <header className="booking-confirmation-header">
        <h1>Mukesh Bhati Acting School</h1>
      </header>
      <main className="booking-confirmation-main">
        <div className="success-message">
          <div className="success-icon">
            <span className="material-icons">check</span>
          </div>
          <h2>
            Congratulations, {name}! Your ticket
            {seatIdArray.length > 1 ? "s are" : " is"} booked!
          </h2>
          <p>
            A confirmation has been sent to {email}. Please bring a valid ID to
            the event.
          </p>
        </div>
        <div className="booking-details-card">
          <div className="event-header">
            <div className="event-info">
              <h3>{eventData.name}</h3>
              <p>{eventData.venue}</p>
            </div>
            <div className="seat-info">
              <p>Seat{seatIdArray.length > 1 ? "s" : ""}</p>
              <p className="seat-number">{seatIdArray.join(", ")}</p>
            </div>
          </div>
          <div className="divider">
            <div className="dashed-line"></div>
            <div className="divider-circles">
              <span className="circle"></span>
              <span className="circle"></span>
            </div>
          </div>
          <div className="booking-info-grid">
            <div>
              <p className="label">Booked By</p>
              <p className="value">{name}</p>
            </div>
            <div>
              <p className="label">Date</p>
              <p className="value">{formattedDate}</p>
            </div>
            <div>
              <p className="label">Day</p>
              <p className="value">{dayOfWeek}</p>
            </div>
            <div>
              <p className="label">Time</p>
              <p className="value">{eventData.time}</p>
            </div>
          </div>
        </div>
        <div className="action-section">
          <a href={`/admin/seat-layout?eventId=${selectedEvent}`}>
            <button>Book another ticket</button>
          </a>
        </div>
      </main>
    </div>
  );
}