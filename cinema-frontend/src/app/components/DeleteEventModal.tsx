import { useState } from "react";
import axios from "axios";
import { FaTimes } from "react-icons/fa";

interface DeleteEventModalProps {
  eventId: string;
  onClose: () => void;
  onDeleteSuccess: () => void;
}

export default function DeleteEventModal({
  eventId,
  onClose,
  onDeleteSuccess,
}: DeleteEventModalProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await axios.delete(`http://localhost:5000/api/events/${eventId}`, {
        data: { password },
      });
      onDeleteSuccess();
      onClose();
    } catch (error: any) {
      setError(
        error.response?.data?.error || "Failed to delete event. Please try again."
      );
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
        <h3>Confirm Event Deletion</h3>
        <p style={{ color: '#6b7280', marginBottom: '15px' }}>
          Enter the admin password to delete this event.
        </p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
              placeholder="Enter admin password"
            />
            <span className="input-label">Password</span>
          </div>
          <div className="button-group">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete Event"}
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