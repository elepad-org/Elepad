import "./styles/Footer.css";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Elepad</h3>
            <p>Cuidando la memoria, fortaleciendo familias</p>
          </div>

          <div className="footer-section">
            <h4>Enlaces</h4>
            <ul>
              <li>
                <a href="#features">Características</a>
              </li>
              <li>
                <a href="#about">Quiénes somos</a>
              </li>
              <li>
                <a href="#contact">Contacto</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li>
                <a href="/privacy">Política de privacidad</a>
              </li>
              <li>
                <a href="/terms">Términos de servicio</a>
              </li>
            </ul>
          </div>

          <div className="footer-section">
            <h4>Descargar</h4>
            <div className="download-links">
              <a href="#" className="download-btn">
                App Store
              </a>
              <a href="#" className="download-btn">
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            © {currentYear} Elepad. Todos los derechos reservados. Hecho con
            ❤️ para tu familia.
          </p>
        </div>
      </div>
    </footer>
  );
}
