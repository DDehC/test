import React, { useState, useEffect } from "react";
import stock1 from "../assets/stock1.jpg";
import stock2 from "../assets/stock2.jpg";
import stock3 from "../assets/stock3.jpg";
import stock4 from "../assets/stock4.jpg";
import stock5 from "../assets/stock5.jpg";
import stock6 from "../assets/stock6.jpg";
import "../styles/LandingPageImageSlideShow.css";

export default function LandingPageImageSlideShow() {
  const images = [stock1, stock2, stock3, stock4, stock5, stock6];
  const [current, setCurrent] = useState(0);

  const prevSlide = () => setCurrent((i) => (i - 1 + images.length) % images.length);
  const nextSlide = () => setCurrent((i) => (i + 1) % images.length);

  // optional auto-advance (10s)
  useEffect(() => {
    const id = setInterval(nextSlide, 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <section className="carousel-container">
      <div className="carousel-slides">
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`slide-${index + 1}`}
            className={`carousel-image ${index === current ? "active" : ""}`}
            draggable={false}
          />
        ))}
      </div>

      <button className="carousel-button prev" onClick={prevSlide} aria-label="Previous slide">
        ‹
      </button>
      <button className="carousel-button next" onClick={nextSlide} aria-label="Next slide">
        ›
      </button>

      <div className="carousel-indicators">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`indicator ${index === current ? "active" : ""}`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
