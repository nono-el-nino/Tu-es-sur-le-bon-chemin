import { describe, expect, it } from "vitest";
import {
  STORAGE_KEY,
  deleteNote,
  emptyData,
  isFavorite,
  lastActiveParcours,
  load,
  markExplored,
  resetParcours,
  save,
  setStepDone,
  toggleFavorite,
  upsertNote,
  forgetExplored,
} from "../src/lib/store";

function memoryStorage() {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    raw: m,
  };
}

describe("favoris", () => {
  it("ajoute puis retire un favori", () => {
    let d = emptyData();
    d = toggleFavorite(d, "p-a");
    expect(isFavorite(d, "p-a")).toBe(true);
    d = toggleFavorite(d, "p-a");
    expect(isFavorite(d, "p-a")).toBe(false);
  });

  it("persiste dans le stockage local et se recharge", () => {
    const s = memoryStorage();
    save(s, toggleFavorite(emptyData(), "p-b"));
    expect(s.raw.has(STORAGE_KEY)).toBe(true);
    expect(isFavorite(load(s), "p-b")).toBe(true);
  });

  it("résiste à des données corrompues", () => {
    const s = memoryStorage();
    s.setItem(STORAGE_KEY, "{pas du json");
    expect(load(s)).toEqual(emptyData());
    expect(load(undefined)).toEqual(emptyData());
  });
});

describe("progression", () => {
  it("valide et annule une étape", () => {
    let d = setStepDone(emptyData(), "pc", "e1", true);
    d = setStepDone(d, "pc", "e2", true);
    expect(d.progress.pc.completedStepIds).toEqual(["e1", "e2"]);
    d = setStepDone(d, "pc", "e1", false);
    expect(d.progress.pc.completedStepIds).toEqual(["e2"]);
    d = setStepDone(d, "pc", "e2", true);
    expect(d.progress.pc.completedStepIds).toEqual(["e2"]);
  });

  it("retrouve le parcours à reprendre, en ignorant les parcours terminés", () => {
    let d = setStepDone(emptyData(), "a", "1", true);
    d = { ...d, progress: { ...d.progress, a: { ...d.progress.a, updatedAt: "2026-01-01T00:00:00Z" } } };
    d = setStepDone(d, "b", "1", true);
    expect(lastActiveParcours(d, { a: 5, b: 1 })).toBe("a");
    expect(lastActiveParcours(d, { a: 5, b: 5 })).toBe("b");
    expect(lastActiveParcours(resetParcours(d, "b"), { a: 5, b: 5 })).toBe("a");
  });
});

describe("notes et thèmes explorés", () => {
  it("crée, modifie et supprime une note", () => {
    let d = upsertNote(emptyData(), { type: "passage", id: "p-a" }, "  Première idée ");
    expect(d.notes[0].text).toBe("Première idée");
    const id = d.notes[0].id;
    d = upsertNote(d, { type: "passage", id: "p-a" }, "Modifiée", id);
    expect(d.notes[0].text).toBe("Modifiée");
    d = deleteNote(d, id);
    expect(d.notes).toHaveLength(0);
  });

  it("ignore une note vide et supprime une note vidée", () => {
    let d = upsertNote(emptyData(), { type: "libre" }, "   ");
    expect(d.notes).toHaveLength(0);
    d = upsertNote(d, { type: "libre" }, "x");
    d = upsertNote(d, { type: "libre" }, "", d.notes[0].id);
    expect(d.notes).toHaveLength(0);
  });

  it("mémorise et oublie un thème exploré", () => {
    let d = markExplored(emptyData(), "joie");
    expect("joie" in d.explored).toBe(true);
    d = forgetExplored(d, "joie");
    expect("joie" in d.explored).toBe(false);
  });
});
