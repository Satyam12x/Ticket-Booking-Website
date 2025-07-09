"use client";
import { useState } from "react";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "../components/Login.css";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"request" | "verify" | "reset">("request");
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    otp: "",
    newPassword: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const validateRequestForm = () => {
    const newErrors = { email: "", otp: "", newPassword: "" };
    let isValid = true;

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email format";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateOtpForm = () => {
    const newErrors = { email: "", otp: "", newPassword: "" };
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

  const validateResetForm = () => {
    const newErrors = { email: "", otp: "", newPassword: "" };
    let isValid = true;

    if (!formData.newPassword) {
      newErrors.newPassword = "New password is required";
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = "New password must be at least 6 characters";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateRequestForm()) return;

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: formData.email,
      });
      setStep("verify");
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Failed to send OTP");
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
        type: "reset-password",
      });
      setStep("reset");
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Failed to verify OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!validateResetForm()) return;

    setIsSubmitting(true);
    try {
      await axios.post("http://localhost:5000/api/auth/reset-password", {
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });
      router.push("/login");
    } catch (error: any) {
      setSubmitError(error.response?.data?.error || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    const newErrors = { ...errors };
    if (name === "email") {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      newErrors.email = !value
        ? "Email is required"
        : !emailRegex.test(value)
        ? "Invalid email format"
        : "";
    } else if (name === "otp") {
      newErrors.otp = !value
        ? "OTP is required"
        : !/^[0-9A-F]{6}$/.test(value)
        ? "OTP must be a 6-digit code"
        : "";
    } else if (name === "newPassword") {
      newErrors.newPassword = !value
        ? "New password is required"
        : value.length < 6
        ? "New password must be at least 6 characters"
        : "";
    }
    setErrors(newErrors);
  };

  return (
    <div className="auth-container">
      <h2>
        {step === "request"
          ? "Forgot Password"
          : step === "verify"
          ? "Verify OTP"
          : "Reset Password"}
      </h2>
      {submitError && <p className="error-text">{submitError}</p>}
      {step === "request" ? (
        <form onSubmit={handleRequestSubmit} className="auth-form">
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
          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
            aria-label="Send OTP"
          >
            {isSubmitting ? "Sending..." : "Send OTP"}
          </button>
        </form>
      ) : step === "verify" ? (
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
      ) : (
        <form onSubmit={handleResetSubmit} className="auth-form">
          <div className="input-group">
            <label htmlFor="newPassword" className="input-label">
              New Password
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleInputChange}
              className={`input-field ${errors.newPassword ? "input-error" : ""}`}
              placeholder="Enter new password"
              required
              aria-describedby={errors.newPassword ? "newPassword-error" : undefined}
            />
            {errors.newPassword && (
              <p id="newPassword-error" className="error-text">
                {errors.newPassword}
              </p>
            )}
          </div>
          <button
            type="submit"
            className="auth-btn"
            disabled={isSubmitting}
            aria-label="Reset Password"
          >
            {isSubmitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}
      <p>
        Remembered your password? <Link href="/login">Login</Link>
      </p>
    </div>
  );
}