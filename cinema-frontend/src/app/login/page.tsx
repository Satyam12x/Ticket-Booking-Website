"use client";
import { useState } from "react";
import { useAuth } from "../components/AuthContext";
import Link from "next/link";
import "../components/Login.css";

export default function LoginPage() {
  const { login } = useAuth();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await login(formData.email, formData.password);
    } catch (err: any) {
      setError(err.message || "Invalid email or password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="auth-container">
      <h2>Login</h2>
      {error && <p className="error-text">{error}</p>}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="input-group">
          <label htmlFor="email" className="input-label">
            Email
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter your email"
            required
            aria-describedby={error ? "email-error" : undefined}
          />
        </div>
        <div className="input-group">
          <label htmlFor="password" className="input-label">
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            className="input-field"
            placeholder="Enter your password"
            required
            aria-describedby={error ? "password-error" : undefined}
          />
        </div>
        <button
          type="submit"
          className="auth-btn"
          disabled={isSubmitting}
          aria-label="Login"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>
      <p>
        Forgot your password? <Link href="/forgot-password">Reset Password</Link>
      </p>
    </div>
  );
}