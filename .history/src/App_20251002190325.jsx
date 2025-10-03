import React, { useRef, useState, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
} from "lucide-react";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const fmt = (s) => {
  if (Number.isNaN(s) || s == null) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
};

export default function PlayerUI({ ALBUM, BRAND }) {
  // State
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [muted, setMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("off");
  const [durations, setDurations] = useState({});

  const audioRef = useRef(null);
  const track = ALBUM.tracks[index] ?? ALBUM.tracks[0];

  // Keep audio volume in sync
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  // Helpers
  const togglePlay = async () => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.pause();
      setIsPlaying(false);
    } else {
      try {
        await a.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const pickRandomIndex = () => {
    if (ALBUM.tracks.length <= 1) return index;
    let r = index;
    while (r === index) r = Math.floor(Math.random() * ALBUM.tracks.length);
    return r;
  };

  const nextIndex = ({ fromButton = false } = {}) => {
    if (shuffle) return pickRandomIndex();
    const n = index + 1;
    if (n < ALBUM.tracks.length) return n;
    return fromButton ? 0 : (repeatMode === "all" ? 0 : index);
  };

  const prevIndex = () => {
    if (shuffle) return pickRandomIndex();
    const p = index - 1;
    return p >= 0 ? p : (ALBUM.tracks.length - 1);
  };

  const handleEnded = () => {
    if (repeatMode === "one") {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
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
    setProgress(0);
    setDuration(0);
    requestAnimationFrame(() => audioRef.current?.play().catch(() => {}));
    setIsPlaying(true);
  };

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header
        className="flex flex-col items-center justify-center px-8 py-6 border-b border-[var(--border)]"
        style={{
          background: `linear-gradient(90deg, ${BRAND.colors.accent} 0%, ${BRAND.colors.accentSecondary} 50%, ${BRAND.colors.accent} 100%)`,
          backdropFilter: "blur(6px)"
        }}
      >
        {BRAND.logo && (
          <img
            src={BRAND.logo}
            alt={BRAND.appName}
            className="h-16 md:h-28"
          />
        )}
        <h1 className="mt-2 text-3xl md:text-4xl lg:text-6xl font-bold tracking-wide text-white">
          {BRAND.appName}
        </h1>

        {/* Platform links row */}
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
        
        {/* Album cover */}
        <div className="flex items-start justify-center">
          <div className="w-64 md:w-[600px] rounded-2xl overflow-hidden shadow-lg">
            <img
              src={ALBUM.cover}
              alt={`${ALBUM.title} cover`}
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Player + Tracklist */}
        <div className="flex flex-col">
          {/* Now Playing */}
          <div className="mb-4 text-center lg:text-left">
            <h2 className="text-2xl md:text-3xl font-semibold text-white">{ALBUM.title}</h2>
            <p className="text-sm md:text-xl text-white mt-1">{track?.title}</p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2 justify-center lg:justify-start">
            <button
              onClick={() => {
                const ni = prevIndex();
                setIndex(ni);
                setProgress(0);
                setDuration(0);
                requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
                setIsPlaying(true);
              }}
              className="p-2 rounded-full bg-[#cfa56a]"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3 rounded-full bg-[#f5b14b] text-black hover:bg-[#7a5cff] hover:text-white transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5"/> : <Play className="w-5 h-5"/>}
            </button>

            <button
              onClick={() => {
                const ni = nextIndex({ fromButton: true });
                setIndex(ni);
                setProgress(0);
                setDuration(0);
                requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
                setIsPlaying(true);
              }}
              className="p-2 rounded-full bg-[#cfa56a]"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          {/* Seek bar */}
          <div className="mt-3">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={(e)=>seek(parseFloat(e.target.value))}
              className="w-full accent-white h-5"
            />
            <div className="flex justify-between text-xs text-zinc-400">
              <span>{fmt(progress)}</span>
              <span>{fmt(duration)}</span>
            </div>
          </div>

          {/* Tracklist */}
          <ol className="space-y-2 overflow-auto flex-1 mt-6">
            {ALBUM.tracks.map((t, i) => (
              <li key={t.id}>
                <button
                  onClick={() => {
                    setIndex(i);
                    setProgress(0);
                    setDuration(0);
                    requestAnimationFrame(() => audioRef.current?.play().catch(()=>{}));
                    setIsPlaying(true);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex justify-between items-center ${
                    i === index
                      ? "bg-[#f5b14b] text-white"
                      : "bg-zinc-800/70 hover:bg-[#cfa56a] text-white"
                  }`}
                >
                  <span className="truncate">{i + 1}. {t.title}</span>
                  <span className={`text-xs ${i === index ? "text-black/70" : "text-zinc-300/80"}`}>
                    {durations[t.id] ? fmt(durations[t.id]) : "—"}
                  </span>
                </button>

                {/* Hidden audio just to read metadata */}
                <audio
                  src={t.src}
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

      {/* Main audio element */}
      <audio
        ref={audioRef}
        src={track?.src}
        preload="metadata"
        onLoadedMetadata={onLoadedMetadata}
        onTimeUpdate={onTimeUpdate}
        onEnded={handleEnded}
      />
    </div>
  );
}
