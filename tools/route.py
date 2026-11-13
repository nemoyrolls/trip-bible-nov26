"""Fetch the real driving route from OSRM and save it as GeoJSON + per-leg stats.
Run: python3 tools/route.py   (re-run if stops change)"""
import json, urllib.request
STOPS = [  # (label, lon, lat)
 ("TU Delft", 4.3736, 52.0022), ("Frankfurt Hbf", 8.66258, 50.10665),
 ("Bad Vilbel Festplatz", 8.747885, 50.189402), ("Bolzano camper area", 11.33744, 46.47200),
 ("Camping Fusina", 12.25649, 45.42020), ("Verona Porta Palio", 10.97848, 45.43391),
 ("Partnachklamm parking", 11.1170, 47.4825), ("Plansee", 10.81288, 47.47432),
 ("highline179", 10.7146, 47.4706), ("Ulm Donaubad", 9.98639, 48.38453), ("Marburg", 8.7667, 50.8021)]
coords = ";".join(f"{lo},{la}" for _, lo, la in STOPS)
url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=full&geometries=geojson"
r = json.load(urllib.request.urlopen(url))["routes"][0]
legs = [{"from": STOPS[i][0], "to": STOPS[i+1][0], "km": round(l["distance"]/1000),
         "h": round(l["duration"]/3600, 2)} for i, l in enumerate(r["legs"])]
def rdp(pts, eps):
    """Ramer-Douglas-Peucker: drop points that sit within eps of the straight line."""
    import math
    if len(pts) < 3: return pts
    (x1,y1),(x2,y2) = pts[0], pts[-1]
    dx,dy = x2-x1, y2-y1; n = math.hypot(dx,dy) or 1e-12
    d = [abs(dy*x-dx*y+x2*y1-y2*x1)/n for x,y in pts[1:-1]]
    i = max(range(len(d)), key=d.__getitem__)
    if d[i] > eps: return rdp(pts[:i+2], eps)[:-1] + rdp(pts[i+1:], eps)
    return [pts[0], pts[-1]]
import sys; sys.setrecursionlimit(100000)
line = rdp(r["geometry"]["coordinates"], 0.0012)
geo = {"type": "Feature", "properties": {"source": "OSRM router.project-osrm.org", "legs": legs},
       "geometry": {"type": "LineString", "coordinates": [[round(x,4), round(y,4)] for x, y in line]}}
json.dump(geo, open("data/route.geojson", "w"), separators=(",", ":"))
for l in legs: print(f'{l["from"]:>22} -> {l["to"]:<22} {l["km"]:>4} km {l["h"]:>5} h')
print("TOTAL", round(r["distance"]/1000), "km", round(r["duration"]/3600, 1), "h;", len(geo["geometry"]["coordinates"]), "points")
