import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PopupMessage from "../components/PopupMessage";
import ResetPasswordModal from "../components/ResetPasswordModal";
import "../styles/Login.css";

const Login = () => {
  //Login States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  //Register States
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  //Reset Password States
  const [resetEmail, setResetEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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
        localStorage.setItem("token", data.accessToken);
        localStorage.setItem("refreshToken", data.refreshToken);
        localStorage.setItem("user", JSON.stringify(data.user));
        localStorage.setItem("isLoggedIn", "true");

        if (data.user.needsPasswordReset) {
          setShowChangePasswordModal(true);
          setPopupMessage("You must reset your password before continuing.");
          setPopupType("error");
        } else {
          setPopupMessage("Login successful! Redirecting to dashboard...");
          setPopupType("success");
          setTimeout(() => {
            navigate("/dashboard");
          }, 2000);
        }
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
    setConfirmPasswordError("");

    function isValidEmail(email) {
      // Email regex pattern: text@text.text
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

      if (!emailPattern.test(email)) return false;

      if (email.includes("..")) return false;

      return true;
    }

    // Checks for valid email format
    if (!isValidEmail(registerEmail)) {
      setRegisterError(
        "Please enter a valid email address without consecutive dots."
      );
      return;
    }

    if (!registerEmail.trim() || !registerPassword.trim()) {
      setRegisterError("Please fill in both email and password.");
      return;
    }

    if (registerPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/request/register`, {
        method: "POST",
        credentials: "include",
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
        setConfirmPassword("");
      } else {
        setRegisterError(data.message || "Registration failed.");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterError("Server error. Please try again later.");
    }
  };

  // Handles Password reset requests
  const handleResetRequest = () => {
    if (!resetEmail) {
      setResetError("Please enter your email.");
      setResetSuccess("");
      return;
    }

    fetch(`${API_BASE}/api/resetRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: resetEmail }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status >= 200 && res.status < 300) {
          return data; // success
        } else {
          throw new Error(data.message || "Failed to send reset request");
        }
      })
      .then((data) => {
        setResetError("");
        setResetSuccess(
          "Password reset request sent. Please wait for admin approval."
        );
        setResetEmail("");
      })
      .catch((error) => {
        setResetError(error.message);
        setResetSuccess("");
      });
  };

  const handleResetPasswordSubmit = async (newPassword) => {
    try {
      setLoading(true);

      const user = JSON.parse(localStorage.getItem("user"));

      const res = await fetch(`${API_BASE}/api/resetRequest/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setPopupMessage("Password reset successfully! You can now log in.");
        setPopupType("success");
        setShowChangePasswordModal(false);
      } else {
        setPopupMessage(data.message || "Failed to reset password");
        setPopupType("error");
      }
    } catch (error) {
      setPopupMessage("Server error. Please try again later.");
      setPopupType("error");
    } finally {
      setLoading(false);
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
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={passwordError ? "input-error" : ""}
          />
          <div className="show-password-container">
            <input
              id="show-password"
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
            />
            <label htmlFor="show-password" className="show-password-label">
              Show Password
            </label>
          </div>
          <button type="submit">Login</button>
        </form>

        {/* Reset Password Link */}
        <p
          className="reset-password-link"
          onClick={() => setShowResetModal(true)}
        >
          Forgot Password?
        </p>

        <div className="register-link">
          <p>Don't have an account?</p>
          <button onClick={() => setShowRegister(true)}>
            Request Registration
          </button>
        </div>
      </div>

      {/* Registration Modal */}
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

            {confirmPasswordError && (
              <p className="registration-error-message">
                {confirmPasswordError}
              </p>
            )}

            <input
              type="email"
              placeholder="example@email.com"
              value={registerEmail}
              onChange={(e) => setRegisterEmail(e.target.value)}
            />
            <input
              type="password"
              placeholder="Password (minimum 6 characters)"
              value={registerPassword}
              onChange={(e) => setRegisterPassword(e.target.value)}
            />

            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={confirmPasswordError ? "input-error" : ""}
            />

            <div className="register-modal-buttons">
              <button onClick={handleRegister}>Submit</button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowRegister(false);
                  setRegisterEmail("");
                  setRegisterPassword("");
                  setConfirmPassword("");
                  setRegisterError("");
                  setRegisterSuccess("");
                  setConfirmPasswordError("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Reset Modal */}
      {showResetModal && (
        <div className="reset-modal">
          <div className="reset-modal-content">
            <h3>Reset Password</h3>
            {resetError && <div className="error-message">{resetError}</div>}
            {resetSuccess && (
              <div className="success-message">{resetSuccess}</div>
            )}

            <input
              type="email"
              placeholder="Enter your email"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
            />

            <div className="reset-modal-buttons">
              <button onClick={handleResetRequest} disabled={loading}>
                Submit Request
              </button>
              <button
                className="cancel-btn"
                onClick={() => {
                  setShowResetModal(false);
                  setResetEmail("");
                  setResetError("");
                  setResetSuccess("");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {showChangePasswordModal && (
        <ResetPasswordModal
          isOpen={showChangePasswordModal}
          onClose={() => setShowChangePasswordModal(false)}
          onSubmit={handleResetPasswordSubmit}
          setPopUpMessage={setPopupMessage}
          setPopUpType={setPopupType}
        />
      )}
    </div>
  );
};

export default Login;
