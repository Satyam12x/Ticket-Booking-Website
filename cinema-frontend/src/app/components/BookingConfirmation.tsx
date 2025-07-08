// File: components/TicketSuccessPage.tsx
import React from "react";
import "./BookingConfirmation.css";

export default function TicketSuccessPage() {
  return (
    <div className="ticket-wrapper">
      <header className="ticket-header">
        <h1>Mukesh Bhati Acting School</h1>
      </header>

      <div className="ticket-content">
        <div className="ticket-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="ticket-title">
          Congratulations! You have successfully booked tickets
        </h2>
        <p className="ticket-note">
          Mail sent to your contact details, along with a relevant ID proof while travelling
        </p>

        <div className="ticket-card">

          <div className="ticket-train-name">
            12430 - NDLS LKO AC SF
          </div>

          <div className="ticket-schedule">
            <div className="schedule-item">
              <p className="bold">Nov 16</p>
              <p>11:25 pm</p>
              <p>NDLS, New Delhi</p>
            </div>

            <div className="schedule-time">
              <div className="progress-bar" />
              <p>8 hours</p>
            </div>

            <div className="schedule-item right">
              <p className="bold">Nov 17</p>
              <p>7:25 am</p>
              <p>LKO, Lucknow</p>
            </div>
          </div>
        </div>

        <button className="ticket-button">
          Book another ticket
        </button>
      </div>
    </div>
  );
}