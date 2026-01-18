import "./styles/Hero.css";

export function Hero() {
  return (
    <section className="hero">
      <div className="hero-content">
        <div className="hero-text left-align">
          <img src="/ele-gray.png" alt="Elepad Elefante" className="hero-elephant" />
          <h1 className="hero-title left-title">Elepad</h1>
          <p className="hero-subtitle">
            La app que cuida la memoria y el bienestar de tu familia
          </p>
          <div className="hero-buttons">
            <button className="button button-primary">
              Descargar la app
            </button>
          </div>
        </div>
        <div className="hero-visual">
          <div className="phone-mockup">
            {/* Espacio para captura de pantalla, reemplaza src cuando tengas la imagen */}
            <img src="" alt="Captura de la app" className="hero-capture" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '32px', background: '#f2f2f7' }} />
          </div>
        </div>
      </div>
    </section>
  );
}
