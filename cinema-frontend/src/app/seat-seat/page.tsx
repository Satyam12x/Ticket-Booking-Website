import SeatLayout from "../seat-layout/page";
import ProtectedRoute from "../components/ProtectedRoute";

export default function SeatLayoutPage() {
  return (
    <ProtectedRoute>
      <SeatLayout />
    </ProtectedRoute>
  );
}