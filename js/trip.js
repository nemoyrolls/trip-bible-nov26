/* ============================================================
   TRIP DATA — the single source of truth for the whole site.
   Every page section renders from this object. Change a fact
   here and it updates everywhere. Each fact carries `src`.
   Drive figures: OSRM car times (tools/route.py). A camper is
   ~10–15% slower, so `vanH` = car h × 1.12, rounded.
   ============================================================ */
window.TRIP = {
  title: "Delft → Marburg",
  subtitle: "Six days, two drivers, one van: lagoon, Alps and a bridge in the dark.",
  dates: "14–19 Nov 2026",
  totalKm: 2458,   // sum of the rounded daily legs, so every number on the page agrees
  totalCarH: 26.8,
  returnDeadline: "Thursday 19 Nov, 13:00, in Marburg",

  moods: {
    awe:     { label: "Awe",     note: "History, scale, beauty" },
    shock:   { label: "Shock",   note: "Heights, cold, adrenaline" },
    calm:    { label: "Calm",    note: "Slow, quiet, recover" },
    vibrant: { label: "Vibrant", note: "Markets, bars, food" }
  },

  /* ---------- FLAGS: things that could break the plan ---------- */
  flags: [
    { level: "red", title: "Partnachklamm is closed until 12:00 Wed 18 Nov",
      text: "Helicopter transport flights for the new bridge. We arrive ~12:15, which fits. If the closure is extended, go to Ehrenberg castle ruins next to highline179 instead.",
      src: "https://www.partnachklamm.de/en/Tours" },
    { level: "red", title: "Winter tyres are mandatory on the A22 from 15 Nov",
      text: "We cross the Brenner on Sun 15 Nov, the first day of the A22/South Tyrol winter obligation (fines €87–345). Check the van has M+S/3PMSF tyres or chains on board.",
      src: "https://loudavymkrokem.cz/en/winter-driving-mountains-equipment/" },
    { level: "amber", title: "Saturday solo drive: 4.9 h, over the 4.5 h limit",
      text: "Take a 30-min break near Montabaur (A3), about halfway. Your friend waits inside the Hbf concourse; meet by message.",
      src: "https://map.project-osrm.org/" },
    { level: "amber", title: "Venice: last boat back is ~18:30 (winter)",
      text: "Fusina → Zattere hourly 08:00–18:00; last return from Zattere about 18:30. Miss it and it's a long taxi. So the night out is in Verona on Tuesday.",
      src: "https://mobile.terminalfusina.it/sites/default/files/linee/linea_blu_it.pdf" },
    { level: "amber", title: "Brenner: Lueg bridge is often one lane each way",
      text: "Expect queues on the A13 south of Innsbruck. Check live travel time before leaving Sunday and Wednesday.",
      src: "https://www.oeamtc.at/news/tirol/a13-verkehrsbeschraenkungen-luegbruecke-18778740" },
    { level: "amber", title: "Van weight unknown",
      text: "Check registration field F.2. Up to 3.5 t: a vignette is enough. Over 3.5 t: GO-Box toll instead, chains mandatory, lower speed limits.",
      src: "https://www.austria.info/en-gb/planning/toll-vignette-and-go-box" },
    { level: "info", title: "Thursday buffer: about 1 h",
      text: "Ulm → Marburg is 3.75 h by car (~4.2 h in the van). Leave by 07:45. Empty the toilet and grey water at Donaubad before leaving.",
      src: "https://map.project-osrm.org/" }
  ],

  /* ---------- DAYS ---------- */
  days: [
    {
      id: "sat", nav: [[52.0022,4.3736],[50.10665,8.66258],[50.189402,8.747885]], wx: ["Frankfurt",50.11,8.68], hero: "sat-hero", gallery: ["sat-frankfurt"], n: "01", date: "2026-11-14", dow: "Sat", day: "14 Nov",
      title: "Night Run", place: "Delft → Frankfurt", mood: "calm",
      lede: "A solo drive into the dark, with one coffee stop and one pickup at midnight.",
      drive: { km: 477, carH: 5.25, vanH: 5.9, legs: [["Frankfurt Hbf", 462, "A12 · A3"], ["Bad Vilbel", 15, "A66"]], solo: true,
               warn: "Over the 4.5 h solo limit: take the break." },
      plan: [
        { t: "19:00", what: "Leave TU Delft campus", mood: "calm" },
        { t: "21:30", what: "30-min break: Raststätte on the A3 near Montabaur", mood: "calm" },
        { t: "~00:15", what: "Pickup at Frankfurt Hbf: friend waits inside, meet by message", mood: "vibrant",
          map: [50.10665, 8.66258] },
        { t: "~00:45", what: "Park and sleep: Bad Vilbel Festplatz (free)", mood: "calm" }
      ],
      sleep: { name: "Stellplatz Bad Vilbel – Am Festplatz", price: "free", lat: 50.189402, lon: 8.747885,
               note: "Open all year, no reception, so a late arrival is fine. No services.",
               link: "https://stellplatz.info/en/rv-park/stellplatz-bad-vilbel-am-festplatz" },
      sunset: "16:42 (Frankfurt)"
    },
    {
      id: "sun", nav: [[50.189402,8.747885],[47.58,12.17],[46.472,11.33744]], wx: ["Bolzano",46.5,11.35], pass: ["Brenner pass",47,11.51], hero: "sun-hero", gallery: ["sun-otzi","sun-otzi2","sun-bolzano","sun-walther","sun-brenner2"], n: "02", date: "2026-11-15", dow: "Sun", day: "15 Nov",
      title: "Over the Brenner", place: "Frankfurt → Bolzano", mood: "awe",
      lede: "The long one. Swap drivers every two hours, climb the Brenner, and meet a 5,300-year-old murder victim.",
      drive: { km: 687, carH: 7.19, vanH: 8.1, legs: [["Innsbruck", 565, "A3 · A9 · A8 · A93 · A12"], ["Brenner pass", 37, "A13"], ["Bolzano", 85, "A22"]],
               warn: "Longest day. Swap every ~2 h. Fill up in Austria (cheapest diesel)." },
      plan: [
        { t: "07:30", what: "Leave Bad Vilbel. Buy the Austrian 10-day vignette online before the border", mood: "calm" },
        { t: "~12:30", what: "Fuel at Kufstein, the first exit in Austria: diesel ~€2.05 vs ~€2.28 in Germany. Lunch.", mood: "calm" },
        { t: "~14:00", what: "Brenner Pass: the A13 Europabrücke, 190 m above the Sill valley", mood: "shock" },
        { t: "~16:00", what: "Ötzi: South Tyrol Museum of Archaeology (last entry 17:30)", mood: "awe",
          price: "€13", link: "https://www.iceman.it/en/", map: [46.49979, 11.34955] },
        { t: "18:00", what: "Evening in the old town: Waltherplatz, the Lauben arcades, a Tyrolean dinner", mood: "vibrant",
          map: [46.4983, 11.3548] }
      ],
      sleep: { name: "Area sosta camper, Via Maso della Pieve", price: "€25 / 12 h", lat: 46.47200, lon: 11.33744,
               note: "19 spaces, opened July 2026, max 72 h. Backup: Via Resia (~€21.60).",
               link: "https://openvan.camp/en/news/opening/apre-larea-sosta-camper-via-maso-della-pieve-si" },
      sunset: "16:41"
    },
    {
      id: "mon", nav: [[46.472,11.33744],[45.4202,12.25649]], wx: ["Venice",45.44,12.33], hero: "mon-hero", gallery: ["mon-fog","mon-boat","mon-sanmarco","mon-doge","mon-sighs"], n: "03", date: "2026-11-16", dow: "Mon", day: "16 Nov",
      title: "La Serenissima", place: "Bolzano → Venice", mood: "awe",
      lede: "Arrive by water like everyone did for a thousand years. November Venice: fog, empty alleys, golden mosaics.",
      drive: { km: 264, carH: 2.84, vanH: 3.2, legs: [["Venezia Fusina", 264, "A22 · A4"]] },
      plan: [
        { t: "07:00", what: "Leave Bolzano", mood: "calm" },
        { t: "10:15", what: "Check in at Camping Fusina", mood: "calm" },
        { t: "11:00", what: "Boat Fusina → Zattere (25 min, €13 return)", mood: "awe",
          price: "€13 return", link: "https://www.terminalfusina.it/de/navigation/lines", map: [45.42902, 12.32733] },
        { t: "11:30", what: "Walk Dorsoduro → Accademia bridge → San Marco", mood: "awe" },
        { t: "13:00", what: "Doge's Palace + prisons + Bridge of Sighs (last entry 17:00)", mood: "awe",
          price: "€35 combined ticket", link: "https://palazzoducale.visitmuve.it/en/visitor-information/", map: [45.4337, 12.3404] },
        { t: "16:39", what: "Sunset from Riva degli Schiavoni, gondolas against San Giorgio", mood: "calm" },
        { t: "17:00", what: "Get lost on purpose: back alleys to the Zattere, cicchetti on the way", mood: "vibrant" },
        { t: "18:30", what: "Last boat back: Zattere → Fusina", mood: "shock" }
      ],
      sleep: { name: "Camping Fusina", price: "~€35–39", lat: 45.42020, lon: 12.25649,
               note: "Open all year. Avoid Tronchetto parking (theft reports).",
               link: "https://www.campercontact.com/en/italy/veneto/venice/21520/camping-fusina" },
      sunset: "16:39"
    },
    {
      id: "tue", nav: [[45.4202,12.25649],[45.43391,10.97848]], wx: ["Verona",45.44,10.99], hero: "tue-hero", gallery: ["tue-market","tue-pescheria","tue-rialto","tue-arena","tue-ponte","tue-view","tue-erbe"], n: "04", date: "2026-11-17", dow: "Tue", day: "17 Nov",
      title: "Market & Arena", place: "Venice → Verona", mood: "vibrant",
      lede: "Fish market at dawn, a Roman arena at dusk, and finally a night out with no ferry to catch.",
      drive: { km: 119, carH: 1.41, vanH: 1.6, legs: [["Verona", 119, "A4"]] },
      plan: [
        { t: "08:00", what: "First boat to Zattere", mood: "calm" },
        { t: "08:45", what: "Rialto market: fish hall + produce stalls (mornings, Tue–Sat)", mood: "vibrant",
          map: [45.43963, 12.33452] },
        { t: "10:00", what: "Cicchetti + coffee in a bacaro; Rialto bridge", mood: "vibrant" },
        { t: "12:30", what: "Boat back to Fusina, check out", mood: "calm" },
        { t: "15:00", what: "Park at Porta Palio, walk 20 min to Piazza Bra", mood: "calm" },
        { t: "15:30", what: "Arena di Verona: a 1st-century amphitheatre, climb the top tiers", mood: "awe",
          price: "€12", link: "https://www.arena.it/en/arena-di-verona/where-we-are", map: [45.4390, 10.9944] },
        { t: "16:44", what: "Sunset: Ponte Pietra → the steps up to Castel San Pietro (free viewpoint)", mood: "awe",
          map: [45.4475, 11.0003] },
        { t: "18:30", what: "Night out: spritz in Piazza delle Erbe, then the osterias of Via Sottoriva", mood: "vibrant",
          map: [45.44305, 10.99717] }
      ],
      sleep: { name: "Area Comunale Porta Palio (AMT)", price: "€10 / 24 h", lat: 45.43391, lon: 10.97848,
               note: "Fenced, lit, run by the city. Some theft reports: keep valuables out of sight.",
               link: "https://www.campercontact.com/en/md/6076" },
      sunset: "16:44"
    },
    {
      id: "wed", nav: [[45.43391,10.97848],[47.4825,11.117],[47.47432,10.81288],[47.4706,10.7146],[48.38453,9.98639]], wx: ["Reutte",47.47,10.72], pass: ["Brenner pass",47,11.51], hero: "wed-hero", gallery: ["wed-gorge","wed-gorge2","wed-plansee","wed-plansee2","wed-highline2","wed-ehrenberg"], n: "05", date: "2026-11-18", dow: "Wed", day: "18 Nov",
      title: "Gorge, Ice, Void", place: "Verona → Alps → Ulm", mood: "shock",
      lede: "Walk inside a mountain, swim in a 7 °C lake, and cross a 406 m bridge 114 m up as the light goes.",
      drive: { km: 517, carH: 6.4, vanH: 7.2, legs: [["Garmisch-Partenkirchen", 319, "A22 · A13 · A12 · B177"], ["Plansee", 45, "St2060 · L255"], ["highline179", 10, "B179"], ["Ulm", 143, "A7"]],
               warn: "Second-longest day: swap drivers at Garmisch." },
      plan: [
        { t: "07:30", what: "Leave Verona (Brenner, Innsbruck, Seefeld, Mittenwald)", mood: "calm" },
        { t: "12:00", what: "Park at the Olympic ski stadium; 25-min walk to the gorge", mood: "calm", map: [47.4825, 11.1170] },
        { t: "12:30", what: "Partnachklamm: 700 m of tunnels and galleries above roaring water (reopens 12:00 today)", mood: "shock",
          price: "€10", link: "https://www.gapa-tourismus.de/partnachklamm/en/Hours%20-%20Fees", map: [47.46464, 11.12212] },
        { t: "15:00", what: "Cold plunge in Plansee: 2 minutes in a lake of about 6–8 °C", mood: "shock", map: [47.47432, 10.81288] },
        { t: "15:50", what: "highline179: 406 m long, 114 m high, walk it at sunset 16:38", mood: "shock",
          price: "€10", link: "https://www.highline179.tirol/en/price", map: [47.46413, 10.71927] },
        { t: "16:50", what: "Ehrenberg castle ruins at blue hour (right next to it)", mood: "awe", map: [47.46537, 10.71762] },
        { t: "17:30", what: "Drive to Ulm, dinner in the Fischerviertel", mood: "calm" }
      ],
      sleep: { name: "Wohnmobil-Stellplatz am Donaubad (Neu-Ulm)", price: "€16", lat: 48.38453, lon: 9.98639,
               note: "Open all year; water, power (extra), toilet disposal.",
               link: "https://www.campercontact.com/en/md/92982" },
      sunset: "16:38 (Reutte)"
    },
    {
      id: "thu", nav: [[48.38453,9.98639],[50.8021,8.7667]], wx: ["Marburg",50.8,8.77], hero: "thu-hero", gallery: ["thu-fischer"], n: "06", date: "2026-11-19", dow: "Thu", day: "19 Nov",
      title: "Homeward", place: "Ulm → Marburg", mood: "calm",
      lede: "Dawn under the world's tallest church spire, then one clean run north. Hand the keys back on time.",
      drive: { km: 394, carH: 3.75, vanH: 4.2, legs: [["Marburg", 394, "A7 · A3 · A45"]], warn: "Hard return at 13:00. Leave by 07:45." },
      plan: [
        { t: "07:00", what: "Empty toilet + grey water, fill fresh water at Donaubad", mood: "calm" },
        { t: "07:15", what: "Ulm Minster at sunrise: the 161.5 m spire (exterior)", mood: "awe",
          link: "https://www.ulmer-muenster.de/", map: [48.39851, 9.992502] },
        { t: "07:45", what: "Drive north", mood: "calm" },
        { t: "~11:45", what: "Refuel near Marburg (rental return level), quick clean", mood: "calm" },
        { t: "13:00", what: "Return the van in Marburg", mood: "shock" }
      ],
      sleep: null,
      sunset: "16:33"
    }
  ],

  /* ---------- BUDGET (EUR) ---------- */
  budget: {
    shared: [
      { item: "Diesel: 2,458 km × ~11 L/100 km × ~€2.22", eur: 600,
        src: "https://www.fuel-prices.eu/news/weekly/europe-fuel-prices-week-2026-11-02/" },
      { item: "Austria 10-day digital vignette", eur: 12.8, src: "https://www.austria.info/en-gb/planning/toll-vignette-and-go-box" },
      { item: "Brenner A13 section toll ×2", eur: 25, src: "https://www.fuel-prices.eu/tolls/austria/brenner-pass-a13/" },
      { item: "Italy: Brenner→Bolzano (~6, est.) + Bolzano→Venice 20.20 + Venice→Verona 9.00 + Verona→Brenner (~16, est.)", eur: 51.2,
        src: "https://calcolopercorso.it/it/distanza/Bolzano/Venezia" },
      { item: "Overnight spots: 0 + 25 + 37 + 10 + 16", eur: 88, src: "#sleep" }
    ],
    perPerson: [
      { item: "Fusina ⇄ Zattere boat ×2 days", eur: 26, src: "https://www.terminalfusina.it/de/navigation/lines" },
      { item: "Doge's Palace (optional)", eur: 35, src: "https://www.finestresullarte.info/en/museums/venice-museum-tickets-rise-doge-s-palace-becomes-a-35-euro-bloodletting" },
      { item: "Ötzi museum", eur: 13, src: "https://www.iceman.it/en/faqs" },
      { item: "Arena di Verona", eur: 12, src: "https://www.italy-museum.com/it/verona/arena-verona" },
      { item: "Partnachklamm", eur: 10, src: "https://www.gapa-tourismus.de/partnachklamm/en/Hours%20-%20Fees" },
      { item: "highline179", eur: 10, src: "https://www.highline179.tirol/en/price" }
    ],
    note: "Excludes the van rental and food. Fuel is the big variable: fill up in Austria."
  },

  /* ---------- RULES & DOCUMENTS (checkboxes) ---------- */
  documents: [
    "Driving licences (both drivers listed on the rental)",
    "Passports / ID cards",
    "Rental contract + registration (Zulassungsbescheinigung Teil I)",
    "Check registration field F.2: van max 3.5 t?",
    "Austrian 10-day digital vignette (buy online before Sunday)",
    "Cash + card for Italian toll booths (take a ticket at entry, pay at exit)",
    "Winter tyres (M+S / 3PMSF) or chains on board: A22 rule from 15 Nov",
    "Warning triangle, hi-vis vests for everyone, first-aid kit (needed in AT and IT)",
    "European Health Insurance Card (EHIC)",
    "Rental's breakdown number saved offline"
  ],

  pack: [
    "Swimsuit + microfibre towel (Plansee plunge)", "Flip-flops / water shoes", "Warm hat + gloves",
    "Thermal base layer", "Waterproof jacket", "Head torch (highline179 at dusk)",
    "Good walking shoes (gorge is wet + icy)", "Power bank + 12 V car charger",
    "Offline maps downloaded (Google Maps)", "Toilet chemicals + toilet paper",
    "Gas: check bottle level for the heater", "Cutlery, mugs, a moka pot",
    "Earplugs (Verona spot can be noisy)", "Reusable bags for the Rialto market", "Small padlock / hide valuables"
  ],

  emergency: [
    { what: "Emergency: police, fire, ambulance", where: "Everywhere in the EU", num: "112", big: true },
    { what: "Police", where: "Germany", num: "110" },
    { what: "Police", where: "Austria", num: "133" },
    { what: "Police (Carabinieri)", where: "Italy", num: "112" },
    { what: "Mountain rescue", where: "Austria", num: "140" },
    { what: "Breakdown: ÖAMTC", where: "Austria", num: "120" },
    { what: "Breakdown: ACI", where: "Italy, from a foreign mobile", num: "+39 02 66165116" },
    { what: "Breakdown: ADAC", where: "Germany", num: "+49 89 20 20 4000" }
  ],

  rules: [
    { title: "Austrian vignette", text: "Digital 10-day vignette, €12.80. Bought online it's valid immediately. It's tied to the number plate, so there's no sticker.",
      link: "https://shop.asfinag.at/en/", linkText: "ASFINAG shop" },
    { title: "Brenner motorway toll (A13)", text: "€12.50 each way, paid at the Schönberg toll plaza, or bought online in advance to use the faster digital lane.",
      link: "https://www.asfinag.at/en/toll/section-toll/", linkText: "Section tolls" },
    { title: "Italian motorways", text: "Take a ticket at the entry booth and pay at the exit by card or cash. Avoid the yellow Telepass-only lanes.",
      link: "https://www.autobrennero.it/en/", linkText: "Autobrennero" },
    { title: "Speed limits (van up to 3.5 t)", text: "Germany: 130 km/h advised on motorways. Austria: 130, but often 100 around Innsbruck (air-quality signs). Italy: 130, or 110 in rain.",
      link: "https://www.austria.info/en-gb/planning/toll-vignette-and-go-box", linkText: "Austria info" },
    { title: "Winter equipment", text: "Austria: winter tyres whenever there's snow or ice (1 Nov–15 Apr). A22 and South Tyrol: mandatory from 15 Nov. Carry chains.",
      link: "https://www.bmimi.gv.at/en/topics/transport/roads/safety/tyres.html", linkText: "Austrian ministry" },
    { title: "If you stop on the motorway", text: "In Austria and Italy, put on the hi-vis vest before stepping out, then set up the warning triangle.",
      link: "", linkText: "" }
  ],

  /* Stops for the "open whole route in Google Maps" button (≤ 9 waypoints on mobile). */
  gmapsRoute: [
    [52.0022, 4.3736], [50.10665, 8.66258], [46.47200, 11.33744], [45.42020, 12.25649],
    [45.43391, 10.97848], [47.4825, 11.1170], [47.47432, 10.81288], [47.46413, 10.71927],
    [48.38453, 9.98639], [50.8021, 8.7667]
  ]
};
