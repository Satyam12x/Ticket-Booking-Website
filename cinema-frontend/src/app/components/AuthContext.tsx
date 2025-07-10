"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  bookSeat: (
    seatId: string,
    name: string,
    email: string,
    phone: string,
    bookingDate: string
  ) => Promise<void>;
  checkAdmin: () => Promise<boolean>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const fetchUser = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/me", {
        withCredentials: true,
      });
      console.log("Fetch user response:", {
        userId: res.data.id,
        email: res.data.email,
        isAdmin: res.data.isAdmin,
      });
      setUser(res.data);
    } catch (error: any) {
      console.error("Fetch user error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/auth/login",
        { email, password },
        { withCredentials: true }
      );
      console.log("Login successful:", {
        userId: res.data.user.id,
        email: res.data.user.email,
        isAdmin: res.data.user.isAdmin,
      });
      setUser(res.data.user);
      router.push("/");
    } catch (error: any) {
      console.error("Login error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(error.response?.data?.error || "Login failed");
    }
  };

  const logout = async () => {
    try {
      await axios.post(
        "http://localhost:5000/api/auth/logout",
        {},
        { withCredentials: true }
      );
      console.log("Logout successful");
      setUser(null);
      router.push("/login");
    } catch (error: any) {
      console.error("Logout error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      setUser(null);
      router.push("/login");
    }
  };

  const bookSeat = async (
    seatId: string,
    name: string,
    email: string,
    phone: string,
    bookingDate: string
  ) => {
    try {
      const res = await axios.post(
        "http://localhost:5000/api/seats/book",
        { seatId, name, email, phone, bookingDate },
        { withCredentials: true }
      );
      console.log("Booking successful:", {
        seatId,
        bookingDate,
        email,
      });
      router.push("/confirmation");
    } catch (error: any) {
      console.error("Booking error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      throw new Error(error.response?.data?.error || "Failed to book seat");
    }
  };

  const checkAdmin = async (): Promise<boolean> => {
    try {
      const res = await axios.get("http://localhost:5000/api/auth/is-admin", {
        withCredentials: true,
      });
      console.log("Check admin response:", {
        isAdmin: res.data.isAdmin,
      });
      return res.data.isAdmin;
    } catch (error: any) {
      console.error("Check admin error:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, login, logout, bookSeat, checkAdmin, isLoading }}
    >
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