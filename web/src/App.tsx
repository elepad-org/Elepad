import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AccountDeletion from './pages/AccountDeletion';
import theme from './theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacidad" element={<PrivacyPolicy />} />
          <Route path="/eliminar-cuenta" element={<AccountDeletion />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;

