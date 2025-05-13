import React, { useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";


type SignUpProps = {
  onSwitchToLogin: () => void;
  onClose: () => void;
  onLogin: (email: string, id: string) => void;
};

const SignUp = ({ onSwitchToLogin, onClose, onLogin }: SignUpProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("http://localhost:5001/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem("userEmail", data.email);
      localStorage.setItem("userId", data.userId);
      onLogin(data.email, data.userId);
    }
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
        Create your account
      </h2>
      <p className="text-center text-gray-600 mb-6">
        Sign up to start using the assistant
      </p>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email address"
          className="w-full p-3 mb-4 bg-gray-800 border border-gray-700 rounded text-sm text-white focus:outline-none"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <div className="w-full mb-4">
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded px-3">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              className="flex-1 p-3 bg-transparent text-sm text-white focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <span
              onClick={() => setShowPassword((prev) => !prev)}
              className="text-gray-400 hover:text-white cursor-pointer transition-colors duration-150"
            >
              {showPassword ? (
                <VisibilityOff fontSize="small" />
              ) : (
                <Visibility fontSize="small" />
              )}
            </span>
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-black text-white rounded font-semibold text-sm"
        >
          Sign up
        </button>
      </form>
      <div className="text-center mt-6 text-sm text-gray-600">
        Already have an account?{" "}
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

export default SignUp;
