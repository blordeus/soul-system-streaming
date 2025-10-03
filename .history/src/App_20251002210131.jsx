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
    // spotify: "https://open.spotify.com/your-pre-save",
    // apple: "https://music.apple.com/your-pre-add",
    // presave: "https://yourname.bandcamp.com",
  },
  tracks: [
    // ❗ served from /public/audio but referenced as /audio in the app
    { id: "t1",  title: "Reboot", src: "/audio/01.mp3",  durationHint: 0 },
    { id: "t2",  title: "Summer Solace",  src: "/audio/02.mp3",  durationHint: 0 },
    { id: "t3",  title: "In the Wilderness",  src: "/audio/03.mp3",  durationHint: 0 },
    { id: "t4",  title: "Butterflies", src: "/audio/04.mp3",  durationHint: 0 },
    { id: "t5",  title: "Foggy Night of the Soul",   src: "/audio/05.mp3",  durationHint: 0 },
    { id: "t6",  title: "It Was All a Dream",src: "/audio/06.mp3",  durationHint: 0 },
    { id: "t7",  title: "07 — Quartz Pulse", src: "/audio/07.mp3",  durationHint: 0 },
    { id: "t8",  title: "08 — Black Sky",    src: "/audio/08.mp3",  durationHint: 0 },
    { id: "t9",  title: "09 — Ion Rain",     src: "/audio/09.mp3",  durationHint: 0 },
    { id: "t10", title: "10 — Meridian",     src: "/audio/10.mp3",  durationHint: 0 },
    { id: "t11", title: "11 — Cold Fire",    src: "/audio/11.mp3",  durationHint: 0 },
    { id: "t12", title: "12 — Blue Shift",   src: "/audio/12.mp3",  durationHint: 0 },
    // { id: "t13", title: "13 — Night Signal", src: "/audio/13.mp3", durationHint: 0 }
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
  // ---- AUDIO STATE (restored) ----
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
  const [durations, setDurations] = useState({}); // { [trackId]: seconds }

  const pickRandomIndex = () => {
  if (ALBUM.tracks.length <= 1) return index;
  let r = index;
  while (r === index) r = Math.floor(Math.random() * ALBUM.tracks.length);
  return r;
};

// Wrap on manual "Next"; respect repeat for auto-advance on ended
const nextIndex = ({ fromButton = false } = {}) => {
  if (shuffle) return pickRandomIndex();
  const n = index + 1;
  if (n < ALBUM.tracks.length) return n;
  return fromButton ? 0 : (repeatMode === "all" ? 0 : index); // wrap only if button, or if repeat all on ended
};

const prevIndex = () => {
  if (shuffle) return pickRandomIndex();
  const p = index - 1;
  return p >= 0 ? p : (ALBUM.tracks.length - 1); // wrap prev
};

const handleEnded = () => {
  if (repeatMode === "one") {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(()=>{});
    setIsPlaying(true);
    return;
  }
  const ni = nextIndex({ fromButton: false });
  if (ni === index && repeatMode === "off") {
    setIsPlaying(false);
    setProgress(0);
    return;
  }
  setIndex(ni);
  requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
  setIsPlaying(true);
};



  const togglePlay = async () => {
  const a = audioRef.current;
  if (!a) return;

  if (a.paused) {
    try {
      await a.play();
      // isPlaying will be updated by event listener
    } catch (err) {
      console.error("Play failed:", err);
    }
  } else {
    a.pause();
    // isPlaying will be updated by event listener
  }
};


  // const nextIndex = () => (index+1<ALBUM.tracks.length ? index+1 : (repeatMode==="all"?0:index));
  // const prevIndex = () => (index-1>=0 ? index-1 : 0);

  // const handleEnded = () => {
  //   const ni = nextIndex();
  //   if (ni === index && repeatMode === "off") {
  //     setIsPlaying(false);
  //     setProgress(0);
  //     audioRef.current && (audioRef.current.currentTime = 0);
  //     return;
  //   }
  //   setIndex(ni);
  //   // Autoplay next
  //   requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
  //   setIsPlaying(true);
  // };

  const seek = (s) => {
  const a = audioRef.current;
  if (!a) return;
  const t = clamp(s, 0, a.duration || duration || 0);
  a.currentTime = t;
  setProgress(t);
};


  const onLoadedMetadata = () => {
  if (audioRef.current) setDuration(audioRef.current.duration || 0);
};

const onTimeUpdate = () => {
  if (audioRef.current) setProgress(audioRef.current.currentTime);
};

useEffect(() => {
  const a = audioRef.current;
  if (!a) return;

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  a.addEventListener("play", handlePlay);
  a.addEventListener("pause", handlePause);

  return () => {
    a.removeEventListener("play", handlePlay);
    a.removeEventListener("pause", handlePause);
  };
}, []);

useEffect(() => {
  if (audioRef.current) {
    audioRef.current.muted = muted;
    audioRef.current.volume = muted ? 0 : volume;
  }
}, [volume, muted]);




  // ---- UI ----
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex items-center justify-center gap-3 px-8 py-6 border-b border-[var(--border)]"
        style={{
          background: `linear-gradient(90deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.accentSecondary} 50%, ${BRAND.colors.accent} 100%)`,
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
        <h1 className="text-3xl md:text-4xl lg:text-6xl font-bold tracking-wide text-white">
          {BRAND.appName}
        </h1>

          {/* Platform Links row */}
  {ALBUM.links && (
    <div className="mt-4 flex justify-center gap-4">
      {ALBUM.links.spotify && (
        <a
          href={ALBUM.links.spotify}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full text-sm font-semibold text-black bg-[#1db954] hover:opacity-90 transition"
        >
          Spotify
        </a>
      )}
      {ALBUM.links.apple && (
        <a
          href={ALBUM.links.apple}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-[#fa2e83] hover:opacity-90 transition"
        >
          Apple Music
        </a>
      )}
      {ALBUM.links.bandcamp && (
        <a
          href={ALBUM.links.bandcamp}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-[#3f46e5] hover:opacity-90 transition"
        >
          Bandcamp
        </a>
      )}
    </div>
  )}
      </header>

      {/* Body */}
      <main className="flex-1 grid grid-cols-1
        md:grid-cols-[50%_50%]
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
          <div className="mb-4 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">{ALBUM.title}</h2>
            <p className="text-sm md:text-xl text-white mt-1">{track?.title}</p>
          </div>

         <div className="flex items-center gap-2 justify-center lg:justify-start">
  {/* Shuffle */}
  <button
    onClick={() => setShuffle(s => !s)}
    className="p-2 rounded-full transition"
    style={{ background: shuffle ? "#7a5cff" : "#cfa56a" }}
    title={shuffle ? "Shuffle: On" : "Shuffle: Off"}
  >
    <Shuffle className={`w-4 h-4 ${shuffle ? "text-white" : "text-black"}`} />
  </button>

  {/* Prev */}
  <button onClick={() => {
  const ni = prevIndex();
  setIndex(ni);
  setProgress(0);
  setDuration(0);
  requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
  setIsPlaying(true);
}} className="p-2 rounded-full bg-[#cfa56a]">
  <SkipBack className="w-4 h-4" />
</button>

  {/* Play/Pause */}
  <button onClick={togglePlay} className="p-3 rounded-full bg-[#f5b14b] text-black hover:bg-[#7a5cff] hover:text-white transition-colors">
    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
  </button>

  {/* Next — wraps to first on last */}
  <button onClick={() => {
  const ni = nextIndex({ fromButton:true });
  setIndex(ni);
  setProgress(0);
  setDuration(0);
  requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
  setIsPlaying(true);
}} className="p-2 rounded-full bg-[#cfa56a]">
  <SkipForward className="w-4 h-4" />
</button>

  {/* Repeat: off -> one -> all */}
  <button
    onClick={() => setRepeatMode(m => (m === "off" ? "one" : m === "one" ? "all" : "off"))}
    className="p-2 rounded-full transition"
    style={{ background: repeatMode === "off" ? "#cfa56a" : "#7a5cff" }}
    title={`Repeat: ${repeatMode}`}
  >
    <Repeat className={`w-4 h-4 ${repeatMode === "off" ? "text-black" : "text-white"}`} />
  </button>
</div>



          {/* Seek bar */}
          <input
  type="range"
  min={0}
  max={duration || 0}
  step={0.1}
  value={progress}
  onChange={(e) => seek(parseFloat(e.target.value))}
  className="w-full accent-white h-5"
/>
<div className="flex justify-between text-xs text-zinc-400">
  <span>{fmt(progress)}</span>
  <span>{fmt(duration)}</span>
</div>


          {/* Volume Controls */}
<div className="mt-4 flex items-center gap-3">
  <button
     onClick={() => setMuted(!muted)}
    className="p-2 rounded-full transition"
    style={{ background: muted || volume === 0 ? "#cfa56a" : "#f5b14b" }}
    title={muted ? "Unmute" : "Mute"}
  >
    {muted || volume === 0 ? (
      <VolumeX className="w-4 h-4 text-white" />
    ) : (
      <Volume2 className="w-4 h-4 text-black" />
    )}
  </button>

  <input
  type="range"
  min={0}
  max={1}
  step={0.01}
  value={muted ? 0 : volume}
  onChange={(e) => setVolume(parseFloat(e.target.value))}
  className="
    w-32 h-2 rounded-lg appearance-none cursor-pointer
    bg-zinc-700
    accent-[var(--accent)]
  "
  style={{
  '--accent': volume > 0.7 ? BRAND.colors.accent : BRAND.colors.accentMuted,
  boxShadow: `0 0 6px ${volume > 0.7 ? BRAND.colors.accent : BRAND.colors.accentMuted}`
}}

/>

</div>


          {/* Tracklist */}
          <ol className="space-y-2 overflow-auto flex-1 mt-6">
  {ALBUM.tracks.map((t, i) => (
    <li key={t.id}>
      <button
        onClick={() => {
          setIndex(i);             // switch to selected track
          setProgress(0);          // reset slider
          setDuration(0);          // reset duration until metadata loads
          requestAnimationFrame(() => {
            audioRef.current?.play().catch(()=>{});
          });
          setIsPlaying(true);
        }}
        className={`w-full px-3 py-2 rounded-lg flex justify-between items-center ${
          i === index
            ? "bg-[#f5b14b] text-white"
            : "bg-zinc-800/70 hover:bg-[#cfa56a] text-white"
        }`}
      >
        <span>{i + 1}. {t.title}</span>
        <span className={`text-xs ${i === index ? "text-black/70" : "text-zinc-300/80"}`}>
          {durations[t.id] ? fmt(durations[t.id]) : "—"}
        </span>
      </button>

      {/* Hidden audio for duration (only for metadata, not playback) */}
      <audio
        src={asset(t.src)}
        preload="metadata"
        onLoadedMetadata={(e) => {
          const d = Math.floor(e.currentTarget.duration || 0);
          if (d > 0) setDurations(prev => ({ ...prev, [t.id]: d }));
        }}
        style={{ display: "none" }}
      />
    </li>
  ))}
</ol>

        </div>
      </main>

      {/* >>> MAIN AUDIO ELEMENT (added) <<< */}
      <audio
        ref={audioRef}
        src={asset(track?.src)}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={handleEnded}
      />
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
