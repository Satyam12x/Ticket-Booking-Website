import { FaCouch } from "react-icons/fa";

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
}

export default function Seat({ seat, onClick, isColumnSix }: SeatProps) {
  return (
    <button
      onClick={onClick}
      className={`seat ${seat.status === "available" ? "seat-available" : "seat-booked"} ${
        isColumnSix ? "ml-gap" : ""
      }`}
      disabled={seat.status !== "available"}
      title={
        seat.status === "booked" && seat.bookedBy
          ? `Booked by ${seat.bookedBy.name}`
          : `Seat ${seat.seatId} - ₹${seat.price}`
      }
    >
      <FaCouch className="chair-icon" />
      <span className="seat-id">{seat.seatId}</span>
    </button>
  );
}