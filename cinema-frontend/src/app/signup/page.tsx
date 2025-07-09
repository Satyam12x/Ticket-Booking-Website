"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../components/Login.css";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<"signup" | "verify">("signup");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });
  const [errors, setErrors] = useState({
    name: "",
    email: "",
    password: "",
    otp: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateSignupForm = () => {
    const newErrors = { name: "", email: "", password: "", otp: "" };
    let isValid = true;

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
      isValid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateOtpForm = () => {
    const newErrors = { name: "", email: "", password: "", otp: "" };
    let isValid = true;

    if (!formData.otp) {
      newErrors.otp = "OTP is required";
      isValid = false;
    } else if (!/^[0-9A-F]{6}$/.test(formData.otp)) {
      newErrors.otp = "OTP must be a 6-digit code";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateSignupForm()) return;

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      setStep("verify");
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Failed to sign up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateOtpForm()) return;

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/auth/verify-otp", {
        email: formData.email,
        otp: formData.otp,
        type: "signup",
      });
      router.push("/login");
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const newErrors = { ...errors };
    if (name === "name") {
      newErrors.name = !value.trim()
        ? "Name is required"
        : value.length < 2
        ? "Name must be at least 2 characters"
        : "";
    } else if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      newErrors.email = !value
        ? "Email is required"
        : !emailRegex.test(value)
        ? "Invalid email format"
        : "";
    } else if (name === "password") {
      newErrors.password = !value
        ? "Password is required"
        : value.length < 6
        ? "Password must be at least 6 characters"
        : "";
    } else if (name === "otp") {
      newErrors.otp = !value
        ? "OTP is required"
        : !/^[0-9A-F]{6}$/.test(value)
        ? "OTP must be a 6-digit code"
        : "";
    }
    setErrors(newErrors);
  };

  return (
    <div className="auth-container">
      <h2>{step === "signup" ? "Sign Up" : "Verify OTP"}</h2>
      {submitError && <p className="error-text">{submitError}</p>}
      {step === "signup" ? (
        <form onSubmit={handleSignupSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="name" className="input-label">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`input-field ${errors.name ? "input-error" : ""}`}
              placeholder="Enter your name"
              required
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {errors.name && (
              <p id="name-error" className="error-text">
                {errors.name}
              </p>
            )}
          </div>
          <div className="input-group">
            <label htmlFor="email" className="input-label">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`input-field ${errors.email ? "input-error" : ""}`}
              placeholder="Enter your email"
              required
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && (
              <p id="email-error" className="error-text">
                {errors.email}
              </p>
            )}
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
              className={`input-field ${errors.password ? "input-error" : ""}`}
              placeholder="Enter your password"
              required
              aria-describedby={errors.password ? "password-error" : undefined}
            />
            {errors.password && (
              <p id="password-error" className="error-text">
                {errors.password}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
            aria-label="Sign Up"
          >
            {isSubmitting ? "Submitting..." : "Sign Up"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleOtpSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="otp" className="input-label">
              OTP
            </label>
            <input
              type="text"
              name="otp"
              value={formData.otp}
              onChange={handleInputChange}
              className={`input-field ${errors.otp ? "input-error" : ""}`}
              placeholder="Enter 6-digit OTP"
              required
              aria-describedby={errors.otp ? "otp-error" : undefined}
            />
            {errors.otp && (
              <p id="otp-error" className="error-text">
                {errors.otp}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
            aria-label="Verify OTP"
          >
            {isSubmitting ? "Verifying..." : "Verify OTP"}
          </button>
        </form>
      )}
      <p>
        Already have an account? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}