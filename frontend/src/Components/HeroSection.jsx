import React from "react";
import "../css/HomePage.css";

const HeroSection = ({ time }) => (
  <section className="hero">
    <span className="time">{time}</span>
    <h1>
      Welcome to <span>My App</span>
    </h1>
    <p>
      This is the home page. Explore features, manage users, and enjoy a smooth
      experience.
    </p>
    <div className="hero-buttons">
      <button className="btn primary">Get Started</button>
      <button className="btn secondary">Learn More</button>
    </div>
  </section>
);

export default HeroSection;
