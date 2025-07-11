"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import ProtectedRoute from "../components/ProtectedRoute";
import { useRouter } from "next/navigation";
import DeleteEventModal from "../components/DeleteEventModal";

interface Event {
  _id: string;
  name: string;
  date: string;
  time: string;
  description: string;
  venue: string;
  totalSeats: number;
  registrationClosed: boolean;
}

interface Booking {
  seatId: string;
  name: string;
  email: string;
  phone: string;
}

function Admin() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [previousEvents, setPreviousEvents] = useState<Event[]>([]);
  const [bookings, setBookings] = useState<{ [key: string]: Booking[] }>({});
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [formData, setFormData] = useState({
    name: "",
    date: "",
    time: "",
    venue: "Mukesh Bhati Acting School, E1/74, Milan Road, near YMCA University, Sector-11, Faridabad",
    description: "",
    password: "",
    totalSeats: "",
  });
  const [formErrors, setFormErrors] = useState({
    name: "",
    date: "",
    time: "",
    venue: "",
    description: "",
    password: "",
    totalSeats: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      await Promise.all([fetchEvents(), fetchPreviousEvents()]);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/events", {
        withCredentials: true,
      });
      console.log("Fetch events response:", {
        count: response.data.length,
        events: response.data.map((e: Event) => ({
          id: e._id,
          name: e.name,
          date: e.date,
        })),
      });
      setEvents(response.data);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.status === 403
            ? "Access denied: Admin privileges required"
            : err.response?.data?.error || "Failed to fetch events";
        setError(errorMessage);
        console.error("Fetch events error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        toast.error(errorMessage);
        if (err.response?.status === 403) {
          router.push("/login?error=admin-required");
        }
      } else {
        setError("Failed to fetch events");
        console.error("Fetch events error:", err);
        toast.error("Failed to fetch events");
      }
    }
  };

  const fetchPreviousEvents = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/events/past", {
        withCredentials: true,
      });
      const prevEvents = response.data;
      setPreviousEvents(prevEvents);
      const bookingsData: { [key: string]: Booking[] } = {};
      for (const event of prevEvents) {
        try {
          const bookingResponse = await axios.get(
            `http://localhost:5000/api/events/${event._id}/bookings`,
            { withCredentials: true }
          );
          bookingsData[event._id] = bookingResponse.data;
        } catch (bookingErr: unknown) {
          if (axios.isAxiosError(bookingErr)) {
            console.error(`Fetch bookings error for event ${event._id}:`, {
              message: bookingErr.message,
              status: bookingErr.response?.status,
              data: bookingErr.response?.data,
            });
            bookingsData[event._id] = [];
          } else {
            console.error(`Fetch bookings error for event ${event._id}:`, bookingErr);
            bookingsData[event._id] = [];
          }
        }
      }
      setBookings(bookingsData);
      setError("");
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || "Failed to fetch previous events";
        setError(errorMessage);
        console.error("Fetch previous events error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        toast.error(errorMessage);
      } else {
        setError("Failed to fetch previous events");
        console.error("Fetch previous events error:", err);
        toast.error("Failed to fetch previous events");
      }
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const newErrors = { ...formErrors };
    const today = new Date().toISOString().split("T")[0];

    if (name === "name") {
      newErrors.name = !value.trim()
        ? "Event name is required"
        : value.length < 2
        ? "Event name must be at least 2 characters"
        : "";
    } else if (name === "date") {
      newErrors.date = !value
        ? "Date is required"
        : !/^\d{4}-\d{2}-\d{2}$/.test(value)
        ? "Invalid date format (YYYY-MM-DD)"
        : value <= today
        ? "Date must be in the future"
        : "";
    } else if (name === "time") {
      newErrors.time = !value
        ? "Time is required"
        : !/^[0-1]?[0-9]|2[0-3]:[0-5][0-9]$/.test(value)
        ? "Invalid time format (HH:MM)"
        : "";
    } else if (name === "venue") {
      newErrors.venue = !value.trim()
        ? "Venue is required"
        : value.length < 2
        ? "Venue must be at least 2 characters"
        : "";
    } else if (name === "description") {
      newErrors.description = !value.trim()
        ? "Description is required"
        : value.length < 10
        ? "Description must be at least 10 characters"
        : "";
    } else if (name === "password") {
      newErrors.password = !value
        ? "Password is required"
        : value.length < 6
        ? "Password must be at least 6 characters"
        : "";
    } else if (name === "totalSeats") {
      newErrors.totalSeats = !value
        ? "Total seats is required"
        : isNaN(Number(value)) || Number(value) < 1
        ? "Total seats must be a positive number"
        : "";
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
      totalSeats: "",
    };
    const today = new Date().toISOString().split("T")[0];
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
    } else if (formData.date <= today) {
      newErrors.date = "Date must be in the future";
      isValid = false;
    }

    if (!formData.time) {
      newErrors.time = "Time is required";
      isValid = false;
    } else if (!/^[0-1]?[0-9]|2[0-3]:[0-5][0-9]$/.test(formData.time)) {
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

    if (!formData.totalSeats) {
      newErrors.totalSeats = "Total seats is required";
      isValid = false;
    } else if (
      isNaN(Number(formData.totalSeats)) ||
      Number(formData.totalSeats) < 1
    ) {
      newErrors.totalSeats = "Total seats must be a positive number";
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      console.log("Form validation failed:", formErrors);
      toast.error("Please correct the form errors");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Submitting event data:", {
        ...formData,
        totalSeats: Number(formData.totalSeats),
      });
      const response = await axios.post(
        "http://localhost:5000/api/events",
        {
          ...formData,
          totalSeats: Number(formData.totalSeats),
        },
        { withCredentials: true }
      );
      console.log("Create event response:", response.data);
      setFormData({
        name: "",
        date: "",
        time: "",
        venue:
          "Mukesh Bhati Acting School, E1/74, Milan Road, near YMCA University, Sector-11, Faridabad",
        description: "",
        password: "",
        totalSeats: "",
      });
      setFormErrors({
        name: "",
        date: "",
        time: "",
        venue: "",
        description: "",
        password: "",
        totalSeats: "",
      });
      toast.success("Event created successfully");
      fetchEvents();
      fetchPreviousEvents();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.status === 403
            ? "Access denied: Admin privileges required"
            : err.response?.data?.error || "Failed to create event";
        setError(errorMessage);
        console.error("Create event error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        toast.error(errorMessage);
        if (err.response?.status === 403) {
          router.push("/login?error=admin-required");
        }
      } else {
        setError("Failed to create event");
        console.error("Create event error:", err);
        toast.error("Failed to create event");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBookTickets = (eventId: string) => {
    console.log("Redirecting to admin seat-layout with eventId:", eventId);
    router.push(`/admin/seat-layout?eventId=${eventId}`);
  };

  const handleEndRegistration = async (eventId: string) => {
    if (!confirm("Are you sure you want to end registration for this event? A booking details document will be emailed.")) {
      return;
    }
    setActionLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      const response = await axios.post(
        `http://localhost:5000/api/events/${eventId}/end-registration`,
        {},
        { withCredentials: true }
      );
      console.log("End registration response:", response.data);
      setEvents(events.map((event) =>
        event._id === eventId ? { ...event, registrationClosed: true } : event
      ));
      setError("");
      toast.success("Registration closed successfully. Booking details emailed.");
      fetchPreviousEvents();
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || "Failed to end registration";
        setError(errorMessage);
        console.error("End registration error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        toast.error(errorMessage);
        if (err.response?.status === 403) {
          router.push("/login?error=admin-required");
        }
      } else {
        setError("Failed to end registration");
        console.error("End registration error:", err);
        toast.error("Failed to end registration");
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  const handleDeleteEvent = async (eventId: string, password: string) => {
    setActionLoading((prev) => ({ ...prev, [eventId]: true }));
    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        data: { password },
        withCredentials: true,
      });
      setEvents(events.filter((event) => event._id !== eventId));
      setPreviousEvents(previousEvents.filter((event) => event._id !== eventId));
      setBookings((prev) => {
        const newBookings = { ...prev };
        delete newBookings[eventId];
        return newBookings;
      });
      setError("");
      toast.success("Event deleted successfully");
      setSelectedEventId(null);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data?.error || "Failed to delete event";
        setError(errorMessage);
        console.error("Delete event error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        toast.error(errorMessage);
      } else {
        setError("Failed to delete event");
        console.error("Delete event error:", err);
        toast.error("Failed to delete event");
      }
    } finally {
      setActionLoading((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className="dashboard-title">Admin Dashboard</h1>
      {error && <p className="error-message">{error}</p>}
      <div className="grid-container">
        <div className="event-form-container">
          <h2 className="section-title">Create Event</h2>
          <form onSubmit={handleSubmit} className="event-form" aria-label="Create Event Form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Event Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter event name"
                className={`form-input ${formErrors.name ? "input-error" : ""}`}
                aria-invalid={!!formErrors.name}
                aria-describedby={formErrors.name ? "name-error" : undefined}
              />
              {formErrors.name && <p id="name-error" className="error-text">{formErrors.name}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="date" className="form-label">Date</label>
              <input
                type="date"
                id="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className={`form-input ${formErrors.date ? "input-error" : ""}`}
                aria-invalid={!!formErrors.date}
                aria-describedby={formErrors.date ? "date-error" : undefined}
              />
              {formErrors.date && <p id="date-error" className="error-text">{formErrors.date}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="time" className="form-label">Time</label>
              <input
                type="time"
                id="time"
                name="time"
                value={formData.time}
                onChange={handleInputChange}
                className={`form-input ${formErrors.time ? "input-error" : ""}`}
                aria-invalid={!!formErrors.time}
                aria-describedby={formErrors.time ? "time-error" : undefined}
              />
              {formErrors.time && <p id="time-error" className="error-text">{formErrors.time}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="venue" className="form-label">Venue</label>
              <input
                type="text"
                id="venue"
                name="venue"
                value={formData.venue}
                onChange={handleInputChange}
                placeholder="Enter venue"
                className={`form-input ${formErrors.venue ? "input-error" : ""}`}
                aria-invalid={!!formErrors.venue}
                aria-describedby={formErrors.venue ? "venue-error" : undefined}
              />
              {formErrors.venue && <p id="venue-error" className="error-text">{formErrors.venue}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter event description"
                className={`form-input ${formErrors.description ? "input-error" : ""}`}
                rows={4}
                aria-invalid={!!formErrors.description}
                aria-describedby={formErrors.description ? "description-error" : undefined}
              ></textarea>
              {formErrors.description && <p id="description-error" className="error-text">{formErrors.description}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="totalSeats" className="form-label">Total Seats</label>
              <input
                type="number"
                id="totalSeats"
                name="totalSeats"
                value={formData.totalSeats}
                onChange={handleInputChange}
                placeholder="Enter total seats"
                className={`form-input ${formErrors.totalSeats ? "input-error" : ""}`}
                min="1"
                aria-invalid={!!formErrors.totalSeats}
                aria-describedby={formErrors.totalSeats ? "totalSeats-error" : undefined}
              />
              {formErrors.totalSeats && <p id="totalSeats-error" className="error-text">{formErrors.totalSeats}</p>}
            </div>
            <div className="form-group">
              <label htmlFor="password" className="form-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter admin password"
                className={`form-input ${formErrors.password ? "input-error" : ""}`}
                aria-invalid={!!formErrors.password}
                aria-describedby={formErrors.password ? "password-error" : undefined}
              />
              {formErrors.password && <p id="password-error" className="error-text">{formErrors.password}</p>}
            </div>
            <div className="form-actions">
              <button
                type="submit"
                className={`submit-button ${isSubmitting || Object.values(formErrors).some((e) => e) ? "button-disabled" : ""}`}
                disabled={isSubmitting || Object.values(formErrors).some((e) => e)}
                aria-disabled={isSubmitting || Object.values(formErrors).some((e) => e)}
              >
                {isSubmitting ? (
                  <span className="button-loading">
                    <span className="spinner"></span>
                    Creating...
                  </span>
                ) : (
                  "Create Event"
                )}
              </button>
            </div>
          </form>
        </div>
        <div className="event-list-container">
          <h2 className="section-title">Scheduled Events</h2>
          <div className="event-list">
            {events.length === 0 ? (
              <p className="no-data">No events scheduled</p>
            ) : (
              events.map((event) => (
                <div key={event._id} className="event-card">
                  <div
                    className="event-image"
                    style={{
                      backgroundImage: `url("https://via.placeholder.com/150")`,
                    }}
                    aria-label={`Event image for ${event.name}`}
                  ></div>
                  <div className="event-details">
                    <p className="event-name">{event.name}</p>
                    <p className="event-info">
                      {new Date(event.date).toLocaleDateString("en-US", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                      {" · "}
                      {event.time}
                    </p>
                  </div>
                  <div className="event-actions">
                    <button
                      className="action-button book-button"
                      onClick={() => handleBookTickets(event._id)}
                      aria-label={`Book tickets for ${event.name}`}
                    >
                      Book Tickets
                    </button>
                    {!event.registrationClosed && (
                      <button
                        className={`action-button end-button ${actionLoading[event._id] ? "button-disabled" : ""}`}
                        onClick={() => handleEndRegistration(event._id)}
                        disabled={actionLoading[event._id]}
                        aria-label={`End registration for ${event.name}`}
                        aria-disabled={actionLoading[event._id]}
                      >
                        {actionLoading[event._id] ? (
                          <span className="button-loading">
                            <span className="spinner"></span>
                            Ending...
                          </span>
                        ) : (
                          "End Registration"
                        )}
                      </button>
                    )}
                    <button
                      className={`action-button delete-button ${actionLoading[event._id] ? "button-disabled" : ""}`}
                      onClick={() => setSelectedEventId(event._id)}
                      disabled={actionLoading[event._id]}
                      aria-label={`Delete event ${event.name}`}
                      aria-disabled={actionLoading[event._id]}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <div className="event-list-container previous-events">
        <h2 className="section-title">Previous Events</h2>
        {previousEvents.length === 0 ? (
          <p className="no-data">No previous events</p>
        ) : (
          previousEvents.map((event) => (
            <div key={event._id} className="past-event-card">
              <div className="past-event-header">
                <div>
                  <p className="event-name">{event.name}</p>
                  <p className="event-info">
                    {new Date(event.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                    {" · "}
                    {event.time}
                  </p>
                  <p className="event-status">Status: {event.registrationClosed ? "Closed" : "Past"}</p>
                </div>
                <button
                  className={`action-button delete-button ${actionLoading[event._id] ? "button-disabled" : ""}`}
                  onClick={() => setSelectedEventId(event._id)}
                  disabled={actionLoading[event._id]}
                  aria-label={`Delete past event ${event.name}`}
                  aria-disabled={actionLoading[event._id]}
                >
                  {actionLoading[event._id] ? (
                    <span className="button-loading">
                      <span className="spinner"></span>
                      Deleting...
                    </span>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
              <div className="table-container">
                <table className="booking-table">
                  <thead>
                    <tr>
                      <th>Seat ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings[event._id]?.length ? (
                      bookings[event._id].map((booking, index) => (
                        <tr key={index}>
                          <td>{booking.seatId}</td>
                          <td>{booking.name}</td>
                          <td>{booking.email}</td>
                          <td>{booking.phone}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="no-bookings">
                          No bookings for this event
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
      {selectedEventId && (
        <DeleteEventModal
          eventId={selectedEventId}
          onClose={() => setSelectedEventId(null)}
          onDelete={handleDeleteEvent}
        />
      )}
    </div>
  );
}

export default function ProtectedAdminLayout() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <Admin />
    </ProtectedRoute>
  );
}