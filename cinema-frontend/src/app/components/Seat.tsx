import { FaTicketAlt } from "react-icons/fa";

interface SeatData {
  _id: string;
  seatId: string;
  row: number;
  column: string;
  price: number;
  status: string;
  bookedBy: { name: string; email: string; phone: string } | null;
}

interface SeatProps {
  seat: SeatData;
  onClick: () => void;
}

export default function Seat({ seat, onClick }: SeatProps) {
  return (
    <button
      onClick={onClick}
      className={`seat ${seat.status === "available" ? "seat-available" : "seat-booked"}`}
      disabled={seat.status !== "available"}
      title={
        seat.status === "booked" && seat.bookedBy
          ? `Booked by ${seat.bookedBy.name}`
          : `Seat ${seat.seatId} - ₹${seat.price}`
      }
    >
      <FaTicketAlt className="chair-icon" />
      <span className="seat-id">{seat.seatId}</span>
    </button>
  );
}