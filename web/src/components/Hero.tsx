import { Button, Card } from "@material-tailwind/react";
import "./styles/Hero.css";

export function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-primary/10 to-accent/10 py-16 flex justify-center items-center min-h-[70vh]">
      <div className="max-w-6xl w-full flex flex-col md:flex-row items-center gap-12 px-4">
        <div className="flex-1 flex flex-col items-start">
          <img src="/ele-gray.png" alt="Elepad Elefante" className="w-16 h-16 mb-4" />
          <h1 className="text-5xl font-lobster text-primary mb-2">Elepad</h1>
          <p className="text-xl font-semibold text-secondary mb-2">
            La app que cuida la memoria y el bienestar de tu familia
          </p>
          <div className="mt-6 flex gap-4">
            <Button color="blue" className="rounded-full px-8 py-3 text-lg font-semibold bg-primary hover:bg-accent transition-colors shadow-md">
              Descargar la app
            </Button>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <Card className="w-[320px] h-[640px] flex items-center justify-center bg-white/80 shadow-xl rounded-3xl border border-gray-100">
            {/* Espacio para captura de pantalla */}
            <span className="text-gray-400">[Captura de la app aquí]</span>
          </Card>
        </div>
      </div>
    </section>
  );
}
