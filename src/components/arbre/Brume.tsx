import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from "react";

/**
 * La brume : le texte passe du flou au net, mot à mot (un <span> par mot,
 * décalé de --d-brume-pas). Réservée aux versets et aux titres, jamais aux boutons.
 * Changer `cle` rejoue l'apparition. En mouvement réduit : simple fondu.
 */
export function Brume({ texte, as: Tag = "span", className, cle }: { texte: string; as?: ElementType; className?: string; cle?: string | number }) {
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
            {m}
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
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`${className} ${vu ? "brume-bloc" : "brume-attente"}`}>
      {children}
    </div>
  );
}
