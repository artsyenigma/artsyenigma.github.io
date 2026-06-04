import { type Page } from "../App";

interface Props {
  nav: (p: Page) => void;
}

export default function Footer({ nav }: Props) {
  return (
    <footer className="w-full border-t border-[#3d2b1a] py-6 px-8 flex items-center justify-between text-[#6a4a2a] text-xs tracking-widest uppercase">
      <button
        onClick={() => nav("landing")}
        className="hover:text-[#e8d5b0] transition-colors duration-200"
      >
        ← Home
      </button>
      <a
        href="https://www.instagram.com/artsy_enigma_/"
        target="_blank"
        rel="noopener noreferrer"
        className="hover:text-[#e8d5b0] transition-colors duration-200 flex items-center gap-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
          <circle cx="12" cy="12" r="4"/>
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
        </svg>
        Instagram
      </a>
      <span>© {new Date().getFullYear()}</span>
      
    </footer>
  );
}