"use client";
import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

import SignupImage from "@/public/images/sky-signin.jpg";
import toast from "react-hot-toast";

export default function SigninPage() {
  const [form, setForm] = useState({ phone: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        phone: form.phone,
        password: form.password,
        redirect: false,
      });


      setLoading(false);

      if (!res?.error) {
        toast.success("Login successful!");
        window.location.href = "/dashboard";
      } else {
        toast.error("Invalid phone or password");
      }

    } catch (err) {
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };




  return (
    <section className="signin">
      <div className="container">
        <div className="signin__content">
          <div className="signin__image-wrap">
            <Image
              src={SignupImage}
              alt="Signin"
              width={500}
              className="signin__image"
            />
          </div>

          <div className="signin__form-wrap">
            <h3 className="secondary-heading signin__heading">
              Welcome to Royel Turf & Swimming Zone
            </h3>
            <p className="primary-text signin__text">
              The Home of Football in Buchi
            </p>

            <form className="signin__form" onSubmit={handleLogin}>
              <label className="signin__form-label" htmlFor="phone">
                Phone
              </label>
              <input
                className="signin__form-input"
                name="phone"
                type="text"
                placeholder="Phone"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                id="phone"
                required
              />

              <label className="signin__form-label" htmlFor="password">
                Password
              </label>
              <div className="signin__form-input-pass-wrap">
                <input
                  className="signin__form-input signin__form-input--password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  id="password"
                  required
                />
                <button
                  type="button"
                  className="signin__form-input-pass-eye"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                </button>
              </div>

              {error && (
                <p style={{ color: "red", marginTop: "10px" }}>{error}</p>
              )}

              <Link href="">
                <span className="signin__forgot-pass-text">
                  Forgot Password
                </span>
              </Link>

              <button
                className="secondary-button signin__button"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="signin__acc-text">
                Do not have an account?{" "}
                <Link href="/signup">
                  <span className="signin__link-text">Sign Up</span>
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}