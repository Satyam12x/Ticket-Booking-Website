import { useState } from "react";
import { FaChair } from "react-icons/fa";

interface SeatProps {
  seat: {
    seatId: string;
    status: "available" | "booked";
    price: number;
    bookedBy?: { name: string; email: string; phone: string };
  };
  onSelect: (seatId: string) => void;
  isColumnSix: boolean;
}

export default function Seat({ seat, onSelect, isColumnSix }: SeatProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={`seat ${
        seat.status === "available" ? "seat-available" : "seat-booked"
      } ${seat.status === "available" ? "seat-selected" : ""} ${
        isColumnSix ? "ml-gap" : ""
      }`}
      onClick={() => seat.status === "available" && onSelect(seat.seatId)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="button"
      aria-label={`Seat ${seat.seatId}, ${
        seat.status === "available" ? "available" : "booked"
      }`}
      tabIndex={seat.status === "available" ? 0 : -1}
      onKeyDown={(e) => {
        if (e.key === "Enter" && seat.status === "available")
          onSelect(seat.seatId);
      }}
    >
      <FaChair className="chair-icon" />
      <span className="seat-id">{seat.seatId}</span>
      {isHovered && seat.status === "booked" && seat.bookedBy && (
        <div className="seat-tooltip">
          <p>Name: {seat.bookedBy.name}</p>
          <p>Phone: {seat.bookedBy.phone}</p>
        </div>
      )}
    </div>
  );
}
