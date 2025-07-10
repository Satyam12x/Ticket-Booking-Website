"use client";
import ProtectedRoute from "../../components/ProtectedRoute";
import AdminSeatLayout from "../SeatLayout";

export default function ProtectedAdminSeatLayout() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <AdminSeatLayout />
    </ProtectedRoute>
  );
}