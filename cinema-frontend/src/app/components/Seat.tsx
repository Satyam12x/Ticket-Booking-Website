// components/Seat.tsx
import { MdChair } from "react-icons/md";


interface SeatData {
  _id: string;
  seatId: string;
  row: string;
  column: number;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

interface SeatProps {
  seat: SeatData;
  onClick: () => void;
  isColumnSix: boolean;
  isSelected: boolean;
}

export default function Seat({ seat, onClick, isColumnSix, isSelected }: SeatProps) {
  return (
    <button
      onClick={seat.status === "available" ? onClick : undefined}
      onKeyDown={(e) => {
        if (seat.status === "available" && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`seat ${seat.status === "available" ? "seat-available" : "seat-booked"} ${isSelected ? "seat-selected" : ""
        } ${isColumnSix ? "ml-gap" : ""}`}
      disabled={seat.status !== "available"}
      aria-label={`Seat ${seat.seatId} is ${seat.status}${isSelected ? ", selected" : ""}`}
      tabIndex={seat.status === "available" ? 0 : -1}
      title={
        seat.status === "booked" && seat.bookedBy
          ? `Booked by ${seat.bookedBy.name}`
          : `Seat ${seat.seatId} - ₹${seat.price}`
      }
    >
      <MdChair className="chair-icon" />
      {/* <span className="seat-id">{seat.seatId}</span> */}
    </button>
  );
}