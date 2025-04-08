import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import axios from "axios";
import Logo from '../../assets/Muves.png';
import { useUser } from "../../context/UserContext";
import ApiService from "../../services/ApiService";

const Auth = () => {
  const [formType, setFormType] = useState("login"); // "login" | "signup" | "forgot" | "verify"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const {setUser} = useUser()

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let response;
      switch(formType) {
        case "login":
          response = await axios.post(`${ApiService.getBaseUrl()}/login`, { email, password },{ withCredentials: true });
          break;

        case "signup":
          if (password !== confirmPassword) {
            throw new Error("Passwords do not match!");
          }
          response = await axios.post(`${ApiService.getBaseUrl()}/register`, { name, email, password });
          break;

        case "forgot":
          response = await axios.post(`${ApiService.getBaseUrl()}/forgot-password`, { email });
          break;

        case "verify":
          response = await axios.post(`${ApiService.getBaseUrl()}/verify`, { email, otp });
          break;
        
          case "reset":
            if (newPassword !== confirmPassword) {
              throw new Error("Passwords do not match!");
            }
            response = await axios.post(`${ApiService.getBaseUrl()}/reset-password`, { 
              email, 
              otp, 
              newPassword 
            });
            break;}

      handleFormSuccess(response.data);
    } catch (error) {
      handleFormError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSuccess = (data) => {
    switch(formType) {
      case "login":
        console.log("data",data);
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("isAuthenticated", "true");
        setUser(data.user);
        navigate("/");
        break;

      case "signup":
        alert("Signup successful! Please verify your email.");
        setFormType("verify");
        break;

      case "verify":
        alert("Email verified successfully!");
        navigate("/login");
        break;

        case "reset":
          alert("Password reset successfully!");
          setFormType("login");
          break;

      case "forgot":
        alert("Password reset link sent to your email.");
        setFormType("reset");
        break;
    }
  };

  const handleFormError = (error) => {
    const errorMessage = error.response?.data?.message || error.message || "An error occurred. Please try again.";
    alert(errorMessage);
  };

  const renderFormContent = () => {
    switch(formType) {
      case "verify":
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Verification Code</label>
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                maxLength="6"
                required
              />
              <p className="text-sm mt-2 text-gray-400">
                Sent to {email}
              </p>
            </div>

            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-blue-400 hover:underline"
                disabled={isLoading}
              >
                Resend Code
              </button>
            </div>
          </>
        );

      case "signup":
        return (
          <>
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Full Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </>
        );

        case "reset":
  return (
    <>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1">Verification Code</label>
        <input
          type="text"
          placeholder="Enter 6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          maxLength="6"
          required
        />
        <p className="text-sm mt-2 text-gray-400">
          Sent to {email}
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-1">New Password</label>
        <input
          type="password"
          placeholder="Enter new password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="mb-4">
        <label className="block text-gray-300 mb-1">Confirm New Password</label>
        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>
    </>
  );

      case "forgot":
        return null;

      default: // login
        return (
          <div className="flex justify-between items-center text-sm mb-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" className="w-4 h-4 bg-gray-700" />
              <span>Remember me</span>
            </label>
            <button 
              type="button" 
              onClick={() => setFormType("forgot")} 
              className="text-blue-400 hover:underline"
            >
              Forgot password?
            </button>
          </div>
        );
    }
  };

  const handleResendOTP = async () => {
    try {
      setIsLoading(true);
      await axios.post(`${ApiService.getBaseUrl()}/resend-otp`, { email });
      alert("New verification code sent!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to resend code");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-900 relative">
      <button
        onClick={() => formType === "verify" ? setFormType("signup") : navigate(-1)}
        className="absolute top-6 left-6 text-white flex items-center space-x-2 hover:text-gray-400"
      >
        <ArrowLeft className="w-6 h-6" />
        <span>Back</span>
      </button>

      <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-96">
        <div className="flex justify-center mb-6">
          <img src={Logo} alt="Logo" className="w-16 h-16" /><br/>
          
        </div>
        <h2 className="text-2xl text-center pb-2">Muve𝄞</h2>

        <h2 className="text-2xl font-bold text-center mb-6">
  {{
    login: "Welcome Back",
    signup: "Create Account",
    verify: "Verify Email",
    forgot: "Reset Password",
    reset: "Reset Password"
  }[formType]}
</h2>

        <form onSubmit={handleSubmit}>
          {formType !== "verify" && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {(formType === "login" || formType === "signup") && (
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Password</label>
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          )}

          {renderFormContent()}

          <button
  type="submit"
  className={`w-full bg-blue-500 hover:bg-blue-600 text-white p-2 rounded font-semibold transition ${
    isLoading ? "opacity-50 cursor-not-allowed" : ""
  }`}
  disabled={isLoading}
>
  {isLoading ? "Processing..." : {
    login: "Login",
    signup: "Sign Up",
    verify: "Verify Code",
    forgot: "Send Reset Link",
    reset: "Reset Password"
  }[formType]}
</button>
        </form>

        <p className="text-center text-sm mt-4">
          {formType === "login" && (
            <>
              Don't have an account?{" "}
              <button 
                onClick={() => setFormType("signup")} 
                className="text-blue-400 hover:underline"
              >
                Sign up
              </button>
            </>
          )}

          {formType === "signup" && (
            <>
              Already have an account?{" "}
              <button 
                onClick={() => setFormType("login")} 
                className="text-blue-400 hover:underline"
              >
                Login
              </button>
            </>
          )}

          {formType === "forgot" && (
            <>
              Remember password?{" "}
              <button 
                onClick={() => setFormType("login")} 
                className="text-blue-400 hover:underline"
              >
                Login
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

export default Auth;