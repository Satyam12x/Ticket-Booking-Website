"use client";
import { useState } from "react";
import { toast } from "react-toastify";

interface DeleteEventModalProps {
  eventId: string;
  onClose: () => void;
  onDelete: (eventId: string, password: string) => Promise<void>;
}

export default function DeleteEventModal({ eventId, onClose, onDelete }: DeleteEventModalProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password) {
      setError("Password is required");
      return;
    }
    setIsSubmitting(true);
    try {
      await onDelete(eventId, password);
      onClose();
    } catch (err) {
      setError("Failed to delete event. Check your password.");
      toast.error("Failed to delete event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">Delete Event</h2>
        <p className="modal-text">Enter the admin password to delete this event.</p>
        {error && <p className="error-text">{error}</p>}
        <form onSubmit={handleSubmit} className="modal-form" aria-label="Delete Event Form">
          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className={`form-input ${error ? "input-error" : ""}`}
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
            />
            {error && <p id="password-error" className="error-text">{error}</p>}
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="action-button cancel-button"
              onClick={onClose}
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`action-button delete-button ${isSubmitting ? "button-disabled" : ""}`}
              disabled={isSubmitting}
              aria-label="Confirm event deletion"
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="button-loading">
                  <span className="spinner"></span>
                  Deleting...
                </span>
              ) : (
                "Delete Event"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}