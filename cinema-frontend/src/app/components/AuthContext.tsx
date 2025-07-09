"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  bookSeat: (seatId: string, name: string, email: string, phone: string, bookingDate: string) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/auth/me", {
          withCredentials: true,
        });
        setUser(res.data);
      } catch (error: any) {
        console.error("Fetch user error:", error.response?.data || error.message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      console.log("Login response:", res.data);
      setUser(res.data.user);
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const logout = () => {
    setUser(null);
    document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    router.push("/login");
  };

  const bookSeat = async (seatId: string, name: string, email: string, phone: string, bookingDate: string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/seats/book",
        { seatId, name, email, phone, bookingDate },
        { withCredentials: true }
      );
      console.log("Booking successful:", res.data);
      router.push("/confirmation"); // Adjust to your desired route
    } catch (error: any) {
      console.error("Booking error:", error.response?.data || error.message);
      throw new Error(error.response?.data?.error || "Failed to book seat");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, bookSeat, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};