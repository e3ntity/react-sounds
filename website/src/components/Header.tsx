import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { playSound, useSoundEnabled, useSoundOnChange } from "react-sounds";
import { cn } from "../utils/cn";

const NAV = [
  { to: "/sounds", label: "Sounds" },
  { to: "/docs", label: "Docs" },
];

const EXTERNAL = [
  {
    href: "https://github.com/e3ntity/react-sounds",
    label: "GitHub",
    icon: "M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12",
  },
  {
    href: "https://www.npmjs.com/package/react-sounds",
    label: "npm",
    icon: "M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z",
  },
];

const focusRing = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

const Header: React.FC = () => {
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
  }
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <nav className="container mx-auto px-4 flex h-14 items-center justify-between gap-6" aria-label="Main">
        <div className="flex items-center gap-8">
          <Link to="/" className={cn("flex items-center gap-2 rounded", focusRing)}>
            <img src="/favicon.svg" alt="" className="h-7 w-7" />
            <span className="text-xl font-semibold text-gray-800">react-sounds</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative py-1 text-sm font-medium transition",
                    focusRing,
                    active
                      ? "text-gray-900 after:absolute after:inset-x-0 after:-bottom-[1.0625rem] after:h-0.5 after:bg-blue-600"
                      : "text-gray-600 hover:text-gray-900"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {EXTERNAL.map((e) => (
            <a
              key={e.href}
              href={e.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={e.label}
              title={e.label}
              className={cn("hidden md:block rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 hover:text-gray-800", focusRing)}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden>
                <path d={e.icon} />
              </svg>
            </a>
          ))}
          <SoundToggle />
          <button
            type="button"
            className={cn("rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden", focusRing)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden>
              {menuOpen ? <path d="M5 5l10 10M15 5L5 15" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
          </button>
        </div>
      </nav>

      {menuOpen && (
        <div className="border-t border-gray-100 bg-white px-4 pt-2 pb-4 shadow-lg md:hidden">
          <div className="space-y-1">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-lg px-3 py-2.5 text-base font-medium",
                    active ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  {n.label}
                </Link>
              );
            })}
          </div>
          <div className="mt-3 border-t border-gray-100 pt-3 space-y-1">
            {EXTERNAL.map((e) => (
              <a
                key={e.href}
                href={e.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-gray-700 hover:bg-gray-50"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 text-gray-500" aria-hidden>
                  <path d={e.icon} />
                </svg>
                {e.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </header>
  );
};

const SoundToggle: React.FC = () => {
  const [enabled, setEnabled] = useSoundEnabled();
  useSoundOnChange("ui/toggle_on", enabled, { initial: false });

  const toggle = async () => {
    if (enabled) await playSound("ui/toggle_off");
    setEnabled(!enabled);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={enabled}
      aria-label="Sounds"
      title={enabled ? "Disable sounds" : "Enable sounds"}
      className={cn(
        "cursor-pointer rounded-lg p-2 transition hover:bg-gray-100",
        enabled ? "text-blue-600" : "text-gray-400 hover:text-gray-700",
        focusRing
      )}
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden>
        <path d="M3.5 7.5h2.5L10 4v12l-4-3.5H3.5z" fill="currentColor" fillOpacity={0.15} />
        {enabled ? <path d="M13 7.5a3.5 3.5 0 010 5M15.2 5.3a6.5 6.5 0 010 9.4" /> : <path d="M13.5 8l4 4M17.5 8l-4 4" />}
      </svg>
    </button>
  );
};

export default Header;
