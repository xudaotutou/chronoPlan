"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

export const SwitchTheme = ({ className }: { className?: string }) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleToggle = () => {
    if (resolvedTheme === "chrono") {
      setTheme("chrono-light");
      return;
    }
    setTheme("chrono");
  };

  // Avoid hydration mismatch by rendering placeholder until mounted
  if (!mounted) {
    return (
      <div
        className={`flex space-x-2 h-5 items-center justify-center text-sm border-l border-neutral px-4 ${className}`}
      >
        <div className="w-5 h-5" />
      </div>
    );
  }

  const isDarkMode = resolvedTheme === "chrono";

  return (
    <div
      className={`flex space-x-2 h-5 items-center justify-center text-sm border-l border-neutral px-4 ${className}`}
    >
      <label
        htmlFor="theme-toggle"
        className={`swap swap-rotate ${!isDarkMode ? "swap-active" : ""}`}
        onClick={handleToggle}
      >
        <SunIcon className="swap-on h-5 w-5" />
        <MoonIcon className="swap-off h-5 w-5" />
      </label>
    </div>
  );
};
