import "./styles/Hero.css";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title">Elepad</h1>
          <p className="hero-subtitle">
            La app que cuida la memoria y el bienestar de tu familia
          </p>
          <p className="hero-description">
            Juegos diseñados científicamente para mantener la mente activa,
            compartir recuerdos y crear conexiones significativas en familia.
          </p>
          <div className="hero-buttons">
            <button className="button button-primary">
              Descargar la app
            </button>
            <button className="button button-secondary">Ver Demo</button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-mockup">
            <div className="phone-notch"></div>
            <div className="phone-content">
              <div className="phone-icon">✨</div>
              <div className="phone-text">Elepad</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
