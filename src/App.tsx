import { useState } from "react";
import Landing from "./pages/Landing";
import About from "./pages/About";
import Art from "./pages/Art";
import FAQ from "./pages/FAQ";
import Menu from "./components/Menu";

export type Page = "landing" | "about" | "art" | "faq";

export default function App() {
  const [page, setPage] = useState<Page>("landing");
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = (p: Page) => { setPage(p); setMenuOpen(false); };

  return (
    <div className="app">
      <Menu open={menuOpen} onClose={() => setMenuOpen(false)} nav={nav} />

      {page === "landing" && <Landing onMenuOpen={() => setMenuOpen(true)} nav={nav} />}
      {page === "about" && <About onMenuOpen={() => setMenuOpen(true)} nav={nav} />}
      {page === "art"   && <Art   onMenuOpen={() => setMenuOpen(true)} nav={nav} />}
      {page === "faq"   && <FAQ   onMenuOpen={() => setMenuOpen(true)} nav={nav} />}
    </div>
  );
}
