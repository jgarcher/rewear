// Tiny inline SVG weather glyphs. Stroke-based, scale with text.
// Condition values come from /lib/weather.ts:normaliseCondition —
// "rainy", "snow", "wind", "sunny", "cloudy", or fallthrough.

type Props = { condition: string; className?: string };

const SHARED =
  "h-4 w-4 inline-block align-[-2px] text-charcoal-soft";

export function WeatherIcon({ condition, className = "" }: Props) {
  const klass = `${SHARED} ${className}`;
  const c = condition.toLowerCase();

  if (c.includes("rain")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
        <path d="M7 14a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A4 4 0 0 1 18 13" />
        <path d="M9 17v3" />
        <path d="M13 17v3" />
        <path d="M17 17v3" />
      </svg>
    );
  }

  if (c.includes("snow")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
        <path d="M12 3v18" />
        <path d="M5 7l14 10" />
        <path d="M19 7L5 17" />
      </svg>
    );
  }

  if (c.includes("wind")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
        <path d="M3 8h11a3 3 0 1 0-3-3" />
        <path d="M3 13h15a3 3 0 1 1-3 3" />
        <path d="M3 18h7" />
      </svg>
    );
  }

  if (c.includes("sun") || c.includes("clear")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="M4.5 4.5l1.5 1.5" />
        <path d="M18 18l1.5 1.5" />
        <path d="M19.5 4.5L18 6" />
        <path d="M6 18l-1.5 1.5" />
      </svg>
    );
  }

  if (c.includes("cloud") || c.includes("mist") || c.includes("fog") || c.includes("haze")) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
        <path d="M7 17a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1A4 4 0 0 1 18 17H7Z" />
      </svg>
    );
  }

  // Fallback — generic disc
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={klass} aria-hidden>
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}
