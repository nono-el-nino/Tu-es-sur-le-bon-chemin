/**
 * Météo du nuage selon l'humeur : teinte des bulles et densité de pluie.
 * Les couleurs sont des noms de tokens (tokens.css), jamais des valeurs.
 * Du plus lourd au plus léger : inquiétude, colère (5 gouttes) … espérance, joie (1 goutte).
 */

export type Meteo = { teinte: string; gouttes: number; goutte: string };

const table: Record<string, Meteo> = {
  inquietude: { teinte: "--meteo-inquietude", gouttes: 5, goutte: "--profondeur" },
  colere: { teinte: "--meteo-colere", gouttes: 5, goutte: "--profondeur" },
  doute: { teinte: "--meteo-doute", gouttes: 4, goutte: "--source" },
  solitude: { teinte: "--meteo-solitude", gouttes: 4, goutte: "--source" },
  fatigue: { teinte: "--meteo-fatigue", gouttes: 3, goutte: "--source" },
  pardon: { teinte: "--meteo-pardon", gouttes: 3, goutte: "--averse" },
  courage: { teinte: "--meteo-courage", gouttes: 2, goutte: "--averse" },
  gratitude: { teinte: "--meteo-gratitude", gouttes: 2, goutte: "--averse" },
  esperance: { teinte: "--meteo-esperance", gouttes: 1, goutte: "--bruine" },
  joie: { teinte: "--meteo-joie", gouttes: 1, goutte: "--bruine" },
};

const calme: Meteo = { teinte: "--nuage-ombre", gouttes: 0, goutte: "--averse" };

export function meteoDe(humeurId?: string | null): Meteo {
  return (humeurId && table[humeurId]) || calme;
}

export const humeursConnues = Object.keys(table);

/** Couleur (token) d'une goutte du carnet selon l'humeur au moment de la sauvegarde. */
export const couleurGoutte = (humeurId?: string | null) => meteoDe(humeurId).goutte;
