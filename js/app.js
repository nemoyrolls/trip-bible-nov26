/* =====================================================================
   ROAD ATLAS — renderer. Builds every section from window.TRIP
   (js/trip.js) and window.PHOTOS (js/photos.js). No framework.
   ===================================================================== */
(() => {
  "use strict";
  const T = window.TRIP, P = window.PHOTOS || {};
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  /* ---------- helpers ---------- */
  const gmaps = (lat, lon) => `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  /** Google Maps directions URL: first point = origin, last = destination, the rest = waypoints */
  const gdir = (pts) => {
    const f = (p) => p.join(","), o = pts[0], d = pts.at(-1), w = pts.slice(1, -1);
    return `https://www.google.com/maps/dir/?api=1&origin=${f(o)}&destination=${f(d)}${w.length ? `&waypoints=${w.map(f).join("|")}` : ""}&travelmode=driving`;
  };
  const hm = (h) => { const m = Math.round(h * 60); return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}`; };
  const icon = {
    pin: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0a5.5 5.5 0 0 0-5.5 5.5C2.5 10 8 16 8 16s5.5-6 5.5-10.5A5.5 5.5 0 0 0 8 0Zm0 7.6a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Z"/></svg>',
    out: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6 3H3v10h10v-3M9 2h5v5M14 2 7 9"/></svg>'
  };

  /** Responsive <picture>: AVIF first, WebP fallback, blurred placeholder behind. */
  function pic(id, { sizes = "100vw", eager = false } = {}) {
    const p = P[id]; if (!p) return "";
    const set = (ext) => [480, 960, 1600].map((w) => `img/${id}-${w}.${ext} ${w}w`).join(", ");
    return `<picture>
      <source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">
      <img src="img/${id}-960.webp" srcset="${set("webp")}" sizes="${sizes}" alt="${esc(p.alt)}"
        ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"
        style="background-image:url(${p.lqip})">
    </picture>`;
  }
  /** Credit line required by CC BY / CC BY-SA: author, license link, source. */
  function credit(id) {
    const p = P[id]; if (!p) return "";
    const lic = p.licenseUrl ? `<a href="${esc(p.licenseUrl)}" rel="license">${esc(p.license)}</a>` : esc(p.license);
    return `Photo: <a href="${esc(p.page)}">${esc(p.author)}</a>, ${lic}`;
  }
  const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII"];

  /* ---------- cover ---------- */
  $("#cover-pic").outerHTML = `<picture class="cover-img">${pic("cover", { eager: true }).replace(/^<picture>|<\/picture>$/g, "")}</picture>`;
  $("#cover-sub").textContent = T.subtitle;
  $("#cover-credit").innerHTML = credit("cover");
  const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // one orchestrated opening moment: letters rise, then the route line types itself
  {
    const h1 = $(".cover h1"), lines = [...h1.childNodes].map((n) => n.textContent.trim()).filter(Boolean);
    h1.setAttribute("aria-label", lines.join(" "));
    let i = 0;
    h1.innerHTML = lines.map((line, li) => `<span class="w${li + 1}" aria-hidden="true">${line.split(" ").map((w) =>
      `<span class="w">${[...w].map((c) => `<span class="ch" style="--i:${i++}">${esc(c)}</span>`).join("")}</span>`).join(" ")}</span>`).join("");
    const routeText = `${T.title}, ${T.totalKm.toLocaleString("en")} km, ${T.dates}`, el = $("#cover-route");
    if (calm) el.textContent = routeText;
    else {
      el.setAttribute("aria-label", routeText);
      let k = 0;
      setTimeout(function type() {
        el.innerHTML = `<span aria-hidden="true">${esc(routeText.slice(0, ++k))}<span class="caret"></span></span>`;
        if (k < routeText.length) setTimeout(type, 28 + Math.random() * 30);
      }, i * 32 + 700);
    }
  }

  /* ---------- the dance: two strands woven once, then moved by CSS (transform only) ---------- */
  {
    const strand = (phase, ampBase, turns) => {
      let d = "", N = 240;
      for (let i = 0; i <= N; i++) {
        const t = i / N, y = t * 3000;
        const amp = ampBase * (0.55 + 0.45 * Math.sin(t * Math.PI * 3 + phase));        // breathes in and out
        const x = 50 + amp * Math.sin(t * Math.PI * 2 * turns + phase) + 8 * Math.sin(t * 37 + phase);
        d += `${i ? "L" : "M"}${x.toFixed(2)},${y.toFixed(1)}`;
      }
      return d;
    };
    for (const [id, ph, amp, turns] of [["strand-gold", 0, 44, 7], ["strand-orchid", 2.1, 40, 8.5]]) {
      const el = document.getElementById(id);
      el.setAttribute("viewBox", "0 0 100 3000");
      el.innerHTML = `<path d="${strand(ph, amp, turns)}"/>`;
    }
  }

  /* ---------- nav ---------- */
  $("#daynav-list").innerHTML = T.days.map((d) =>
    `<li><a href="#${d.id}" data-day="${d.id}">${d.dow}<small>${d.day.split(" ")[0]}</small></a></li>`).join("");

  /* ---------- day spreads ---------- */
  const dayHTML = (d) => {
    const dr = d.drive;
    const sign = `<div class="sign-wrap">
      <div class="sign" role="group" aria-label="Drive for ${esc(d.dow)}">
        <div class="sign-inner">
          <p class="sign-title">The drive</p>
          <ol class="sign-legs">
            ${dr.legs.map(([dest, km, roads]) => `
              <li><span class="sign-dest">${esc(dest)}</span><span class="sign-km">${km} km</span>
                  <span class="sign-roads">via ${esc(roads.split(" · ").join(", "))}</span></li>`).join("")}
          </ol>
          <div class="sign-total">
            <div><b>${dr.km}</b><span>km today</span></div>
            <div><b>${hm(dr.carH)}</b><span>by car (OSRM)</span></div>
            <div><b>~${hm(dr.vanH)}</b><span>in the van</span></div>
          </div>
        </div>
      </div>
      ${dr.warn ? `<p class="plate">${dr.solo ? "Solo driver. " : ""}${esc(dr.warn)}</p>` : ""}
      <p class="plate" id="pass-${d.id}" hidden></p>
      <div class="links"><a class="btn" href="${gdir(d.nav)}" target="_blank" rel="noopener">${icon.pin} Today's drive in Google Maps</a></div></div>`;

    const sleep = d.sleep ? `
      <section class="sleep" aria-label="Where we sleep">
        <div class="p-sign" aria-hidden="true">☾</div>
        <div>
          <p class="sleep-label">Where we sleep</p>
          <h3>${esc(d.sleep.name)}</h3>
          <p class="sleep-price">${esc(d.sleep.price)}</p>
          <p>${esc(d.sleep.note)}</p>
          <div class="links">
            <a class="btn" href="${gmaps(d.sleep.lat, d.sleep.lon)}" target="_blank" rel="noopener">${icon.pin} Navigate</a>
            <a class="btn ghost" href="${esc(d.sleep.link)}" target="_blank" rel="noopener">${icon.out} Spot info</a>
          </div>
        </div>
      </section>` : `
      <section class="sleep" aria-label="Van return">
        <div class="p-sign" aria-hidden="true">✦</div>
        <div><p class="sleep-label">The last act</p><h3>No night: the van goes back</h3><p>${esc(T.returnDeadline)}</p></div>
      </section>`;

    const road = `
      <ol class="road" data-reveal>
        ${d.plan.map((s) => `
          <li data-m="${s.mood}">
            <span class="post">${esc(s.t)}</span>
            <p class="stop-what">${esc(s.what)}</p>
            ${(s.price || s.map || s.link) ? `<div class="stop-meta">
              ${s.price ? `<span class="price">${esc(s.price)}</span>` : ""}
              ${s.map ? `<a class="btn ghost" href="${gmaps(s.map[0], s.map[1])}" target="_blank" rel="noopener">${icon.pin} Map</a>` : ""}
              ${s.link ? `<a class="btn ghost" href="${esc(s.link)}" target="_blank" rel="noopener">${icon.out} ${s.price ? "Tickets & hours" : "Website"}</a>` : ""}
            </div>` : ""}
          </li>`).join("")}
      </ol>`;

    const gallery = d.gallery?.length ? `
      <section class="day-wide" aria-label="Photos">
        <div class="gallery">
          ${d.gallery.map((id) => `<figure>${pic(id, { sizes: "(min-width: 640px) 520px, 82vw" })}
            <figcaption>${esc(P[id]?.caption)}<p class="credit">${credit(id)}</p></figcaption></figure>`).join("")}
        </div>
      </section>` : "";

    const alt = d.id === "wed" ? `<section class="day-wide alt" data-m="${d.mood}" data-reveal id="alt-wed" aria-label="Altitude profile"></section>` : "";

    return `
      <section class="day" id="${d.id}" data-mood="${d.mood}" aria-labelledby="h-${d.id}">
        <header class="day-hero">
          ${pic(d.hero, { sizes: "(max-width: 700px) 130vw, 100vw" })}
          <div class="hero-text">
            <span class="shield" aria-label="Day ${Number(d.n)}"><small>Nº</small>${ROMAN[Number(d.n)]}</span>
            <p class="day-when">${d.dow} ${d.day}, ${esc(d.place)}</p>
            <h2 id="h-${d.id}"><span class="mask"><span>${esc(d.title)}</span></span></h2>
            <p class="day-lede">${esc(d.lede)}</p>
            <span class="mood-tag" data-m="${d.mood}"><b>${T.moods[d.mood].label}</b> ${T.moods[d.mood].note.toLowerCase()}</span>
          </div>
          <p class="credit hero-credit">${credit(d.hero)}</p>
        </header>
        <div class="day-body">
          <div class="day-side">${sign}${sleep}<p class="day-wx" id="wx-${d.id}">Sunset ${esc(d.sunset)}</p></div>
          <div class="day-main">${road}</div>
          ${alt}
          ${gallery}
        </div>
      </section>`;
  };
  $("#days").innerHTML = T.days.map(dayHTML).join("");

  // deep links (…#wed, #map): the browser jumps before the days exist, so jump again once they do
  if (location.hash.length > 1) {
    const go = () => document.getElementById(decodeURIComponent(location.hash.slice(1)))?.scrollIntoView({ block: "start" });
    requestAnimationFrame(go); document.fonts?.ready.then(go);
  }

  /* ---------- altitude profile (real DEM data, data/elev-wed.json) ---------- */
  fetch("data/elev-wed.json").then((r) => r.json()).then((pts) => {
    // draw at roughly real pixel width so 11–13px labels stay readable on a phone
    const W = Math.max(340, Math.min(1000, $("#alt-wed").clientWidth - 32)), H = W < 600 ? 220 : 260;
    const padT = 34, padB = 26, maxKm = pts.at(-1)[0], maxM = 1500;
    const x = (km) => (km / maxKm) * W, y = (m) => padT + (1 - m / maxM) * (H - padT - padB);
    const line = pts.map(([k, m], i) => `${i ? "L" : "M"}${x(k).toFixed(1)},${y(m).toFixed(1)}`).join("");
    // stop markers: cumulative leg km scaled to the profile length
    const legs = T.days.find((d) => d.id === "wed").drive.legs, scale = maxKm / legs.reduce((a, l) => a + l[1], 0);
    let acc = 0;
    const raw = [["Verona", 0], ...legs.map(([n, km]) => [n.replace("Garmisch-Partenkirchen", "Garmisch"), (acc += km) * scale])];
    // merge stops that would print on top of each other (Plansee + highline179 are 10 km apart)
    const marks = raw.reduce((out, m) => {
      const last = out.at(-1);
      if (last && x(m[1]) - x(last[1]) < 70) last[0] += " + " + m[0]; else out.push([...m]);
      return out;
    }, []);
    const top = pts.reduce((a, b) => (b[1] > a[1] ? b : a));
    const elevAt = (km) => pts.reduce((a, b) => (Math.abs(b[0] - km) < Math.abs(a[0] - km) ? b : a))[1];
    const svg = `
      <h3 class="section-h">Up, over, down: the Wednesday profile</h3>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Elevation along Wednesday's route: Verona ${pts[0][1]} m, Brenner ${top[1]} m, Ulm ${pts.at(-1)[1]} m">
        ${[500, 1000].map((m) => `<line class="grid" x1="0" x2="${W}" y1="${y(m)}" y2="${y(m)}"/><text class="lbl-s" x="0" y="${y(m) - 5}">${m.toLocaleString("en")} m</text>`).join("")}
        <defs><linearGradient id="altfill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D88FC4" stop-opacity=".45"/><stop offset="1" stop-color="#3B1456" stop-opacity="0"/></linearGradient></defs>
        <path class="area" d="${line}L${W},${H - padB}L0,${H - padB}Z"/>
        <path class="line" d="${line}" pathLength="1"/>
        <g>
          <circle class="pin" cx="${x(top[0])}" cy="${y(top[1])}" r="5"/>
          <text class="lbl" x="${x(top[0])}" y="${y(top[1]) - 12}" text-anchor="middle">Brenner ${top[1].toLocaleString("en")} m</text>
        </g>
        ${marks.map(([n, km], i) => {
          const anchor = i === 0 ? "start" : i === marks.length - 1 ? "end" : "middle";
          const dy = i % 2 ? 0 : 0;
          return `<line class="grid" x1="${x(km)}" x2="${x(km)}" y1="${y(elevAt(km))}" y2="${H - padB}"/>
            <text class="lbl-s" x="${x(km)}" y="${H - 6 + dy}" text-anchor="${anchor}">${esc(n)}</text>`;
        }).join("")}
      </svg>
      <p>Real terrain heights along our route (Copernicus DEM via Open-Meteo). The highest point is the Brenner, then down to Garmisch and back up to highline179.</p>`;
    $("#alt-wed").innerHTML = svg;
  }).catch(() => { $("#alt-wed")?.remove(); });

  /* ---------- JOURNEY: route drawn by scroll + odometer ---------- */
  // cumulative real km at the end of each day: [477, 1164, …, 2458]
  const dayEndKm = T.days.reduce((a, d) => (a.push((a.at(-1) || 0) + d.drive.km), a), []);
  const totalKm = dayEndKm.at(-1);
  const journey = { ready: false };

  fetch("data/route.geojson").then((r) => r.json()).then((geo) => {
    const ll = geo.geometry.coordinates, k = Math.cos((48.7 * Math.PI) / 180);
    const proj = ([lo, la]) => [lo * k, -la];               // simple equirectangular, fine at this scale
    const P0 = ll.map(proj), xs = P0.map((p) => p[0]), ys = P0.map((p) => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const W = 400, pad = 34, s = (W - pad * 2) / (maxX - minX), H = (maxY - minY) * s + pad * 2;
    const xy = (p) => { const [x, y] = proj(p); return [pad + (x - minX) * s, pad + (y - minY) * s]; };
    const pts = ll.map(xy);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum.at(-1);
    const fracAt = (lon, lat) => { const q = xy([lon, lat]); let b = 0, bd = 1e9;
      pts.forEach((p, i) => { const d = Math.hypot(p[0] - q[0], p[1] - q[1]); if (d < bd) { bd = d; b = i; } }); return cum[b] / L; };

    // stops on the map; `night` marks where a day ends
    const stops = [
      ["Delft", 4.3736, 52.0022, "end", 1], ["Frankfurt", 8.66258, 50.10665, "end"], ["Bolzano", 11.33744, 46.472, "start", 1],
      ["Venice", 12.25649, 45.4202, "start", 1], ["Verona", 10.97848, 45.43391, "end", 1], ["Garmisch", 11.117, 47.4825, "start"],
      ["Reutte", 10.7146, 47.4706, "end"], ["Ulm", 9.98639, 48.38453, "start", 1], ["Marburg", 8.7667, 50.8021, "start", 1]
    ].map(([name, lon, lat, side, night]) => ({ name, side, night, xy: xy([lon, lat]), f: fracAt(lon, lat) }));
    // day boundaries as fractions of the drawn line (Sat ends at Bad Vilbel ≈ Frankfurt)
    const dayEndF = [fracAt(8.747885, 50.189402), fracAt(11.33744, 46.472), fracAt(12.25649, 45.4202),
                     fracAt(10.97848, 45.43391), fracAt(9.98639, 48.38453), 1];
    const countries = [["Netherlands", 4.9, 51.55], ["Germany", 8.1, 48.9], ["Austria", 10.2, 47.1], ["Italy", 11.9, 45.95]];

    const d = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");
    const svg = $("#journey-map");
    svg.setAttribute("viewBox", `0 0 ${W} ${H.toFixed(0)}`);
    svg.innerHTML = `
      ${countries.map(([n, lo, la]) => { const [x, y] = xy([lo, la]); return `<text class="country" x="${x}" y="${y}" text-anchor="middle">${n}</text>`; }).join("")}
      <path class="ghost" d="${d}"/>
      <path class="route" id="jr" d="${d}" pathLength="1"/>
      ${stops.map((st, i) => `<g class="stop${st.night ? " night" : ""}" data-i="${i}">
          <circle cx="${st.xy[0]}" cy="${st.xy[1]}" r="${st.night ? 5.5 : 4}"/>
          <text x="${st.xy[0] + (st.side === "end" ? -10 : 10)}" y="${st.xy[1] + 4}" text-anchor="${st.side}">${st.name}</text></g>`).join("")}
      <g class="van" id="van" aria-hidden="true">
        <circle class="halo" r="11"/><circle class="core" r="5"/>
      </g>`;
    Object.assign(journey, { ready: true, path: $("#jr"), van: $("#van"), stops: [...svg.querySelectorAll(".stop")],
      stopF: stops.map((s) => s.f), dayEndF, len: $("#jr").getTotalLength() });
    onScroll();
  });

  const card = $("#journey-card");
  let cardDay = -1;
  function renderCard(i) {
    if (i === cardDay) return; cardDay = i;
    const d = T.days[i];
    card.innerHTML = `<span class="shield" aria-hidden="true"><small>Nº</small>${ROMAN[i + 1]}</span>
      <div><h3>${esc(d.title)}</h3><p>${d.dow} ${d.day}, ${esc(d.place)}</p></div>
      <div class="journey-km" aria-hidden="true"><b id="jkm">0</b><span>km</span></div>`;
  }

  /* one rAF-throttled scroll handler drives the map and the odometer */
  const odo = $("#odo"), jsec = $("#journey"), daySecs = [...document.querySelectorAll(".day")];
  let ticking = false, shownKm = -1;
  const clamp = (v) => Math.max(0, Math.min(1, v));
  function onScroll() {
    ticking = false;
    let km = 0, journeyKm = null;
    // 1. inside the journey section: progress p maps to the drawn line and to real km
    const r = jsec.getBoundingClientRect();
    const p = clamp(-r.top / (r.height - innerHeight));
    if (journey.ready) {
      journey.path.style.strokeDashoffset = calm ? 0 : 1 - p;
      const pt = journey.path.getPointAtLength((calm ? 1 : p) * journey.len);
      journey.van.setAttribute("transform", `translate(${pt.x.toFixed(1)} ${pt.y.toFixed(1)})`);
      journey.stops.forEach((g, i) => g.classList.toggle("on", calm || p >= journey.stopF[i] - 0.002));
      const di = Math.max(0, journey.dayEndF.findIndex((f) => p <= f + 1e-6));
      renderCard(di);
      const f0 = di ? journey.dayEndF[di - 1] : 0, k0 = di ? dayEndKm[di - 1] : 0;
      const jkm = Math.round(k0 + ((p - f0) / (journey.dayEndF[di] - f0)) * (dayEndKm[di] - k0));
      const jel = document.getElementById("jkm"); if (jel) jel.textContent = Math.max(0, jkm).toLocaleString("en");
      if (r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5) journeyKm = Math.max(0, jkm);
    }
    // 2. odometer: 0 on the cover, then the km of the day you are reading
    const mid = innerHeight * 0.5;
    const cur = daySecs.findIndex((s) => { const b = s.getBoundingClientRect(); return b.top <= mid && b.bottom > mid; });
    if (journeyKm !== null) km = journeyKm;
    else if (cur >= 0) {
      const b = daySecs[cur].getBoundingClientRect();
      const q = clamp((mid - b.top) / b.height);
      km = (cur ? dayEndKm[cur - 1] : 0) + q * T.days[cur].drive.km;
    } else if (daySecs[0].getBoundingClientRect().top > mid) km = 0;
    else km = totalKm;
    km = Math.round(km);
    if (km !== shownKm) { odo.textContent = km.toLocaleString("en"); shownKm = km; }
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  addEventListener("resize", onScroll);
  renderCard(0); onScroll();

  /* ---------- mood tint + active day in nav ---------- */
  const navLinks = [...document.querySelectorAll(".daynav a[data-day]")];
  const root = document.documentElement;
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const id = e.target.id;
      root.dataset.mood = e.target.dataset.mood;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.dataset.day === id)));
      const cur = navLinks.find((a) => a.dataset.day === id);
      cur?.scrollIntoView({ block: "nearest", inline: "center" });
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll(".day").forEach((s) => io.observe(s));

  /* ---------- fallback for browsers without scroll-driven animations ---------- */
  if (!CSS.supports("animation-timeline: view()")) {
    root.classList.add("no-sda");
    const rev = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); rev.unobserve(e.target); }
    }), { threshold: 0.25 });
    const watch = () => document.querySelectorAll("[data-reveal]").forEach((el) => rev.observe(el));
    watch(); setTimeout(watch, 600);  // altitude section is filled in after fetch
  }

  /* =====================================================================
     STAGE 5 — LIVE DATA (no API keys: Open-Meteo + E-Control)
     ===================================================================== */
  const store = {   // localStorage can throw (private mode): never let it break the page
    get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} }
  };
  const timeAgo = (t) => { const m = Math.round((Date.now() - t) / 60000); return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`; };

  /* ---------- weather: one request for all six stops + the Brenner pass ---------- */
  const WX = { sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    cloud: '<path d="M7 18h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 9.5 4.3 4.3 0 0 0 7 18Z"/>',
    fog: '<path d="M4 9h16M2 13h20M5 17h14"/>',
    rain: '<path d="M7 14h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14Z"/><path d="M8 17l-1 3M12 17l-1 3M16 17l-1 3"/>',
    snow: '<path d="M7 14h10a4 4 0 0 0 .4-8A6 6 0 0 0 6 5.5 4.3 4.3 0 0 0 7 14Z"/><path d="M8 18h.01M12 20h.01M16 18h.01M10 21.5h.01M14 21.5h.01"/>' };
  const wxKind = (c) => c === 0 || c === 1 ? ["sun", "Clear"] : c <= 3 ? ["cloud", "Cloudy"] : c <= 48 ? ["fog", "Fog"]
    : (c >= 71 && c <= 77) || c === 85 || c === 86 ? ["snow", "Snow"] : ["rain", c >= 95 ? "Thunder" : "Rain"];
  const wxIcon = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true">${WX[k]}</svg>`;

  function drawWeather(data, stamp, offline) {
    const days = T.days;
    const pick = (loc, date) => { const i = loc.daily.time.indexOf(date); return i < 0 ? null : {
      code: loc.daily.weather_code[i], max: Math.round(loc.daily.temperature_2m_max[i]), min: Math.round(loc.daily.temperature_2m_min[i]),
      rain: loc.daily.precipitation_probability_max[i], snow: loc.daily.snowfall_sum[i], sunset: loc.daily.sunset[i].slice(11) }; };
    const pass = data[days.length];
    $("#wx").innerHTML = days.map((d, i) => {
      const w = pick(data[i], d.date); if (!w) return "";
      const [k, label] = wxKind(w.code);
      const p = d.pass ? pick(pass, d.date) : null;
      const alert = p && (p.snow > 0 || p.min <= 0) ? `<span class="wx-alert">Brenner: ${p.snow > 0 ? `${p.snow} cm snow` : `${p.min}° at night`}. Chains on board.</span>` : "";
      // also write the forecast into the day's own spread
      const line = $(`#wx-${d.id}`);
      if (line) line.innerHTML = `<b>${esc(d.wx[0])}: ${label.toLowerCase()}, ${w.max}° / ${w.min}°</b>, rain ${w.rain}%${w.snow ? `, snow ${w.snow} cm` : ""}. Sunset ${w.sunset}.`;
      const plate = $(`#pass-${d.id}`);
      if (plate && alert) { plate.hidden = false; plate.textContent = `Brenner forecast: ${p.snow > 0 ? `${p.snow} cm of snow` : `${p.min} °C`}. Winter tyres are mandatory; keep chains on board.`; }
      return `<li><span class="wx-day">${d.dow} ${d.day}</span><span class="wx-place">${esc(d.wx[0])}</span>
        ${wxIcon(k)}<span class="wx-t">${w.max}°<span> / ${w.min}°</span></span>
        <span class="wx-meta">${label}, rain ${w.rain}%${w.snow ? `, snow ${w.snow} cm` : ""}<br>Sunset ${w.sunset}</span>${alert}</li>`;
    }).join("");
    $("#wx-status").textContent = `${offline ? "Offline: showing the forecast saved" : "Forecast for each night's stop, from Open-Meteo. Updated"} ${timeAgo(stamp)}.`;
  }
  {
    const locs = [...T.days.map((d) => d.wx), ["Brenner pass", 47.00, 11.51]];
    const url = "https://api.open-meteo.com/v1/forecast?latitude=" + locs.map((l) => l[1]).join(",") + "&longitude=" + locs.map((l) => l[2]).join(",")
      + "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,snowfall_sum,sunset&timezone=Europe%2FBerlin"
      + `&start_date=${T.days[0].date}&end_date=${T.days.at(-1).date}`;
    const cached = store.get("wx-v1");
    if (cached) drawWeather(cached.data, cached.t, false);
    fetch(url).then((r) => { if (!r.ok) throw r.status; return r.json(); })
      .then((data) => { store.set("wx-v1", { t: Date.now(), data }); drawWeather(data, Date.now(), false); })
      .catch(() => { if (cached) drawWeather(cached.data, cached.t, true); else $("#wx-status").textContent = "No connection: the forecast loads when you are back online."; });
  }

  /* ---------- diesel: E-Control (Austria) publishes the 5 cheapest per search ---------- */
  const FUEL_SPOTS = [["Kufstein", 47.58, 12.17], ["Innsbruck", 47.27, 11.40], ["Wipptal (Brenner)", 47.09, 11.46], ["Reutte", 47.49, 10.72]];
  const ecUrl = (lat, lon) => `https://api.e-control.at/sprit/1.0/search/gas-stations/by-address?latitude=${lat}&longitude=${lon}&fuelType=DIE&includeClosed=false`;
  let fuelList = [];
  function drawFuel(list, note = "") {
    $("#fuel").innerHTML = (note ? `<li><span class="fuel-note">${esc(note)}</span></li>` : "") + list.slice(0, 8).map((s) => `
      <li><span class="fuel-price">€${s.price.toFixed(3)}</span>
        <span><span class="fuel-name">${esc(s.name)}</span><br><span class="fuel-where">${esc(s.city)}${s.km != null ? `, ${s.km.toFixed(1)} km away` : ""}</span></span>
        <a class="btn ghost" href="${gmaps(s.lat, s.lon)}" target="_blank" rel="noopener" aria-label="Directions to ${esc(s.name)}">${icon.pin}</a></li>`).join("");
    if (window.__fuelLayer) window.__fuelLayer(list);
  }
  const parseEC = (arr, origin) => arr.filter((s) => s.prices?.length).map((s) => ({
    name: s.name, city: s.location.city, lat: s.location.latitude, lon: s.location.longitude, price: s.prices[0].amount,
    km: origin ? s.distance : null }));
  {
    const cached = store.get("fuel-v1");
    Promise.all(FUEL_SPOTS.map(([, la, lo]) => fetch(ecUrl(la, lo)).then((r) => r.json()).then((a) => parseEC(a)).catch(() => [])))
      .then((lists) => {
        const seen = new Set();
        fuelList = lists.flat().filter((s) => { const k = s.name + s.lat; if (seen.has(k)) return false; seen.add(k); return true; })
          .sort((a, b) => a.price - b.price);
        if (!fuelList.length) throw 0;
        store.set("fuel-v1", { t: Date.now(), list: fuelList });
        drawFuel(fuelList, `Live, ${new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}. Cheapest stations along our Austrian stretch.`);
      })
      .catch(() => cached ? drawFuel(cached.list, `Offline: prices from ${timeAgo(cached.t)}.`) : drawFuel([], "No connection: prices load when you are back online."));
  }
  $("#fuel-near").addEventListener("click", () => {
    if (!navigator.geolocation) return drawFuel(fuelList, "This browser can't share its location.");
    $("#fuel-near").textContent = "Finding you…";
    navigator.geolocation.getCurrentPosition((pos) => {
      const { latitude: la, longitude: lo } = pos.coords;
      fetch(ecUrl(la, lo)).then((r) => r.json()).then((a) => {
        const list = parseEC(a, true).sort((x, y) => x.price - y.price);
        const far = !list.length || Math.min(...list.map((s) => s.km)) > 40;
        drawFuel(list, far ? "You're probably outside Austria: these are the nearest Austrian stations. Use the German or Italian links below." : "Cheapest diesel near you right now.");
        $("#fuel-near").textContent = "Cheapest near me";
      }).catch(() => { $("#fuel-near").textContent = "Cheapest near me"; });
    }, () => { drawFuel(fuelList, "Location was blocked. Allow it in the browser to search near you."); $("#fuel-near").textContent = "Cheapest near me"; },
    { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
  });

  /* ---------- Leaflet map: loaded only when you scroll near it ---------- */
  $("#gmaps-all").href = gdir(T.gmapsRoute);
  function loadCSS(href) { return new Promise((ok) => { const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; l.onload = ok; document.head.append(l); }); }
  function loadJS(src) { return new Promise((ok, bad) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = bad; document.head.append(s); }); }
  let mapStarted = false;
  function startMap() {
    if (mapStarted) return; mapStarted = true;
    const base = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/";
    Promise.all([loadCSS(base + "leaflet.min.css"), loadJS(base + "leaflet.min.js"), fetch("data/route.geojson").then((r) => r.json())])
      .then(([, , geo]) => {
        const box = $("#leaflet"); box.innerHTML = "";
        const map = L.map(box, { scrollWheelZoom: false, tap: true });
        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · route: OSRM' }).addTo(map);
        const line = L.polyline(geo.geometry.coordinates.map(([lo, la]) => [la, lo]), { color: "#D8C08A", weight: 4, opacity: .95 }).addTo(map);
        map.fitBounds(line.getBounds(), { padding: [20, 20] });
        const moodColor = (m) => getComputedStyle(document.documentElement).getPropertyValue(`--${m}`).trim() || "#14232A";
        T.days.forEach((d) => {
          d.plan.filter((s) => s.map).forEach((s) => {
            L.circleMarker(s.map, { radius: 7, color: "#0E0A12", weight: 2, fillColor: moodColor(s.mood), fillOpacity: 1 }).addTo(map)
              .bindPopup(`<b>${esc(s.what)}</b><br>${d.dow} ${d.day}, ${esc(s.t)}<br><a href="${gmaps(s.map[0], s.map[1])}" target="_blank" rel="noopener">Directions</a>`);
          });
          if (d.sleep) L.marker([d.sleep.lat, d.sleep.lon], { icon: L.divIcon({ className: "", html: '<div class="moon-pin">☾</div>', iconSize: [26, 26] }) })
            .addTo(map).bindPopup(`<b>${esc(d.sleep.name)}</b><br>${d.dow} night, ${esc(d.sleep.price)}<br><a href="${gmaps(d.sleep.lat, d.sleep.lon)}" target="_blank" rel="noopener">Navigate</a>`);
        });
        const fuelLayer = L.layerGroup().addTo(map);
        window.__fuelLayer = (list) => { fuelLayer.clearLayers(); list.slice(0, 12).forEach((s) =>
          L.marker([s.lat, s.lon], { icon: L.divIcon({ className: "", html: `<div class="fuel-pin">€${s.price.toFixed(2)}</div>`, iconSize: [48, 20], iconAnchor: [24, 10] }) })
            .addTo(fuelLayer).bindPopup(`<b>${esc(s.name)}</b><br>Diesel €${s.price.toFixed(3)}<br><a href="${gmaps(s.lat, s.lon)}" target="_blank" rel="noopener">Directions</a>`)); };
        if (fuelList.length) window.__fuelLayer(fuelList);
        let me;
        $("#locate").addEventListener("click", () => map.locate({ setView: true, maxZoom: 13 }));
        map.on("locationfound", (e) => { me?.remove(); me = L.marker(e.latlng, { icon: L.divIcon({ className: "", html: '<div class="me-pin"></div>', iconSize: [16, 16] }) }).addTo(map); });
        map.on("locationerror", () => { $("#locate").textContent = "Location blocked"; });
      })
      .catch(() => { $("#leaflet").innerHTML = '<p class="map-wait">The map needs a connection. Use the Google Maps button below.</p>'; });
  }
  new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { startMap(); o.disconnect(); } }, { rootMargin: "800px 0px" })
    .observe($("#leaflet"));

  /* =====================================================================
     STAGE 6 — BUDGET, CHECKLISTS, RULES, EMERGENCY
     ===================================================================== */
  {
    const B = T.budget, eur = (n) => `€${n.toLocaleString("en", { maximumFractionDigits: n % 1 ? 2 : 0, minimumFractionDigits: n % 1 ? 2 : 0 })}`;
    const srcLink = (u) => u.startsWith("http") ? ` <a href="${esc(u)}" target="_blank" rel="noopener">source</a>` : "";
    const sharedSum = B.shared.reduce((a, r) => a + r.eur, 0);
    function drawBudget() {
      const withOpt = store.get("budget-opt") !== false;   // optional items included by default
      const pp = B.perPerson.filter((r) => withOpt || !/optional/i.test(r.item));
      const ppSum = pp.reduce((a, r) => a + r.eur, 0), each = Math.round(sharedSum / 2 + ppSum);
      $("#budget-box").innerHTML = `
        <div class="budget-total">
          <b>${eur(each)}</b><span>each, about ${eur(each * 2)} for both of you</span>
          <p>Shared costs ${eur(Math.round(sharedSum))} split in two, plus ${eur(ppSum)} of tickets each. ${esc(B.note)}</p>
          <label class="budget-toggle"><input type="checkbox" id="opt" ${withOpt ? "checked" : ""}> Include the Doge's Palace (€35 each)</label>
        </div>
        <div>
          <table class="btable">
            <caption>Shared: van costs</caption>
            <thead><tr><th scope="col">What</th><th scope="col" class="eur">Total</th></tr></thead>
            <tbody>
              ${B.shared.map((r) => `<tr><td>${esc(r.item)}${srcLink(r.src)}</td><td class="eur">${eur(r.eur)}</td></tr>`).join("")}
              <tr class="sub"><td>Shared total, ${eur(Math.round(sharedSum / 2))} each</td><td class="eur">${eur(Math.round(sharedSum))}</td></tr>
            </tbody>
          </table>
          <table class="btable" style="margin-top:16px">
            <caption>Tickets: per person</caption>
            <thead><tr><th scope="col">What</th><th scope="col" class="eur">Each</th></tr></thead>
            <tbody>
              ${pp.map((r) => `<tr><td>${esc(r.item)}${srcLink(r.src)}</td><td class="eur">${eur(r.eur)}</td></tr>`).join("")}
              <tr class="sub"><td>Tickets total</td><td class="eur">${eur(ppSum)}</td></tr>
            </tbody>
          </table>
        </div>`;
      $("#opt").addEventListener("change", (e) => { store.set("budget-opt", e.target.checked); drawBudget(); $("#opt").focus(); });
    }
    drawBudget();

    // checklists: ticks saved per phone (localStorage); the stamp plays only on your own tap
    const ticks = store.get("ticks-v1") || {};
    const listHTML = (key, items) => items.map((t, i) => { const id = `${key}-${i}`;
      return `<li><label><input type="checkbox" data-id="${id}" ${ticks[id] ? "checked" : ""}><span class="txt">${esc(t)}</span><span class="stamp" aria-hidden="true">OK</span></label></li>`; }).join("");
    $("#docs").innerHTML = listHTML("doc", T.documents);
    $("#pack").innerHTML = listHTML("pack", T.pack);
    $("#lists").addEventListener("change", (e) => {
      const id = e.target.dataset?.id; if (!id) return;
      ticks[id] = e.target.checked; store.set("ticks-v1", ticks);
      const lab = e.target.closest("label"); lab.classList.remove("just");
      if (e.target.checked) { void lab.offsetWidth; lab.classList.add("just"); }
    });
    $("#reset-lists").addEventListener("click", () => {
      document.querySelectorAll("#lists input[data-id]").forEach((c) => (c.checked = false));
      Object.keys(ticks).forEach((k) => delete ticks[k]); store.set("ticks-v1", ticks);
    });

    $("#rules").innerHTML = T.rules.map((r) => `<article class="rule"><h4>${esc(r.title)}</h4><p>${esc(r.text)}</p>
      ${r.link ? `<a href="${esc(r.link)}" target="_blank" rel="noopener">${esc(r.linkText)}</a>` : ""}</article>`).join("");

    $("#sos-list").innerHTML = T.emergency.map((e) => `<li class="${e.big ? "big" : ""}"><a href="tel:${e.num.replace(/\s/g, "")}">
      <span class="what">${esc(e.what)}</span><span class="where">${esc(e.where)}</span><span class="num">${esc(e.num)}</span></a></li>`).join("");
  }

  /* offline support (see sw.js) */
  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    // when a new version takes over, reload once so nobody is stuck on an old design
    const hadController = !!navigator.serviceWorker.controller;
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => { if (hadController && !reloaded) { reloaded = true; location.reload(); } });
    navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then((r) => r.update()).catch(() => {});
  }
})();
