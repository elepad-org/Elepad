import { useState } from "react";

export function Navigation() {
  const [openNav, setOpenNav] = useState(false);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
    setOpenNav(false);
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <img src="/ele-gray.png" alt="Elepad Elefante" className="w-10 h-10" />
            <span className="text-3xl font-lobster text-primary">Elepad</span>
          </div>
          <div className="hidden md:flex gap-8 items-center">
            <button onClick={() => scrollToSection("features")} className="text-secondary hover:text-primary transition-colors font-medium">Características</button>
            <button onClick={() => scrollToSection("about")} className="text-secondary hover:text-primary transition-colors font-medium">Quiénes somos</button>
            <button onClick={() => scrollToSection("contact")} className="text-secondary hover:text-primary transition-colors font-medium">Contacto</button>
            <button className="bg-primary hover:bg-accent text-white px-6 py-2.5 rounded-full font-semibold transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5">Descargar</button>
          </div>
          <button onClick={() => setOpenNav(!openNav)} className="md:hidden p-2">
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={openNav ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
            </svg>
          </button>
        </div>
        {openNav && (
          <div className="md:hidden pb-4 flex flex-col gap-3">
            <button onClick={() => scrollToSection("features")} className="text-secondary hover:text-primary transition-colors font-medium text-left">Características</button>
            <button onClick={() => scrollToSection("about")} className="text-secondary hover:text-primary transition-colors font-medium text-left">Quiénes somos</button>
            <button onClick={() => scrollToSection("contact")} className="text-secondary hover:text-primary transition-colors font-medium text-left">Contacto</button>
            <button className="bg-primary hover:bg-accent text-white px-6 py-2.5 rounded-full font-semibold transition-all w-full">Descargar</button>
          </div>
        )}
      </div>
    </nav>
  );
}
