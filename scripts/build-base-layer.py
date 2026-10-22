"""Fond de carte « À l'époque » (public/geo/fond-naturel.json) : terres, lacs et fleuves, sans noms modernes.

Source : Natural Earth 1:10m (domaine public), https://github.com/nvkelso/natural-earth-vector
Usage : python3 scripts/build-base-layer.py <dossier natural-earth-vector>
"""
import json, math, os, sys

SRC = os.path.join(sys.argv[1], "geojson")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
X0, Y0, X1, Y1 = 5.0, 10.0, 75.0, 48.0  # de Rome à l'Indus, de Koush à la mer Noire


def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    (x1, y1), (x2, y2) = pts[0][:2], pts[-1][:2]
    den = math.hypot(y2 - y1, x2 - x1) or 1e-12
    dmax, idx = 0, 0
    for i in range(1, len(pts) - 1):
        x0, y0 = pts[i][:2]
        d = abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1) / den
        if d > dmax:
            dmax, idx = d, i
    if dmax > eps:
        return rdp(pts[: idx + 1], eps)[:-1] + rdp(pts[idx:], eps)
    return [pts[0], pts[-1]]


def clip_ring(ring):
    """Découpage de Sutherland-Hodgman par le rectangle d'étude."""
    def clip(pts, inside, inter):
        out = []
        for i, cur in enumerate(pts):
            prev = pts[i - 1]
            if inside(cur):
                if not inside(prev):
                    out.append(inter(prev, cur))
                out.append(cur)
            elif inside(prev):
                out.append(inter(prev, cur))
        return out

    def ix(x):
        return lambda a, b: [x, a[1] + (b[1] - a[1]) * (x - a[0]) / ((b[0] - a[0]) or 1e-12)]

    def iy(y):
        return lambda a, b: [a[0] + (b[0] - a[0]) * (y - a[1]) / ((b[1] - a[1]) or 1e-12), y]

    pts = [p[:2] for p in ring]
    for inside, inter in (
        (lambda p: p[0] >= X0, ix(X0)),
        (lambda p: p[0] <= X1, ix(X1)),
        (lambda p: p[1] >= Y0, iy(Y0)),
        (lambda p: p[1] <= Y1, iy(Y1)),
    ):
        if not pts:
            return []
        pts = clip(pts, inside, inter)
    return pts


def ring_simplify(pts, eps):
    if len(pts) < 4:
        return None
    m = len(pts) // 2
    s = rdp(pts[: m + 1], eps)[:-1] + rdp(pts[m:] + [pts[0]], eps)
    s = [[round(x, 3), round(y, 3)] for x, y in s]
    return s if len(s) >= 4 else None


def polygons(geom):
    return [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]


def area(r):
    return abs(sum(a[0] * b[1] - b[0] * a[1] for a, b in zip(r, r[1:] + r[:1]))) / 2


feats = []
for name, kind, eps, min_area in (("ne_10m_land", "terre", 0.01, 0.002), ("ne_10m_lakes", "lac", 0.004, 0.003)):
    for f in json.load(open(os.path.join(SRC, name + ".geojson"), encoding="utf-8"))["features"]:
        for poly in polygons(f["geometry"]):
            rings = []
            for r in poly:
                c = clip_ring(r)
                s = ring_simplify(c, eps) if c else None
                if s and area(s) >= min_area:
                    rings.append(s)
            if rings:
                feats.append({"type": "Feature", "properties": {"t": kind}, "geometry": {"type": "Polygon", "coordinates": rings}})

for f in json.load(open(os.path.join(SRC, "ne_10m_rivers_lake_centerlines.geojson"), encoding="utf-8"))["features"]:
    if (f["properties"].get("scalerank") or 99) > 6:
        continue
    g = f["geometry"]
    lines = [g["coordinates"]] if g["type"] == "LineString" else g["coordinates"]
    keep = []
    for l in lines:
        pts = [p[:2] for p in l if X0 <= p[0] <= X1 and Y0 <= p[1] <= Y1]
        if len(pts) > 1:
            keep.append([[round(x, 3), round(y, 3)] for x, y in rdp(pts, 0.008)])
    if keep:
        feats.append({"type": "Feature", "properties": {"t": "fleuve"}, "geometry": {"type": "MultiLineString", "coordinates": keep}})

path = os.path.join(ROOT, "public/geo/fond-naturel.json")
json.dump({"type": "FeatureCollection", "features": feats}, open(path, "w"), separators=(",", ":"))
from collections import Counter
print(Counter(f["properties"]["t"] for f in feats), os.path.getsize(path) // 1024, "Ko")
