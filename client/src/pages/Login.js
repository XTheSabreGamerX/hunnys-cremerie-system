import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PopupMessage from "../components/PopupMessage";
import "../styles/Login.css";

const Login = () => {
  //Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //Register States
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

  //Handles Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setEmailError(false);
    setPasswordError(false);

    let hasError = false;

    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    }

    if (!password.trim()) {
      setPasswordError(true);
      hasError = true;
    }

    if (hasError) return;

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);

        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");

        setPopupMessage("Login successful! Redirecting to dashboard...");
        setPopupType("success");
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      } else {
        const message = data.message || "Invalid email or password";
        setPopupMessage(message);
        setPopupType("error");
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setErrorMessage("There was a problem connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  //Handles Registration
  const handleRegister = async () => {
    setRegisterError("");
    setRegisterSuccess("");

    if (!registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError("Please fill in both email and password.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/request/register`, {
        method: "POST",
        credentials: 'include',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setRegisterSuccess(
          "Registration request submitted! Please wait for your approval from the admin!"
        );
        setRegisterEmail("");
        setRegisterPassword("");
      } else {
        setRegisterError(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterError("Server error. Please try again later.");
    }
  };

  return (
    <div className="login-main-content">
      {popupMessage && (
        <PopupMessage
          message={popupMessage}
          type={popupType}
          onClose={() => {
            setPopupMessage("");
            setPopupType("");
          }}
        />
      )}

      <div className="login-container">
        <h2>Login</h2>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        {loading && (
          <div className="loading-box">
            <div className="loading-spinner"></div>
            <p>Connecting, please wait...</p>
          </div>
        )}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={emailError ? "input-error" : ""}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={passwordError ? "input-error" : ""}
          />
          <button type="submit">Login</button>
        </form>

        <div className="register-link">
          <p>Don't have an account?</p>
          <button onClick={() => setShowRegister(true)}>
            Request Registration
          </button>
        </div>
      </div>

      {showRegister && (
        <div className="register-modal">
          <div className="register-modal-content">
            <h3>Request Registration</h3>

            {registerError && (
              <div className="registration-error-message">{registerError}</div>
            )}
            {registerSuccess && (
              <div className="success-message">{registerSuccess}</div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />

            <div className="register-modal-buttons">
              <button onClick={handleRegister}>Submit</button>
              <button
                className="cancel-btn"
                onClick={() => setShowRegister(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
