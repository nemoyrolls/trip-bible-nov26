"""Real elevation profile for Wednesday (Verona → Alps → Ulm) from the Open-Meteo
elevation API (Copernicus DEM, free, no key). Samples 100 evenly spaced points
along the OSRM route geometry. Output: data/elev-wed.json  [[km, metres], ...]"""
import json, math, urllib.request
g = json.load(open("data/route.geojson"))["geometry"]["coordinates"]
def hav(a, b):
    R=6371; la1,la2=map(math.radians,(a[1],b[1])); dla=la2-la1; dlo=math.radians(b[0]-a[0])
    return 2*R*math.asin(math.sqrt(math.sin(dla/2)**2+math.cos(la1)*math.cos(la2)*math.sin(dlo/2)**2))
near = lambda p: min(range(len(g)), key=lambda i: hav(g[i], p))
seg = g[near((10.97848, 45.43391)):near((9.98639, 48.38453)) + 1]   # Verona Porta Palio → Ulm Donaubad
cum = [0]
for a, b in zip(seg, seg[1:]): cum.append(cum[-1] + hav(a, b))
N = 100; pts = []
for k in range(N):                      # resample at equal distance steps
    d = cum[-1] * k / (N - 1); i = max(j for j in range(len(cum)) if cum[j] <= d)
    if i == len(seg) - 1: pts.append((d, seg[-1])); continue
    t = (d - cum[i]) / ((cum[i+1] - cum[i]) or 1)
    pts.append((d, [seg[i][0] + t*(seg[i+1][0]-seg[i][0]), seg[i][1] + t*(seg[i+1][1]-seg[i][1])]))
url = ("https://api.open-meteo.com/v1/elevation?latitude=" + ",".join(f"{p[1][1]:.4f}" for p in pts)
       + "&longitude=" + ",".join(f"{p[1][0]:.4f}" for p in pts))
el = json.load(urllib.request.urlopen(url))["elevation"]
out = [[round(d), round(e)] for (d, _), e in zip(pts, el)]
json.dump(out, open("data/elev-wed.json", "w"), separators=(",", ":"))
top = max(out, key=lambda x: x[1]); print("km", round(cum[-1]), "| max", top, "| start", out[0], "| end", out[-1])
