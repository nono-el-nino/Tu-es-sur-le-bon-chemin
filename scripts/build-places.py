"""Construit src/content/data/places.json à partir des données OpenBible.info (CC BY 4.0).

Usage : python3 scripts/build-places.py <dossier bible-geocoding-data>
Source : https://github.com/openbibleinfo/Bible-Geocoding-Data
"""
import json, math, sys, os

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open(os.path.join(ROOT, "scripts/places-config.json"), encoding="utf-8"))

ancient = {}
for line in open(os.path.join(SRC, "data/ancient.jsonl"), encoding="utf-8"):
    d = json.loads(line)
    ancient[d["id"]] = d
modern = {}
for line in open(os.path.join(SRC, "data/modern.jsonl"), encoding="utf-8"):
    d = json.loads(line)
    modern[d["id"]] = d
sources = {}
for line in open(os.path.join(SRC, "data/source.jsonl"), encoding="utf-8"):
    d = json.loads(line)
    sources[d["id"]] = d.get("friendly_id")


def rdp(points, eps):
    """Simplification de Douglas-Peucker (degrés)."""
    if len(points) < 3:
        return points
    (x1, y1), (x2, y2) = points[0], points[-1]
    dmax, idx = 0, 0
    for i in range(1, len(points) - 1):
        x0, y0 = points[i]
        num = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        den = math.hypot(y2 - y1, x2 - x1) or 1e-12
        d = num / den
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(points[: idx + 1], eps)[:-1] + rdp(points[idx:], eps)
    return [points[0], points[-1]]


def rnd(pts):
    return [[round(x, 4), round(y, 4)] for x, y in pts]


def ring(pts, eps):
    """Contour fermé : chaque moitié est simplifiée séparément."""
    pts = pts[:-1] if pts[0] == pts[-1] else pts
    m = len(pts) // 2
    out = rnd(rdp(pts[: m + 1], eps)[:-1] + rdp(pts[m:] + [pts[0]], eps))
    return out if len(out) >= 4 else None


def simplify(geom, eps):
    t, c = geom["type"], geom["coordinates"]
    if t == "LineString":
        return {"type": t, "coordinates": rnd(rdp(c, eps))}
    if t == "MultiLineString":
        return {"type": t, "coordinates": [rnd(rdp(l, eps)) for l in c]}
    if t == "Polygon":
        return {"type": t, "coordinates": [x for x in (ring(r, eps) for r in c) if x]}
    if t == "MultiPolygon":
        return {"type": t, "coordinates": [q for q in ([x for x in (ring(r, eps) for r in p) if x] for p in c) if q]}
    return None


def best_identification(place, depth=0):
    """Meilleure identification ; suit « another name for … » (ex. Horeb → Sinaï)."""
    idents = place.get("identifications", [])
    out = []
    for ident in idents:
        score = ident.get("score", {}).get("time_total")
        res = (ident.get("resolutions") or [{}])[0]
        desc = ident.get("description", "")
        if ident.get("id_source") == "ancient" and desc.startswith("another name for") and depth < 2:
            target = ancient[ident["id"]]
            # confiance combinée : (A est un autre nom de B) × (B est localisé ici)
            for sub in best_identification(target, depth + 1):
                combined = round((score or 0) * (sub["score"] or 0) / 1000)
                out.append({**sub, "score": combined, "via": target["friendly_id"]})
            continue
        if not res.get("lonlat"):
            continue
        lon, lat = map(float, res["lonlat"].split(","))
        site = modern.get(ident.get("id"), {}).get("friendly_id") if ident.get("id_source") == "modern" else None
        out.append({"site": site, "score": score, "lat": round(lat, 5), "lon": round(lon, 5), "type": res.get("type")})
    out.sort(key=lambda x: -(x["score"] if x["score"] is not None else -1))
    return out


places = []
slug_by_id = {}
for pid, meta in cfg["places"].items():
    d = ancient[pid]
    slug_by_id[pid] = meta["slug"]
    ids = best_identification(d)
    best = ids[0]
    extra = json.loads(d.get("extra", "{}"))
    linked = {}
    for sid, v in (d.get("linked_data") or {}).items():
        name = sources.get(sid)
        val = v.get("id") or v.get("url")
        if not val or v.get("modifier") in ("not", "nonunique_url"):
            continue
        if name == "pleiades":
            linked["pleiades"] = f"https://pleiades.stoa.org/places/{val}"
        elif name == "wikidata":
            linked["wikidata"] = f"https://www.wikidata.org/wiki/{val}"
        elif name == "dare":
            linked["dare"] = f"https://imperium.ahlfeldt.se/places/{val}"
    geometry = None
    kind = (d.get("types") or ["settlement"])[0]
    gpath = os.path.join(SRC, "geometry", f"{pid}.geojson")
    if kind in ("region", "river") and os.path.exists(gpath):
        g = json.load(open(gpath, encoding="utf-8"))
        feats = g.get("features", [g])
        shapes = [f["geometry"] for f in feats if f.get("geometry") and f["geometry"]["type"] != "Point"]
        if shapes:
            geometry = simplify(shapes[0] if len(shapes) == 1 else {"type": "MultiLineString", "coordinates": [s["coordinates"] for s in shapes]}, 0.006 if kind == "river" else 0.01)
    places.append({
        "id": meta["slug"],
        "name": meta["name"],
        "openbible": {"id": pid, "name": d["friendly_id"], "url": f"https://www.openbible.info/geo/ancient/{pid}/"},
        "kind": {"settlement": "ville", "region": "region", "river": "fleuve", "mountain": "montagne", "body of water": "mer"}.get(kind, kind),
        "lat": best["lat"],
        "lon": best["lon"],
        "identification": {"site": best.get("site"), "score": best["score"], "via": best.get("via")},
        "alternatives": [{"site": a.get("site"), "score": a["score"], "lat": a["lat"], "lon": a["lon"]} for a in ids[1:4] if (a["score"] or 0) >= 50],
        "links": linked,
        "verses": extra.get("osises", []),
        "geometry": geometry,
    })

links = {}
for passage_id, ls in cfg["links"].items():
    links[passage_id] = ls

places.sort(key=lambda p: p["id"])
NOTE = "OpenBible.info Bible Geocoding Data (CC BY 4.0) — https://github.com/openbibleinfo/Bible-Geocoding-Data. Généré par scripts/build-places.py ; ne pas modifier à la main."
# 1. Fiches de lieux (légères, utilisées par l'app)
lean = [{k: v for k, v in p.items() if k not in ("verses", "geometry")} for p in places]
path = os.path.join(ROOT, "src/content/data/places.json")
json.dump({"_source": NOTE, "places": lean, "links": links}, open(path, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
# 2. Contours des régions et tracés des fleuves (chargés avec la carte)
feats = [{"type": "Feature", "properties": {"id": p["id"]}, "geometry": p["geometry"]} for p in places if p["geometry"]]
json.dump({"type": "FeatureCollection", "features": feats}, open(os.path.join(ROOT, "public/geo/lieux-contours.json"), "w"), separators=(",", ":"))
# 3. Index des versets où chaque lieu est nommé (utilisé par les tests)
json.dump({p["id"]: p["verses"] for p in places}, open(os.path.join(ROOT, "scripts/data/places-verses.json"), "w"), separators=(",", ":"))
print(len(places), "lieux,", sum(len(v) for v in links.values()), "liens,", os.path.getsize(path) // 1024, "Ko")
for p in places:
    print(f"  {p['id']:14} {p['kind']:8} {p['identification']['score']!s:>5} {p['identification']['site']} {'via '+p['identification']['via'] if p['identification']['via'] else ''} alt={len(p['alternatives'])} geom={'oui' if p['geometry'] else '-'} {list(p['links'])}")
