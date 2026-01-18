import "./styles/Features.css";

const FEATURES = [
  {
    icon: "🧠",
    title: "Juegos Cognitivos",
    description:
      "Actividades diseñadas por expertos para fortalecer memoria, atención y concentración",
  },
  {
    icon: "👨‍👩‍👧‍👦",
    title: "Modo Familia",
    description:
      "Comparte momentos y crea recuerdos compartidos con tus seres queridos",
  },
  {
    icon: "🏆",
    title: "Sistema de Logros",
    description:
      "Motívate con retos diarios, racha de participación y logros personalizados",
  },
  {
    icon: "📱",
    title: "Interfaz Intuitiva",
    description:
      "Diseño limpio y minimalista pensado para todas las edades",
  },
  {
    icon: "📊",
    title: "Seguimiento",
    description:
      "Visualiza tu progreso con estadísticas detalladas y reportes personalizados",
  },
  {
    icon: "🔒",
    title: "Privacidad",
    description: "Tus datos están seguros. No compartimos información personal",
  },
];

export function Features() {
  return (
    <section id="features" className="features">
      <div className="features-container">
        <div className="section-header">
          <h2>Características principales</h2>
          <p>Diseñado para cuidar tu salud mental y fortalecer tus relaciones</p>
        </div>

        <div className="features-grid">
          {FEATURES.map((feature, index) => (
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
