"""STAGE 2b — download the chosen photos and compress them for mobile.

For each pick:  Commons 1600px thumbnail  ->  AVIF + WebP at 480/960/1600 w
plus a ~24px blurred WebP placeholder ("LQIP") inlined as a data: URI.
Writes js/photos.js (window.PHOTOS) with caption + author + license for credits.
Run: python3 tools/photos_build.py
"""
import base64, json, os, re, subprocess, time, urllib.request

C = json.load(open("tools/candidates.json"))
UA = {"User-Agent": "trip-bible-builder/1.0 (personal travel site)"}
WIDTHS = (480, 960, 1600)
RAW = "tools/.raw"; os.makedirs(RAW, exist_ok=True); os.makedirs("img", exist_ok=True)

# id: (slot, candidate index, caption, alt text)
PICKS = {
  "cover":        ("cover", 0, "San Giorgio Maggiore in November fog: this is Venice in the off-season.", "Island church of San Giorgio Maggiore in fog on the Venetian lagoon"),
  "sat-hero":     ("sat-autobahn", 2, "The night run: 462 km of autobahn light trails.", "Long-exposure light trails on a German autobahn at night"),
  "sat-frankfurt":("sat-frankfurt", 1, "Frankfurt's skyline over the Main, where we pick up our second driver.", "Frankfurt skyline at blue hour reflected in the river Main"),
  "sun-hero":     ("sun-brenner", 1, "Europabrücke on the Brenner motorway, 190 m above the Sill valley.", "Europabrücke motorway bridge over a snowy valley near Innsbruck"),
  "sun-brenner2": ("sun-brenner", 0, "The Wipptal from above: the old road to Italy.", "Brenner motorway bridge with green valley and Alps"),
  "sun-otzi":     ("sun-otzi", 2, "Ötzi, 5,300 years old, killed by an arrow. (Replica in a touring exhibition; the real body is in Bolzano.)", "Replica of the mummy of Ötzi the Iceman in a glass case"),
  "sun-otzi2":    ("sun-otzi", 1, "His kit: a copper axe, a backpack frame and a quiver. (Replicas.)", "Replicas of Ötzi's equipment in a museum display"),
  "sun-bolzano":  ("sun-bolzano", 0, "Waltherplatz, Bolzano's living room.", "Aerial view of Waltherplatz square in Bolzano"),
  "sun-walther":  ("sun-bolzano", 3, "The Walther von der Vogelweide statue.", "Statue of Walther von der Vogelweide in Bolzano"),
  "mon-hero":     ("mon-sunset", 1, "A gondola at dusk, with the Salute dome behind it.", "Gondolier rowing at sunset with Santa Maria della Salute behind"),
  "mon-fog":      ("cover", 3, "A vaporetto crossing the Bacino in the fog.", "Water bus crossing the lagoon in fog with San Giorgio behind"),
  "mon-boat":     ("mon-boat", 0, "The lagoon from above: our boat route from Fusina comes in from the left.", "View over Venice lagoon from a rooftop with boats"),
  "mon-sanmarco": ("mon-sanmarco", 1, "The Campanile and the Doge's Palace from the water.", "Venice waterfront with St Mark's Campanile and Doge's Palace"),
  "mon-doge":     ("mon-doge", 2, "The Doge's Palace: 700 years of power in pink and white stone.", "Gothic facade of the Doge's Palace in Venice"),
  "mon-sighs":    ("mon-sighs", 2, "The Bridge of Sighs on a foggy morning. Prisoners crossed it to the cells.", "Bridge of Sighs over a canal on a foggy morning"),
  "tue-market":   ("tue-market", 3, "The Rialto market, Tuesday morning.", "Fruit and vegetable stalls at Rialto market"),
  "tue-pescheria":("tue-market", 0, "The Pescheria, the fish hall since 1907, on the Grand Canal.", "Neo-gothic fish market hall on the Grand Canal"),
  "tue-rialto":   ("tue-rialto", 0, "The Rialto Bridge in golden light.", "Rialto Bridge over the Grand Canal at golden hour"),
  "tue-hero":     ("tue-arena-out", 1, "The Arena di Verona, 1st century AD: still a working venue.", "Roman amphitheatre Arena di Verona from Piazza Bra"),
  "tue-arena":    ("tue-arena", 0, "Inside the Arena: 44 rows of stone seats.", "Interior tiers of the Arena di Verona"),
  "tue-ponte":    ("tue-ponte", 2, "Ponte Pietra over the fast Adige: Roman arches, rebuilt stone by stone after 1945.", "Ponte Pietra Roman bridge over the Adige river in Verona"),
  "tue-view":     ("tue-view", 0, "From the Castel San Pietro steps: our sunset viewpoint.", "Verona rooftops and cypresses seen from Castel San Pietro"),
  "tue-erbe":     ("tue-erbe", 3, "Piazza delle Erbe at night: spritz o'clock.", "Piazza delle Erbe in Verona in the evening with cafe lights"),
  "wed-hero":     ("wed-highline", 2, "highline179: 406 m long, 114 m up, and the floor is a grate.", "View along the highline179 suspension bridge walkway"),
  "wed-highline2":("wed-highline", 1, "The bridge and Ehrenberg above a sea of fog.", "highline179 bridge and castle ruin above valley fog"),
  "wed-gorge":    ("wed-gorge", 0, "Partnachklamm: the river cut 80 m deep into the limestone.", "Narrow limestone gorge with rushing turquoise water"),
  "wed-gorge2":   ("wed-gorge2", 0, "The water is loud in here.", "White water rushing over rocks inside Partnach gorge"),
  "wed-plansee":  ("wed-plansee", 2, "Plansee: the cold plunge. In summer someone swims; in November that's us.", "Turquoise alpine lake Plansee with a lone swimmer"),
  "wed-plansee2": ("wed-plansee", 1, "Plansee at blue hour.", "Mountains reflected in still Plansee lake at dusk"),
  "wed-ehrenberg":("wed-ehrenberg", 1, "Ehrenberg castle ruins, our blue-hour backup.", "Ruins of Ehrenberg castle on a wooded hill near Reutte"),
  "thu-hero":     ("thu-minster", 1, "Ulm Minster: the tallest church spire in the world, 161.5 m.", "Ulm Minster spire rising above the old town and Danube"),
  "thu-fischer":  ("thu-fischer", 3, "The Fischerviertel: half-timbered houses over the Blau.", "Canal in Ulm's Fischerviertel with stone bridge"),
}


def sh(*a):
    subprocess.run(a, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def fetch(url, dest):
    if os.path.exists(dest) and os.path.getsize(dest) > 5000:
        return
    for i in range(5):
        try:
            open(dest, "wb").write(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read())
            time.sleep(1); return
        except Exception as e:
            print("  retry", e); time.sleep(4 * (i + 1))
    raise RuntimeError(url)


def clean_author(a):
    a = re.sub(r"^This Photo was taken by\s*", "", a).strip()
    return re.sub(r"\.?\s*Feel free.*$", "", a).strip() or "Unknown"


out = {}
for pid, (slot, idx, caption, alt) in PICKS.items():
    c = C[slot][idx]
    # Commons only serves standard thumbnail buckets (…960, 1280, 1920…) and never larger than the original
    bucket = 1920 if c["w"] >= 1920 else 1280
    big = re.sub(r"/\d+px-", f"/{bucket}px-", c["thumb"].split("?")[0])
    raw = f"{RAW}/{pid}.jpg"; fetch(big, raw)
    done = os.path.exists(f"img/{pid}-1600.avif") and os.path.exists(f"{RAW}/{pid}-lq.webp")
    for slot_w in ([] if done else WIDTHS):  # resumable: skip photos already encoded
        px = min(slot_w, bucket)  # no upscaling: a 1280 source also fills the "1600" slot
        tmp = f"{RAW}/{pid}-{slot_w}.png"
        sh("ffmpeg", "-y", "-i", raw, "-vf", f"scale={px}:-2:flags=lanczos", tmp)
        sh("cwebp", "-q", "62", "-m", "6", "-af", "-mt", tmp, "-o", f"img/{pid}-{slot_w}.webp")
        sh("ffmpeg", "-y", "-i", tmp, "-c:v", "libaom-av1", "-still-picture", "1", "-crf", "36",
           "-cpu-used", "6", "-pix_fmt", "yuv420p", f"img/{pid}-{slot_w}.avif")
    # tiny blurred placeholder, inlined so the layout never jumps
    if not done: sh("ffmpeg", "-y", "-i", raw, "-vf", "scale=24:-2", f"{RAW}/{pid}-lq.png")
    if not done: sh("cwebp", "-q", "30", f"{RAW}/{pid}-lq.png", "-o", f"{RAW}/{pid}-lq.webp")
    lq = "data:image/webp;base64," + base64.b64encode(open(f"{RAW}/{pid}-lq.webp", "rb").read()).decode()
    out[pid] = {"ratio": round(c["w"] / c["h"], 3), "alt": alt, "caption": caption,
                "author": clean_author(c["author"]), "license": c["license"],
                "licenseUrl": c["licenseUrl"], "page": c["page"], "lqip": lq}
    kb = os.path.getsize(f"img/{pid}-960.avif") // 1024
    print(f"{pid:14} ok · 960 avif {kb} KB · {out[pid]['author'][:30]} · {c['license']}")

open("js/photos.js", "w").write("/* generated by tools/photos_build.py — do not edit */\nwindow.PHOTOS = " +
                                json.dumps(out, ensure_ascii=False, indent=1) + ";\n")
