"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

const hubs = [
  {
    id: "mayfair",
    name: "Mayfair",
  },
  {
    id: "lagere",
    name: "Lagere",
  },
  {
    id: "asherifa",
    name: "Asherifa",
  },
] as const;

export default function RiderDashboard() {
  const supabase = createClient();

  const [selectedHub, setSelectedHub] =
    useState<
      "mayfair" | "lagere" | "asherifa"
    >("mayfair");

  const [shareRide, setShareRide] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  async function requestRide() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { error } = await supabase
      .from("rides")
      .insert({
        rider_id: user.id,
        hub: selectedHub,
        direction: "outbound",
        status: "requested",
        fare_kobo: shareRide
          ? 30000
          : 60000,
        driver_payout_kobo: shareRide
          ? 50000
          : 50000,
      });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setMessage(
      "Your ride request has been created. We're looking for a driver."
    );

    setLoading(false);
  }

  async function signOut() {
    await supabase.auth.signOut();

    window.location.href = "/";
  }

  return (
    <main className="dashboard">
      <header>
        <div>
          <a href="/" className="logo">
            JOY RIDE
          </a>

          <p>Ride. Earn. Repeat.</p>
        </div>

        <button
          className="logout"
          onClick={signOut}
        >
          Sign out
        </button>
      </header>

      <section className="welcome">
        <p className="eyebrow">
          RIDER DASHBOARD
        </p>

        <h1>
          Where are you
          going?
        </h1>

        <p>
          Choose your pickup hub and
          request a ride to OAU Campus Gate.
        </p>
      </section>

      <section className="booking-card">
        <div className="step">
          <span>1</span>

          <div>
            <h2>
              Choose pickup hub
            </h2>

            <div className="hub-grid">
              {hubs.map((hub) => (
                <button
                  key={hub.id}
                  className={
                    selectedHub === hub.id
                      ? "hub selected"
                      : "hub"
                  }
                  onClick={() =>
                    setSelectedHub(hub.id)
                  }
                >
                  <strong>
                    {hub.name}
                  </strong>

                  <small>
                    → OAU Campus Gate
                  </small>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="step">
          <span>2</span>

          <div className="destination">
            <h2>
              Destination
            </h2>

            <div className="destination-box">
              <span>📍</span>

              <div>
                <strong>
                  OAU Campus Gate
                </strong>

                <small>
                  Obafemi Awolowo University
                </small>
              </div>
            </div>
          </div>
        </div>

        <div className="step">
          <span>3</span>

          <div>
            <h2>
              Ride preference
            </h2>

            <button
              className={
                shareRide
                  ? "share selected"
                  : "share"
              }
              onClick={() =>
                setShareRide(!shareRide)
              }
            >
              <div>
                <strong>
                  Share my ride
                </strong>

                <small>
                  Automatically match me with
                  another rider going the same way.
                </small>
              </div>

              <span className="toggle">
                {shareRide ? "ON" : "OFF"}
              </span>
            </button>
          </div>
        </div>

        <div className="fare-section">
          <div>
            <span>
              Your fare
            </span>

            <strong>
              ₦{shareRide ? "300" : "600"}
            </strong>
          </div>

          <div>
            <span>
              Driver receives
            </span>

            <strong>
              ₦500
            </strong>
          </div>
        </div>

        {message && (
          <div className="message">
            {message}
          </div>
        )}

        <button
          className="request"
          onClick={requestRide}
          disabled={loading}
        >
          {loading
            ? "REQUESTING..."
            : "REQUEST RIDE"}
        </button>
      </section>

      <section className="features">
        <a href="#">
          <span>💰</span>

          <strong>
            Wallet
          </strong>

          <small>
            Ride credits & points
          </small>
        </a>

        <a href="#">
          <span>🎬</span>

          <strong>
            Watch & Ride
          </strong>

          <small>
            Earn rewards from ads
          </small>
        </a>

        <a href="#">
          <span>🎟️</span>

          <strong>
            Ride Passes
          </strong>

          <small>
            Save with subscriptions
          </small>
        </a>

        <a href="#">
          <span>🚕</span>

          <strong>
            My Rides
          </strong>

          <small>
            View ride history
          </small>
        </a>
      </section>

      <style jsx>{`
        .dashboard {
          min-height: 100vh;
          background: #f7f9fc;
          color: #0b172a;
        }

        header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 25px 8%;
          background: white;
          border-bottom: 1px solid #e5e7eb;
        }

        .logo {
          color: #0b172a;
          text-decoration: none;
          font-size: 20px;
          font-weight: 900;
          letter-spacing: 2px;
        }

        header p {
          margin-top: 5px;
          color: #64748b;
          font-size: 12px;
        }

        .logout {
          padding: 10px 18px;
          border: 1px solid #cbd5e1;
          background: white;
          border-radius: 8px;
        }

        .welcome {
          max-width: 900px;
          margin: auto;
          padding: 70px 25px 35px;
        }

        .eyebrow {
          font-size: 12px;
          letter-spacing: 2px;
          font-weight: 800;
        }

        .welcome h1 {
          font-size: clamp(42px, 7vw, 75px);
          line-height: 1;
          margin: 15px 0;
        }

        .welcome > p:last-child {
          color: #64748b;
          font-size: 18px;
        }

        .booking-card {
          max-width: 900px;
          margin: 0 auto 40px;
          padding: 35px;
          background: white;
          border-radius: 24px;
          border: 1px solid #e5e7eb;
        }

        .step {
          display: grid;
          grid-template-columns: 40px 1fr;
          gap: 20px;
          margin-bottom: 40px;
        }

        .step > span {
          width: 35px;
          height: 35px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: #0b172a;
          color: white;
          font-weight: 800;
        }

        h2 {
          font-size: 20px;
          margin-bottom: 18px;
        }

        .hub-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        .hub {
          text-align: left;
          padding: 18px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
        }

        .hub.selected {
          border: 2px solid #0b172a;
        }

        .hub strong,
        .hub small {
          display: block;
        }

        .hub small {
          margin-top: 7px;
          color: #64748b;
        }

        .destination-box {
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 18px;
          border-radius: 12px;
          background: #f1f5f9;
        }

        .destination-box strong,
        .destination-box small {
          display: block;
        }

        .destination-box small {
          margin-top: 5px;
          color: #64748b;
        }

        .share {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
          padding: 18px;
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 12px;
        }

        .share.selected {
          border: 2px solid #0b172a;
        }

        .share small {
          display: block;
          max-width: 500px;
          margin-top: 5px;
          color: #64748b;
        }

        .toggle {
          padding: 7px 10px;
          border-radius: 8px;
          background: #e2e8f0;
          font-size: 11px;
          font-weight: 800;
        }

        .share.selected .toggle {
          background: #0b172a;
          color: white;
        }

        .fare-section {
          display: flex;
          justify-content: space-between;
          gap: 20px;
          padding: 25px 0;
          border-top: 1px solid #e5e7eb;
        }

        .fare-section span,
        .fare-section strong {
          display: block;
        }

        .fare-section span {
          color: #64748b;
          font-size: 14px;
        }

        .fare-section strong {
          font-size: 28px;
          margin-top: 5px;
        }

        .message {
          margin-bottom: 15px;
          padding: 14px;
          border-radius: 10px;
          background: #e0f2fe;
          color: #075985;
        }

        .request {
          width: 100%;
          padding: 17px;
          border: 0;
          border-radius: 12px;
          background: #0b172a;
          color: white;
          font-weight: 900;
          letter-spacing: 1px;
        }

        .request:disabled {
          opacity: 0.6;
        }

        .features {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px 25px 80px;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 15px;
        }

        .features a {
          display: block;
          padding: 22px;
          background: white;
          border-radius: 14px;
          border: 1px solid #e5e7eb;
          text-decoration: none;
          color: #0b172a;
        }

        .features span,
        .features strong,
        .features small {
          display: block;
        }

        .features span {
          font-size: 25px;
          margin-bottom: 15px;
        }

        .features small {
          margin-top: 5px;
          color: #64748b;
        }

        @media (max-width: 700px) {
          .hub-grid,
          .features {
            grid-template-columns: 1fr;
          }

          .booking-card {
            margin-left: 15px;
            margin-right: 15px;
            padding: 25px;
          }

          .fare-section {
            flex-direction: column;
          }
        }
      `}</style>
    </main>
  );
        }
