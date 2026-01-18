import "./styles/Contact.css";
import { useState } from "react";

export function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí puedes agregar la lógica para enviar el formulario
    console.log("Formulario enviado:", formData);
    setFormData({ name: "", email: "", message: "" });
  };

  return (
    <section id="contact" className="contact">
      <div className="contact-container">
        <div className="section-header">
          <h2>Ponte en contacto</h2>
          <p>¿Tienes preguntas o sugerencias? Nos encantaría escucharte</p>
        </div>

        <div className="contact-content">
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Nombre</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Tu nombre"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@email.com"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">Mensaje</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tu mensaje..."
                  rows={5}
                  required
                ></textarea>
              </div>

              <button type="submit" className="button button-primary">
                Enviar mensaje
              </button>
            </form>
          </div>

          <div className="contact-info">
            <div className="info-item">
              <div className="info-icon">📧</div>
              <div className="info-text">
                <h3>Email</h3>
                <p>
                  <a href="mailto:hola@elepad.app">hola@elepad.app</a>
                </p>
              </div>
            </div>
            <div className="info-item">
              <div className="info-icon">🌍</div>
              <div className="info-text">
                <h3>Ubicación</h3>
                <p>Disponible globalmente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
