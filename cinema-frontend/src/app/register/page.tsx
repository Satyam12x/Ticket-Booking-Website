"use client";
import React, { useState } from 'react';
import { useAuth } from '../components/AuthContext';
import Link from 'next/link';
import { FaUserPlus } from "react-icons/fa";
import '../components/RegisterPage.css';

const RegisterPage: React.FC = () => {
  const { login } = useAuth();
  const [step, setStep] = useState<'register' | 'verify'>('register');
  const [formData, setFormData] = useState({ name: "", email: "", password: "", otp: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      setStep('verify');
    } catch (error: any) {
      setError(`Registration failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OTP verification failed');
      }
      await login(formData.email, formData.password);
    } catch (error: any) {
      setError(`OTP verification failed: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="page">
      <div className="register-box">
        <div className="avatar-circle">
          <FaUserPlus className="user-icon" />
        </div>
        <h2 className="welcome-text">
          {step === 'register' ? 'Create Account' : 'Verify Email'}
        </h2>
        <p className="sub-text">
          {step === 'register' ? 'Sign up for a new account' : 'Enter the OTP sent to your email'}
        </p>

        {error && <p className="demo-warning">{error}</p>}

        {step === 'register' ? (
          <form className="form" onSubmit={handleRegister}>
            <label className="label">Name</label>
            <div className="input-wrapper">
              <span className="input-icon">👤</span>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter your name"
                className="input"
                required
                aria-describedby={error ? "name-error" : undefined}
              />
            </div>

            <label className="label">Email Address</label>
            <div className="input-wrapper">
              <span className="input-icon">@</span>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                className="input"
                required
                aria-describedby={error ? "email-error" : undefined}
              />
            </div>

            <label className="label">Password</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                className="input"
                required
                aria-describedby={error ? "password-error" : undefined}
              />
            </div>

            <button
              type="submit"
              className="register-btn"
              disabled={isSubmitting}
              aria-label="Register"
            >
              {isSubmitting ? "Registering..." : "Register"}
            </button>

            <div className="options">
              <Link href="/login" className="login-link">
                Already have an account? Sign In
              </Link>
            </div>
          </form>
        ) : (
          <form className="form" onSubmit={handleVerifyOtp}>
            <label className="label">OTP</label>
            <div className="input-wrapper">
              <span className="input-icon">🔑</span>
              <input
                type="text"
                name="otp"
                value={formData.otp}
                onChange={handleInputChange}
                placeholder="Enter the OTP"
                className="input"
                required
                aria-describedby={error ? "otp-error" : undefined}
              />
            </div>

            <button
              type="submit"
              className="verify-btn"
              disabled={isSubmitting}
              aria-label="Verify OTP"
            >
              {isSubmitting ? "Verifying..." : "Verify OTP"}
            </button>

            <div className="options">
              <Link href="/login" className="login-link">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default RegisterPage;