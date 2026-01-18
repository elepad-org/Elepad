import { Navbar, NavbarBrand, NavbarMenu, NavbarMenuItem, NavbarMenuToggle, Button } from "@material-tailwind/react";
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
    <Navbar className="mx-auto max-w-screen-xl px-4 py-2 rounded-xl shadow-md bg-white/90 border border-gray-100 sticky top-0 z-50">
      <div className="flex items-center justify-between">
        <NavbarBrand className="flex items-center gap-2">
          <img src="/ele-gray.png" alt="Elepad Elefante" className="w-10 h-10" />
          <span className="text-3xl font-lobster text-primary">Elepad</span>
        </NavbarBrand>
        <div className="hidden md:flex gap-6 items-center">
          <NavbarMenu className="flex gap-6 items-center">
            <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("features")}>Características</NavbarMenuItem>
            <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("about")}>Quiénes somos</NavbarMenuItem>
            <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("contact")}>Contacto</NavbarMenuItem>
          </NavbarMenu>
          <Button color="blue" className="rounded-full px-6 py-2 font-semibold text-base bg-primary hover:bg-accent transition-colors">Descargar</Button>
        </div>
        <NavbarMenuToggle className="md:hidden" onClick={() => setOpenNav(!openNav)} />
      </div>
      {openNav && (
        <div className="flex flex-col gap-4 mt-4 md:hidden">
          <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("features")}>Características</NavbarMenuItem>
          <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("about")}>Quiénes somos</NavbarMenuItem>
          <NavbarMenuItem className="cursor-pointer text-secondary hover:text-primary transition-colors" onClick={() => scrollToSection("contact")}>Contacto</NavbarMenuItem>
          <Button color="blue" className="rounded-full px-6 py-2 font-semibold text-base bg-primary hover:bg-accent transition-colors">Descargar</Button>
        </div>
      )}
    </Navbar>
  );
}
