import React, { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Footer from "./components/Footer";
import Header from "./components/Header";
import "./index.css";
import site from "./pages.json";
import DocumentationPage from "./pages/DocumentationPage";
import GuidesPage from "./pages/guides/GuidesPage";
import HowlerReact from "./pages/guides/HowlerReact";
import PlaySoundInReact from "./pages/guides/PlaySoundInReact";
import UseSoundVsReactSounds from "./pages/guides/UseSoundVsReactSounds";
import HomePage from "./pages/HomePage";
import ImprintPage from "./pages/ImprintPage";
import PrivacyPage from "./pages/PrivacyPage";
import SoundLibraryPage from "./pages/SoundLibraryPage";

const App: React.FC = () => {
  const { pathname } = useLocation();
  // The prerendered HTML carries each page's head; this keeps the tab title right on client-side navigation
  useEffect(() => {
    const page = site.pages.find((p) => p.path === pathname);
    if (page) document.title = page.title;
  }, [pathname]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/docs" element={<DocumentationPage />} />
          <Route path="/sounds" element={<SoundLibraryPage />} />
          <Route path="/guides" element={<GuidesPage />} />
          <Route path="/guides/play-sound-in-react" element={<PlaySoundInReact />} />
          <Route path="/guides/howler-react" element={<HowlerReact />} />
          <Route path="/guides/use-sound-vs-react-sounds" element={<UseSoundVsReactSounds />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/imprint" element={<ImprintPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
