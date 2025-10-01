import React from "react";
import "../css/HomePage.css";

const HomePage = () => {
  return (
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero">
        <h1>
          Welcome to <span>My App</span>
        </h1>
        <p>
          This is the home page. Explore features, manage users, and enjoy a
          smooth experience.
        </p>
        <div className="hero-buttons">
          <button className="btn primary">Get Started</button>
          <button className="btn secondary">Learn More</button>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="feature-card">
          <h3>🔐 Authentication</h3>
          <p>Secure login, registration, and role-based access management.</p>
        </div>
        <div className="feature-card">
          <h3>📊 Dashboard</h3>
          <p>Track statistics, user activity, and manage data in one place.</p>
        </div>
        <div className="feature-card">
          <h3>⚡ Performance</h3>
          <p>Optimized for speed and smooth user experience on all devices.</p>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
