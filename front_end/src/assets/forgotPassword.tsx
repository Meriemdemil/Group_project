import React, { useState } from "react";

type ForgotPasswordProps = {
  onSwitchToLogin: () => void;
  onClose: () => void;
};

const ForgotPassword = ({ onSwitchToLogin, onClose }: ForgotPasswordProps) => {
  const [email, setEmail] = useState("");

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    console.log(data);
  };

  return (
    <div className="bg-white w-full max-w-md p-6 rounded-lg relative">
      <span
        onClick={onClose}
        className="absolute top-4 right-4 text-600 text-3xl hover:text-red-600 cursor-pointer focus:outline-none"
        aria-label="Close"
      >
        ×
      </span>
      <h2 className="text-3xl font-bold text-center text-black mb-2">
        Reset your password
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Enter your email to receive a password reset link
      </p>
      <form onSubmit={handleResetPassword}>
        <input
          type="email"
          placeholder="Email address"
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full py-3 bg-black text-white rounded font-semibold text-sm"
        >
          Reset password
        </button>
      </form>
      <div className="text-center mt-6 text-sm text-gray-600">
        Back to{" "}
        <span
          className="font-semibold text-black cursor-pointer"
          onClick={onSwitchToLogin}
        >
          Log in
        </span>
      </div>
    </div>
  );
};

export default ForgotPassword;
