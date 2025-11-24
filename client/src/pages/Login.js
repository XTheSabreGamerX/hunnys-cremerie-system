import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import PopupMessage from "../components/PopupMessage";
import ResetPasswordModal from "../components/ResetPasswordModal";

// --- IMPORTS FROM YOUR FILE STRUCTURE ---
import logo from "../elements/images/logo.webp";
import storeImage from "../elements/images/background.webp";

const Login = () => {
  // --- Login States ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const cooldownTimer = useRef(null);

  // --- Register States ---
  const [showRegister, setShowRegister] = useState(false);
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [registerError, setRegisterError] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState("");

  // --- Reset Password States ---
  const [resetEmail, setResetEmail] = useState("");
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

  // --- UI States ---
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState("");

  const navigate = useNavigate();
  const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5001";

  const showPopup = (message, type, duration = 3000) => {
    setPopupMessage(message);
    setPopupType(type);
    setTimeout(() => {
      setPopupMessage("");
      setPopupType("");
    }, duration);
  };

  // --- Handlers ---
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

    if (cooldownSeconds > 0) {
      showPopup(
        `Please wait ${cooldownSeconds} seconds before trying again.`,
        "error"
      );
      return;
    }

    setLoading(true);

    try {
      await new Promise((r) => setTimeout(r, 800));

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
          setPopupMessage("Login successful! Redirecting...");
          setPopupType("success");
          setTimeout(() => navigate("/dashboard"), 1500);
        }

        setCooldownSeconds(0);
        if (cooldownTimer.current) {
          clearInterval(cooldownTimer.current);
          cooldownTimer.current = null;
        }
      } else {
        const message = data.message || "Invalid email or password";
        showPopup(message, "error");

        if (data.cooldownSeconds && data.cooldownSeconds > 0) {
          setCooldownSeconds(data.cooldownSeconds);
          if (cooldownTimer.current) clearInterval(cooldownTimer.current);
          cooldownTimer.current = setInterval(() => {
            setCooldownSeconds((prev) => {
              if (prev <= 1) {
                clearInterval(cooldownTimer.current);
                cooldownTimer.current = null;
                return 0;
              }
              return prev - 1;
            });
          }, 1000);
        }
      }
    } catch (err) {
      console.error("Error logging in:", err);
      setErrorMessage("There was a problem connecting to the server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setRegisterError("");
    setRegisterSuccess("");
    setConfirmPasswordError("");

    const isValidEmail = (email) => {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      return emailPattern.test(email) && !email.includes("..");
    };

    if (!isValidEmail(registerEmail)) {
      setRegisterError("Please enter a valid email address.");
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: registerEmail,
          password: registerPassword,
        }),
      });
      const data = await res.json();

      if (res.ok) {
        setRegisterSuccess("Request submitted! Wait for admin approval.");
        setRegisterEmail("");
        setRegisterPassword("");
        setConfirmPassword("");
      } else {
        setRegisterError(data.message || "Registration failed.");
      }
    } catch (err) {
      setRegisterError("Server error. Please try again later.");
    }
  };

  const handleResetRequest = () => {
    if (!resetEmail) {
      setResetError("Please enter your email.");
      return;
    }

    fetch(`${API_BASE}/api/resetRequest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: resetEmail }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status >= 200 && res.status < 300) return data;
        throw new Error(data.message || "Failed to send reset request");
      })
      .then((data) => {
        setResetError("");
        if (data.message?.toLowerCase().includes("password reset approved")) {
          setResetSuccess("Password reset approved. Check your email.");
        } else {
          setResetSuccess("Request sent. Wait for admin approval.");
        }
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

  // --- Animation Variants ---
  const fadeIn = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.6 } },
  };

  const imageFade = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.8, delay: 0.2 },
    },
  };

  const modalDrop = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { type: "spring", stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, scale: 0.95 },
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50 p-4 lg:p-8 overflow-hidden">
      {/* Decorative Blobs (Background) */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-primary rounded-full blur-[120px] opacity-10"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-brand-dark rounded-full blur-[120px] opacity-10"></div>
      </div>

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

      {/* --- Main Login Card (Split Layout) --- */}
      <div className="bg-white w-full max-w-6xl h-[85vh] lg:h-[800px] rounded-[2rem] shadow-2xl overflow-hidden flex relative z-10 border border-white/50">
        {/* Left Panel - Form */}
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="w-full lg:w-1/2 h-full flex flex-col justify-center p-8 md:p-12 lg:p-16 relative"
        >
          <div className="max-w-md w-full mx-auto">
            {/* --- LOGO (Centered at top of form) --- */}
            <div className="flex justify-center mb-6">
              <img
                src={logo}
                alt="Hunny's Crémerie Logo"
                className="h-24 w-auto object-contain"
              />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight text-center">
              Welcome Back
            </h2>
            <p className="text-gray-500 mb-8 text-center">
              Please enter your details to sign in.
            </p>

            {errorMessage && (
              <div className="mb-6 p-4 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center shadow-sm">
                <span className="mr-2 text-lg">⚠️</span> {errorMessage}
              </div>
            )}

            <form
              onSubmit={handleLogin}
              autoComplete="off"
              className="space-y-6"
            >
              {/* Email Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    placeholder="admin@hunnys.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-5 pr-5 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-brand-light focus:border-brand-primary outline-none transition-all placeholder-gray-400 font-medium ${
                      emailError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  />
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <Mail
                      className={`h-5 w-5 ${
                        emailError ? "text-red-400" : "text-gray-400"
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full pl-5 pr-12 py-4 bg-gray-50 border rounded-2xl focus:ring-4 focus:ring-brand-light focus:border-brand-primary outline-none transition-all placeholder-gray-400 font-medium ${
                      passwordError
                        ? "border-red-500 bg-red-50"
                        : "border-gray-100 hover:border-gray-300"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions Row */}
              <div className="flex items-center justify-between pt-2">
                <div className="text-sm"></div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(true)}
                  className="text-sm text-brand-primary hover:text-brand-dark font-semibold hover:underline transition-colors"
                >
                  Forgot Password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || cooldownSeconds > 0}
                className={`w-full py-4 px-6 bg-brand-primary text-white text-lg font-bold rounded-2xl shadow-lg shadow-brand-primary/30 hover:bg-brand-dark hover:shadow-brand-dark/30 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center`}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin mr-2 h-6 w-6" />
                    Please wait...
                  </>
                ) : cooldownSeconds > 0 ? (
                  `Retry in ${cooldownSeconds}s`
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-400">
                © 2025 Hunny's Crémerie Baking Supplies
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right Panel - Image */}
        <motion.div
          variants={imageFade}
          initial="hidden"
          animate="visible"
          className="hidden lg:block w-1/2 h-full relative bg-brand-light p-4"
        >
          <div className="w-full h-full rounded-[1.5rem] overflow-hidden relative shadow-inner">
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent z-10"></div>

            {/* Imported Image */}
            {/* CHANGED: added 'object-left' to show the left side of the image */}
            <img
              src={storeImage}
              alt="Hunny's Storefront"
              className="w-full h-full object-cover object-left"
            />

            {/* Text on Image */}
            <div className="absolute bottom-12 left-8 z-20 text-white max-w-md">
              <h3 className="text-3xl font-bold mb-3">
                Quality Baking Supplies
              </h3>
              <p className="text-white/90 text-base leading-relaxed">
                Providing the best ingredients for your baking needs since 2020.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* --- Modals --- */}
      <AnimatePresence>
        {/* Registration Modal */}
        {showRegister && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              variants={modalDrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                  Request Registration
                </h3>

                {registerError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {registerError}
                  </div>
                )}
                {registerSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100">
                    {registerSuccess}
                  </div>
                )}
                {confirmPasswordError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {confirmPasswordError}
                  </div>
                )}

                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder="example@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                </div>

                <div className="mt-8 flex gap-3">
                  <button
                    onClick={() => {
                      setShowRegister(false);
                      setRegisterEmail("");
                      setRegisterPassword("");
                      setConfirmPassword("");
                      setRegisterError("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRegister}
                    className="flex-1 px-4 py-3 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-dark transition-colors"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Reset Password Modal */}
        {showResetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              variants={modalDrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="p-8">
                <div className="mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">
                    Reset Password
                  </h3>
                  <p className="text-gray-500 mt-2">
                    Enter your email to receive a reset link.
                  </p>
                </div>

                {resetError && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                    {resetError}
                  </div>
                )}
                {resetSuccess && (
                  <div className="mb-4 p-3 bg-green-50 text-green-600 text-sm rounded-xl border border-green-100">
                    {resetSuccess}
                  </div>
                )}

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="w-full px-5 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-brand-primary outline-none mb-8"
                />

                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowResetModal(false);
                      setResetEmail("");
                      setResetError("");
                      setResetSuccess("");
                    }}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetRequest}
                    disabled={loading}
                    className="flex-1 px-4 py-3 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-dark transition-colors disabled:opacity-50"
                  >
                    Submit
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Force Change Password Modal */}
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
