"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import SignupImage from "@/public/images/sky-signin.jpg";
import { toast } from "react-hot-toast";


const isValidBDPhone = (phone) => {
  const bdRegex = /^(013|014|015|016|017|018|019)\d{8}$/;
  return bdRegex.test(phone);
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export default function SignupPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);


    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }


    if (!isValidBDPhone(form.phone)) {
      toast.error(
        "Phone must be 11 digits and start with 013, 014, 015, 016, 017, 018, or 019"
      );
      setLoading(false);
      return;
    }


    if (!isValidEmail(form.email)) {
      toast.error("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Signup successful!");
        setTimeout(() => router.push("/dashboard"), 1000);
      } else {
        toast.error(data?.error || "Something went wrong");
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="signup">
      <div className="container">
        <div className="signup__content">
          <div className="signup__form-wrap">
            <h3 className="secondary-heading signup__heading">
              Create your account
            </h3>
            <p className="primary-text signup__text">
              The Home of Football in Mymensingh
            </p>

            <form className="signup__form" onSubmit={handleSubmit}>
              <label className="signup__form-label">Full Name</label>
              <input
                className="signup__form-input"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                required
              />

              <label className="signup__form-label">Phone</label>
              <input
                className="signup__form-input"
                placeholder="01XXXXXXXXX"
                value={form.phone}
                maxLength={11}
                onChange={(e) =>
                  setForm({
                    ...form,
                    phone: e.target.value.replace(/\D/g, ""),
                  })
                }
                required
              />

              <label className="signup__form-label">Email</label>
              <input
                type="email"
                className="signup__form-input"
                value={form.email}
                onChange={(e) =>
                  setForm({ ...form, email: e.target.value })
                }
                required
              />

              <label className="signup__form-label">Password</label>
              <input
                type="password"
                className="signup__form-input"
                value={form.password}
                onChange={(e) =>
                  setForm({ ...form, password: e.target.value })
                }
                required
              />

              <label className="signup__form-label">
                Confirm Password
              </label>
              <input
                type="password"
                className="signup__form-input"
                value={form.confirmPassword}
                onChange={(e) =>
                  setForm({
                    ...form,
                    confirmPassword: e.target.value,
                  })
                }
                required
              />

              <button
                className="secondary-button signup__button"
                type="submit"
                disabled={loading}
              >
                {loading ? <span className="loader" /> : "Sign up"}
              </button>

              <p className="signup__acc-text">
                Already have an account?{" "}
                <Link href="/signin">
                  <span className="signup__link-text">Sign In</span>
                </Link>
              </p>
            </form>
          </div>

          <div className="signup__image-wrap">
            <Image
              src={SignupImage}
              alt="Signup"
              width={500}
              className="signup__image"
            />
          </div>
        </div>
      </div>
    </section>
    
  );
}

