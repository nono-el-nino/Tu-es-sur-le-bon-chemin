"""Prépare les couches historiques (public/geo/*.json) à partir des données AWMC.

Source : Ancient World Mapping Center, https://github.com/AWMC/geodata
Licence : ODbL 1.0 (données dérivées du Barrington Atlas of the Greek and Roman World).
Usage : python3 scripts/build-geo-layers.py <dossier AWMC/geodata>
"""
import json, math, os, sys

SRC = sys.argv[1]
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public/geo")
os.makedirs(OUT, exist_ok=True)


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0][:2], pts[-1][:2]
    dmax, idx = 0, 0
    den = math.hypot(y2 - y1, x2 - x1) or 1e-12
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i][:2]
        d = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / den
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[: idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def r(pts):
    return [[round(p[0], 3), round(p[1], 3)] for p in pts]


def ring(pts, eps):
    # contour fermé : on simplifie chaque moitié séparément (sinon les extrémités confondues l'effondrent)
    pts = pts[:-1] if pts[0] == pts[-1] else pts
    if len(pts) < 3:
        return None
    m = len(pts) // 2
    s = r(rdp(pts[: m + 1], eps)[:-1] + rdp(pts[m:] + [pts[0]], eps))
    return s if len(s) >= 4 else None


def simplify(g, eps):
    t, c = g["type"], g["coordinates"]
    if t == "Polygon":
        rings = [x for x in (ring(rr, eps) for rr in c) if x]
        return {"type": "Polygon", "coordinates": rings} if rings else None
    if t == "MultiPolygon":
        polys = [[x for x in (ring(rr, eps) for rr in p) if x] for p in c]
        polys = [p for p in polys if p]
        return {"type": "MultiPolygon", "coordinates": polys} if polys else None
    if t == "LineString":
        return {"type": t, "coordinates": r(rdp(c, eps))}
    if t == "MultiLineString":
        return {"type": t, "coordinates": [r(rdp(l, eps)) for l in c if len(l) > 1]}


def in_bbox(g, bbox):
    x0, y0, x1, y1 = bbox
    def pts(c):
        if isinstance(c[0], (int, float)):
            yield c
        else:
            for k in c:
                yield from pts(k)
    return any(x0 <= p[0] <= x1 and y0 <= p[1] <= y1 for p in pts(g["coordinates"]))


def build(src, out, eps, keep=lambda p: True, bbox=None, min_area=0.0):
    d = json.load(open(os.path.join(SRC, src), encoding="utf-8"))
    feats = []
    for f in d["features"]:
        g = f.get("geometry")
        if not g or not keep(f["properties"]):
            continue
        if bbox and not in_bbox(g, bbox):
            continue
        if min_area and f["properties"].get("Shape_Area", 1) < min_area:
            continue
        s = simplify(g, eps)
        if s:
            feats.append({"type": "Feature", "properties": {}, "geometry": s})
    fc = {"type": "FeatureCollection", "features": feats}
    path = os.path.join(OUT, out)
    json.dump(fc, open(path, "w"), separators=(",", ":"))
    print(out, len(feats), "éléments", os.path.getsize(path) // 1024, "Ko")


P = "Cultural-Data/political_shading/"
build(P + "persian_extent/extent_of_the_persian_empire.geojson", "empire-perse.json", 0.03, min_area=0.02)
build(P + "herod/herods_kingdom.geojson", "royaume-herode.json", 0.005)
build(P + "roman_empire_ce_117_extent/roman_empire_ce_117_extent.geojson", "empire-romain-117.json", 0.03, min_area=0.02)
build("Cultural-Data/roads/roads.geojson", "voies-romaines.json", 0.01,
      keep=lambda p: p.get("Major_or_M") == "1", bbox=(10, 24, 50, 46))
