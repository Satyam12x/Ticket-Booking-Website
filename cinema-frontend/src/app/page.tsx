"use client";
import { useState, useEffect } from "react";
import BookingLayout from "./components/BookingLayout";
import Loader from "./components/loader";
import ProtectedRoute from "./components/ProtectedRoute";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1900);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ProtectedRoute>
      {isLoading ? <Loader isLoading={true} /> : <BookingLayout />}
    </ProtectedRoute>
  );
}