interface Props {
  onMenuOpen: () => void;
}

export default function Logo({ onMenuOpen }: Props) {
  return (
    <button
      onClick={onMenuOpen}
      className="fixed top-5 left-5 z-30 w-12 h-12 flex items-center justify-center"
      aria-label="Open menu"
    >
      {/* Replace src with your actual logo path */}
      <img
        src="/logo.png"
        alt="Logo"
        className="w-full h-full object-contain drop-shadow-lg hover:scale-105 transition-transform duration-200"
        onError={(e) => {
          // Fallback if logo not found
          const el = e.currentTarget as HTMLImageElement;
          el.style.display = "none";
          el.parentElement!.innerHTML = `<span class="text-[#e8d5b0] text-xl tracking-widest font-display">☽</span>`;
        }}
      />
    </button>
  );
}
