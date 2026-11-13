"""STAGE 2a — find photo candidates on Wikimedia Commons.

For every photo slot we ask the Commons search API for files, then fetch
`imageinfo` + `extmetadata` (author, license) for each hit. We keep only:
  * free licenses (CC BY / CC BY-SA / CC0 / Public domain)
  * landscape images at least 1600 px wide
Candidates that Commons volunteers marked as "Quality images" or
"Featured pictures" rank first. Output: tools/candidates.json
Run: python3 tools/photos_search.py
"""
import json, re, time, urllib.parse, urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = {"User-Agent": "trip-bible-builder/1.0 (personal travel site; contact via github nemoyrolls)"}

# slot id -> list of search queries (tried in order until we have enough)
SLOTS = {
    "cover":          ["Venice fog San Giorgio Maggiore", "Venice Grand Canal dusk"],
    "sat-frankfurt":  ["Frankfurt skyline night Main", "Frankfurt am Main skyline blue hour"],
    "sat-autobahn":   ["Autobahn night light trails Germany"],
    "sun-brenner":    ["Europabrücke Brenner Autobahn", "Brenner motorway A13 Europabrücke"],
    "sun-otzi":       ["Ötzi", "Oetzi Iceman", "South Tyrol Museum of Archaeology", "Ötztal Alps Similaun"],
    "sun-bolzano":    ["Bolzano Waltherplatz", "Bozen Waltherplatz Dom"],
    "sun-lauben":     ["Bozen Laubengasse", "Bolzano Via dei Portici"],
    "mon-boat":       ["Venice Giudecca canal vaporetto", "Zattere Venice"],
    "mon-sanmarco":   ["Piazza San Marco Venice basilica", "St Mark's Basilica facade Venice"],
    "mon-doge":       ["Doge's Palace Venice facade", "Palazzo Ducale Venezia"],
    "mon-sighs":      ["Bridge of Sighs Venice", "Ponte dei Sospiri"],
    "mon-sunset":     ["San Giorgio Maggiore sunset gondolas", "Riva degli Schiavoni gondolas sunset", "Venice gondolas San Giorgio", "Venice sunset lagoon"],
    "mon-alley":      ["Venice narrow canal Cannaregio", "Venice canal houses quiet", "Rio Venezia canal", "Venice canal gondola bridge"],
    "tue-market":     ["Rialto fish market Pescheria Venice", "Mercato di Rialto"],
    "tue-rialto":     ["Rialto Bridge Venice Grand Canal", "Ponte di Rialto"],
    "tue-arena":      ["Arena di Verona interior", "Verona Arena amphitheatre"],
    "tue-arena-out":  ["Arena di Verona Piazza Bra", "Verona Arena exterior"],
    "tue-ponte":      ["Ponte Pietra Verona", "Verona Adige Ponte Pietra night"],
    "tue-view":       ["Verona view from Castel San Pietro", "Verona panorama Castel San Pietro"],
    "tue-erbe":       ["Piazza delle Erbe Verona", "Verona Piazza delle Erbe evening"],
    "wed-gorge":      ["Partnachklamm", "Partnach Gorge Garmisch"],
    "wed-gorge2":     ["Partnachklamm winter ice", "Partnachklamm gallery"],
    "wed-plansee":    ["Plansee Tirol", "Plansee lake Reutte"],
    "wed-highline":   ["highline179", "Highline 179 Reutte suspension bridge"],
    "wed-highline2":  ["highline179 Ehrenberg bridge", "Hängebrücke Reutte Ehrenberg"],
    "wed-ehrenberg":  ["Burgruine Ehrenberg Reutte", "Ehrenberg castle ruin Tyrol"],
    "thu-minster":    ["Ulm Minster", "Ulmer Münster"],
    "thu-fischer":    ["Ulm Fischerviertel", "Ulm Fischerviertel Blau"],
}

FREE = re.compile(r"^(cc[- ]by|cc0|public domain|pd)", re.I)
WANT = 4  # candidates per slot


import hashlib, os
CACHE = "tools/.cache"; os.makedirs(CACHE, exist_ok=True)


def api(**p):
    """GET the Commons API with an on-disk cache and exponential back-off on 429s."""
    p.update(format="json", formatversion=2)
    url = API + "?" + urllib.parse.urlencode(p)
    f = os.path.join(CACHE, hashlib.md5(url.encode()).hexdigest() + ".json")
    if os.path.exists(f):
        return json.load(open(f))
    for attempt in range(6):
        try:
            data = json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
            json.dump(data, open(f, "w")); time.sleep(1.5)
            return data
        except Exception as e:
            print("   retry", attempt, e); time.sleep(5 * 2 ** attempt)
    raise RuntimeError(url)


def strip_html(s):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", s or "")).strip()


def search(q):
    r = api(action="query", generator="search", gsrsearch=f"{q} filetype:bitmap", gsrnamespace=6,
            gsrlimit=20, prop="imageinfo|categories", cllimit=50, clshow="!hidden",
            iiprop="url|size|extmetadata|mime", iiurlwidth=480)
    out = []
    for p in sorted(r.get("query", {}).get("pages", []), key=lambda p: p.get("index", 99)):
        ii = (p.get("imageinfo") or [{}])[0]
        md = ii.get("extmetadata", {})
        lic = md.get("LicenseShortName", {}).get("value", "")
        w, h = ii.get("width", 0), ii.get("height", 0)
        if not FREE.match(lic) or w < 1600 or w < h * 1.2 or ii.get("mime") not in ("image/jpeg", "image/png"):
            continue
        cats = " ".join(c["title"] for c in p.get("categories", []))
        # quality signals: Commons assessment templates also appear in hidden cats, so check metadata too
        assess = md.get("Assessments", {}).get("value", "")
        score = (3 if "featured" in assess.lower() else 0) + (2 if "quality" in assess.lower() else 0)
        out.append({
            "title": p["title"], "w": w, "h": h, "score": score,
            "thumb": ii.get("thumburl"), "page": ii.get("descriptionurl"),
            "author": strip_html(md.get("Artist", {}).get("value", "Unknown"))[:120],
            "license": lic, "licenseUrl": md.get("LicenseUrl", {}).get("value", ""),
            "desc": strip_html(md.get("ImageDescription", {}).get("value", ""))[:160],
        })
    return out


def main():
    result = {}
    for slot, queries in SLOTS.items():
        seen, cands = set(), []
        for q in queries:
            for c in search(q):
                if c["title"] not in seen:
                    seen.add(c["title"]); cands.append(c)
            if len(cands) >= WANT * 2:
                break
            time.sleep(0.5)
        cands.sort(key=lambda c: -c["score"])  # stable: keeps search relevance within a score
        result[slot] = cands[:WANT]
        print(f"{slot:15} {len(cands):2} found · top: {cands[0]['title'][5:70] if cands else '—'}")
    json.dump(result, open("tools/candidates.json", "w"), indent=1, ensure_ascii=False)


if __name__ == "__main__":
    main()
