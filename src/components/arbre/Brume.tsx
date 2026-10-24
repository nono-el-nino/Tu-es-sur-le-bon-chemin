import { tokenMs } from "../../lib/tokens";
import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * La brume : le texte passe du flou au net, mot à mot (un <span> par mot,
 * décalé de --d-brume-pas). Réservée aux versets et aux titres, jamais aux boutons.
 * Changer `cle` rejoue l'apparition. En mouvement réduit : simple fondu.
 */
export function Brume({ texte, as: Tag = "span", className, cle, emphase }: { texte: string; as?: ElementType; className?: string; cle?: string | number; /** mots mis en lumière (italique) */ emphase?: string[] }) {
  const mots = texte.split(/(\s+)/).filter((m) => m.length > 0);
  let i = 0;
  return (
    <Tag className={className} key={cle}>
      <span className="sr-only">{texte}</span>
      {mots.map((m, k) =>
        /^\s+$/.test(m) ? (
          " "
        ) : (
          <span key={k} className="brume-mot" aria-hidden="true" style={{ "--i": i++ } as CSSProperties}>
            {emphase?.includes(m.replace(/[^\p{L}'’-]/gu, "")) ? <em>{m}</em> : m}
          </span>
        ),
      )}
    </Tag>
  );
}

/** Bloc qui apparaît en brume quand il entre à l'écran (lecture au défilement). */
export function BrumeAuDefilement({ children, className = "" }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [vu, setVu] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return setVu(true);
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVu(true);
          io.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    // filet de sécurité : le contenu ne reste jamais caché
    const t = window.setTimeout(() => setVu(true), tokenMs("--d-brume-secours"));
    return () => {
      io.disconnect();
      window.clearTimeout(t);
    };
  }, []);
  return (
    <div ref={ref} className={`${className} ${vu ? "brume-bloc" : "brume-attente"}`}>
      {children}
    </div>
  );
}
