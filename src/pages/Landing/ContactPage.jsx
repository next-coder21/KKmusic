import React, { useState } from "react";
import LandingNavbar from "./LandingNavbar";
import LandingFooter from "./LandingFooter";
import { useLandingBody } from "./useLandingBody";
import { API_CONFIG } from "../../config.js";
import "./landing.css";

const CATEGORIES = ["Bug Report", "Feature Request", "General Feedback", "Other"];

export default function ContactPage() {
  useLandingBody();
  const [form, setForm] = useState({ name: "", email: "", category: "Bug Report", message: "" });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const res = await fetch(`${API_CONFIG.AUTH_URL}/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");
      setResult({ ok: true, text: "Message sent! We'll get back to you soon." });
      setForm({ name: "", email: "", category: "Bug Report", message: "" });
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setSending(false);
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", fontSize: 15,
    fontFamily: "var(--lp-font-body)", color: "var(--lp-on-surface)",
    background: "var(--lp-surface-container-lowest)",
    border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)",
    outline: "none", transition: "box-shadow 0.2s ease",
    boxSizing: "border-box",
  };

  return (
    <div className="landing-root">
      <LandingNavbar />
      <main style={{ flex: 1, paddingTop: "var(--lp-nav-h)" }}>
        <section style={{ padding: "5rem 0", overflow: "hidden" }}>
          <div className="lp-wrap" style={{ maxWidth: 600, margin: "0 auto" }}>
            <h1 className="lp-headline-xl" style={{ color: "var(--lp-on-surface)", display: "inline-block", position: "relative", marginBottom: 12 }}>
              Contact Us
              <div style={{ position: "absolute", bottom: -8, left: 0, width: "100%", height: 8, background: "var(--lp-tertiary-container)", zIndex: -1, transform: "rotate(-1deg)" }} />
            </h1>
            <p className="lp-body-lg" style={{ color: "var(--lp-on-surface-variant)", marginBottom: "2.5rem" }}>
              Found a bug? Have a feature idea? Just want to say hi? Drop us a message.
            </p>

            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <input
                  name="name" value={form.name} onChange={handleChange} required
                  placeholder="Your name" aria-label="Your name"
                  style={{ ...inputStyle, flex: "1 1 200px" }}
                  onFocus={e => e.target.style.boxShadow = "var(--lp-shadow)"}
                  onBlur={e => e.target.style.boxShadow = "var(--lp-shadow-sm)"}
                />
                <input
                  name="email" type="email" value={form.email} onChange={handleChange} required
                  placeholder="Your email" aria-label="Your email"
                  style={{ ...inputStyle, flex: "1 1 200px" }}
                  onFocus={e => e.target.style.boxShadow = "var(--lp-shadow)"}
                  onBlur={e => e.target.style.boxShadow = "var(--lp-shadow-sm)"}
                />
              </div>

              <select
                name="category" value={form.category} onChange={handleChange}
                aria-label="Category"
                style={{ ...inputStyle, cursor: "pointer", appearance: "auto" }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <textarea
                name="message" value={form.message} onChange={handleChange} required
                placeholder="Describe the issue, idea, or feedback..." aria-label="Message"
                rows={6}
                style={{ ...inputStyle, resize: "vertical", minHeight: 140 }}
                onFocus={e => e.target.style.boxShadow = "var(--lp-shadow)"}
                onBlur={e => e.target.style.boxShadow = "var(--lp-shadow-sm)"}
              />

              <button
                type="submit" disabled={sending}
                className="lp-btn lp-btn-primary lp-wobble"
                style={{ alignSelf: "flex-start", transform: "rotate(-1deg)", fontSize: 16, padding: "0.75rem 2rem", opacity: sending ? 0.6 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{sending ? "hourglass_top" : "send"}</span>
                {sending ? "Sending..." : "Send Message"}
              </button>

              {result && (
                <p style={{
                  padding: "12px 16px", fontSize: 14, fontWeight: 600,
                  background: result.ok ? "var(--lp-primary-container)" : "var(--lp-tertiary-container)",
                  color: result.ok ? "var(--lp-on-primary-container)" : "var(--lp-on-tertiary-container)",
                  border: "2px solid var(--lp-on-surface)", boxShadow: "var(--lp-shadow-sm)",
                }}>
                  {result.text}
                </p>
              )}
            </form>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
