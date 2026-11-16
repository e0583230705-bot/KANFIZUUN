(function () {
  "use strict";
  var WA = "https://wa.me/972553181059";
  function waLink(text) { return WA + "?text=" + encodeURIComponent(text); }
  function $(id) { return document.getElementById(id); }

  /* =========================================================
     SETTINGS — edit here
     ========================================================= */

  /* Upcoming trips table. If TRIPS_CSV is set (a Google Sheet published
     as CSV), the site reads trips from there; otherwise this list is used.
     Columns: dest, heb, date (YYYY-MM-DD), price, seats, note           */
  var TRIPS_CSV = "https://docs.google.com/spreadsheets/d/159Dz2Gfa0_xajgjnGyM_d9-QufYQnsEPRklJt5MnXas/gviz/tq?tqx=out:csv";
  var TRIPS = [
    { dest: "uman_chanukah_w", heb: "כ״ו–ל׳ כסלו תשפ״ז", date: "2026-12-06", price: "", seats: "",
      note: "מ-6/12 עד 10/12 · מלון מפואר · אוכל גורמה · נסיעות VIP · טיסות אל על · הנחה משמעותית לנרשמות יחד", flyer: "/images/flyer-chanukah-women.jpg" },
    { dest: "uman_shabbat_chanukah", heb: "שבת חנוכה תשפ״ז", date: "2026-12-07", price: "טיסות לקישינב החל מ-320$ לכיוון · הלוך ושוב באמצע חנוכה במבצע 690$", seats: "",
      note: "טיסות הלוך בין 7/12 ל-10/12 · חזור בין 13/12 ל-15/12", flyer: "/images/flyer-shabbat-chanukah.jpg" },
    { dest: "lizhensk", heb: "כ״א אדר ב׳ תשפ״ז", date: "2027-03-30", price: "", seats: "", note: "" },
    { dest: "kerestir", heb: "ג׳ אייר תשפ״ז", date: "2027-05-10", price: "", seats: "", note: "" },
    { dest: "uman", heb: "ראש השנה תשפ״ח", date: "2027-10-02", price: "", seats: "", note: "" },
    { dest: "pressburg", heb: "כ״ה תשרי תשפ״ח", date: "2027-10-26", price: "", seats: "", note: "" }
  ];

  /* Numbers strip — stays hidden until real numbers are filled in.
     Example: { n: 1200, plus: true, label: "נוסעים מרוצים" }          */
  var STATS = [];

  /* ========================================================= */

  var DEST = {
    lizhensk: { name: "רבי אלימלך מליז'ענסק", place: "ליז'ענסק, פולין", when: "הילולא כ״א אדר",
      desc: "עליה לציון בעל ה'נועם אלימלך' בליז'ענסק, עם תפילות מרוממות ואווירה מיוחדת." },
    kerestir: { name: "רבי ישעיה מקערסטיר", place: "קערסטיר, הונגריה", when: "הילולא ג׳ אייר",
      desc: "נסיעה מאורגנת לציון \"רבי שייעלע\", שידוע כפועל ישועות לכל הפונים אליו." },
    pressburg: { name: "רבינו החתם סופר", place: "פרשבורג, ברטיסלבה", when: "הילולא כ״ה תשרי",
      desc: "נסיעה לציון גדול הדור, ראש ישיבת פרשבורג, בליווי סיפורים והתרוממות רוח." },
    uman_chanukah_w: { name: "חנוכה באומן לנשים ונערות", place: "אומן, אוקראינה", when: "חנוכה", base: "uman", page: "/uman",
      desc: "להאיר את הנשמה — חנוכה באומן לנשים ונערות: מלון מפואר, אוכל גורמה, אווירה שמורה, נסיעות VIP וטיסות אל על. לפרטים: 058-3240685." },
    uman_shabbat_chanukah: { name: "שבת חנוכה באומן", place: "אומן, אוקראינה · טיסות לקישינב", when: "שבת חנוכה", base: "uman", page: "/uman",
      desc: "טיסות לשבת חנוכה באומן, דרך קישינב — מגוון מועדים וחברות תעופה, החל מ-320$ לכיוון." },
    uman: { name: "אומן ראש השנה", place: "אומן, אוקראינה", when: "ראש השנה",
      desc: "מגוון טיסות ומסלולים לציון רבי נחמן מברסלב באומן לראש השנה." }
  };
  var MONTHS = ["ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני", "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"];
  var today = new Date(); today.setHours(0, 0, 0, 0);
  function esc(t) { return String(t == null ? "" : t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function daysTo(d) { return Math.round((d - today) / 86400000); }
  function tripLabel(t) { return DEST[t.dest].name + " — " + t.heb; }

  /* ---------- Map + tabs ---------- */
  var panel = $("dest-panel");
  var tabs = document.querySelectorAll(".dest-tab");
  var pins = document.querySelectorAll(".pin");
  var routes = document.querySelectorAll(".route");
  function select(key) {
    var d = DEST[key]; if (!d || !panel) return;
    tabs.forEach(function (t) { t.setAttribute("aria-selected", t.dataset.dest === key ? "true" : "false"); });
    pins.forEach(function (p) { p.classList.toggle("on", p.dataset.dest === key); });
    routes.forEach(function (r) { r.classList.toggle("on", r.dataset.dest === key); });
    panel.innerHTML = '<h3>' + d.name + '</h3><p class="meta">' + d.place + '</p><span class="when">' + d.when + '</span>' +
      '<p class="desc">' + d.desc + '</p>' +
      '<button type="button" class="btn btn-gold" data-register="' + key + '">להרשמה לנסיעה</button>' +
      '<a class="more" href="/' + key + '">כל הפרטים על היעד ←</a>';
    panel.classList.remove("swap"); void panel.offsetWidth; panel.classList.add("swap");
    var img = $("j-img"), cap = $("j-cap");
    if (img) {
      var IMG = { lizhensk: ["/images/ohel.jpg", "ציון רבי אלימלך מליז'ענסק"], kerestir: ["/images/kerestir.jpg", "ציון ר' ישעיה מקערסטיר"] };
      var v = IMG[key], fr = img.parentNode;
      cap.textContent = v ? v[1] : d.name + " · " + d.place;
      if (v) { img.classList.add("off"); setTimeout(function () { img.src = v[0]; img.alt = v[1]; img.classList.remove("off"); }, 250); fr.classList.remove("no-img"); }
      else { img.classList.add("off"); fr.classList.add("no-img"); }
    }
  }
  tabs.forEach(function (t) { t.addEventListener("click", function () { select(t.dataset.dest); }); });
  pins.forEach(function (p) { p.addEventListener("click", function () { select(p.dataset.dest); }); });

  var map = document.querySelector(".journey .map");
  if (map) {
    if ("IntersectionObserver" in window) {
      var mo = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { map.classList.add("drawn"); mo.disconnect(); } }, { threshold: 0.12 });
      mo.observe(map);
    } else map.classList.add("drawn");
  }

  /* ---------- Trips (board, pass, register options) ---------- */
  function parseCSV(text) {
    var rows = [], row = [], cell = "", q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    var head = rows.shift().map(function (h) { return h.trim().toLowerCase(); });
    return rows.filter(function (r) { return r.join("").trim(); }).map(function (r) {
      var o = {}; head.forEach(function (h, j) { o[h] = (r[j] || "").trim(); }); return o;
    });
  }

  function renderTrips(list) {
    var future = list.filter(function (t) { return DEST[t.dest] && t.date; })
      .map(function (t) { var s = String(t.date); t.dt = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + "T00:00:00") : new Date(s); t.dt.setHours(0, 0, 0, 0); return t; })
      .filter(function (t) { return !isNaN(t.dt) && t.dt >= today; })
      .sort(function (a, b) { return a.dt - b.dt; });

    /* board */
    var grid = $("trips-grid");
    if (grid) {
      if (!future.length) { $("trips").hidden = true; }
      grid.innerHTML = future.map(function (t) {
        var d = DEST[t.dest], n = daysTo(t.dt), seats = parseInt(t.seats, 10), stat = "ההרשמה פתוחה", cls = "";
        if (!isNaN(seats)) {
          if (seats <= 0) { stat = "מלא — אפשר להירשם להמתנה"; cls = " full"; }
          else if (seats <= 8) { stat = "נשארו " + seats + " מקומות"; cls = " low"; }
        }
        return '<article class="tcard">' +
          '<span class="tdays">' + (n === 0 ? "היום" : "בעוד " + n + " ימים") + '</span>' +
          '<p class="tdate"><b>' + t.dt.getDate() + '</b><span>ב' + MONTHS[t.dt.getMonth()] + '</span><small>' + esc(t.heb) + '</small></p>' +
          '<h3>' + d.name + '</h3><p class="tplace">' + d.place + '</p>' +
          (t.note ? '<p class="tplace">' + esc(t.note) + '</p>' : '') +
          '<span class="tstat' + cls + '">' + stat + '</span>' +
          (t.price ? '<p class="tprice">' + esc(t.price) + '</p>' : '') +
          '<div class="tact"><button type="button" class="btn btn-ink" data-register="' + t.dest + '" data-trip="' + esc(tripLabel(t)) + '">שריינו מקום</button>' +
          (t.flyer ? '<button type="button" class="tflyer" data-flyer="' + esc(t.flyer) + '" data-title="' + esc(d.name) + '">לפרסום המלא</button>' : '<a href="' + (d.page || "/" + t.dest) + '">פרטים</a>') + '</div></article>';
      }).join("");
    }

    /* next-hilula pass */
    var next = future[0], pass = $("next-pass");
    if (pass) {
      if (next) {
        var d = DEST[next.dest], days = daysTo(next.dt);
        $("np-name").textContent = d.name; $("np-place").textContent = d.place; $("np-heb").textContent = next.heb;
        $("np-days").textContent = days === 0 ? "היום" : days;
        $("np-unit").textContent = days === 0 ? "" : (days === 1 ? "יום" : "ימים");
        var cta = $("np-cta"); cta.removeAttribute("href"); cta.setAttribute("role", "button");
        cta.dataset.register = next.dest; cta.dataset.trip = tripLabel(next);
        if (panel) select(d.base || next.dest);
      } else pass.style.display = "none";
    }
    if (panel && !next) select("lizhensk");

    /* destination page: next date */
    var dpk = document.body.dataset.dest, dpn = $("dp-next");
    if (dpk && dpn) {
      var nd = future.filter(function (t) { return t.dest === dpk || (DEST[t.dest].base === dpk); })[0];
      if (nd) dpn.textContent = "הנסיעה הקרובה: " + nd.dt.getDate() + " ב" + MONTHS[nd.dt.getMonth()] + " " + nd.dt.getFullYear();
    }

    /* register options */
    var sel = $("r-trip");
    if (sel) {
      var opts = future.map(function (t) { return tripLabel(t); });
      Object.keys(DEST).forEach(function (k) { if (!DEST[k].base) opts.push(DEST[k].name + " — מועד אחר"); });
      opts.push("טיול נשים ונערות", "אחר");
      sel.innerHTML = opts.map(function (o) { return "<option>" + esc(o) + "</option>"; }).join("");
    }
    window.__kzFuture = future;
  }

  renderTrips(TRIPS.slice());
  if (TRIPS_CSV) {
    fetch(TRIPS_CSV, { cache: "no-store" }).then(function (r) { return r.ok ? r.text() : Promise.reject(); })
      .then(function (txt) { var l = parseCSV(txt); if (l.length) renderTrips(l); })
      .catch(function () {});
  }

  /* ---------- Cover panels: open on hover/focus, slow auto-cycle ---------- */
  (function () {
    var wrap = $("panels"); if (!wrap) return;
    var ps = Array.prototype.slice.call(wrap.querySelectorAll(".panel")), cur = 0, hold = false;
    function open(k) { cur = k; ps.forEach(function (p, n) { p.classList.toggle("is-open", n === k); }); }
    ps.forEach(function (p, n) {
      p.addEventListener("mouseenter", function () { hold = true; open(n); });
      p.addEventListener("focus", function () { hold = true; open(n); });
    });
    wrap.addEventListener("mouseleave", function () { hold = false; });
    setInterval(function () {
      if (hold || document.hidden || document.body.classList.contains("a11y-nomotion")) return;
      if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      open((cur + 1) % ps.length);
    }, 5000);
  })();

  /* ---------- Flyer viewer ---------- */
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-flyer]"); if (!b) return;
    var box = document.createElement("div");
    box.className = "lb open"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", b.dataset.title);
    box.innerHTML = '<button class="lx" type="button" aria-label="סגירה">✕</button><figure><img src="' + b.dataset.flyer + '" alt="' + b.dataset.title + '"></figure>';
    function close() { box.remove(); document.body.style.overflow = ""; b.focus(); document.removeEventListener("keydown", onKey); }
    function onKey(ev) { if (ev.key === "Escape") close(); }
    box.addEventListener("click", function (ev) { if (ev.target === box || ev.target.closest(".lx")) close(); });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box); document.body.style.overflow = "hidden"; box.querySelector(".lx").focus();
  });

  /* ---------- Promo popup: current flyers, once per visit, until their end date ---------- */
  var PROMOS = [
    { until: "2026-12-06", img: "/images/flyer-chanukah-women.jpg", title: "חנוכה באומן לנשים ונערות",
      dest: "uman_chanukah_w", call: "0583240685", callText: "058-3240685" },
    { until: "2026-12-10", img: "/images/flyer-shabbat-chanukah.jpg", title: "שבת חנוכה באומן — טבלת טיסות",
      dest: "uman_shabbat_chanukah", call: "0527141425", callText: "052-714-1425" }
  ];
  (function () {
    var nowD = new Date(); nowD.setHours(0, 0, 0, 0);
    var live = PROMOS.filter(function (p) { return new Date(p.until + "T23:59:59") >= nowD; });
    if (!live.length || document.body.classList.contains("dp")) return;
    var KEYP = "kz-promo-" + live.map(function (p) { return p.until; }).join("_"), seen = false;
    try { seen = !!sessionStorage.getItem(KEYP); } catch (e) {}
    if (seen) return;
    var i = 0, last = null;
    var box = document.createElement("div");
    box.className = "promo2"; box.setAttribute("role", "dialog"); box.setAttribute("aria-modal", "true"); box.setAttribute("aria-label", "מבצעים ונסיעות קרובות");
    box.innerHTML = '<div class="p2-card"><button type="button" class="p2-x" aria-label="סגירת חלון">✕</button>' +
      '<div class="p2-img"><img alt=""></div>' +
      '<div class="p2-bar">' + (live.length > 1 ? '<div class="p2-dots" role="tablist">' + live.map(function (p, k) { return '<button type="button" role="tab" aria-label="' + p.title + '" data-k="' + k + '"></button>'; }).join("") + '</div>' : '') +
      '<div class="p2-ctas"><button type="button" class="btn btn-gold p2-reg">שריינו מקום</button><a class="btn btn-line p2-call"></a></div></div></div>';
    var img = box.querySelector("img"), call = box.querySelector(".p2-call"), reg = box.querySelector(".p2-reg");
    function show(k) {
      i = (k + live.length) % live.length; var p = live[i];
      img.src = p.img; img.alt = p.title; call.href = "tel:" + p.call; call.textContent = "התקשרו: " + p.callText;
      reg.dataset.register = p.dest; reg.dataset.trip = "";
      box.querySelectorAll(".p2-dots button").forEach(function (b, n) { b.setAttribute("aria-selected", n === i ? "true" : "false"); });
    }
    function close() { box.classList.remove("open"); document.body.style.overflow = ""; clearInterval(auto); if (last) last.focus(); }
    function onKey(e) { if (!box.classList.contains("open")) return; if (e.key === "Escape") close(); if (e.key === "ArrowLeft") show(i + 1); if (e.key === "ArrowRight") show(i - 1); }
    box.addEventListener("click", function (e) {
      if (e.target === box || e.target.closest(".p2-x")) return close();
      var d = e.target.closest(".p2-dots button"); if (d) { clearInterval(auto); show(+d.dataset.k); }
      if (e.target.closest(".p2-reg")) close();
    });
    var sx = null;
    box.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) { clearInterval(auto); show(i + (dx < 0 ? 1 : -1)); } sx = null; });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box); show(0);
    var auto = null;
    setTimeout(function () {
      last = document.activeElement; box.classList.add("open"); document.body.style.overflow = "hidden"; box.querySelector(".p2-x").focus();
      try { sessionStorage.setItem(KEYP, "1"); } catch (e) {}
      if (live.length > 1) auto = setInterval(function () { show(i + 1); }, 6000);
    }, 2200);
  })();

  /* ---------- Stats ---------- */
  var sg = $("stats-grid");
  if (sg && STATS.length) {
    $("stats").hidden = false;
    sg.innerHTML = STATS.map(function (s) { return '<div><b data-n="' + s.n + '" data-plus="' + (s.plus ? 1 : 0) + '">0</b><span>' + esc(s.label) + '</span></div>'; }).join("");
    var counted = false;
    var run = function () {
      if (counted) return; counted = true;
      sg.querySelectorAll("b").forEach(function (b) {
        var n = +b.dataset.n, plus = b.dataset.plus === "1", t0 = null;
        var step = function (ts) { if (!t0) t0 = ts; var p = Math.min(1, (ts - t0) / 1600), v = Math.round(n * (1 - Math.pow(1 - p, 3)));
          b.textContent = v.toLocaleString("he-IL") + (plus && p === 1 ? "+" : ""); if (p < 1) requestAnimationFrame(step); };
        requestAnimationFrame(step);
      });
    };
    if ("IntersectionObserver" in window) { var so = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { run(); so.disconnect(); } }); so.observe(sg); } else run();
  }

  /* ---------- Hero: living night scene (stars, flight path, candles, embers) ---------- */
  (function () {
    var hero = document.querySelector(".hero"); if (!hero) return;
    var sky = hero.querySelector(".hero-sky"), fire = hero.querySelector(".hero-fire"), ohel = hero.querySelector(".ohel");
    if (!sky || !fire || !sky.getContext) return;
    var sc = sky.getContext("2d"), fc = fire.getContext("2d");
    var W = 0, H = 0, dpr = 1, stars = [], candles = [], embers = [], running = false, visible = true, last = 0, t0 = performance.now();
    function still() {
      return document.body.classList.contains("a11y-nomotion") ||
        (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
    function rnd(a, b) { return a + Math.random() * (b - a); }
    function layout() {
      var r = hero.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      W = r.width; H = r.height;
      [sky, fire].forEach(function (c) { c.width = Math.round(W * dpr); c.height = Math.round(H * dpr); });
      sc.setTransform(dpr, 0, 0, dpr, 0, 0); fc.setTransform(dpr, 0, 0, dpr, 0, 0);
      stars = [];
      var n = Math.round(W * H / 9000);
      for (var i = 0; i < n; i++) stars.push({ x: Math.random() * W, y: Math.pow(Math.random(), 1.6) * H * .75, r: rnd(.3, 1.25), p: rnd(0, 6.28), s: rnd(.4, 1.6) });
      var o = ohel.getBoundingClientRect(), ox = o.left - r.left, ow = o.width, base = o.bottom - r.top;
      var mobile = W < 900;
      candles = [];
      var count = mobile ? 11 : 34;
      for (var j = 0; j < count; j++) {
        var depth = Math.random();
        var x = ox + ow * rnd(-0.1, 1.1);
        var y = base + 4 + depth * (mobile ? 26 : 70) + rnd(-3, 3);
        var scale = (mobile ? .55 : 1.05) * (0.6 + depth * 0.75);
        candles.push({ x: x, y: y, h: rnd(16, 40) * scale, w: 7 * scale, f: scale, ph: rnd(0, 100), sp: rnd(.8, 1.4) });
      }
      candles.sort(function (a, b) { return a.y - b.y; });
      embers = [];
    }
    function arcPt(u) {
      var x0 = W * .97, y0 = H * .32, x1 = W * .06, y1 = H * .2, cx = W * .52, cy = -H * .05;
      var a = 1 - u; return { x: a * a * x0 + 2 * a * u * cx + u * u * x1, y: a * a * y0 + 2 * a * u * cy + u * u * y1 };
    }
    function drawSky(t) {
      sc.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], a = .35 + .45 * Math.sin(t * s.s + s.p);
        sc.globalAlpha = Math.max(.08, a); sc.fillStyle = "#f5efe3";
        sc.beginPath(); sc.arc(s.x, s.y, s.r, 0, 6.283); sc.fill();
      }
      sc.globalAlpha = 1;
      /* faint flight path */
      sc.setLineDash([2, 7]); sc.strokeStyle = "rgba(200,160,75,.28)"; sc.lineWidth = 1;
      sc.beginPath(); for (var k = 0; k <= 60; k++) { var p = arcPt(k / 60); k ? sc.lineTo(p.x, p.y) : sc.moveTo(p.x, p.y); } sc.stroke(); sc.setLineDash([]);
      /* travelling light with trail */
      var period = 16, u = ((t % period) / period);
      var ease = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      for (var j = 24; j >= 0; j--) {
        var q = ease - j * .006; if (q < 0) continue;
        var pt = arcPt(q), al = (1 - j / 24) * (u < .06 ? u / .06 : u > .94 ? (1 - u) / .06 : 1);
        sc.fillStyle = "rgba(226,194,122," + (al * .55) + ")";
        sc.beginPath(); sc.arc(pt.x, pt.y, 1.8 * (1 - j / 30), 0, 6.283); sc.fill();
      }
      var hd = arcPt(ease), ha = u < .06 ? u / .06 : u > .94 ? (1 - u) / .06 : 1;
      var g = sc.createRadialGradient(hd.x, hd.y, 0, hd.x, hd.y, 14);
      g.addColorStop(0, "rgba(255,236,190," + ha + ")"); g.addColorStop(1, "rgba(226,194,122,0)");
      sc.fillStyle = g; sc.beginPath(); sc.arc(hd.x, hd.y, 14, 0, 6.283); sc.fill();
    }
    function flick(c, t) { var v = t * c.sp + c.ph; return .82 + .1 * Math.sin(v * 7.1) + .06 * Math.sin(v * 13.7) + .04 * Math.sin(v * 23.3); }
    function drawFire(t, dt) {
      fc.clearRect(0, 0, W, H);
      /* ground glow */
      if (candles.length) {
        var gx = candles[Math.floor(candles.length / 2)].x, gy = candles[candles.length - 1].y;
        var gg = fc.createRadialGradient(gx, gy, 0, gx, gy, Math.max(W, H) * .45);
        gg.addColorStop(0, "rgba(255,190,100,.16)"); gg.addColorStop(1, "rgba(255,190,100,0)");
        fc.fillStyle = gg; fc.fillRect(0, 0, W, H);
      }
      for (var i = 0; i < candles.length; i++) {
        var c = candles[i], k = flick(c, t), top = c.y - c.h;
        /* body */
        var bg = fc.createLinearGradient(c.x - c.w / 2, 0, c.x + c.w / 2, 0);
        bg.addColorStop(0, "#cdbf9f"); bg.addColorStop(.45, "#f6eedb"); bg.addColorStop(1, "#a8987a");
        fc.fillStyle = bg; fc.fillRect(c.x - c.w / 2, top, c.w, c.h);
        fc.fillStyle = "rgba(255,214,140,.55)"; fc.fillRect(c.x - c.w / 2, top, c.w, 1.2 * c.f);
        /* glow */
        fc.globalCompositeOperation = "lighter";
        var fr = 26 * c.f * k, gl = fc.createRadialGradient(c.x, top - 5 * c.f, 0, c.x, top - 5 * c.f, fr);
        gl.addColorStop(0, "rgba(255,200,110,.5)"); gl.addColorStop(1, "rgba(255,160,60,0)");
        fc.fillStyle = gl; fc.beginPath(); fc.arc(c.x, top - 5 * c.f, fr, 0, 6.283); fc.fill();
        /* flame */
        var fh = 11 * c.f * k, fw = 2.6 * c.f, sway = Math.sin(t * 2.3 + c.ph) * 1.1 * c.f, fy = top - 1.5 * c.f;
        var fg = fc.createLinearGradient(0, fy, 0, fy - fh);
        fg.addColorStop(0, "rgba(255,170,70,.95)"); fg.addColorStop(.5, "rgba(255,226,150,.95)"); fg.addColorStop(1, "rgba(255,250,230,.0)");
        fc.fillStyle = fg; fc.beginPath();
        fc.moveTo(c.x, fy + fw * .4);
        fc.quadraticCurveTo(c.x - fw * 1.6, fy - fh * .35, c.x + sway, fy - fh);
        fc.quadraticCurveTo(c.x + fw * 1.6, fy - fh * .35, c.x, fy + fw * .4); fc.fill();
        fc.globalCompositeOperation = "source-over";
        /* spawn embers */
        if (dt && Math.random() < dt * .55 * c.f) embers.push({ x: c.x + sway, y: fy - fh, vy: rnd(14, 34), life: 0, max: rnd(3, 7), r: rnd(.5, 1.6) * Math.max(.7, c.f), ph: rnd(0, 6.28), sw: rnd(6, 16) });
      }
      fc.globalCompositeOperation = "lighter";
      for (var e = embers.length - 1; e >= 0; e--) {
        var m = embers[e]; m.life += dt; if (m.life > m.max) { embers.splice(e, 1); continue; }
        m.y -= m.vy * dt; var ex = m.x + Math.sin(m.life * 1.3 + m.ph) * m.sw * (m.life / m.max);
        var al = Math.sin(Math.PI * m.life / m.max) * .85;
        fc.fillStyle = "rgba(255,206,120," + al + ")"; fc.beginPath(); fc.arc(ex, m.y, m.r, 0, 6.283); fc.fill();
      }
      fc.globalCompositeOperation = "source-over";
      if (embers.length > 260) embers.splice(0, embers.length - 260);
    }
    function frame(now) {
      if (!running) return;
      var t = (now - t0) / 1000, dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      drawSky(t); drawFire(t, dt);
      requestAnimationFrame(frame);
    }
    function start() { if (running || still() || !visible || document.hidden) return; running = true; last = 0; requestAnimationFrame(frame); }
    function stop() { running = false; }
    function staticFrame() { stop(); drawSky(4.2); drawFire(1.3, 0); }
    function refresh() { layout(); if (still()) staticFrame(); else { stop(); start(); } }
    var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(refresh, 150); });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    window.__kzScene = refresh;
    refresh();
  })();

  /* ---------- Flight progress + nav ---------- */
  var nav = document.querySelector(".nav"), flight = document.querySelector(".flight");
  var plane = flight && flight.querySelector("svg"), trail = flight && flight.querySelector(".trail");
  function onScroll() {
    if (nav && !document.body.classList.contains("dp")) nav.classList.toggle("solid", window.scrollY > 40);
    if (flight) {
      var max = document.documentElement.scrollHeight - window.innerHeight, p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      plane.style.top = (p * 100) + "%"; trail.style.height = (p * 100) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- Modal helper ---------- */
  function modal(el, onOpen) {
    var last = null;
    function close() { el.classList.remove("open"); document.body.style.overflow = ""; if (last) last.focus(); }
    function open() { last = document.activeElement; el.classList.add("open"); document.body.style.overflow = "hidden"; if (onOpen) onOpen(); }
    el.addEventListener("click", function (e) { if (e.target === el) close(); });
    el.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", close); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && el.classList.contains("open")) close(); });
    return { open: open, close: close };
  }

  /* ---------- Leads ---------- */
  var SB_URL = "https://jrpofocugarjzjjlcbck.supabase.co/rest/v1/leads";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpycG9mb2N1Z2FyanpqamxjYmNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2NTI2NDAsImV4cCI6MjA5OTIyODY0MH0.D4e4rgx0gBbk_VZ4cAZCOPim08hGlRB9UeBmHwMy290";
  var MAIL_URL = "https://formsubmit.co/ajax/kz0527141425@gmail.com";
  async function sendLead(data, subject) {
    var saved = false, mailed = false;
    try {
      var r1 = await fetch(SB_URL, { method: "POST", headers: { "Content-Type": "application/json", "apikey": SB_KEY, "Authorization": "Bearer " + SB_KEY, "Prefer": "return=minimal" },
        body: JSON.stringify({ source: "website", name: data.name, phone: data.phone, trip: data.trip, message: data.message }) });
      saved = r1.ok;
    } catch (e) {}
    try {
      var r2 = await fetch(MAIL_URL, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
        body: JSON.stringify(Object.assign({}, data, { _subject: subject, _template: "table", _captcha: "false" })) });
      mailed = r2.ok;
    } catch (e) {}
    return saved || mailed;
  }
  function need(form, fields, prefix) {
    var bad = false;
    fields.forEach(function (f) {
      var miss = !form[f].value.trim(), el = $(prefix + f);
      if (el) el.style.display = miss ? "block" : "none";
      form[f].setAttribute("aria-invalid", miss ? "true" : "false"); if (miss && !bad) { form[f].focus(); bad = true; }
    });
    return !bad;
  }

  /* contact form */
  var form = $("lead-form");
  if (form) {
    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!need(form, ["name", "phone"], "err-")) return;
      var b = $("form-submit"); b.disabled = true; b.textContent = "שולח..."; $("form-err").style.display = "none";
      var ok = await sendLead({ name: form.name.value.trim(), phone: form.phone.value.trim(), trip: form.trip.value, message: form.message.value.trim() }, "פנייה חדשה מהאתר — כנפי ציון טורס");
      b.disabled = false; b.textContent = "שליחת פנייה";
      if (ok) { form.style.display = "none"; $("form-ok").style.display = "flex"; } else $("form-err").style.display = "block";
    });
    $("form-again").addEventListener("click", function () { form.reset(); $("form-ok").style.display = "none"; form.style.display = "block"; });
  }

  /* registration */
  var rgEl = $("register"), rgForm = $("rg-form");
  if (rgEl && rgForm) {
    var rg = modal(rgEl);
    document.addEventListener("click", function (e) {
      var t = e.target.closest("[data-register]"); if (!t) return;
      e.preventDefault();
      var sel = $("r-trip"), want = t.dataset.trip;
      if (!want) { var f = (window.__kzFuture || []).filter(function (x) { return x.dest === t.dataset.register; })[0]; want = f ? tripLabel(f) : DEST[t.dataset.register].name + " — מועד אחר"; }
      for (var i = 0; i < sel.options.length; i++) if (sel.options[i].text === want) sel.selectedIndex = i;
      rgForm.style.display = "block"; $("rg-ok").style.display = "none"; $("rg-err").style.display = "none";
      rg.open(); setTimeout(function () { $("r-name").focus(); }, 50);
    });
    rgForm.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!need(rgForm, ["name", "phone"], "rerr-")) return;
      var b = $("rg-submit"); b.disabled = true; b.textContent = "שולח...";
      var pax = rgForm.pax.value, note = rgForm.message.value.trim();
      var ok = await sendLead({ name: rgForm.name.value.trim(), phone: rgForm.phone.value.trim(), trip: rgForm.trip.value,
        message: "הרשמה לנסיעה · מספר נוסעים: " + pax + (note ? " · " + note : ""), passengers: pax }, "הרשמה חדשה לנסיעה — " + rgForm.trip.value);
      b.disabled = false; b.textContent = "שריינו לי מקום";
      if (ok) { rgForm.reset(); rgForm.style.display = "none"; $("rg-ok").style.display = "flex"; } else $("rg-err").style.display = "block";
    });
  }

  /* updates list */
  var uf = $("upd-form");
  if (uf) {
    uf.addEventListener("submit", async function (e) {
      e.preventDefault();
      if (!need(uf, ["name", "phone"], "uerr-")) return;
      var b = uf.querySelector("button"); b.disabled = true; b.textContent = "שולח...";
      var ok = await sendLead({ name: uf.name.value.trim(), phone: uf.phone.value.trim(), trip: "רשימת עדכונים", message: "ביקש/ה לקבל עדכונים על נסיעות חדשות" }, "הצטרפות לרשימת העדכונים — כנפי ציון טורס");
      b.disabled = false; b.textContent = "עדכנו אותי";
      if (ok) { uf.style.display = "none"; $("upd-ok").style.display = "block"; }
      else window.open(waLink("שלום, אשמח לקבל עדכונים על נסיעות חדשות"), "_blank");
    });
  }

  /* ---------- Gallery lightbox ---------- */
  var gg = $("ggrid"), lb = $("lb");
  if (gg && lb) {
    var imgs = Array.prototype.slice.call(gg.querySelectorAll("img")), cur = 0;
    var lbm = modal(lb);
    var show = function (i) { cur = (i + imgs.length) % imgs.length; $("lb-img").src = imgs[cur].src; $("lb-img").alt = imgs[cur].alt; $("lb-cap").textContent = imgs[cur].alt; };
    gg.addEventListener("click", function (e) { var b = e.target.closest("button"); if (!b) return; show(+b.dataset.i); lbm.open(); lb.querySelector(".lx").focus(); });
    lb.querySelector(".lx").addEventListener("click", lbm.close);
    lb.querySelector(".lp").addEventListener("click", function () { show(cur - 1); });
    lb.querySelector(".ln").addEventListener("click", function () { show(cur + 1); });
    document.addEventListener("keydown", function (e) {
      if (!lb.classList.contains("open")) return;
      if (e.key === "ArrowLeft") show(cur + 1); if (e.key === "ArrowRight") show(cur - 1);
    });
    var sx = null;
    lb.addEventListener("touchstart", function (e) { sx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (sx === null) return; var dx = e.changedTouches[0].clientX - sx; if (Math.abs(dx) > 40) show(cur + (dx < 0 ? 1 : -1)); sx = null; });
  }

  /* ---------- Accessibility widget ---------- */
  var KEY = "kz-a11y-settings", body = document.body, rootEl = document.documentElement;
  var state = { font: 100, contrast: false, links: false, nomotion: false, readable: false };
  try { var saved = JSON.parse(localStorage.getItem(KEY) || "null"); if (saved) state = Object.assign(state, saved); } catch (e) {}
  var toggles = { contrast: "a11y-contrast", links: "a11y-links", nomotion: "a11y-nomotion", readable: "a11y-font" };
  function apply() {
    rootEl.style.fontSize = state.font === 100 ? "" : state.font + "%";
    Object.keys(toggles).forEach(function (k) {
      body.classList.toggle(toggles[k], !!state[k]);
      var b = document.querySelector('[data-a11y="' + k + '"]');
      if (b) { b.setAttribute("aria-pressed", state[k] ? "true" : "false"); b.textContent = state[k] ? "כבה" : "הפעל"; }
    });
    if (window.__kzScene) window.__kzScene();
    var pct = $("a11y-pct"); if (pct) pct.textContent = state.font + "%";
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }
  var abtn = $("a11y-btn"), apanel = $("a11y-panel");
  if (abtn && apanel) {
    abtn.addEventListener("click", function (e) { e.stopPropagation(); var o = apanel.classList.toggle("open"); abtn.setAttribute("aria-expanded", o ? "true" : "false"); });
    document.addEventListener("click", function (e) { if (!apanel.contains(e.target) && !abtn.contains(e.target)) { apanel.classList.remove("open"); abtn.setAttribute("aria-expanded", "false"); } });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && apanel.classList.contains("open")) { apanel.classList.remove("open"); abtn.setAttribute("aria-expanded", "false"); abtn.focus(); } });
    apanel.addEventListener("click", function (e) {
      var t = e.target.closest("button"); if (!t) return;
      var a = t.getAttribute("data-a11y"); if (a && toggles[a]) state[a] = !state[a];
      if (t.id === "a11y-plus") state.font = Math.min(148, state.font + 12);
      if (t.id === "a11y-minus") state.font = Math.max(76, state.font - 12);
      if (t.id === "a11y-reset") state = { font: 100, contrast: false, links: false, nomotion: false, readable: false };
      apply();
    });
  }
  apply();
})();
