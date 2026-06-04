import { useEffect, useState } from "react";
import Logo from "../components/Logo";
import Footer from "../components/Footer";
import { type Page } from "../App";

interface FaqData {
  bookingUrl: string;
  faqs: { q: string; a: string }[];
}

interface Props { onMenuOpen: () => void; nav: (p: Page) => void; }

export default function FAQ({ onMenuOpen, nav }: Props) {
  const [data, setData] = useState<FaqData>({ bookingUrl: "#", faqs: [] });
  const [open, setOpen] = useState<number | null>(null);

  useEffect(() => {
    fetch("/data/faq.json")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {});
  }, []);

  return (
    <div className="wood-bg min-h-screen flex flex-col">
      <Logo onMenuOpen={onMenuOpen} />

      <main className="flex-1 max-w-3xl mx-auto w-full px-8 pt-24 pb-16">
        <h2 className="font-display text-xs tracking-[0.4em] uppercase text-[#8a6a4a] mb-12">FAQ &amp; Book</h2>

        <a
          href={data.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="
            inline-block font-display text-xs tracking-[0.3em] uppercase
            border border-[#8a6a4a] text-[#e8d5b0]
            px-8 py-3 mb-16
            hover:bg-[#3d2b1a] transition-colors duration-200
          "
        >
          Book a Consultation →
        </a>

        <div className="flex flex-col gap-0 border-t border-[#3d2b1a]">
          {data.faqs.map((item, i) => (
            <div key={i} className="border-b border-[#3d2b1a]">
              <button
                className="w-full text-left py-5 flex justify-between items-center gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <span className="font-display text-[#c4a882] text-sm tracking-wide uppercase">{item.q}</span>
                <span className="text-[#6a4a2a] text-lg">{open === i ? "−" : "+"}</span>
              </button>
              {open === i && (
                <p className="pb-5 text-[#8a6a4a] text-sm leading-relaxed pr-8">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </main>

      <Footer nav={nav} />
    </div>
  );
}
