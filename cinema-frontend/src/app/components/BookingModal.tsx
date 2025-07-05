import { useState, useEffect } from "react";
import axios from "axios";
import { FaSpinner, FaTimes } from "react-icons/fa";

interface BookingModalProps {
  seatId: string;
  price: number;
  quantity: number;
  onClose: () => void;
  bookingDate: string;
}

export default function BookingModal({
  seatId,
  price,
  quantity,
  onClose,
  bookingDate,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bookingDate,
    quantity,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
    server: "",
  });

  const validateForm = () => {
    const newErrors = { name: "", email: "", phone: "", server: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
    if (!formData.phone) {
      newErrors.phone = "Phone number is required";
      isValid = false;
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone =
        "Phone number must be 10 digits (e.g., +911234567890 or 1234567890)";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors((prev) => ({ ...prev, server: "" }));

    const payload = {
      seatId,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      bookingDate: formData.bookingDate,
    };

    try {
      const response = await axios.post("http://localhost:5000/api/seats/book", payload);
      onClose();
      window.location.reload();
    } catch (error: any) {
      setErrors((prev) => ({
        ...prev,
        server:
          error.response?.data?.error ||
          "Booking failed. Please check your input or try again later.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="alert-modal">
        <button onClick={onClose} className="modal-close" aria-label="Close modal">
          <FaTimes size={16} />
        </button>
        <h3>Book Seat {seatId}</h3>
        <p style={{ marginBottom: '8px', color: '#6b7280' }}>
          Row: {seatId[0]}, Seat: {seatId.slice(1)}
        </p>
        <p style={{ marginBottom: '8px', color: '#6b7280' }}>Price: ₹{price}</p>
        <p style={{ marginBottom: '8px', color: '#6b7280' }}>Quantity: {quantity}</p>
        <p style={{ marginBottom: '8px', color: '#6b7280' }}>Total: ₹{price * quantity}</p>
        <p style={{ marginBottom: '15px', color: '#6b7280' }}>Date: {formData.bookingDate}</p>
        {errors.server && <p className="error-text">{errors.server}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`input-field ${errors.name ? "input-error" : ""}`}
              required
              placeholder="Enter your name"
            />
            <span className="input-label">Name</span>
            {errors.name && <p className="error-text">{errors.name}</p>}
          </div>
          <div className="input-group">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`input-field ${errors.email ? "input-error" : ""}`}
              required
              placeholder="Enter your email"
            />
            <span className="input-label">Email</span>
            {errors.email && <p className="error-text">{errors.email}</p>}
          </div>
          <div className="input-group">
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`input-field ${errors.phone ? "input-error" : ""}`}
              required
              placeholder="Enter your phone number"
            />
            <span className="input-label">Phone</span>
            {errors.phone && <p className="error-text">{errors.phone}</p>}
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || !!errors.name || !!errors.email || !!errors.phone}
            >
              {isSubmitting ? (
                <>
                  <FaSpinner className="spinner-btn" /> Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </button>
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}