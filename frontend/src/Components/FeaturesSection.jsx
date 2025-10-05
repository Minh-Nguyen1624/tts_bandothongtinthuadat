import React from "react";
import "../css/HomePage.css";

const FeaturesSection = () => (
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
);

export default FeaturesSection;
