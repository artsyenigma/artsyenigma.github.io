import { useState, useCallback } from "react";

// ── CONFIG ───────────────────────────────────────────────
const REPO = "artsyenigma/artsyenigma.github.io";
const BRANCH = "main";
const FILES = {
  about: "public/data/about.json",
  gallery: "public/data/gallery.json",
  faq: "public/data/faq.json",
};

// ── TYPES ────────────────────────────────────────────────
interface Piece {
  id: string;
  image: string;
  title?: string;
  description?: string;
}
interface FaqItem {
  q: string;
  a: string;
}
interface AboutData {
  photo: string;
  story: string;
}
interface GalleryData {
  pieces: Piece[];
}
interface FaqData {
  bookingUrl: string;
  faqs: FaqItem[];
}

type Tab = "About" | "Gallery" | "FAQ";
const TABS: Tab[] = ["About", "Gallery", "FAQ"];

// ── GITHUB HELPERS ───────────────────────────────────────
async function ghGet(token: string, path: string) {
  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}?ref=${BRANCH}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
      },
    },
  );

  if (res.status === 404) return { json: null, sha: null, raw: "" };

  const data = await res.json();
  if (!data) throw new Error("No response from GitHub");

  let text = "";
  if (data.download_url) {
    const fileRes = await fetch(`${data.download_url}&t=${Date.now()}`);
    text = await fileRes.text();
  } else if (data.content && data.encoding === "base64") {
    const binary = atob(data.content.replace(/\n/g, ""));
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    text = new TextDecoder().decode(bytes);
  } else {
    throw new Error("GitHub returned no usable file content");
  }

  return { json: JSON.parse(text), sha: data.sha, raw: text };
}

async function ghPut(
  token: string,
  path: string,
  sha: string | null,
  content: unknown,
  msg: string,
) {
  const text = JSON.stringify(content, null, 2);
  const bytes = new TextEncoder().encode(text);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  const encoded = btoa(binary);

  const body: Record<string, unknown> = {
    message: msg,
    content: encoded,
    branch: BRANCH,
  };
  if (sha) body.sha = sha;

  const res = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`GitHub PUT failed: ${res.status} — ${err.message ?? ""}`);
  }
}

// ── IMAGE HELPERS ─────────────────────────────────────────
function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

function normalizeImageUrl(url: string): string {
  if (!url) return url;
  const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileMatch) {
    return `https://drive.google.com/thumbnail?id=${fileMatch[1]}&sz=w1000`;
  }
  const ucMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (ucMatch && url.includes("drive.google.com")) {
    return `https://drive.google.com/thumbnail?id=${ucMatch[1]}&sz=w1000`;
  }
  return url;
}

// ── COMPONENT ────────────────────────────────────────────
export default function Admin() {
  const [token, setToken] = useState("");
  const [activeTab, setTab] = useState<Tab>("About");
  const [commitMsg, setMsg] = useState("chore: update content");
  const [status, setStatus] = useState<{
    type: "idle" | "load" | "ok" | "err";
    msg: string;
  }>({ type: "idle", msg: "Load to begin" });

  const [about, setAbout] = useState<AboutData>({ photo: "", story: "" });
  const [aboutSha, setAboutSha] = useState<string | null>(null);
  const [aboutRaw, setAboutRaw] = useState("");

  const [gallery, setGallery] = useState<GalleryData>({ pieces: [] });
  const [galSha, setGalSha] = useState<string | null>(null);
  const [galRaw, setGalRaw] = useState("");

  const [faq, setFaq] = useState<FaqData>({ bookingUrl: "", faqs: [] });
  const [faqSha, setFaqSha] = useState<string | null>(null);
  const [faqRaw, setFaqRaw] = useState("");

  const [galleryUrlInput, setGalleryUrlInput] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [hasLoaded, setHasLoaded] = useState(false);

  const load = useCallback(async () => {
    setStatus({ type: "load", msg: "Loading..." });
    try {
      const [a, g, f] = await Promise.all([
        ghGet(token, FILES.about),
        ghGet(token, FILES.gallery),
        ghGet(token, FILES.faq),
      ]);
      setAbout(a.json ?? { photo: "", story: "" });
      setAboutSha(a.sha ?? null);
      setAboutRaw(a.raw);
      setGallery(g.json ?? { pieces: [] });
      setGalSha(g.sha ?? null);
      setGalRaw(g.raw);
      setFaq(f.json ?? { bookingUrl: "", faqs: [] });
      setFaqSha(f.sha ?? null);
      setFaqRaw(f.raw);
      setHasLoaded(true);
      setStatus({ type: "ok", msg: "Loaded" });
    } catch (e) {
      setStatus({ type: "err", msg: "Load failed — check token / repo name" });
      console.error(e);
    }
  }, [token]);

  const save = useCallback(async () => {
    setStatus({ type: "load", msg: "Saving..." });
    try {
      // compare current content to what was loaded — skip unchanged files
      const aboutNew = JSON.stringify(about, null, 2);
      const galNew = JSON.stringify(gallery, null, 2);
      const faqNew = JSON.stringify(faq, null, 2);

      const aboutChanged = aboutNew !== aboutRaw.trim();
      const galChanged = galNew !== galRaw.trim();
      const faqChanged = faqNew !== faqRaw.trim();

      if (!aboutChanged && !galChanged && !faqChanged) {
        setStatus({ type: "ok", msg: "No changes to save" });
        return;
      }

      // save only changed files, one at a time to avoid sha conflicts
      if (aboutChanged) {
        const fresh = await ghGet(token, FILES.about);
        await ghPut(token, FILES.about, fresh.sha, about, commitMsg);
        setAboutRaw(aboutNew);
        setAboutSha((await ghGet(token, FILES.about)).sha);
      }

      if (galChanged) {
        const fresh = await ghGet(token, FILES.gallery);
        await ghPut(token, FILES.gallery, fresh.sha, gallery, commitMsg);
        setGalRaw(galNew);
        setGalSha((await ghGet(token, FILES.gallery)).sha);
      }

      if (faqChanged) {
        const fresh = await ghGet(token, FILES.faq);
        await ghPut(token, FILES.faq, fresh.sha, faq, commitMsg);
        setFaqRaw(faqNew);
        setFaqSha((await ghGet(token, FILES.faq)).sha);
      }

      setStatus({ type: "ok", msg: "Saved ✓" });
    } catch (e) {
      setStatus({ type: "err", msg: `Save failed — ${(e as Error).message}` });
      console.error(e);
    }
  }, [token, about, aboutSha, aboutRaw, gallery, galSha, galRaw, faq, faqSha, faqRaw, commitMsg]);

  // ── GALLERY helpers ────────────────────────────────────
  const addPieceByUrl = () => {
    const url = galleryUrlInput.trim();
    if (!url) return;
    setGallery((p) => ({
      pieces: [
        ...p.pieces,
        { id: uid(), image: normalizeImageUrl(url), title: "", description: "" },
      ],
    }));
    setGalleryUrlInput("");
  };

  const addPieceByFile = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const newPieces: Piece[] = await Promise.all(
      Array.from(files).map(async (f) => ({
        id: uid(),
        image: await readFileAsDataUrl(f),
        title: "",
        description: "",
      })),
    );
    setGallery((p) => ({ pieces: [...p.pieces, ...newPieces] }));
    setFileInputKey((k) => k + 1);
  };

  const updatePiece = (id: string, key: keyof Piece, val: string) =>
    setGallery((p) => ({
      pieces: p.pieces.map((x) => (x.id === id ? { ...x, [key]: val } : x)),
    }));

  const removePiece = (id: string) =>
    setGallery((p) => ({ pieces: p.pieces.filter((x) => x.id !== id) }));

  const movePiece = (i: number, dir: -1 | 1) =>
    setGallery((p) => {
      const arr = [...p.pieces];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { pieces: arr };
    });

  // ── FAQ helpers ────────────────────────────────────────
  const addFaq = () =>
    setFaq((p) => ({ ...p, faqs: [...p.faqs, { q: "", a: "" }] }));
  const updFaq = (i: number, key: "q" | "a", val: string) =>
    setFaq((p) => ({
      ...p,
      faqs: p.faqs.map((x, idx) => (idx === i ? { ...x, [key]: val } : x)),
    }));
  const remFaq = (i: number) =>
    setFaq((p) => ({ ...p, faqs: p.faqs.filter((_, idx) => idx !== i) }));
  const moveFaq = (i: number, dir: -1 | 1) =>
    setFaq((p) => {
      const arr = [...p.faqs];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return p;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...p, faqs: arr };
    });

  // ── STATUS COLORS ──────────────────────────────────────
  const statusColor: Record<string, string> = {
    idle: "text-[#555] border-[#2a2a2a]",
    load: "text-[#d4af37] border-[#3a3a1e]",
    ok: "text-[#4caf7a] border-[#1e4a2e]",
    err: "text-[#e05555] border-[#4a1e1e]",
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-[#e8e8e0] font-mono flex flex-col pt-[70px]">
      {/* TOPBAR */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#0d0d0d] border-b border-[#1e1e1e] px-8 py-4 flex justify-between items-center">
        <span className="text-[11px] tracking-[0.2em] uppercase text-[#555]">
          CALEBS CMS
        </span>
        <span
          className={`text-[10px] px-3 py-1 rounded-full border ${statusColor[status.type]}`}
        >
          {status.msg}
        </span>
      </div>

      {/* TOKEN BAR */}
      <div className="border-b border-[#1e1e1e] px-8 py-3 flex gap-3">
        <input
          type="password"
          placeholder="GitHub personal access token"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          className="flex-1 bg-[#161616] border border-[#2a2a2a] text-white px-3 py-2 text-sm"
        />
        <button
          onClick={load}
          className="bg-none border border-[#2a2a2a] text-[#888] px-4 py-2 text-sm hover:text-white transition-colors"
        >
          Load
        </button>
      </div>

      <div className="flex flex-1">
        {/* SIDEBAR */}
        <div className="w-44 border-r border-[#1e1e1e] flex flex-col">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`w-full text-left px-4 py-3 text-sm border-none bg-transparent transition-colors
                ${activeTab === t ? "text-white border-l-2 border-white" : "text-[#444] hover:text-[#aaa]"}`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* MAIN */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#555] mb-6">
            {activeTab}
          </div>

          {!hasLoaded ? (
            <p className="text-[#333] text-sm">Load file to begin editing.</p>
          ) : activeTab === "About" ? (
            /* ── ABOUT ── */
            <div className="flex flex-col gap-5 max-w-2xl">
              <div>
                <label className="block text-[11px] text-[#555] mb-1">
                  Artist Photo URL or paste base64
                </label>
                <input
                  className="w-full bg-[#161616] border border-[#222] text-white px-3 py-2 text-sm"
                  value={about.photo}
                  onChange={(e) =>
                    setAbout((p) => ({
                      ...p,
                      photo: normalizeImageUrl(e.target.value),
                    }))
                  }
                  placeholder="https://... or data:image/..."
                />
                {about.photo && (
                  <img
                    src={about.photo}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="mt-3 max-h-48 grayscale"
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] text-[#555] mb-1">
                  Upload photo from disk
                </label>
                <input
                  type="file"
                  accept="image/*"
                  className="text-sm text-[#888]"
                  onChange={async (e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const url = await readFileAsDataUrl(f);
                    setAbout((p) => ({ ...p, photo: url }));
                  }}
                />
              </div>
              <div>
                <label className="block text-[11px] text-[#555] mb-1">
                  Story
                </label>
                <textarea
                  rows={8}
                  className="w-full bg-[#161616] border border-[#222] text-white px-3 py-2 text-sm"
                  value={about.story}
                  onChange={(e) =>
                    setAbout((p) => ({ ...p, story: e.target.value }))
                  }
                />
              </div>
            </div>
          ) : activeTab === "Gallery" ? (
            /* ── GALLERY ── */
            <div className="flex flex-col gap-4">
              {gallery.pieces.map((p, i) => (
                <div
                  key={p.id}
                  className="bg-[#121212] border border-[#1e1e1e] p-4 rounded-md"
                >
                  <div className="flex justify-between mb-3">
                    <span className="text-[10px] text-[#555]">#{i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => movePiece(i, -1)}
                        className="bg-[#161616] border border-[#2a2a2a] text-[#888] px-2 py-0.5 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => movePiece(i, 1)}
                        className="bg-[#161616] border border-[#2a2a2a] text-[#888] px-2 py-0.5 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => removePiece(p.id)}
                        className="bg-[#161616] border border-[#4a1e1e] text-[#e05555] px-2 py-0.5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <img
                      src={p.image}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-24 h-24 object-cover grayscale flex-shrink-0"
                    />
                    <div className="flex-1 flex flex-col gap-2">
                      <input
                        placeholder="Title (optional)"
                        value={p.title}
                        onChange={(e) =>
                          updatePiece(p.id, "title", e.target.value)
                        }
                        className="bg-[#161616] border border-[#222] text-white px-3 py-1.5 text-sm"
                      />
                      <textarea
                        placeholder="Description (optional)"
                        rows={2}
                        value={p.description}
                        onChange={(e) =>
                          updatePiece(p.id, "description", e.target.value)
                        }
                        className="bg-[#161616] border border-[#222] text-white px-3 py-1.5 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              ))}

              <div className="flex flex-col gap-2 pt-1">
                <div className="flex gap-2">
                  <input
                    className="flex-1 bg-[#161616] border border-[#222] text-white px-3 py-2 text-sm"
                    placeholder="Image URL or Google Drive share link"
                    value={galleryUrlInput}
                    onChange={(e) => setGalleryUrlInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addPieceByUrl();
                    }}
                  />
                  <button
                    onClick={addPieceByUrl}
                    className="bg-[#e8e8e0] text-[#0d0d0d] text-xs font-bold px-4 py-2 whitespace-nowrap"
                  >
                    + Add URL
                  </button>
                </div>
                <label className="cursor-pointer inline-block bg-[#e8e8e0] text-[#0d0d0d] text-xs font-bold px-4 py-2 w-fit">
                  + Upload from disk
                  <input
                    key={fileInputKey}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => addPieceByFile(e.target.files)}
                  />
                </label>
              </div>
            </div>
          ) : (
            /* ── FAQ ── */
            <div className="flex flex-col gap-5 max-w-2xl">
              <div>
                <label className="block text-[11px] text-[#555] mb-1">
                  Booking Form URL
                </label>
                <input
                  className="w-full bg-[#161616] border border-[#222] text-white px-3 py-2 text-sm"
                  value={faq.bookingUrl}
                  onChange={(e) =>
                    setFaq((p) => ({ ...p, bookingUrl: e.target.value }))
                  }
                  placeholder="https://docs.google.com/forms/..."
                />
              </div>

              <div className="text-[10px] tracking-[0.2em] uppercase text-[#555] border-b border-[#1e1e1e] pb-2">
                Questions
              </div>

              {faq.faqs.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#121212] border border-[#1e1e1e] p-4 rounded-md"
                >
                  <div className="flex justify-between mb-2">
                    <span className="text-[10px] text-[#555]">#{i + 1}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => moveFaq(i, -1)}
                        className="bg-[#161616] border border-[#2a2a2a] text-[#888] px-2 py-0.5 text-xs"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveFaq(i, 1)}
                        className="bg-[#161616] border border-[#2a2a2a] text-[#888] px-2 py-0.5 text-xs"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => remFaq(i)}
                        className="bg-[#161616] border border-[#4a1e1e] text-[#e05555] px-2 py-0.5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <input
                    placeholder="Question"
                    value={item.q}
                    onChange={(e) => updFaq(i, "q", e.target.value)}
                    className="w-full bg-[#161616] border border-[#222] text-white px-3 py-1.5 text-sm mb-2"
                  />
                  <textarea
                    placeholder="Answer"
                    rows={3}
                    value={item.a}
                    onChange={(e) => updFaq(i, "a", e.target.value)}
                    className="w-full bg-[#161616] border border-[#222] text-white px-3 py-1.5 text-sm resize-none"
                  />
                </div>
              ))}
              <button
                onClick={addFaq}
                className="bg-[#e8e8e0] text-[#0d0d0d] text-xs font-bold px-4 py-2 w-fit"
              >
                + Add Question
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FOOTER / SAVE BAR */}
      <div className="border-t border-[#1e1e1e] px-8 py-4 flex gap-3">
        <input
          className="flex-1 bg-[#161616] border border-[#2a2a2a] text-white px-3 py-2 text-sm"
          value={commitMsg}
          onChange={(e) => setMsg(e.target.value)}
          placeholder="Commit message"
        />
        <button
          onClick={save}
          disabled={!hasLoaded}
          className={`px-5 py-2 text-sm font-bold transition-colors ${
            hasLoaded
              ? "bg-[#e8e8e0] text-[#0d0d0d] cursor-pointer hover:bg-white"
              : "bg-[#1e1e1e] text-[#444] cursor-not-allowed"
          }`}
        >
          Save
        </button>
      </div>
    </div>
  );
}
