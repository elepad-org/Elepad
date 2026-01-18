import "./styles/Navigation.css";
import { useState } from "react";

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    element?.scrollIntoView({ behavior: "smooth" });
    setIsOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <span className="logo-icon">✨</span>
          <span className="logo-text">Elepad</span>
        </div>

        <div className={`nav-menu ${isOpen ? "active" : ""}`}>
          <button
            className="nav-link"
            onClick={() => scrollToSection("features")}
          >
            Características
          </button>
          <button className="nav-link" onClick={() => scrollToSection("about")}>
            Quiénes somos
          </button>
          <button
            className="nav-link"
            onClick={() => scrollToSection("contact")}
          >
            Contacto
          </button>
          <a href="#download" className="nav-link-cta">
            Descargar
          </a>
        </div>

        <button className="hamburger" onClick={toggleMenu}>
          <span className={isOpen ? "active" : ""}></span>
          <span className={isOpen ? "active" : ""}></span>
          <span className={isOpen ? "active" : ""}></span>
        </button>
      </div>
    </nav>
  );
}
