export function Hero() {
  return (
    <section className="w-full bg-gradient-to-br from-primary/10 via-white to-accent/10 py-20 px-4">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col items-start">
          <img src="/ele-gray.png" alt="Elepad Elefante" className="w-20 h-20 mb-4" />
          <h1 className="text-6xl md:text-7xl font-lobster text-primary mb-4">Elepad</h1>
          <p className="text-2xl font-semibold text-secondary mb-6 leading-relaxed">
            La app que cuida la memoria y el bienestar de tu familia
          </p>
          <div className="mt-6">
            <button className="bg-primary hover:bg-accent text-white px-10 py-4 rounded-full text-lg font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
              Descargar la app
            </button>
          </div>
        </div>
        <div className="flex-1 flex justify-center">
          <div className="w-[300px] h-[600px] bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-[2.5rem] border-8 border-gray-200 flex items-center justify-center overflow-hidden">
            <span className="text-gray-400 text-sm px-4 text-center">Espacio para captura de pantalla de la app</span>
          </div>
        </div>
      </div>
    </section>
  );
}
