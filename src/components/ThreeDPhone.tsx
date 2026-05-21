import React, { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";

interface ThreeDPhoneProps {
  color?: string; // e.g. "Natural Titanium", "Emerald Green", "Midnight Blue" etc.
  neonGlowColor?: string; // e.g. "indigo", "emerald", "amber"
  interactive?: boolean;
}

export default function ThreeDPhone({
  color = "Natural Titanium",
  neonGlowColor = "cyan",
  interactive = true,
}: ThreeDPhoneProps) {
  const [rotation, setRotation] = useState({ x: 12, y: -22 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Map user readable colors to CSS hex/tail hues
  const getColorHex = (name: string) => {
    const raw = name.toLowerCase();
    if (raw.includes("titanium") && raw.includes("natural")) return "#c2b4a3";
    if (raw.includes("titanium") && raw.includes("gray")) return "#8a9597";
    if (raw.includes("titanium") && raw.includes("violet")) return "#5d4e6d";
    if (raw.includes("blue") || raw.includes("sapphire")) return "#1a2a40";
    if (raw.includes("green") || raw.includes("emerald")) return "#0f3a20";
    if (raw.includes("black") || raw.includes("dark")) return "#111111";
    if (raw.includes("mint")) return "#cef0cc";
    if (raw.includes("gold")) return "#ecd8b1";
    return "#334155"; // Cool slate default
  };

  const phoneBodyColor = getColorHex(color);

  // Auto slow rotation if not dragging
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotation((prev) => ({
        x: prev.x + Math.sin(Date.now() / 2500) * 0.15,
        y: prev.y + 0.3,
      }));
    }, 30);
    return () => clearInterval(interval);
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;
    setRotation((prev) => ({
      x: prev.x - deltaY * 0.4,
      y: prev.y + deltaX * 0.4,
    }));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!interactive) return;
    setIsDragging(true);
    const touch = e.touches[0];
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.current.x;
    const deltaY = touch.clientY - dragStart.current.y;
    setRotation((prev) => ({
      x: prev.x - deltaY * 0.4,
      y: prev.y + deltaX * 0.4,
    }));
    dragStart.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square flex items-center justify-center select-none overflow-visible cursor-grab active:cursor-grabbing"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUpOrLeave}
      id="three-d-phone-container"
    >
      {/* Realtime Perspective Wrapper */}
      <div
        className="relative w-64 h-[500px] transition-transform duration-75 ease-out preserve-3d"
        style={{
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
          perspective: "1000px",
          transformStyle: "preserve-3d",
        }}
      >
        {/* Glowing Background Radial Ring */}
        <div
          className="absolute inset--10 rounded-full filter blur-3xl opacity-20 pointer-events-none transition-all duration-700"
          style={{
            background: `radial-gradient(circle, ${phoneBodyColor} 0%, transparent 70%)`,
            transform: "translateZ(-80px)",
          }}
        />

        {/* --- FRONT GLASS SHIELD PANEL --- */}
        <div
          className="absolute inset-0 rounded-[40px] border-[3px] border-slate-800 bg-slate-950/90 backdrop-blur-2xl flex flex-col items-center justify-between p-4 shadow-2xl overflow-hidden"
          style={{
            transform: "translateZ(10px)",
            backfaceVisibility: "visible",
            boxShadow: `0 25px 50px -12px rgba(0,0,0,0.8), 0 0 30px ${phoneBodyColor}40`,
          }}
        >
          {/* Dynamic Island Screen notch */}
          <div className="w-28 h-6 bg-black rounded-full mt-2 flex items-center justify-center z-10">
            <div className="w-3 h-3 bg-zinc-900 rounded-full border border-zinc-800" />
            <div className="w-8 h-2 bg-gradient-to-r from-teal-500 to-indigo-500 rounded-full ml-auto mr-3 scale-75 opacity-70 animate-pulse" />
          </div>

          {/* Luxury Live Dynamic Neon Visualization */}
          <div className="flex-1 w-full my-4 flex flex-col justify-between items-center px-2 py-4 relative">
            {/* Screen Wallpaper */}
            <div className="absolute inset-0 z-0 bg-radial from-slate-900 via-transparent to-black rounded-3xl opacity-60 overflow-hidden">
              <div className="absolute -top-12 -left-12 w-40 h-40 bg-indigo-500/20 rounded-full filter blur-2xl" />
              <div
                className="absolute -bottom-12 -right-12 w-44 h-44 rounded-full filter blur-2xl transition-colors duration-1000"
                style={{ backgroundColor: `${phoneBodyColor}30` }}
              />
            </div>

            <div className="z-10 text-center select-none w-full">
              <span className="text-[10px] font-mono tracking-widest text-zinc-500 uppercase">
                DARKCART Sovereign Edition
              </span>
              <h4 className="text-xl font-sans font-light tracking-tight text-white mt-1">
                Border-Cross Direct
              </h4>
              <div className="text-[11px] font-mono text-cyan-400 mt-2 bg-cyan-950/60 px-2 py-0.5 rounded-full inline-block border border-cyan-800/50 animate-pulse">
                ⚙️ Unlocked Spec Active
              </div>
            </div>

            {/* Glowing Holographic Ring */}
            <div className="relative w-32 h-32 flex items-center justify-center z-10">
              <div
                className="absolute inset-0 rounded-full border border-dashed animate-[spin_10s_linear_infinite]"
                style={{ borderColor: `${phoneBodyColor}80` }}
              />
              <div className="absolute w-24 h-24 rounded-full border border-double border-white/10 animate-pulse flex items-center justify-center bg-black/40">
                <span className="text-2xl font-light text-zinc-100 font-mono tracking-tighter">
                  5G
                </span>
              </div>
              <div className="absolute inset-2 bg-radial from-cyan-500/10 via-transparent to-transparent z-0 animate-ping" />
            </div>

            {/* Simulated Live Specs Bar */}
            <div className="w-full bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl z-10 backdrop-blur-md">
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mb-1">
                <span>Refresher Rate:</span>
                <span className="text-lime-400">120Hz Ultra-Smooth</span>
              </div>
              <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full w-[95%] bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full" />
              </div>
              <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400 mt-2">
                <span>Signal Strength:</span>
                <span className="text-cyan-400 flex items-center gap-1">
                  ৳ Direct-Gate <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
                </span>
              </div>
            </div>
          </div>

          {/* Glass Home Bar Indicator */}
          <div className="w-24 h-1.5 bg-white/20 rounded-full mb-1" />
        </div>

        {/* --- PHYSICAL MIDDLE FRAME SIDE PANEL (thickness simulation) --- */}
        <div
          className="absolute top-0 bottom-0 left-[-5px] w-[10px] rounded-l-[40px]"
          style={{
            backgroundColor: phoneBodyColor,
            transform: "rotateY(-90deg) translateZ(4px)",
            backfaceVisibility: "visible",
            borderRight: "1px solid rgba(255,255,255,0.2)",
            filter: "brightness(0.7)",
          }}
        />
        <div
          className="absolute top-0 bottom-0 right-[-5px] w-[10px] rounded-r-[40px]"
          style={{
            backgroundColor: phoneBodyColor,
            transform: "rotateY(90deg) translateZ(4px)",
            backfaceVisibility: "visible",
            borderLeft: "1px solid rgba(255,255,255,0.2)",
            filter: "brightness(0.8)",
          }}
        />
        <div
          className="absolute left-0 right-0 top-[-5px] h-[10px] rounded-t-[40px]"
          style={{
            backgroundColor: phoneBodyColor,
            transform: "rotateX(90deg) translateZ(4px)",
            backfaceVisibility: "visible",
            filter: "brightness(0.9)",
          }}
        />
        <div
          className="absolute left-0 right-0 bottom-[-5px] h-[10px] rounded-b-[40px]"
          style={{
            backgroundColor: phoneBodyColor,
            transform: "rotateX(-90deg) translateZ(4px)",
            backfaceVisibility: "visible",
            filter: "brightness(0.5)",
          }}
        />

        {/* --- PREMIUM METAL REAR PANEL --- */}
        <div
          className="absolute inset-0 rounded-[40px] border border-stone-800 flex flex-col justify-between p-6 overflow-hidden"
          style={{
            backgroundColor: phoneBodyColor,
            transform: "translateZ(-10px) rotateY(180deg)",
            backfaceVisibility: "visible",
            boxShadow: `inset 0 0 40px rgba(0,0,0,0.8), 0 0 25px ${phoneBodyColor}50`,
          }}
        >
          {/* Subtle metal reflection background overlay */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-black/30 opacity-70" />

          {/* Premium Camera Module Island */}
          <div className="z-10 bg-black/60 backdrop-blur-xl border border-white/10 p-3 rounded-3xl w-28 h-28 grid grid-cols-2 gap-2 shadow-2xl relative">
            {/* Lense 1 */}
            <div className="rounded-full bg-zinc-950 flex items-center justify-center p-0.5 border border-zinc-800 shadow-inner">
              <div className="w-full h-full rounded-full bg-radial from-slate-900 to-black relative overflow-hidden flex items-center justify-center">
                <div className="absolute w-4 h-4 rounded-full bg-blue-500/20 blur-[1px]" />
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-stone-800" />
              </div>
            </div>
            {/* Lense 2 */}
            <div className="rounded-full bg-zinc-950 flex items-center justify-center p-0.5 border border-zinc-800 shadow-inner">
              <div className="w-full h-full rounded-full bg-radial from-slate-900 to-black relative overflow-hidden flex items-center justify-center">
                <div className="absolute w-4 h-4 rounded-full bg-violet-500/20 blur-[1px]" />
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-stone-800" />
              </div>
            </div>
            {/* Lense 3 */}
            <div className="rounded-full bg-zinc-950 flex items-center justify-center p-0.5 border border-zinc-800 shadow-inner">
              <div className="w-full h-full rounded-full bg-radial from-slate-900 to-black relative overflow-hidden flex items-center justify-center">
                <div className="absolute w-4 h-4 rounded-full bg-emerald-500/10 blur-[1px]" />
                <div className="w-2.5 h-2.5 rounded-full bg-black border border-stone-800" />
              </div>
            </div>
            {/* Flash & LiDaR */}
            <div className="flex flex-col gap-1 items-center justify-center">
              <div className="w-4 h-4 rounded-full bg-amber-100 flex items-center justify-center border border-white/20 shadow-md">
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full" />
              </div>
              <div className="w-3 h-3 rounded-full bg-zinc-900 border border-zinc-800" />
            </div>
          </div>

          {/* Center Brand Emboss Accent Logo */}
          <div className="flex-1 flex flex-col items-center justify-center z-10 py-6">
            <span className="text-white text-3xl font-light font-mono tracking-tighter filter drop-shadow">
              DARK<span className="font-semibold text-zinc-100">CART</span>
            </span>
            <div className="w-6 h-0.5 bg-white/30 my-2 rounded-full" />
            <span className="text-[9px] font-mono tracking-widest text-zinc-450 uppercase opacity-60">
              Border-Cross Secure
            </span>
          </div>

          <div className="z-10 text-center text-[9px] font-mono text-white/30 tracking-wide">
            Designed in Singapore • Sourced Globally
          </div>
        </div>
      </div>

      {/* Floating hints in interactive mode */}
      {interactive && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 flex items-center gap-1.5 text-[10px] text-zinc-400 select-none shadow-md">
          <span className="inline-block h-1.5 w-1.5 bg-cyan-400 rounded-full animate-ping" />
          <span>Interactive 3D Frame • Click & Drag to view angle</span>
        </div>
      )}
    </div>
  );
}
