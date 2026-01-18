import "./styles/About.css";

export function About() {
  return (
    <section id="about" className="about">
      <div className="about-container">
        <div className="about-content">
          <div className="about-text">
            <h2>Quiénes somos</h2>
            <p>
              Elepad nace de la necesidad de crear herramientas que cuiden la
              salud cognitiva de nuestras familias. Combinamos investigación
              científica con tecnología moderna para desarrollar una app que no
              solo es efectiva, sino también disfrutadle.
            </p>

            <h3>Nuestra misión</h3>
            <p>
              Queremos ser el aliado de cada familia en el cuidado de la memoria
              y el bienestar mental, creando espacios donde el aprendizaje y la
              diversión van de la mano.
            </p>

            <div className="values">
              <div className="value-item">
                <strong>✓ Científicamente fundamentado</strong>
                <p>Basado en investigaciones neurológicas comprobadas</p>
              </div>
              <div className="value-item">
                <strong>✓ Accesible para todos</strong>
                <p>Diseño inclusivo pensado para cualquier edad</p>
              </div>
              <div className="value-item">
                <strong>✓ Privacidad garantizada</strong>
                <p>Tu información está protegida y bajo tu control</p>
              </div>
            </div>
          </div>

          <div className="about-visual">
            <div className="about-illustration">
              <div className="circle circle-1"></div>
              <div className="circle circle-2"></div>
              <div className="circle circle-3"></div>
              <div className="illustration-text">Elepad</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
