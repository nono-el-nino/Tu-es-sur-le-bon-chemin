/**
 * Données personnelles, stockées uniquement sur l'appareil (localStorage).
 * Aucune donnée n'est envoyée sur un serveur.
 */

export type Note = {
  id: string;
  /** Élément auquel la note est rattachée (passage ou étape de parcours). */
  target: { type: "passage"; id: string } | { type: "step"; parcoursId: string; stepId: string } | { type: "libre" };
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type ParcoursProgress = {
  completedStepIds: string[];
  startedAt: string;
  lastStepId?: string;
  updatedAt: string;
};

export type UserData = {
  version: 1;
  /** humeur : humeur choisie au moment de garder le passage (teinte de la goutte au carnet). */
  favorites: { passageId: string; savedAt: string; humeur?: string }[];
  notes: Note[];
  progress: Record<string, ParcoursProgress>;
  explored: Record<string, string>; // topicId -> dernière visite
  /** Prénom facultatif saisi à l'accueil. */
  prenom?: string;
  /** Date de fin de l'onboarding. */
  onboardedAt?: string;
};

export const STORAGE_KEY = "bon-chemin:v1";

export const emptyData = (): UserData => ({ version: 1, favorites: [], notes: [], progress: {}, explored: {} });

type KV = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const now = () => new Date().toISOString();
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

export function load(storage: KV | undefined): UserData {
  if (!storage) return emptyData();
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as Partial<UserData>;
    if (parsed.version !== 1) return emptyData();
    return { ...emptyData(), ...parsed } as UserData;
  } catch {
    return emptyData();
  }
}

export function save(storage: KV | undefined, data: UserData) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // stockage plein ou indisponible (navigation privée) : on reste en mémoire
  }
}

// --- opérations pures (testables) ---

export const isFavorite = (d: UserData, passageId: string) => d.favorites.some((f) => f.passageId === passageId);

export function toggleFavorite(d: UserData, passageId: string, humeur?: string): UserData {
  return isFavorite(d, passageId)
    ? { ...d, favorites: d.favorites.filter((f) => f.passageId !== passageId) }
    : { ...d, favorites: [{ passageId, savedAt: now(), ...(humeur ? { humeur } : {}) }, ...d.favorites] };
}

// --- Onboarding ---

/** Les personnes qui utilisent déjà l'app (données présentes) ne revoient pas l'accueil. */
export const needsOnboarding = (d: UserData) =>
  !d.onboardedAt && d.favorites.length === 0 && d.notes.length === 0 && Object.keys(d.progress).length === 0 && Object.keys(d.explored).length === 0;

export function finishOnboarding(d: UserData, prenom?: string): UserData {
  const p = prenom?.trim().slice(0, 40);
  return { ...d, onboardedAt: now(), ...(p ? { prenom: p } : {}) };
}

export function setPrenom(d: UserData, prenom: string): UserData {
  const p = prenom.trim().slice(0, 40);
  const next = { ...d };
  if (p) next.prenom = p;
  else delete next.prenom;
  return next;
}

// --- Croissance de l'arbre ---

/** Progression globale (0..1) et croissance de chaque branche (une par parcours). */
export function croissance(d: UserData, parcours: { id: string; steps: { id: string }[] }[]) {
  const parBranche = parcours.map((p) => {
    const faites = p.steps.filter((s) => d.progress[p.id]?.completedStepIds.includes(s.id)).length;
    return p.steps.length ? faites / p.steps.length : 0;
  });
  const total = parcours.reduce((n, p) => n + p.steps.length, 0);
  const faites = parcours.reduce((n, p) => n + p.steps.filter((s) => d.progress[p.id]?.completedStepIds.includes(s.id)).length, 0);
  // un parcours commencé fait déjà apparaître sa branche
  const branches = parcours.map((p, i) => (p.id in d.progress ? Math.max(0.12, parBranche[i]) : 0));
  return { progression: total ? faites / total : 0, branches };
}

export function upsertNote(d: UserData, target: Note["target"], text: string, noteId?: string): UserData {
  const t = text.trim();
  if (noteId) {
    if (!t) return deleteNote(d, noteId);
    return { ...d, notes: d.notes.map((n) => (n.id === noteId ? { ...n, text: t, updatedAt: now() } : n)) };
  }
  if (!t) return d;
  const n: Note = { id: uid(), target, text: t, createdAt: now(), updatedAt: now() };
  return { ...d, notes: [n, ...d.notes] };
}

export const deleteNote = (d: UserData, noteId: string): UserData => ({ ...d, notes: d.notes.filter((n) => n.id !== noteId) });

export function setStepDone(d: UserData, parcoursId: string, stepId: string, done: boolean): UserData {
  const prev = d.progress[parcoursId] ?? { completedStepIds: [], startedAt: now(), updatedAt: now() };
  const set = new Set(prev.completedStepIds);
  if (done) set.add(stepId);
  else set.delete(stepId);
  return {
    ...d,
    progress: { ...d.progress, [parcoursId]: { ...prev, completedStepIds: [...set], lastStepId: stepId, updatedAt: now() } },
  };
}

export function visitStep(d: UserData, parcoursId: string, stepId: string): UserData {
  const prev = d.progress[parcoursId] ?? { completedStepIds: [], startedAt: now(), updatedAt: now() };
  return { ...d, progress: { ...d.progress, [parcoursId]: { ...prev, lastStepId: stepId, updatedAt: now() } } };
}

export function resetParcours(d: UserData, parcoursId: string): UserData {
  const progress = { ...d.progress };
  delete progress[parcoursId];
  return { ...d, progress };
}

export const markExplored = (d: UserData, topicId: string): UserData => ({ ...d, explored: { ...d.explored, [topicId]: now() } });

export const forgetExplored = (d: UserData, topicId: string): UserData => {
  const explored = { ...d.explored };
  delete explored[topicId];
  return { ...d, explored };
};

/** Parcours commencé le plus récemment et non terminé. */
export function lastActiveParcours(d: UserData, stepCounts: Record<string, number>): string | undefined {
  return Object.entries(d.progress)
    .filter(([id, p]) => id in stepCounts && p.completedStepIds.length < stepCounts[id])
    .sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt))[0]?.[0];
}
