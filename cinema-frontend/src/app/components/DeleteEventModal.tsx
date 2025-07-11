"use client";
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";

interface DeleteEventModalProps {
  eventId: string;
  onClose: () => void;
  onDelete: (eventId: string, password: string) => Promise<void>;
}

export default function DeleteEventModal({
  eventId,
  onClose,
  onDelete,
}: DeleteEventModalProps) {
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side validation
    if (!password) {
      setError("Password is required");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setIsSubmitting(true);
    try {
      console.log("Attempting to delete event:", {
        eventId,
        passwordLength: password.length,
      });
      await onDelete(eventId, password);
      toast.success("Event deleted successfully");
      onClose();
    } catch (err) {
      let errorMessage = "Failed to delete event. Please try again.";
      if (axios.isAxiosError(err)) {
        console.error("Delete event error:", {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
        });
        if (err.response?.status === 403) {
          errorMessage = "Access denied: Admin privileges required";
        } else if (err.response?.status === 400) {
          errorMessage = err.response?.data?.error || "Invalid password";
        } else {
          errorMessage =
            err.response?.data?.error || "Server error. Please try again.";
        }
      } else {
        console.error("Unexpected error:", err);
      }
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset state when modal closes
  useEffect(() => {
    return () => {
      setPassword("");
      setError("");
      setIsSubmitting(false);
    };
  }, []);

  return (
    <div className="admin-modal-overlay">
      <div className="admin-modal-content">
        <h2 className="admin-modal-title">Delete Event</h2>
        <p className="admin-modal-text">
          Enter the admin password to delete this event.
        </p>
        {error && <p className="admin-error-text">{error}</p>}
        <form
          onSubmit={handleSubmit}
          className="admin-modal-form"
          aria-label="Delete Event Form"
        >
          <div className="admin-form-group">
            <label htmlFor="password" className="admin-form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter admin password"
              className={`admin-form-input ${error ? "admin-input-error" : ""}`}
              aria-invalid={!!error}
              aria-describedby={error ? "password-error" : undefined}
            />
            {error && (
              <p id="password-error" className="admin-error-text">
                {error}
              </p>
            )}
          </div>
          <div className="admin-modal-actions">
            <button
              type="button"
              className="admin-action-button admin-cancel-button"
              onClick={onClose}
              aria-label="Cancel deletion"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`admin-action-button admin-delete-button ${
                isSubmitting ? "admin-button-disabled" : ""
              }`}
              disabled={isSubmitting}
              aria-label="Confirm event deletion"
              aria-disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="admin-button-loading">
                  <span className="admin-spinner"></span>
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
