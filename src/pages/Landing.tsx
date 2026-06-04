import Logo from "../components/Logo";
import { type Page } from "../App";

interface Props {
  onMenuOpen: () => void;
  nav: (p: Page) => void;
}

export default function Landing({ onMenuOpen, nav }: Props) {
  return (
    <div className="wood-bg relative w-full h-screen overflow-hidden flex flex-col items-center justify-center">
      <Logo onMenuOpen={onMenuOpen} />

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-radial-vignette pointer-events-none" />

      {/* Artist name image — swap src for the transparent-bg title image */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <img
          src="/title.png"
          alt="Artist Name"
          className="max-w-[70vw] md:max-w-[40vw] drop-shadow-2xl"
          onError={(e) => {
            const el = e.currentTarget as HTMLImageElement;
            el.style.display = "none";
            el.parentElement!.innerHTML += `<h1 class="font-display text-[#e8d5b0] text-6xl md:text-8xl tracking-widest uppercase drop-shadow-2xl">ARTSY ENIGMA</h1>`;
          }}
        />
      </div>
    </div>
  );
}
