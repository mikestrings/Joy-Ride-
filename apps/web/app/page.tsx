import Link from "next/link";

export default function HomePage() {
  return (
    <div className="page">
      <header className="container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "28px 24px" }}>
        <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 20, letterSpacing: "0.02em" }}>
          Joy Ride
        </span>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link href="/login" className="btn btn-ghost">Sign in</Link>
          <Link href="/signup" className="btn btn-primary">Start riding</Link>
        </nav>
      </header>

      <section className="container" style={{ padding: "80px 24px 100px", textAlign: "center" }}>
        <h1 style={{ fontSize: "clamp(40px, 7vw, 76px)", marginBottom: 20 }}>
          Move smarter.<br />Ride better.
        </h1>
        <p style={{ fontSize: 19, color: "var(--ink-dim)", maxWidth: 480, margin: "0 auto 36px" }}>
          The future of student mobility in Ile-Ife — affordable Okada rides to and from OAU, with rewards for riding.
        </p>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/signup" className="btn btn-primary">Start riding</Link>
          <Link href="/signup?role=driver" className="btn btn-ghost">Become a driver</Link>
        </div>
      </section>

      <section className="container" style={{ padding: "0 24px 100px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
        {[
          { title: "Book a ride", body: "Pick your hub, choose OAU Campus Gate, get matched with a driver." },
          { title: "Ride together", body: "Automatic matching and fare splitting with other riders." },
          { title: "Watch & Ride", body: "Watch ads, earn points, redeem free rides and food rewards." },
          { title: "Track live", body: "Follow your ride in real time from pickup to drop-off." },
        ].map((f) => (
          <div key={f.title} className="glass" style={{ padding: 28 }}>
            <h3 style={{ fontSize: 20, marginBottom: 10 }}>{f.title}</h3>
            <p style={{ color: "var(--ink-dim)", fontSize: 15 }}>{f.body}</p>
          </div>
        ))}
      </section>

      <section className="container" style={{ padding: "0 24px 100px" }}>
        <h2 style={{ fontSize: 32, marginBottom: 32, textAlign: "center" }}>Simple pricing</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
          {[
            { name: "Single ride", price: "₦600", note: "One trip, any hub" },
            { name: "Weekly pass", price: "₦2,500", note: "One ride daily, Mon–Fri" },
            { name: "Monthly pass", price: "₦10,000", note: "Unlimited daily rides" },
            { name: "Round trip weekly", price: "₦5,000", note: "There and back, Mon–Fri" },
          ].map((p) => (
            <div key={p.name} className="glass" style={{ padding: 28, textAlign: "center" }}>
              <p style={{ color: "var(--ink-dim)", fontSize: 14, marginBottom: 8 }}>{p.name}</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: 30, fontWeight: 700, color: "var(--electric)" }}>{p.price}</p>
              <p style={{ color: "var(--ink-dim)", fontSize: 13, marginTop: 8 }}>{p.note}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="container" style={{ padding: "40px 24px 60px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <span style={{ color: "var(--ink-dim)", fontSize: 14 }}>© 2026 Joy Ride — Ile-Ife, Nigeria</span>
        <div style={{ display: "flex", gap: 20 }}>
          <Link href="/login" style={{ color: "var(--ink-dim)", fontSize: 14 }}>Sign in</Link>
          <Link href="/signup" style={{ color: "var(--ink-dim)", fontSize: 14 }}>Sign up</Link>
        </div>
      </footer>
    </div>
  );
}
