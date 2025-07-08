import "../components/BookingConfirmation.css";

// Interface for Event Details
interface EventDetails {
  _id: string;
  name: string;
  venue: string;
  date: string;
  time: string;
  description: string;
  totalSeats: number;
}

// Interface for User Details
interface UserDetails {
  name: string;
  email: string;
  phone: string;
}

// Interface for Seat Details
interface SeatDetails {
  seatId: string;
  bookedBy: UserDetails;
}

// Interface for searchParams
interface SearchParams {
  seatId?: string | string[];
  bookingDate?: string;
  selectedEvent?: string;
}

// Fetch event details based on eventId
async function getEventDetails(eventId: string): Promise<EventDetails> {
  try {
    console.log("Fetching event details for eventId:", eventId);
    if (!eventId || !/^[0-9a-fA-F]{24}$/.test(eventId)) {
      throw new Error(`Invalid eventId format: ${eventId}`);
    }
    const res = await fetch(`http://localhost:5000/api/events/${eventId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      let errorMessage = `Failed to fetch event details: ${res.status} ${res.statusText}`;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await res.json();
          errorMessage += ` - ${errorData.error || JSON.stringify(errorData)}`;
        } catch (e) {
          console.error("Error parsing event details error response:", e);
          errorMessage += " - Unable to parse error response";
        }
      } else {
        errorMessage += " - Non-JSON response received";
      }
      throw new Error(errorMessage);
    }
    const event = await res.json();
    if (!event || !event._id) {
      throw new Error(`No event found for eventId: ${eventId}`);
    }
    console.log("Event details fetched:", event);
    return event;
  } catch (error) {
    console.error("Error fetching event details for eventId:", eventId, error);
    throw error;
  }
}

// Fetch seat details based on seatIds and bookingDate
async function getSeatDetails(
  seatIds: string[],
  bookingDate: string
): Promise<SeatDetails[]> {
  try {
    console.log(
      "Fetching seat details for seatIds:",
      seatIds,
      "date:",
      bookingDate
    );
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
      let errorMessage = `Failed to fetch seat details: ${res.status} ${res.statusText}`;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          const errorData = await res.json();
          errorMessage += ` - ${errorData.error || JSON.stringify(errorData)}`;
        } catch (e) {
          console.error("Error parsing seat details error response:", e);
          errorMessage += " - Unable to parse error response";
        }
      } else {
        errorMessage += " - Non-JSON response received";
      }
      throw new Error(errorMessage);
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
    console.log("Seat details fetched:", seats);
    return seats;
  } catch (error) {
    console.error(
      "Error fetching seat details for seatIds:",
      seatIds,
      "and date:",
      bookingDate,
      error
    );
    throw error;
  }
}

export default async function BookingConfirmationPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { seatId, bookingDate, selectedEvent } = searchParams;
  console.log("BookingConfirmation searchParams:", {
    seatId,
    bookingDate,
    selectedEvent,
  });

  // Normalize seatId to array
  const seatIdArray = Array.isArray(seatId) ? seatId : seatId ? [seatId] : [];

  // Validate required parameters
  if (
    !seatIdArray.length ||
    !bookingDate ||
    !selectedEvent ||
    !/^[0-9a-fA-F]{24}$/.test(selectedEvent)
  ) {
    console.error("Missing or invalid booking details:", {
      seatId,
      bookingDate,
      selectedEvent,
    });
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
    // Fetch event and seat details concurrently
    [eventData, seatData] = await Promise.all([
      getEventDetails(selectedEvent),
      getSeatDetails(seatIdArray, bookingDate),
    ]);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : "An unexpected error occurred";
    console.error("Error fetching booking confirmation data:", errorMessage);
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

  // Format date
  const dateObj = new Date(bookingDate);
  const dayOfWeek = dateObj.toLocaleDateString("en-US", { weekday: "long" });
  const formattedDate = dateObj.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  // Assume all seats are booked by the same user
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
            {/* <div>
              <p className="label">Email</p>
              <p className="value">{email}</p>
            </div> */}
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
          <a href={`/seat-layout?eventId=${selectedEvent}`}>
            <button>Book another ticket</button>
          </a>
        </div>
      </main>
    </div>
  );
}
