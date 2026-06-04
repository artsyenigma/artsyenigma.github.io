import { type Page } from "../App";

interface Props {
  open: boolean;
  onClose: () => void;
  nav: (p: Page) => void;
}

export default function Menu({ open, onClose, nav }: Props) {
  const links: { label: string; page: Page }[] = [
    { label: "ABOUT",  page: "about" },
    { label: "ART",    page: "art"   },
    { label: "FAQ",    page: "faq"   },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`
          fixed inset-0 z-40 bg-black/60 transition-opacity duration-300
          ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}
        `}
      />

      {/* Drawer */}
      <nav
        className={`
          fixed top-0 left-0 z-50 h-full bg-[#1a120a] border-r border-[#3d2b1a]
          flex flex-col justify-center px-10 gap-8
          w-full md:w-[22vw] transition-transform duration-300
          ${open ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-[#8a6a4a] hover:text-[#e8d5b0] text-xl tracking-widest"
        >
          ✕
        </button>

        {links.map(({ label, page }) => (
          <button
            key={page}
            onClick={() => nav(page)}
            className="
              text-left font-display text-4xl md:text-3xl text-[#e8d5b0]
              hover:text-white tracking-widest uppercase
              border-b border-[#3d2b1a] pb-4
              transition-colors duration-200
            "
          >
            {label}
          </button>
        ))}
      </nav>
    </>
  );
}
