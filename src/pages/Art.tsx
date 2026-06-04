import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { type Page } from "../App";

export interface Piece {
  id: string;
  image: string;    // URL or base64
  title: string;
  description: string;
}

interface Props { onMenuOpen: () => void; nav: (p: Page) => void;}

export default function Art({ onMenuOpen, nav }: Props) {
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    fetch("/data/gallery.json")
      .then((r) => r.json())
      .then((data) => setPieces(data.pieces ?? [])) 
      .catch(() => setPieces([]));
  }, []);

  return (
    <div className="wood-bg min-h-screen flex flex-col">
      <Logo onMenuOpen={onMenuOpen} />

      <main className="flex-1 max-w-6xl mx-auto w-full px-8 pt-24 pb-16">
        <h2 className="font-display text-xs tracking-[0.4em] uppercase text-[#8a6a4a] mb-12">Art</h2>

        {pieces.length === 0 ? (
          <p className="text-[#6a4a2a] text-sm tracking-widest">Gallery coming soon.</p>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 gap-4 space-y-4">
            {pieces.map((p) => (
              <div
                key={p.id}
                className="relative break-inside-avoid cursor-pointer group"
                onMouseEnter={() => setHovered(p.id)}
                onMouseLeave={() => setHovered(null)}
              >
                <img
                  src={p.image}
                  alt={p.title}
                  className="w-full block grayscale contrast-125 transition-all duration-300 group-hover:grayscale-0"
                />
                {/* Hover overlay */}
                <div
                  className={`
                    absolute inset-0 bg-black/70 flex flex-col justify-end p-4
                    transition-opacity duration-300
                    ${hovered === p.id ? "opacity-100" : "opacity-0"}
                  `}
                >
                  {p.title && (
                    <p className="font-display text-white text-sm tracking-widest uppercase">{p.title}</p>
                  )}
                  {p.description && (
                    <p className="text-[#c4a882] text-xs mt-1 leading-relaxed">{p.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer nav={nav} />
    </div>
  );
}
