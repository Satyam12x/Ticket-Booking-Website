import { useState } from "react";
import axios, { AxiosError } from "axios";
import { FaTimes } from "react-icons/fa";

interface BookingModalProps {
  seatId: string;
  price: number;
  quantity: number;
  onClose: () => void;
  bookingDate: string;
  onBookingSuccess: () => void;
}

export default function BookingModal({
  seatId,
  price,
  quantity,
  onClose,
  bookingDate,
  onBookingSuccess,
}: BookingModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateForm = () => {
    const newErrors = {
      name: "",
      email: "",
      phone: "",
    };
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
      newErrors.phone = "Invalid phone number format (10 digits or +[country code][10 digits])";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/seats/book", {
        seatId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        bookingDate,
        quantity,
      });
      onBookingSuccess();
      onClose();
    } catch (error: unknown) {
      // Check if error is an AxiosError
      if (axios.isAxiosError(error)) {
        setSubmitError(
          error.response?.data?.error || "Failed to book seat. Please try again."
        );
      } else {
        setSubmitError("Failed to book seat. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const newErrors = { ...errors };
    if (name === "name") {
      newErrors.name =
        !value.trim() ? "Name is required" :
        value.length < 2 ? "Name must be at least 2 characters" : "";
    } else if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      newErrors.email =
        !value ? "Email is required" :
        !emailRegex.test(value) ? "Invalid email format" : "";
    } else if (name === "phone") {
      const phoneRegex = /^(\+?\d{1,3}[-.\s]?)?\d{10}$/;
      newErrors.phone =
        !value ? "Phone number is required" :
        !phoneRegex.test(value) ? "Invalid phone number format (10 digits or +[country code][10 digits])" : "";
    }
    setErrors(newErrors);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal show">
        <button onClick={onClose} className="modal-close" aria-label="Close modal">
          <FaTimes size={16} />
        </button>
        <h3>Book Seat {seatId}</h3>
        <p style={{ color: '#6b7280', marginBottom: '15px' }}>
          Price: ₹{price} | Date: {bookingDate}
        </p>
        {submitError && <p className="error-text active">{submitError}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`input-field ${errors.name ? "input-error" : ""}`}
              placeholder="Enter your name"
              required
            />
            {errors.name && <p className="error-text active">{errors.name}</p>}
          </div>
          <div className="input-group">
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`input-field ${errors.email ? "input-error" : ""}`}
              placeholder="Enter your email"
              required
            />
            {errors.email && <p className="error-text active">{errors.email}</p>}
          </div>
          <div className="input-group">
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              className={`input-field ${errors.phone ? "input-error" : ""}`}
              placeholder="Enter your phone number"
              required
            />
            {errors.phone && <p className="error-text active">{errors.phone}</p>}
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting || Object.values(errors).some((e) => e)}
            >
              {isSubmitting ? "Booking..." : "Confirm Booking"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
}