const routes = [
  {
    name: "Mayfair",
    description: "Mayfair → OAU Campus Gate"
  },
  {
    name: "Lagere",
    description: "Lagere → OAU Campus Gate"
  },
  {
    name: "Asherifa",
    description: "Asherifa → OAU Campus Gate"
  }
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-content">
          <p className="badge">
            ILE-IFE'S SMART MOBILITY PLATFORM
          </p>

          <h1>
            Ride.
            <br />
            Earn.
            <br />
            Repeat.
          </h1>

          <p className="subtitle">
            Safe, simple and affordable rides connecting
            students and commuters to OAU Campus Gate.
          </p>

          <div className="actions">
            <a href="/signup" className="primary-button">
              Get Started
            </a>

            <a href="/login" className="secondary-button">
              Sign In
            </a>
          </div>
        </div>

        <div className="ride-card">
          <div className="card-label">
            JOY RIDE
          </div>

          <div className="fare">
            ₦600
          </div>

          <p>
            Standard ride
          </p>

          <div className="driver">
            <span>Driver earns</span>
            <strong>₦500</strong>
          </div>
        </div>
      </section>

      <section className="routes">
        <div className="section-heading">
          <p>OUR ROUTES</p>

          <h2>
            Getting you where you need to go.
          </h2>
        </div>

        <div className="route-grid">
          {routes.map((route) => (
            <div
              className="route-card"
              key={route.name}
            >
              <div className="route-icon">
                🏍️
              </div>

              <h3>{route.name}</h3>

              <p>
                {route.description}
              </p>

              <span>
                From ₦600
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="rewards">
        <div>
          <p className="section-label">
            WATCH & RIDE
          </p>

          <h2>
            Watch ads.
            <br />
            Earn rides.
          </h2>

          <p>
            Turn your rewarded ad views into
            ride credits, free rides and food
            rewards.
          </p>
        </div>

        <div className="reward-list">
          <div>
            <strong>1 Ad</strong>
            <span>1 point</span>
          </div>

          <div>
            <strong>10 Points</strong>
            <span>₦50 ride credit</span>
          </div>

          <div>
            <strong>100 Points</strong>
            <span>Free ride</span>
          </div>

          <div>
            <strong>500 Points</strong>
            <span>Food reward</span>
          </div>
        </div>
      </section>

      <section className="subscriptions">
        <p className="section-label">
          RIDE PASSES
        </p>

        <h2>
          Save more with subscriptions.
        </h2>

        <div className="subscription-grid">
          <div>
            <h3>Weekly</h3>
            <strong>₦2,500</strong>
            <p>
              One ride daily, Monday–Friday.
            </p>
          </div>

          <div>
            <h3>Weekly To & Fro</h3>
            <strong>₦5,000</strong>
            <p>
              Two rides daily, Monday–Friday.
            </p>
          </div>

          <div>
            <h3>Monthly</h3>
            <strong>₦10,000</strong>
            <p>
              One ride daily, Monday–Friday.
            </p>
          </div>

          <div>
            <h3>Monthly To & Fro</h3>
            <strong>₦20,000</strong>
            <p>
              Two rides daily, Monday–Friday.
            </p>
          </div>
        </div>
      </section>

      <footer>
        <strong>Joy Ride</strong>

        <p>
          Ride. Earn. Repeat.
        </p>

        <p>
          Ile-Ife, Osun State, Nigeria
        </p>
      </footer>

      <style jsx>{`
        main {
          min-height: 100vh;
        }

        .hero {
          min-height: 680px;
          display: grid;
          grid-template-columns: 1.3fr 0.7fr;
          gap: 40px;
          align-items: center;
          padding: 80px 10%;
          background: #0b172a;
          color: white;
        }

        .hero-content {
          max-width: 650px;
        }

        .badge,
        .section-label,
        .section-heading p {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
        }

        h1 {
          font-size: clamp(64px, 9vw, 120px);
          line-height: 0.88;
          margin: 25px 0;
        }

        .subtitle {
          max-width: 550px;
          font-size: 20px;
          line-height: 1.6;
          color: #dbe4f0;
        }

        .actions {
          display: flex;
          gap: 15px;
          margin-top: 35px;
        }

        .actions a {
          text-decoration: none;
          padding: 15px 25px;
          border-radius: 10px;
          font-weight: 700;
        }

        .primary-button {
          background: #ffffff;
          color: #0b172a;
        }

        .secondary-button {
          border: 1px solid #64748b;
          color: white;
        }

        .ride-card {
          background: white;
          color: #0b172a;
          border-radius: 25px;
          padding: 35px;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.25);
        }

        .card-label {
          font-weight: 800;
          letter-spacing: 2px;
        }

        .fare {
          font-size: 60px;
          font-weight: 900;
          margin-top: 40px;
        }

        .driver {
          display: flex;
          justify-content: space-between;
          margin-top: 50px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
        }

        .routes,
        .subscriptions {
          padding: 90px 10%;
        }

        .section-heading h2,
        .subscriptions h2,
        .rewards h2 {
          font-size: clamp(35px, 5vw, 60px);
          margin-top: 15px;
        }

        .route-grid,
        .subscription-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-top: 45px;
        }

        .route-card,
        .subscription-grid > div {
          background: white;
          padding: 30px;
          border-radius: 18px;
          border: 1px solid #e5e7eb;
        }

        .route-icon {
          font-size: 35px;
          margin-bottom: 20px;
        }

        .route-card h3 {
          font-size: 24px;
        }

        .route-card p,
        .subscription-grid p {
          color: #64748b;
          line-height: 1.6;
          margin: 10px 0 20px;
        }

        .route-card span {
          font-weight: 800;
        }

        .rewards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          padding: 100px 10%;
          background: #eaf1f8;
        }

        .rewards > div:first-child {
          max-width: 550px;
        }

        .rewards h2 {
          margin-bottom: 20px;
        }

        .rewards > div:first-child > p:last-child {
          font-size: 18px;
          line-height: 1.7;
          color: #475569;
        }

        .reward-list {
          display: grid;
          gap: 12px;
        }

        .reward-list div {
          display: flex;
          justify-content: space-between;
          background: white;
          padding: 22px;
          border-radius: 12px;
        }

        .subscription-grid {
          grid-template-columns: repeat(4, 1fr);
        }

        .subscription-grid strong {
          display: block;
          font-size: 30px;
          margin-top: 15px;
        }

        footer {
          padding: 50px 10%;
          background: #0b172a;
          color: white;
          display: flex;
          justify-content: space-between;
          gap: 20px;
          flex-wrap: wrap;
        }

        @media (max-width: 800px) {
          .hero,
          .rewards {
            grid-template-columns: 1fr;
          }

          .route-grid,
          .subscription-grid {
            grid-template-columns: 1fr;
          }

          .hero {
            padding-top: 60px;
            padding-bottom: 60px;
          }
        }
      `}</style>
    </main>
  );
              }
