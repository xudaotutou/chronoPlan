"use client";

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useStarkZap } from "~~/hooks/useStarkZap";
import {
  SchedulesSection,
  LockedCard,
  EmptyState,
} from "./components/SchedulesSection";
import { TemplatesSection } from "./components/TemplatesSection";
import { CreateSection } from "./components/CreateSection";
import { InfoSection } from "./components/InfoSection";
import {
  StatusBadge,
  TabIcon,
  ProModeToggle,
  ProModeModal,
} from "./components/UI";

// ── Pro Mode Storage ──────────────────────────────────────────────────
const PRO_MODE_KEY = "chronoplan_pro_mode";

function loadProMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(PRO_MODE_KEY) === "true";
}

function saveProMode(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(PRO_MODE_KEY, enabled ? "true" : "false");
}

// ═══════════════════════════════════════════════════════════════════════════
// ── Root ───────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════
export default function Home() {
  const { address, isConnected } = useStarkZap();
  const [tab, setTab] = useState<"create" | "templates" | "plans" | "info">(
    "create",
  );
  const [proMode, setProMode] = useState(false);
  const [showProUnlock, setShowProUnlock] = useState(false);

  // Load Pro Mode preference
  useEffect(() => {
    setProMode(loadProMode());
  }, []);

  // Listen for tab switch events from child components
  useEffect(() => {
    const handleSwitchTab = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setTab(customEvent.detail as typeof tab);
      }
    };
    window.addEventListener("switchTab", handleSwitchTab);
    return () => window.removeEventListener("switchTab", handleSwitchTab);
  }, []);

  const toggleProMode = useCallback(() => {
    const newMode = !proMode;
    setProMode(newMode);
    saveProMode(newMode);
    if (newMode) {
      toast.success("Pro Mode enabled — batch plans unlocked", {
        duration: 3000,
      });
    }
  }, [proMode]);

  return (
    <div className="min-h-screen bg-grid-fine">
      {/* Sophisticated ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Main warm glow */}
        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary/8 to-transparent blur-[120px]" />
        {/* Secondary teal accent */}
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tr from-secondary/6 to-transparent blur-[100px]" />
        {/* Subtle amber accent */}
        <div className="absolute top-1/2 right-0 w-[300px] h-[300px] rounded-full bg-gradient-to-tl from-accent/4 to-transparent blur-[80px]" />
      </div>

      {/* Header */}
      <header className="relative pt-24 pb-20 px-6">
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto">
          {/* Decorative clock element */}
          <div className="flex items-center gap-5 mb-8 animate-fade-up">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="w-full h-full">
                {/* Outer ring */}
                <circle
                  cx="32"
                  cy="32"
                  r="30"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-primary/20"
                />
                {/* Inner ring */}
                <circle
                  cx="32"
                  cy="32"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-primary/10"
                />
                {/* Tick marks */}
                {[...Array(12)].map((_, i) => (
                  <line
                    key={i}
                    x1="32"
                    y1="4"
                    x2="32"
                    y2={i % 3 === 0 ? "10" : "7"}
                    stroke="currentColor"
                    strokeWidth={i % 3 === 0 ? "2" : "1"}
                    className="text-primary/50"
                    transform={`rotate(${i * 30} 32 32)`}
                  />
                ))}
                {/* Hour markers (larger) */}
                {[...Array(4)].map((_, i) => (
                  <circle
                    key={i}
                    cx={32 + 22 * Math.cos(((i * 90 - 90) * Math.PI) / 180)}
                    cy={32 + 22 * Math.sin(((i * 90 - 90) * Math.PI) / 180)}
                    r="2"
                    fill="currentColor"
                    className="text-primary/60"
                  />
                ))}
                {/* Center dot */}
                <circle
                  cx="32"
                  cy="32"
                  r="3"
                  fill="currentColor"
                  className="text-primary"
                />
                {/* Animated second hand */}
                <line
                  x1="32"
                  y1="32"
                  x2="32"
                  y2="10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="text-accent animate-tick"
                  style={{ transformOrigin: "32px 32px" }}
                />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-mono tracking-[0.3em] text-primary/70 uppercase">
                Powered by TWAMM
              </span>
            </div>
          </div>

          {/* Main heading with distinctive typography */}
          <h1 className="text-6xl md:text-8xl font-display font-bold mb-6 animate-fade-up delay-100 leading-none tracking-tight">
            <span className="text-gradient-brass">Chrono</span>
            <span className="text-base-content">Plan</span>
          </h1>

          {/* Elegant subtitle */}
          <div className="max-w-2xl mb-10 animate-fade-up delay-200">
            <p className="font-accent text-xl md:text-2xl text-base-content/60 italic mb-4">
              Precision scheduling for token releases
            </p>
            <div className="flex items-center gap-3">
              <div className="h-px w-16 bg-gradient-to-r from-primary/60 to-transparent" />
              <p className="text-xs font-mono text-base-content/40">
                Time-Weighted Average Mass Meeting
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Wallet warning */}
      {!isConnected && (
        <div className="max-w-6xl mx-auto px-6 mb-8 animate-fade-up delay-300">
          <div className="card-instrument p-4 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-warning/10 border border-warning/20 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-warning"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-mono text-sm text-base-content/70">
                  Connect your wallet to create and manage plans
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab navigation */}
      <div className="max-w-6xl mx-auto px-6 mb-10 animate-fade-up delay-400">
        <div className="flex items-center justify-between">
          <div className="tabs tabs-box bg-base-200/60 backdrop-blur border border-base-300/50 p-1">
            {(["create", "plans", "templates", "info"] as const).map((t) => (
              <button
                key={t}
                role="tab"
                aria-selected={tab === t}
                className={`tab font-mono text-xs tracking-wider uppercase transition-all duration-200 ${
                  tab === t ? "tab-active" : "hover:bg-base-300/30"
                }`}
                onClick={() => setTab(t as typeof tab)}
              >
                <span className="flex items-center gap-2">
                  <TabIcon tab={t} active={tab === t} />
                  <span className="hidden sm:inline">
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {/* Pro Mode Toggle */}
          <ProModeToggle
            enabled={proMode}
            onUnlockRequest={() => setShowProUnlock(true)}
          />
        </div>
      </div>

      {/* Content */}
      <main className="relative max-w-6xl mx-auto px-6 pb-24">
        {tab === "create" && (
          <CreateSection
            isConnected={isConnected ?? false}
            address={address ?? null}
            proMode={proMode}
          />
        )}
        {tab === "templates" && <TemplatesSection />}

        {tab === "plans" && (
          <SchedulesSection
            isConnected={isConnected ?? false}
            address={address ?? null}
          />
        )}
        {tab === "info" && <InfoSection />}
      </main>

      {/* Pro Mode Unlock Modal */}
      {showProUnlock && (
        <ProModeModal
          onClose={() => setShowProUnlock(false)}
          isPro={proMode}
          onToggle={toggleProMode}
        />
      )}
    </div>
  );
}
