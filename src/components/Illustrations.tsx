/**
 * Illustrations originales, générées en SVG : horizons, soleils,
 * chemins pointillés et constellations. Une « graine » (l'id du contenu)
 * garantit qu'une même carte garde toujours le même paysage.
 */

type Tone = "terracotta" | "turquoise" | "sable" | "bleu";

const palette: Record<Tone, { sky: string; sun: string; far: string; near: string; path: string; star: string }> = {
  terracotta: { sky: "#F6E1D7", sun: "#D87859", far: "#E9A88F", near: "#233D56", path: "#EBCB79", star: "#B0533A" },
  turquoise: { sky: "#DCEFEB", sun: "#EBCB79", far: "#8CC4BB", near: "#2B7369", path: "#F8F5ED", star: "#233D56" },
  sable: { sky: "#F8EDCF", sun: "#D87859", far: "#EBCB79", near: "#59A99E", path: "#F8F5ED", star: "#8A6A1F" },
  bleu: { sky: "#E3E8EE", sun: "#EBCB79", far: "#8FA3B8", near: "#233D56", path: "#EBCB79", star: "#2F5070" },
};

function rng(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function Landscape({ seed, tone, className }: { seed: string; tone: Tone; className?: string }) {
  const r = rng(seed);
  const c = palette[tone];
  const sunX = 60 + r() * 280;
  const sunY = 40 + r() * 30;
  const sunR = 18 + r() * 14;
  const h1 = 78 + r() * 18;
  const h2 = 98 + r() * 14;
  const wave = (base: number, amp: number) => {
    const a = r() * amp;
    const b = r() * amp;
    return `M0 ${base} C 90 ${base - a} 150 ${base + b} 200 ${base - b / 2} S 330 ${base - a} 400 ${base + b / 3} V140 H0Z`;
  };
  const stars = Array.from({ length: 4 }, () => [20 + r() * 360, 10 + r() * 40] as const);
  const showConstellation = r() > 0.45;
  const pathStart = 120 + r() * 160;
  return (
    <svg className={className} viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="140" fill={c.sky} />
      <circle cx={sunX} cy={sunY} r={sunR} fill={c.sun} opacity="0.95" />
      <circle cx={sunX} cy={sunY} r={sunR + 10} fill="none" stroke={c.sun} strokeOpacity="0.35" strokeDasharray="2 6" />
      {showConstellation ? (
        <g stroke={c.star} strokeOpacity="0.45" strokeWidth="1" fill={c.star}>
          <polyline points={stars.map((s) => s.join(",")).join(" ")} fill="none" />
          {stars.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={i === 0 ? 2.6 : 1.8} stroke="none" fillOpacity="0.8" />
          ))}
        </g>
      ) : null}
      <path d={wave(h1, 16)} fill={c.far} />
      <path d={wave(h2, 12)} fill={c.near} />
      <path
        d={`M${pathStart} 140 C ${pathStart + 30} 128 ${pathStart - 30} 118 ${pathStart + 10} ${h2 + 2}`}
        fill="none"
        stroke={c.path}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
    </svg>
  );
}

/** Grand paysage de la page d'accueil, avec rose des vents discrète. */
export function HeroArt({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 400 230" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#233D56" />
          <stop offset="1" stopColor="#2F5070" />
        </linearGradient>
      </defs>
      <rect width="400" height="230" fill="url(#sky)" />
      <g fill="#F8F5ED" opacity="0.8">
        <circle cx="40" cy="30" r="1.4" />
        <circle cx="92" cy="54" r="1" />
        <circle cx="150" cy="22" r="1.6" />
        <circle cx="352" cy="40" r="1.2" />
        <circle cx="310" cy="18" r="1" />
        <circle cx="210" cy="44" r="1" />
      </g>
      <g stroke="#59A99E" strokeOpacity="0.7" fill="#59A99E">
        <polyline points="190,34 214,22 236,40 258,30" fill="none" />
        <circle cx="190" cy="34" r="2.4" />
        <circle cx="214" cy="22" r="1.8" />
        <circle cx="236" cy="40" r="2" />
        <circle cx="258" cy="30" r="1.6" />
      </g>
      <circle cx="318" cy="70" r="28" fill="#D87859" />
      <circle cx="318" cy="70" r="40" fill="none" stroke="#EBCB79" strokeOpacity="0.4" strokeDasharray="2 7" />
      <path d="M0 130 C 80 110 150 120 220 134 S 340 118 400 126 V230 H0Z" fill="#59A99E" opacity="0.55" />
      <path d="M0 152 C 90 136 190 150 260 160 S 360 150 400 148 V230 H0Z" fill="#1B3045" />
      <path d="M120 230 C 160 200 250 190 230 172 S 250 150 292 146" fill="none" stroke="#EBCB79" strokeWidth="3" strokeLinecap="round" strokeDasharray="1 9" opacity="0.6" />
      <g transform="translate(46 50)" stroke="#EBCB79" strokeOpacity="0.55" fill="none">
        <circle r="16" />
        <path d="M0 -22 L3 0 L0 22 L-3 0Z" fill="#EBCB79" fillOpacity="0.5" />
        <path d="M-22 0 L0 3 L22 0 L0 -3Z" />
      </g>
    </svg>
  );
}

/** Illustration de couverture d'un parcours. */
export function ParcoursArt({ kind, tone }: { kind: "sunrise" | "path" | "constellation"; tone: Tone }) {
  const c = palette[tone];
  return (
    <svg viewBox="0 0 400 120" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="400" height="120" fill={c.sky} />
      {kind === "sunrise" && (
        <>
          <circle cx="200" cy="92" r="40" fill={c.sun} />
          {Array.from({ length: 9 }, (_, i) => {
            const a = Math.PI + (i * Math.PI) / 8;
            return <line key={i} x1={200 + Math.cos(a) * 52} y1={92 + Math.sin(a) * 52} x2={200 + Math.cos(a) * 64} y2={92 + Math.sin(a) * 64} stroke={c.sun} strokeWidth="3" strokeLinecap="round" opacity="0.6" />;
          })}
          <path d="M0 96 C 100 86 300 86 400 96 V120 H0Z" fill={c.near} />
        </>
      )}
      {kind === "constellation" && (
        <>
          <g stroke={c.near} strokeOpacity="0.5" fill={c.near}>
            <polyline points="60,70 120,36 190,58 250,24 330,50" fill="none" strokeDasharray="3 4" />
            {[[60, 70], [120, 36], [190, 58], [250, 24], [330, 50]].map(([x, y], i) => (
              <circle key={i} cx={x} cy={y} r={i === 3 ? 5 : 3.5} stroke="none" />
            ))}
          </g>
          <circle cx="330" cy="50" r="12" fill="none" stroke={c.sun} strokeWidth="2" />
          <path d="M0 104 C 120 94 260 110 400 98 V120 H0Z" fill={c.far} />
        </>
      )}
      {kind === "path" && (
        <>
          <circle cx="320" cy="36" r="16" fill={c.sun} />
          <path d="M0 74 C 120 60 220 80 400 66 V120 H0Z" fill={c.far} />
          <path d="M0 96 C 140 84 260 100 400 88 V120 H0Z" fill={c.near} />
          <path d="M40 120 C 120 100 80 86 170 80 S 260 70 310 60" fill="none" stroke={c.path} strokeWidth="3.5" strokeLinecap="round" strokeDasharray="1 9" />
          <g transform="translate(310 46)">
            <line x1="0" y1="14" x2="0" y2="-6" stroke={c.near} strokeWidth="2" />
            <path d="M0 -6 L14 -1 L0 4Z" fill={c.star} />
          </g>
        </>
      )}
    </svg>
  );
}
