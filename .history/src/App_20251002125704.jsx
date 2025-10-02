import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Music2,
  Clock,
} from "lucide-react";

// --- Soul System Player with /embed route layout ---
// Main player + optional compact embed view
// Asset helper so /public assets work in dev, prod, and subpaths
const BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) ? import.meta.env.BASE_URL : '/';
const asset = (p) => {
  if (!p) return p;
  if (/^https?:\/\//i.test(p)) return p; // absolute URL
  if (p.startsWith(BASE)) return p;       // already prefixed
  if (p.startsWith('/')) return `${BASE.replace(/\/$/, '')}${p}`; // from /public
  return `${BASE}${p}`; // relative
};

const DEFAULT_ALBUM = {
  // artist: "Your Artist Name",
  title: "Soul System",
  releaseDate: "2025-10-15",
  cover: "/img/soul-system-cover.png",
  links: {
    spotify: "https://open.spotify.com/your-pre-save",
    apple: "https://music.apple.com/your-pre-add",
    bandcamp: "https://yourname.bandcamp.com",
  },
  tracks: [
    { id: "t1", title: "01 — Dawn Transit", src: "/audio/01.mp3", durationHint: 0 },
    { id: "t2", title: "02 — Solar Drift", src: "/audio/02.mp3", durationHint: 0 },
    { id: "t3", title: "03 — Halo Engine", src: "/audio/03.mp3", durationHint: 0 },
    { id: "t4", title: "04 — Gravity Echo", src: "/audio/04.mp3", durationHint: 0 },
    { id: "t5", title: "05 — Neon Orbit", src: "/audio/05.mp3", durationHint: 0 },
    { id: "t6", title: "06 — Liminal Field", src: "/audio/06.mp3", durationHint: 0 },
    { id: "t7", title: "07 — Quartz Pulse", src: "/audio/07.mp3", durationHint: 0 },
    { id: "t8", title: "08 — Black Sky", src: "/audio/08.mp3", durationHint: 0 },
    { id: "t9", title: "09 — Ion Rain", src: "/audio/09.mp3", durationHint: 0 },
    { id: "t10", title: "10 — Meridian", src: "/audio/10.mp3", durationHint: 0 },
    { id: "t11", title: "11 — Cold Fire", src: "/audio/11.mp3", durationHint: 0 },
    { id: "t12", title: "12 — Blue Shift", src: "/audio/12.mp3", durationHint: 0 },
    { id: "t13", title: "13 — Night Signal", src: "/audio/13.mp3", durationHint: 0 }
  ],
};

const DEFAULT_BRANDING = {
  appName: "Soul System Streaming",
  colors: {
    bg: "#050506",
    card: "#0b0b0c",
    border: "#2b2b2e",
    text: "#f3efe6",
    accent: "#f5b14b",
    accentMuted: "#cfa56a",
    accentSecondary: "#7a5cff",
    pill1: "#1db954",
    pill2: "#fa2e83",
    pill3: "#3f46e5"
  },
  logo: "/img/logo-astronaut.png",
  fontFamily: "var(--font, \"Gontserrat\", Montserrat, Sora, Poppins, Inter, ui-sans-serif)",
  backgroundImage: "/img/soul-system-promo-no-text.png",
  backgroundMode: "art-overlay"
};

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmt = (s) => {
  if (Number.isNaN(s) || s == null) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

function PlayerUI({ ALBUM, BRAND, embed=false }) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(ALBUM.tracks[0]?.durationHint || 0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const audioRef = useRef(null);
  const track = ALBUM.tracks[index] ?? ALBUM.tracks[0];

  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) { a.pause(); setIsPlaying(false); }
    else { try { await a.play(); setIsPlaying(true);} catch { setIsPlaying(false);} }
  };

  const nextIndex = () => (index+1<ALBUM.tracks.length ? index+1 : (repeatMode==="all"?0:index));
  const prevIndex = () => (index-1>=0 ? index-1 : 0);

  const handleEnded = () => { const ni=nextIndex(); setIndex(ni); setIsPlaying(true); };
  const seek = (s) => { const a=audioRef.current; if(a){ a.currentTime=clamp(s,0,a.duration||duration||0); setProgress(a.currentTime);} };

  const onLoadedMetadata = () => { if(audioRef.current) setDuration(audioRef.current.duration||duration); };
  const onTimeUpdate = () => { if(audioRef.current) setProgress(audioRef.current.currentTime); };

  return (
    <div className="flex flex-col min-h-screen">
  {/* Header */}
  <header
  className="flex items-center justify-center gap-3 px-8 py-6 border-b border-[var(--border)]"
  style={{
    background: `linear-gradient(90deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.accentSecondary} 50%, ${BRAND.colors.accent} 100%)`,
    // color: "#fff",
    backdropFilter: "blur(6px)"
  }}
>
  {BRAND.logo && (
    <img
      src={asset(BRAND.logo)}
      alt={BRAND.appName}
      className="h-16 md:h-28"
    />
  )}
  <h1 className="text-xl md:text-6xl font-bold tracking-wide text-white">
    {BRAND.appName}
  </h1>
</header>


  {/* Body */}
  <main className="flex-1 grid grid-cols-1
    md:grid-cols-[40%_50%]
    lg:grid-cols-[60%_40%]
    xl:grid-cols-[62%_38%]
    gap-6 md:gap-8
    px-4 md:px-8 lg:px-16 xl:px-24
    py-6 md:py-8
    max-w-[1700px] w-full mx-auto">
    {/* Left: album cover */}
    <div className="flex items-start justify-center">
      <div className="w-64 md:w-[600px] rounded-2xl overflow-hidden shadow-lg">
        <img
          src={asset(ALBUM.cover)}
          alt={`${ALBUM.title} cover`}
          className="w-full h-auto object-cover"
        />
      </div>
    </div>

    {/* Right: player + tracklist */}
    <div className="flex flex-col">
      {/* Now Playing */}
      <div className="mb-4">
        <h2 className="text-3xl font-semibold text-white">{ALBUM.title}</h2>
        {/* <p className="text-zinc-400">{ALBUM.artist}</p> */}
        <p className="text-sm text-white mt-1">{track?.title}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button onClick={()=>setIndex(prevIndex())} className="p-2 rounded-full bg-zinc-800"><SkipBack className="w-4 h-4"/></button>
        <button onClick={togglePlay} className="p-3 rounded-full bg-[var(--accent)] text-black hover:bg-[var(--accentSecondary)] hover:text-white transition-colors">
        {isPlaying?<Pause className="w-5 h-5"/>:<Play className="w-5 h-5"/>}
        </button>
        <button onClick={()=>setIndex(nextIndex())} className="p-2 rounded-full bg-zinc-800"><SkipForward className="w-4 h-4"/></button>
        </div>

        {/* Seek bar */}
<div className="mt-3">
<input type="range" min={0} max={duration||0} step={0.1} value={progress} onChange={(e)=>seek(parseFloat(e.target.value))} className="w-full accent-white h-5"/>
<div className="flex justify-between text-xs text-zinc-400"><span>{fmt(progress)}</span><span>{fmt(duration)}</span></div>
</div>

      {/* Tracklist */}
      <ol className="space-y-2 overflow-auto flex-1 mt-6">
        {ALBUM.tracks.map((t, i) => (
          <li key={t.id}>
            <button
              onClick={() => {
                setIndex(i);
                setIsPlaying(true);
                audioRef.current?.play();
              }}
              className={`w-full px-3 py-2 rounded-lg flex justify-between ${
                i === index
                  ? "bg-[#f5b14b] text-black"
                  : "bg-zinc-800/70 hover:bg-zinc-700"
              }`}
            >
              <span>{i + 1}. {t.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  </main>
</div>

  );
}

export default function App(){
  const [ALBUM] = useState(DEFAULT_ALBUM);
  const [BRAND] = useState(DEFAULT_BRANDING);
  const isEmbed = window.location.pathname.startsWith("/embed");

  return (
    <div
  className="min-h-screen flex flex-col"
  style={{
    backgroundColor: BRAND.colors.bg,
    fontFamily: BRAND.fontFamily,
    backgroundImage: BRAND.backgroundImage
      ? `linear-gradient(rgba(5,5,6,0.6), rgba(5,5,6,0.6)), url(${asset(BRAND.backgroundImage)})`
      : undefined,
    backgroundSize: BRAND.backgroundImage ? "cover" : undefined,
    backgroundPosition: BRAND.backgroundImage ? "center" : undefined,
  }}
>
  <PlayerUI ALBUM={ALBUM} BRAND={BRAND} embed={isEmbed} />
  <style>{`
    body::before {
      content: '';
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: url('/img/noise-texture.png');
      background-size: cover;
      opacity: 0.08;
      pointer-events: none;
      z-index: -1;
    }
  `}</style>
</div>

  );
}
