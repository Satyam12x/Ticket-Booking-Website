import React from 'react';
import './LoginPage.css';
import { FaUserAlt } from "react-icons/fa";

const LoginPage: React.FC = () => {
  return (
    <div className="page">
      <div className="login-box">
        <div className="avatar-circle">
            <FaUserAlt className='user-icon' />
        </div>
        <h2 className="welcome-text">Welcome Back</h2>
        <p className="sub-text">Sign in to your account</p>

        <form className="form">
          <label className="label">Email Address</label>
          <div className="input-wrapper">
            <span className="input-icon">@</span>
            <input
              type="email"
              placeholder="Enter your email"
              className="input"
            />
          </div>

          <label className="label">Password</label>
          <div className="input-wrapper">
            <span className="input-icon">🔒</span>
            <input
              type="password"
              placeholder="Enter your password"
              className="input"
            />
            {/* <span className="input-icon eye-icon">👁️</span> */}
          </div>

          <button type="submit" className="signin-btn">
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
