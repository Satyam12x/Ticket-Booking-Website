  "use client";
  import { useState, useEffect } from "react";
  import axios from "axios";
  import ProtectedRoute from "../components/ProtectedRoute";
  import { useRouter } from "next/navigation";
  

  interface Event {
    _id: string;
    name: string;
    date: string;
    time: string;
    description: string;
    venue: string;
    totalSeats: number;
  }

  function Admin() {
    const router = useRouter();
    const [events, setEvents] = useState<Event[]>([]);
    const [error, setError] = useState("");
    const [formData, setFormData] = useState({
      name: "",
      date: "",
      time: "",
      venue:
        "Mukesh Bhati Acting School, E1/74, Milan Road, near YMCA University, Sector-11, Faridabad",
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
      fetchEvents();
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
          if (err.response?.status === 403) {
            router.push("/login?error=admin-required");
          }
        } else {
          setError("Failed to fetch events");
          console.error("Fetch events error:", err);
        }
      }
    };

    const handleInputChange = (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => {
      const { name, value } = e.target;
      setFormData({ ...formData, [name]: value });

      const newErrors = { ...formErrors };
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
          : "";
      } else if (name === "time") {
        newErrors.time = !value
          ? "Time is required"
          : !/^\d{2}:\d{2}$/.test(value)
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
        fetchEvents();
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
          if (err.response?.status === 403) {
            router.push("/login?error=admin-required");
          }
        } else {
          setError("Failed to create event");
          console.error("Create event error:", err);
        }
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleBookTickets = (eventId: string) => {
      console.log("Redirecting to admin seat-layout with eventId:", eventId);
      router.push(`/admin/seat-layout?eventId=${eventId}`);
    };

    return (
      <div className="theater-container">
        <h1 className="text-5xl">Admin Dashboard</h1>
        {error && <p className="error-text">{error}</p>}
        <div className="admin-layout">
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
                {formErrors.name && (
                  <p className="error-text active">{formErrors.name}</p>
                )}
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
                {formErrors.date && (
                  <p className="error-text active">{formErrors.date}</p>
                )}
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
                {formErrors.time && (
                  <p className="error-text active">{formErrors.time}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Venue</label>
                <input
                  type="text"
                  name="venue"
                  value={formData.venue}
                  onChange={handleInputChange}
                  placeholder="Enter venue"
                  className={`form-input ${
                    formErrors.venue ? "input-error" : ""
                  }`}
                />
                {formErrors.venue && (
                  <p className="error-text active">{formErrors.venue}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter event description"
                  className={`form-input ${
                    formErrors.description ? "input-error" : ""
                  }`}
                ></textarea>
                {formErrors.description && (
                  <p className="error-text active">{formErrors.description}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Total Seats</label>
                <input
                  type="number"
                  name="totalSeats"
                  value={formData.totalSeats}
                  onChange={handleInputChange}
                  placeholder="Enter total seats"
                  className={`form-input ${
                    formErrors.totalSeats ? "input-error" : ""
                  }`}
                  min="1"
                />
                {formErrors.totalSeats && (
                  <p className="error-text active">{formErrors.totalSeats}</p>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter admin password"
                  className={`form-input ${
                    formErrors.password ? "input-error" : ""
                  }`}
                />
                {formErrors.password && (
                  <p className="error-text active">{formErrors.password}</p>
                )}
              </div>
              <div className="form-actions">
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={
                    isSubmitting || Object.values(formErrors).some((e) => e)
                  }
                >
                  {isSubmitting ? "Creating..." : "Create Event"}
                </button>
              </div>
            </form>
          </div>
          <div className="event-list-container">
            <h2 className="form-title">Scheduled Events</h2>
            <div className="event-list">
              {events.length === 0 ? (
                <p className="no-events">No events scheduled</p>
              ) : (
                events.map((event) => (
                  <div key={event._id} className="event-item">
                    <div
                      className="event-image"
                      style={{
                        backgroundImage: `url("https://cdna.artstation.com/p/assets/images/images/026/941/604/large/kaustubh-chaudhary-doremon-pink.jpg?1590151532")`,
                      }}
                    ></div>
                    <div className="event-info">
                      <p className="event-name">{event.name}</p>
                      <p className="event-datetime">
                        {new Date(event.date).toLocaleDateString("en-US", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                        {" · "}
                        {event.time}
                      </p>
                    </div>
                    <button
                      className="book-tickets-btn"
                      onClick={() => handleBookTickets(event._id)}
                    >
                      Book Tickets
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
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