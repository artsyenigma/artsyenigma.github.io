import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { type Page } from "../App";

interface AboutData {
  photo: string;       // URL or base64
  story: string;
}

const DEFAULT: AboutData = { photo: "", story: "Loading..." };

interface Props { onMenuOpen: () => void; nav: (p: Page) => void;}

export default function About({ onMenuOpen, nav }: Props) {
  const [data, setData] = useState<AboutData>(DEFAULT);

  useEffect(() => {
    fetch("/data/about.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({ photo: "", story: "Artist story coming soon." }));
  }, []);

  return (
    <div className="wood-bg min-h-screen flex flex-col">
      <Logo onMenuOpen={onMenuOpen} />

      <main className="flex-1 max-w-4xl mx-auto w-full px-8 pt-24 pb-16">
        <h2 className="font-display text-xs tracking-[0.4em] uppercase text-[#8a6a4a] mb-12">About</h2>

        <div className="flex flex-col md:flex-row gap-12 items-start">
          {data.photo && (
            <img
              src={data.photo}
              alt="Artist"
              className="w-full md:w-72 object-cover border border-[#3d2b1a] grayscale contrast-125"
            />
          )}
          <div className="flex-1">
            <p className="text-[#c4a882] font-serif text-lg leading-relaxed whitespace-pre-wrap">
              {data.story}
            </p>
          </div>
        </div>
      </main>

      <Footer nav={nav} />
    </div>
  );
}
