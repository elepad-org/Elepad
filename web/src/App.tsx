import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountDeletion from './pages/AccountDeletion';
import SobreNosotros from './pages/sobre-nosotros';
import Contacto from './pages/contacto';
import TerminosDeServicio from './pages/terminos-de-servicio';
import Ayuda from './pages/ayuda';
import theme from './theme';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/eliminar-cuenta" element={<AccountDeletion />} />
          <Route path="/sobre-nosotros" element={<SobreNosotros />} />
          <Route path="/contacto" element={<Contacto />} />
          <Route path="/terminos-de-servicio" element={<TerminosDeServicio />} />
          <Route path="/ayuda" element={<Ayuda />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

