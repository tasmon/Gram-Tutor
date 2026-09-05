/* My Gramify App v3.1.0 */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));

  const LOGO_SVG =
    '<svg viewBox="0 0 64 64" width="72" height="72" aria-hidden="true">' +
    '<defs><linearGradient id="ga" x1="0" y1="0" x2="1" y2="1">' +
    '<stop offset="0%" stop-color="#5b7cfa"/><stop offset="55%" stop-color="#4c63e8"/><stop offset="100%" stop-color="#3b46c9"/>' +
    '</linearGradient><linearGradient id="gsa" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0%" stop-color="#ffffff" stop-opacity="0.16"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>' +
    "</linearGradient></defs>" +
    '<rect x="1" y="1" width="62" height="62" rx="17" fill="url(#ga)"/>' +
    '<rect x="1" y="1" width="62" height="30" rx="17" fill="url(#gsa)"/>' +
    '<g transform="translate(32,34)">' +
    '<path d="M -20 -8 C -13 -12 -6 -12 0 -8 L 0 15 C -6 11 -13 11 -20 15 Z" fill="#fff" opacity="0.97"/>' +
    '<path d="M 20 -8 C 13 -12 6 -12 0 -8 L 0 15 C 6 11 13 11 20 15 Z" fill="#fff" opacity="0.88"/>' +
    '<path d="M -15.5 -3.4 C -10.5 -6 -5.5 -6 -1.8 -3.6" stroke="#4c63e8" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.55"/>' +
    '<path d="M -15.5 2.6 C -10.5 0 -5.5 0 -1.8 2.4" stroke="#4c63e8" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.55"/>' +
    '<path d="M 15.5 -3.4 C 10.5 -6 5.5 -6 1.8 -3.6" stroke="#4c63e8" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.4"/>' +
    '<path d="M 15.5 2.6 C 10.5 0 5.5 0 1.8 2.4" stroke="#4c63e8" stroke-width="1.7" fill="none" stroke-linecap="round" opacity="0.4"/>' +
    "</g>" +
    '<circle cx="47.5" cy="18.5" r="11.5" fill="#22b25c" stroke="var(--card,#fff)" stroke-width="2.6"/>' +
    '<path d="M 42.3 18.7 L 46.1 22.4 L 53 15.2" stroke="#fff" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  const state = {
    view: "home",
    lessonId: null,
    cat: "all",
    search: "",
    quiz: null,
    game: null,
    flash: { i: 0, show: false, list: [] },
    toolsTab: "verbs",
    progress: null
  };

  function loadProgress() {
    try {
      const r = localStorage.getItem("mygramify_v2");
      if (r) return JSON.parse(r);
    } catch (e) {}
    return {
      completed: {},
      xp: 0,
      quizzes: 0,
      correct: 0,
      streak: 0,
      lastVisit: null,
      badges: {},
      favorites: [],
      verbStudy: false,
      gamesPlayed: 0,
      topicStats: {},
      reviewed: {},
      missed: {},
      answered: 0,
      placementLevel: null,
      seenQuestions: {},
      seenFlashcards: {},
      seenGameItems: {}
    };
  }

  function save() {
    localStorage.setItem("mygramify_v2", JSON.stringify(state.progress));
    updateXP();
  }

  function addXP(n) {
    state.progress.xp = (state.progress.xp || 0) + n;
    checkBadges();
    save();
  }

  function checkBadges() {
    const p = state.progress;
    const done = Object.keys(p.completed).length;
    if (p.quizzes >= 1) p.badges.first_quiz = true;
    if (done >= 10) p.badges.ten_lessons = true;
    if (done >= (window.LESSONS || []).length) p.badges.all_lessons = true;
    if (p.streak >= 3) p.badges.streak_3 = true;
    if (p.streak >= 7) p.badges.streak_7 = true;
    if (p.verbStudy) p.badges.verbs = true;
    if (p.gamesPlayed >= 1) p.badges.games = true;
    if (p.placementLevel) p.badges.placement_done = true;
    if ((p.answered || 0) >= 100) p.badges.bank_explorer = true;
    if (p._hadMissed && Object.keys(p.missed || {}).length === 0) p.badges.review_master = true;
    if (Object.keys(p.missed || {}).length > 0) p._hadMissed = true;
    if (new Date().getHours() >= 22 || new Date().getHours() < 5) p.badges.night_owl = true;
  }

  function touchStreak() {
    const today = new Date().toDateString();
    const p = state.progress;
    if (p.lastVisit !== today) {
      const y = new Date(Date.now() - 864e5).toDateString();
      p.streak = p.lastVisit === y ? (p.streak || 0) + 1 : 1;
      p.lastVisit = today;
      save();
    }
  }

  function updateXP() {
    const el = $("#xpPill");
    if (el) el.textContent = "⭐ " + (state.progress.xp || 0) + " XP";
  }

  function getUserName() {
    return (localStorage.getItem("gramifyName") || "").trim();
  }

  function setUserName(name) {
    name = String(name || "").trim().slice(0, 40);
    if (name) localStorage.setItem("gramifyName", name);
    return name;
  }

  function timeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }

  function homeGreeting() {
    const name = getUserName();
    const g = timeGreeting();
    if (name) return g + ", " + name;
    return g;
  }


  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._tm);
    toast._tm = setTimeout(() => t.classList.remove("show"), 2200);
  }

  function levelFromXP(xp) {
    return Math.floor(xp / 100) + 1;
  }

  /* ---------- Theme ---------- */
  const THEMES = [
    { id: "light", icon: "☀️", label: "Light" },
    { id: "dark", icon: "🌙", label: "Dark" },
    { id: "ocean", icon: "🌊", label: "Ocean" },
    { id: "forest", icon: "🌿", label: "Forest" },
    { id: "sunset", icon: "🌅", label: "Sunset" },
    { id: "lavender", icon: "💜", label: "Lavender" },
    { id: "slate", icon: "⬜", label: "Slate" }
  ];

  function themeMeta(id) {
    return THEMES.find(function (x) { return x.id === id; }) || THEMES[0];
  }

  function initTheme() {
    const th = localStorage.getItem("gramifyTheme") || "light";
    document.documentElement.setAttribute("data-theme", th);
    const btn = $("#themeBtn");
    if (btn) {
      btn.textContent = themeMeta(th).icon;
      btn.title = "Theme: " + themeMeta(th).label + " (tap to change)";
    }
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute("data-theme") || "light";
    const idx = THEMES.findIndex(function (x) { return x.id === cur; });
    const next = THEMES[(idx + 1) % THEMES.length];
    document.documentElement.setAttribute("data-theme", next.id);
    localStorage.setItem("gramifyTheme", next.id);
    const btn = $("#themeBtn");
    if (btn) {
      btn.textContent = next.icon;
      btn.title = "Theme: " + next.label + " (tap to change)";
    }
    toast("Theme: " + next.label);
  }

  /* ---------- Navigation ---------- */
  function nav(view, data) {
    state.view = view;
    if (data) Object.assign(state, data);
    if (view === "home" || view === "lessons" || view === "practice" || view === "tools" || view === "progress" || view === "about") {
      state.lessonId = null;
      state.quiz = null;
      state.game = null;
    }
    render();
    window.scrollTo(0, 0);
    $$(".nav-item, .bnav-item").forEach((b) => {
      const v = b.getAttribute("data-nav");
      const active =
        v === state.view ||
        (state.view === "lesson" && v === "lessons") ||
        ((state.view === "quiz" || state.view === "game") && v === "practice");
      b.classList.toggle("active", !!active);
    });
  }

  /* ---------- Render helpers ---------- */
  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function badge(level) {
    const c = "b-" + String(level).replace(/\s/g, "");
    return '<span class="badge ' + c + '">' + esc(level) + "</span>";
  }

  /* ---------- Views ---------- */
  function viewHome() {
    const L = window.LESSONS || [];
    const done = Object.keys(state.progress.completed).length;
    const pct = L.length ? Math.round((done / L.length) * 100) : 0;
    const cats = window.CATEGORIES || [];
    return (
      '<div class="view">' +
      '<div class="hero">' +
      ("<h1>" + esc(homeGreeting()) + "</h1>") +
      "<p>Lessons, adaptive quizzes, and practice games. Progress stays on this device.</p>" +
      '<div class="hero-stats">' +
      '<div class="stat-chip"><b>' + L.length + "</b>Lessons</div>" +
      '<div class="stat-chip"><b>' + done + "</b>Done</div>" +
      '<div class="stat-chip"><b>' + (state.progress.streak || 0) + "</b>Day streak</div>" +
      '<div class="stat-chip"><b>Lv ' + levelFromXP(state.progress.xp) + "</b>" + (state.progress.xp || 0) + " XP</div>" +
      "</div></div>" +
      '<div class="card mb-2"><div class="flex justify-between items-center mb-1"><strong>Overall progress</strong><span class="muted">' +
      pct +
      "%</span></div><div class=\"bar\"><i style=\"width:" +
      pct +
      '%"></i></div></div>' +
      '<div class="h-sec">Quick start</div>' +
      '<div class="grid grid-2 keep-2 mb-2">' +
      '<button type="button" class="card card-click" data-action="nav" data-view="practice"><div class="ticon">🎯</div><strong>Practice</strong><div class="muted">Quizzes and games</div></button>' +
      '<button type="button" class="card card-click" data-action="quick-quiz"><div class="ticon">⚡</div><strong>Quick quiz</strong><div class="muted">10 mixed questions</div></button>' +
      '<button type="button" class="card card-click" data-action="nav" data-view="tools"><div class="ticon">🛠️</div><strong>Tools</strong><div class="muted">Verbs, glossary, cards</div></button>' +
      '<button type="button" class="card card-click" data-action="daily"><div class="ticon">📅</div><strong>Today\'s five</strong><div class="muted">A short daily set</div></button>' +
      "</div>" +
      '<div class="h-sec">Categories</div>' +
      '<div class="grid grid-3">' +
      cats
        .map(function (c) {
          const n = L.filter(function (l) {
            return l.category === c.id;
          }).length;
          return (
            '<button type="button" class="card card-click" data-action="filter-cat" data-cat="' +
            c.id +
            '"><div class="ticon" style="--cc:' +
            c.color +
            '">' +
            c.icon +
            "</div><strong>" +
            esc(c.name) +
            '</strong><div class="muted">' +
            n +
            " lessons</div></button>"
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function viewLessons() {
    let list = window.LESSONS || [];
    if (state.cat !== "all") list = list.filter((l) => l.category === state.cat);
    if (state.search) {
      const q = state.search.toLowerCase();
      list = list.filter(
        (l) =>
          l.title.toLowerCase().includes(q) ||
          l.description.toLowerCase().includes(q) ||
          l.level.toLowerCase().includes(q)
      );
    }
    const cats = window.CATEGORIES || [];
    return (
      '<div class="view"><div class="h-sec" style="margin-top:0">Lessons (' +
      list.length +
      ')</div><div class="search-wrap"><span class="si">🔍</span><input type="search" id="searchInput" placeholder="Search lessons…" value="' +
      esc(state.search) +
      '" /></div>' +
      '<div class="chips">' +
      '<button type="button" class="chip' +
      (state.cat === "all" ? " on" : "") +
      '" data-action="filter-cat" data-cat="all">All</button>' +
      cats
        .map(
          (c) =>
            '<button type="button" class="chip' +
            (state.cat === c.id ? " on" : "") +
            '" data-action="filter-cat" data-cat="' +
            c.id +
            '">' +
            c.icon +
            " " +
            esc(c.name) +
            "</button>"
        )
        .join("") +
      "</div>" +
      '<div class="grid grid-2">' +
      (list.length
        ? list
            .map((l) => {
              const ok = state.progress.completed[l.id];
              return (
                '<button type="button" class="card card-click" data-action="open-lesson" data-id="' +
                l.id +
                '"><div class="flex justify-between items-center mb-1">' +
                badge(l.level) +
                (ok ? " ✅" : "") +
                '</div><strong>' +
                esc(l.title) +
                '</strong><div class="muted">' +
                esc(l.description) +
                "</div></button>"
              );
            })
            .join("")
        : '<div class="empty"><div class="e">🔍</div>No lessons found</div>') +
      "</div></div>"
    );
  }

  function enrichLessonContent(lesson) {
    const c = lesson.content || {};
    const exp = (window.LESSON_EXPANSIONS && window.LESSON_EXPANSIONS[lesson.id]) || window.DEFAULT_LESSON_EXPANSION || {};
    const sections = (c.sections || []).slice();
    (exp.extraSections || []).forEach(function (s) { sections.push(s); });
    const tips = (c.tips || []).slice();
    (exp.extraTips || []).forEach(function (tip) {
      if (tips.indexOf(tip) < 0) tips.push(tip);
    });
    return { intro: c.intro || "", sections: sections, tips: tips };
  }

  function viewLesson() {
    const lesson = (window.LESSONS || []).find((l) => l.id === state.lessonId);
    if (!lesson) return '<div class="empty">Lesson not found</div>';
    const c = enrichLessonContent(lesson);
    const wordCount = (c.intro + " " + c.sections.map(function (s) {
      return s.title + " " + s.text + " " + (s.examples || []).map(function (e) { return e.correct + " " + (e.note || ""); }).join(" ");
    }).join(" ") + " " + (c.tips || []).join(" ")).split(/\s+/).filter(Boolean).length;
    return (
      '<div class="view">' +
      '<button type="button" class="back" data-action="nav" data-view="lessons">← Back to lessons</button>' +
      badge(lesson.level) +
      '<span class="muted" style="margin-left:.5rem;font-size:.8rem">~' + wordCount + " words</span>" +
      "<h1 style=\"font-size:1.4rem;margin:.4rem 0\">" +
      esc(lesson.title) +
      '</h1><p class="muted mb-2">' +
      esc(lesson.description) +
      "</p>" +
      '<div class="card mb-2"><p>' +
      esc(c.intro) +
      "</p></div>" +
      (c.sections || [])
        .map(
          (s) =>
            '<div class="section"><h3>' +
            esc(s.title) +
            "</h3><p class=\"mb-1\">" +
            esc(s.text) +
            "</p>" +
            (s.examples || [])
              .map(
                (e) =>
                  '<div class="ex"><strong>' +
                  esc(e.correct) +
                  "</strong>" +
                  (e.note ? "<small>" + esc(e.note) + "</small>" : "") +
                  "</div>"
              )
              .join("") +
            "</div>"
        )
        .join("") +
      (c.tips && c.tips.length
        ? '<div class="tips mb-2"><h4>Tips</h4><ul>' +
          c.tips.map((tip) => "<li>" + esc(tip) + "</li>").join("") +
          "</ul></div>"
        : "") +
      '<div class="flex gap-1 flex-wrap">' +
      '<button type="button" class="btn btn-p" data-action="lesson-quiz" data-id="' +
      lesson.id +
      '">Take quiz</button>' +
      '<button type="button" class="btn btn-s" data-action="complete-lesson" data-id="' +
      lesson.id +
      '">Mark complete (+15 XP)</button>' +
      "</div></div>"
    );
  }

  function viewPractice() {
    const done = Object.keys(state.progress.completed || {}).length;
    const info = window.QuizGen ? window.QuizGen.bankInfo() : { size: 0, topics: 0 };
    const weak = window.QuizGen ? window.QuizGen.weakTopics(state.progress, 3) : [];
    const missedCount = window.QuizGen ? window.QuizGen.missedQuestions(state.progress).length : 0;
    let adaptiveNote = done === 0
      ? "Finish a lesson first - quizzes then adapt to what you have studied."
      : "Questions adapt to your completed lessons" + (weak.length ? " and focus on weaker topics." : ".");
    return (
      '<div class="view">' +
      '<div class="h-sec" style="margin-top:0">Practice</div>' +
      '<p class="muted mb-2">' + adaptiveNote + ' The bank has ' + info.size.toLocaleString() + ' distinct questions across ' + info.topics + ' grammar topics, each with a short explanation.</p>' +
      '<div class="h-sec">Get started</div>' +
      '<div class="grid grid-2 keep-2 mb-2">' +
      '<button type="button" class="card card-click" data-action="placement-test"><div class="ticon">🧭</div><strong>Placement test</strong><div class="muted">18 questions - find your level</div></button>' +
      '<button type="button" class="card card-click" data-action="review-quiz"><div class="ticon">🔁</div><strong>Review mistakes</strong><div class="muted">' + (missedCount ? missedCount + " question" + (missedCount === 1 ? "" : "s") + " to revisit" : "Nothing to review yet") + '</div></button>' +
      '</div>' +
      '<div class="h-sec">Quizzes</div>' +
      '<div class="grid grid-2 keep-2 mb-2">' +
      [
        ["quick-quiz", "⚡", "Quick quiz", "10 questions matched to your progress"],
        ["mixed-quiz", "🎲", "Longer quiz", "20 mixed questions from the full bank"],
        ["hard-quiz", "🔥", "Hard quiz", "B2-C1 challenge set (15 questions)"],
        ["daily", "📅", "Today's five", "A short daily set"],
        ["lesson-practice", "📚", "From your lessons", "Only topics you have completed"]
      ]
        .map(function (x) {
          return (
            '<button type="button" class="card card-click" data-action="' +
            x[0] +
            '"><div class="ticon">' +
            x[1] +
            "</div><strong>" +
            x[2] +
            '</strong><div class="muted">' +
            x[3] +
            "</div></button>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="h-sec">Games</div>' +
      '<p class="muted mb-1">Short practice games - not multiple-choice quizzes.</p>' +
      '<div class="grid grid-2 keep-2">' +
      [
        ["game-scramble", "🔤", "Word order", "Drag the words into a correct sentence"],
        ["game-fill", "✍️", "Fill the gap", "Type the missing word or form"],
        ["game-error", "🔧", "Error clinic", "Find and fix the mistake"]
      ]
        .map(function (x) {
          return (
            '<button type="button" class="card card-click game-card" data-action="' +
            x[0] +
            '"><div class="ticon">' +
            x[1] +
            "</div><strong>" +
            x[2] +
            '</strong><div class="muted">' +
            x[3] +
            '</div><span class="badge b-B1" style="margin-top:.4rem">Game</span></button>'
          );
        })
        .join("") +
      "</div></div>"
    );
  }

  function viewQuiz() {
    const qz = state.quiz;
    if (!qz || !qz.qs.length) return '<div class="empty">No questions</div>';
    if (qz.i >= qz.qs.length) {
      const pct = Math.round((qz.score / qz.qs.length) * 100);
      if (qz.mode !== "placement") {
        state.progress.quizzes++;
        state.progress.correct += qz.score;
        if (pct === 100) state.progress.badges.perfect = true;
        addXP(qz.score * 5 + (pct === 100 ? 20 : 0));
        touchStreak();
      }
      if (qz.mode === "placement") {
        const byLevel = {};
        qz.qs.forEach(function (q, idx) {
          const lvl = q.level || "B1";
          if (!byLevel[lvl]) byLevel[lvl] = { right: 0, total: 0 };
          byLevel[lvl].total++;
          if (qz.results && qz.results[idx]) byLevel[lvl].right++;
        });
        const suggested = window.QuizGen ? window.QuizGen.suggestLevel(byLevel) : "A2";
        state.progress.placementLevel = suggested;
        checkBadges();
        addXP(30);
        save();
        return (
          '<div class="view"><div class="card q-card text-center">' +
          '<div class="score-big">' + suggested + '</div>' +
          '<p style="font-size:1.1rem">' + qz.score + ' / ' + qz.qs.length + ' correct</p>' +
          '<p class="muted mb-2">Based on your answers, ' + suggested + ' looks like a good place to focus. Lessons at or just above this level will stretch you without feeling overwhelming.</p>' +
          '<div class="tbl-wrap mb-2"><table><thead><tr><th>Level</th><th>Score</th></tr></thead><tbody>' +
          Object.keys(byLevel).sort().map(function (l) {
            return "<tr><td>" + l + "</td><td>" + byLevel[l].right + " / " + byLevel[l].total + "</td></tr>";
          }).join("") +
          "</tbody></table></div>" +
          '<div class="flex gap-1 flex-wrap" style="justify-content:center">' +
          '<button type="button" class="btn btn-p" data-action="nav" data-view="lessons">Browse lessons</button>' +
          '<button type="button" class="btn btn-s" data-action="nav" data-view="practice">Practice menu</button>' +
          "</div></div></div>"
        );
      }
      return (
        '<div class="view"><div class="card q-card text-center">' +
        '<div class="score-big">' +
        pct +
        "%</div>" +
        "<p style=\"font-size:1.1rem\">" +
        qz.score +
        " / " +
        qz.qs.length +
        " correct</p>" +
        '<p class="muted mb-2">' +
        (pct >= 90 ? "Excellent work." : pct >= 70 ? "Nice job - well done." : pct >= 50 ? "Not bad. A bit more practice will help." : "Have another look at the lessons, then try again.") +
        "</p>" +
        '<div class="flex gap-1 flex-wrap" style="justify-content:center">' +
        '<button type="button" class="btn btn-p" data-action="retry-quiz">Try again</button>' +
        '<button type="button" class="btn btn-s" data-action="nav" data-view="practice">Practice menu</button>' +
        "</div></div></div>"
      );
    }
    const cur = qz.qs[qz.i];
    return (
      '<div class="view"><div class="card q-card">' +
      '<div class="q-meta"><span>Q ' +
      (qz.i + 1) +
      " / " +
      qz.qs.length +
      "</span><span>Score: " +
      qz.score +
      "</span></div>" +
      '<div class="bar mb-2"><i style="width:' +
      (qz.i / qz.qs.length) * 100 +
      '%"></i></div>' +
      '<div class="q-text">' +
      esc(cur.q) +
      "</div>" +
      '<div class="opts">' +
      cur.options
        .map(
          (o, i) =>
            '<button type="button" class="opt' +
            (qz.answered ? (i === cur.answer ? " right" : i === qz.chosen && i !== cur.answer ? " wrong" : "") : "") +
            '" data-action="answer" data-i="' +
            i +
            '"' +
            (qz.answered ? " disabled" : "") +
            ">" +
            esc(o) +
            "</button>"
        )
        .join("") +
      "</div>" +
      (qz.answered
        ? '<div class="fb ' +
          (qz.chosen === cur.answer ? "ok" : "no") +
          '">' +
          (qz.chosen === cur.answer ? "Correct! 🎉" : "Answer: “" + esc(cur.options[cur.answer]) + "”") +
          (cur.explain ? '<div class="fb-explain">' + esc(cur.explain) + "</div>" : "") +
          "</div>" +
          '<button type="button" class="btn btn-p btn-block mt-2" data-action="next-q">' +
          (qz.i + 1 === qz.qs.length ? "See results" : "Next →") +
          "</button>"
        : "") +
      "</div></div>"
    );
  }


  function completedLessonTopics() {
    const done = state.progress.completed || {};
    const topics = [];
    (window.LESSONS || []).forEach(function (l) {
      if (done[l.id] && topics.indexOf(l.category) < 0) topics.push(l.category);
      if (done[l.id] && topics.indexOf(l.id) < 0) topics.push(l.id);
    });
    return topics;
  }

  function startAdaptiveQuiz(count, difficulty, mode, topics, seed, extra) {
    let qs = [];
    if (window.QuizGen) {
      qs = window.QuizGen.sampleQuiz(Object.assign({
        count: count,
        difficulty: difficulty,
        completed: state.progress.completed || {},
        topics: topics || null,
        excludeIds: state.progress.seenQuestions || {},
        seed: seed || (Date.now() % 100000)
      }, extra || {}));
    }
    if (!qs.length) {
      toast("Not enough questions found - try a different mode.");
      return;
    }
    if (window.QuizGen && mode !== "review") {
      window.QuizGen.markSeen(state.progress, qs.map((q) => q.id));
      save();
    }
    startQuiz(qs, mode, mode === "quick" || mode === "mixed" || mode === "hard");
  }

  function startQuiz(qs, mode, keepOrder) {
    state.quiz = {
      qs: keepOrder ? qs.slice() : qs.slice().sort(() => Math.random() - 0.5),
      i: 0,
      score: 0,
      answered: false,
      chosen: null,
      mode: mode || "quick",
      results: []
    };
    state.view = "quiz";
    render();
  }

  function viewGame() {
    const g = state.game;
    if (!g) return "";
    if (g.type === "scramble") return viewScramble(g);
    if (g.type === "fill") return viewFill(g);
    if (g.type === "error") return viewError(g);
    return "";
  }

  function viewScramble(g) {
    const list = g.order || [];
    if (g.i >= list.length) {
      state.progress.gamesPlayed++;
      addXP(g.score * 8);
      checkBadges();
      save();
      return (
        '<div class="view"><div class="card q-card text-center"><div class="score-big">' +
        g.score +
        "/" +
        list.length +
        '</div><p class="mb-2">Scramble complete!</p>' +
        '<button type="button" class="btn btn-p" data-action="game-scramble">Play again</button> ' +
        '<button type="button" class="btn btn-s" data-action="nav" data-view="practice">Back</button></div></div>'
      );
    }
    if (!g.cur) {
      const src = list[g.i];
      g.cur = { answer: src.answer, words: src.words.slice().sort(() => Math.random() - 0.5) };
      g.sel = [];
    }
    const used = {};
    g.sel.forEach((w) => {
      used[w] = (used[w] || 0) + 1;
    });
    const poolCount = {};
    g.cur.words.forEach((w) => {
      poolCount[w] = (poolCount[w] || 0) + 1;
    });
    return (
      '<div class="view"><div class="card q-card">' +
      '<div class="q-meta"><span>Sentence ' +
      (g.i + 1) +
      "/" +
      list.length +
      "</span><span>Score: " +
      g.score +
      "</span></div>" +
      '<p class="muted">Tap words in the correct order</p>' +
      '<div class="drop" id="dropBox">' +
      (g.sel.length
        ? g.sel
            .map(
              (w, i) =>
                '<button type="button" class="chip-w" data-action="unpick" data-i="' + i + '">' + esc(w) + "</button>"
            )
            .join("")
        : '<span class="muted">Your sentence…</span>') +
      "</div>" +
      '<div class="words">' +
      g.cur.words
        .map((w, idx) => {
          const u = used[w] || 0;
          const dim = u >= (poolCount[w] || 0);
          return (
            '<button type="button" class="chip-w' +
            (dim ? " dim" : "") +
            '" data-action="pick" data-w="' +
            esc(w) +
            '"' +
            (dim ? " disabled" : "") +
            ">" +
            esc(w) +
            "</button>"
          );
        })
        .join("") +
      '</div><div class="flex gap-1">' +
      '<button type="button" class="btn btn-p" data-action="check-scramble">Check</button>' +
      '<button type="button" class="btn btn-ghost" data-action="clear-scramble">Clear</button>' +
      '</div><div id="gfb" class="mt-1"></div></div></div>'
    );
  }

  function viewFill(g) {
    const list = g.order || [];
    if (g.i >= list.length) {
      state.progress.gamesPlayed++;
      addXP(g.score * 8);
      checkBadges();
      save();
      return (
        '<div class="view"><div class="card q-card text-center"><div class="score-big">' +
        g.score +
        "/" +
        list.length +
        '</div><p class="mb-2">Fill-blank complete!</p>' +
        '<button type="button" class="btn btn-p" data-action="game-fill">Play again</button> ' +
        '<button type="button" class="btn btn-s" data-action="nav" data-view="practice">Back</button></div></div>'
      );
    }
    const item = list[g.i];
    return (
      '<div class="view"><div class="card q-card">' +
      '<div class="q-meta"><span>Q ' +
      (g.i + 1) +
      "/" +
      list.length +
      "</span><span>Score: " +
      g.score +
      "</span></div>" +
      '<div class="q-text">' +
      esc(item.sentence) +
      '</div><p class="muted" style="font-size:.85rem">Hint: ' +
      esc(item.hint) +
      '</p><input class="fill-in" id="fillIn" placeholder="Type your answer…" autocomplete="off" />' +
      '<button type="button" class="btn btn-p btn-block" data-action="check-fill">Check</button>' +
      '<div id="gfb" class="mt-1"></div></div></div>'
    );
  }

  function viewError(g) {
    const list = g.order || [];
    if (g.i >= list.length) {
      state.progress.gamesPlayed++;
      addXP(g.score * 10);
      checkBadges();
      save();
      return (
        '<div class="view"><div class="card q-card text-center"><div class="score-big">' +
        g.score +
        "/" +
        list.length +
        '</div><p class="mb-2">Error clinic complete!</p>' +
        '<button type="button" class="btn btn-p" data-action="game-error">Again</button> ' +
        '<button type="button" class="btn btn-s" data-action="nav" data-view="practice">Back</button></div></div>'
      );
    }
    const item = list[g.i];
    return (
      '<div class="view"><div class="card q-card">' +
      '<div class="q-meta"><span>' +
      (g.i + 1) +
      "/" +
      list.length +
      "</span><span>Score: " +
      g.score +
      '</span></div><p class="muted mb-1">Fix this sentence:</p>' +
      '<div class="ex" style="border-color:var(--bad)"><strong>' +
      esc(item.wrong) +
      '</strong></div><input class="fill-in" id="fillIn" placeholder="Write the corrected sentence…" />' +
      '<button type="button" class="btn btn-p btn-block" data-action="check-error">Check</button>' +
      '<div id="gfb" class="mt-1"></div></div></div>'
    );
  }

  function viewTools() {
    const tab = state.toolsTab;
    let body = "";
    if (tab === "verbs") {
      state.progress.verbStudy = true;
      checkBadges();
      save();
      body =
        '<div class="search-wrap"><span class="si">🔍</span><input type="search" id="verbSearch" placeholder="Filter verbs…" /></div>' +
        '<div class="tbl-wrap"><table id="verbTable"><thead><tr><th>Base</th><th>Past</th><th>Past Participle</th></tr></thead><tbody>' +
        (window.IRREGULAR_VERBS || [])
          .map((v) => "<tr><td>" + esc(v[0]) + "</td><td>" + esc(v[1]) + "</td><td>" + esc(v[2]) + "</td></tr>")
          .join("") +
        "</tbody></table></div>";
    } else if (tab === "glossary") {
      body =
        '<div class="search-wrap"><span class="si">🔍</span><input type="search" id="glossSearch" placeholder="Search terms…" /></div>' +
        '<div class="grid" id="glossList">' +
        (window.GLOSSARY || [])
          .map(
            (g) =>
              '<div class="card"><strong>' +
              esc(g.term) +
              '</strong><div class="muted">' +
              esc(g.def) +
              "</div></div>"
          )
          .join("") +
        "</div>";
    } else if (tab === "flash") {
      if (!state.flash.list.length) {
        state.flash.list = newFlashBatch(30);
        state.flash.i = 0;
        state.flash.show = false;
      }
      const card = state.flash.list[state.flash.i];
      body = card
        ? '<div class="card flash" data-action="flip-flash"><div class="inner">' +
          (state.flash.show ? esc(card.back) : esc(card.front)) +
          '</div></div><p class="text-center muted mt-1">' +
          (state.flash.i + 1) +
          " / " +
          state.flash.list.length +
          (state.flash.show ? " · answer" : " · tap to flip") +
          '</p><div class="flex gap-1 mt-2" style="justify-content:center">' +
          '<button type="button" class="btn btn-s" data-action="flash-prev">← Prev</button>' +
          '<button type="button" class="btn btn-p" data-action="flip-flash">Flip</button>' +
          '<button type="button" class="btn btn-s" data-action="flash-next">Next →</button>' +
          '</div><p class="text-center mt-1"><button type="button" class="btn btn-ghost btn-sm" data-action="flash-shuffle">🔀 New batch</button></p>'
        : '<div class="empty">No cards</div>';
    }
    return (
      '<div class="view"><div class="h-sec" style="margin-top:0">Tools</div>' +
      '<div class="chips">' +
      [
        ["verbs", "📘 Irregular Verbs"],
        ["glossary", "📖 Glossary"],
        ["flash", "🃏 Flashcards"],
      ]
        .map(
          (t) =>
            '<button type="button" class="chip' +
            (tab === t[0] ? " on" : "") +
            '" data-action="tools-tab" data-tab="' +
            t[0] +
            '">' +
            t[1] +
            "</button>"
        )
        .join("") +
      "</div>" +
      body +
      "</div>"
    );
  }

  function viewProgress() {
    const L = window.LESSONS || [];
    const done = Object.keys(state.progress.completed).length;
    const pct = L.length ? Math.round((done / L.length) * 100) : 0;
    const badges = window.BADGES || [];
    return (
      '<div class="view"><div class="h-sec" style="margin-top:0">Your progress</div>' +
      (getUserName()
        ? '<p class="muted mb-1">Hi, <strong>' + esc(getUserName()) + '</strong> · <button type="button" class="btn btn-ghost btn-sm" data-action="edit-name" style="display:inline;padding:.15rem .45rem">Change name</button></p>'
        : '<p class="muted mb-1"><button type="button" class="btn btn-s btn-sm" data-action="edit-name">Add your name</button></p>') +
      '<div class="card mb-2"><div class="flex justify-between mb-1"><span>Lessons</span><strong>' +
      done +
      " / " +
      L.length +
      '</strong></div><div class="bar"><i style="width:' +
      pct +
      '%"></i></div></div>' +
      '<div class="grid grid-2 keep-2 mb-2">' +
      '<div class="card text-center"><div style="font-size:1.8rem;font-weight:800;color:var(--p)">' +
      (state.progress.xp || 0) +
      '</div><div class="muted">XP · Level ' +
      levelFromXP(state.progress.xp) +
      "</div></div>" +
      '<div class="card text-center"><div style="font-size:1.8rem;font-weight:800;color:var(--warn)">' +
      (state.progress.streak || 0) +
      '</div><div class="muted">Day streak 🔥</div></div>' +
      '<div class="card text-center"><div style="font-size:1.8rem;font-weight:800;color:var(--sec)">' +
      (state.progress.quizzes || 0) +
      '</div><div class="muted">Quizzes taken</div></div>' +
      '<div class="card text-center"><div style="font-size:1.8rem;font-weight:800;color:var(--ok)">' +
      (state.progress.gamesPlayed || 0) +
      '</div><div class="muted">Games played</div></div>' +
      "</div>" +
      '<div class="h-sec">Badges</div><div class="grid grid-2 keep-2 mb-2">' +
      badges
        .map((b) => {
          const on = state.progress.badges[b.id];
          return (
            '<div class="card" style="opacity:' +
            (on ? 1 : 0.45) +
            '"><span style="font-size:1.5rem">' +
            b.icon +
            "</span> <strong>" +
            esc(b.name) +
            '</strong><div class="muted">' +
            esc(b.desc) +
            (on ? " ✓" : "") +
            "</div></div>"
          );
        })
        .join("") +
      "</div>" +
      '<div class="card mb-2"><strong class="mb-1" style="display:block">Lessons</strong>' +
      L.map(
        (l) =>
          '<div class="flex gap-1 items-center" style="padding:.4rem 0;border-bottom:1px solid var(--line)">' +
          (state.progress.completed[l.id] ? "✅" : "⬜") +
          " " +
          esc(l.title) +
          ' <span class="muted" style="font-size:.8rem">· ' +
          esc(l.level) +
          "</span></div>"
      ).join("") +
      "</div>" +
      '<button type="button" class="btn btn-ghost btn-block" data-action="reset">Reset all progress</button></div>'
    );
  }

  function viewAbout() {
    return (
      '<div class="view"><div class="card text-center" style="max-width:480px;margin:0 auto">' +
      '<div class="logo-mark logo-lg" aria-hidden="true">' + LOGO_SVG + "</div>" +
      "<h1>My Gramify</h1>" +
      '<p class="muted mb-2">A grammar app built to actually be used, not just downloaded.</p>' +
      '<p style="text-align:left">I got tired of grammar apps that run out of content fast or lock explanations behind a subscription, so I built the one I wanted to use myself.</p>' +
      '<p class="mt-1" style="text-align:left">Not sure where to start? Try the placement test. Anything you get wrong is quietly saved and comes back around later - that\'s usually where the real learning happens.</p>' +
      '<p class="mt-1" style="text-align:left">Everything stays on this device: no account, no ads, works offline.</p>' +
      '<p class="mt-2" style="display:inline-block;padding:.3rem .8rem;background:var(--elev);border-radius:99px;font-size:.85rem" class="muted">Version ' +
      (window.APP_VERSION || "3.1.0") +
      "</p>" +
      '<hr style="border:none;border-top:1px solid var(--line);margin:1.25rem 0" />' +
      '<p style="text-align:left"><strong>Developer:</strong> ' +
      esc((window.DEVELOPER || {}).name || "Tasmon Islam") +
      '<br><strong>Email:</strong> <a href="mailto:' +
      esc((window.DEVELOPER || {}).email || "tasmon@outlook.com") +
      '">' +
      esc((window.DEVELOPER || {}).email || "tasmon@outlook.com") +
      "</a></p></div></div>"
    );
  }

  function render() {
    const main = $("#main");
    if (!main) return;
    let html = "";
    switch (state.view) {
      case "home":
        html = viewHome();
        break;
      case "lessons":
        html = viewLessons();
        break;
      case "lesson":
        html = viewLesson();
        break;
      case "practice":
        html = viewPractice();
        break;
      case "quiz":
        html = viewQuiz();
        break;
      case "game":
        html = viewGame();
        break;
      case "tools":
        html = viewTools();
        break;
      case "progress":
        html = viewProgress();
        break;
      case "about":
        html = viewAbout();
        break;
      default:
        html = viewHome();
    }
    main.innerHTML = html;

    const si = $("#searchInput");
    if (si) {
      si.addEventListener("input", function () {
        state.search = this.value;
        render();
        const again = $("#searchInput");
        if (again) {
          again.focus();
          again.setSelectionRange(again.value.length, again.value.length);
        }
      });
    }
    const vs = $("#verbSearch");
    if (vs) {
      vs.addEventListener("input", function () {
        const q = this.value.toLowerCase();
        $$("#verbTable tbody tr").forEach((tr) => {
          tr.style.display = tr.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }
    const gs = $("#glossSearch");
    if (gs) {
      gs.addEventListener("input", function () {
        const q = this.value.toLowerCase();
        $$("#glossList .card").forEach((c) => {
          c.style.display = c.textContent.toLowerCase().includes(q) ? "" : "none";
        });
      });
    }
    const fi = $("#fillIn");
    if (fi) {
      fi.focus();
      fi.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          if (state.game && state.game.type === "fill") handleCheckFill();
          if (state.game && state.game.type === "error") handleCheckError();
        }
      });
    }
  }

  /* ---------- Actions ---------- */
  function shuffle(a) {
    return a.slice().sort(() => Math.random() - 0.5);
  }

  function startGameSession(rawList, typeKey, roundSize) {
    if (!state.progress.seenGameItems) state.progress.seenGameItems = {};
    const seen = state.progress.seenGameItems[typeKey] || {};
    const withIdx = rawList.map((item, idx) => ({ item, idx }));
    const unseen = withIdx.filter((x) => !seen[x.idx]);
    const source = unseen.length >= Math.min(roundSize, rawList.length) ? unseen : withIdx;
    const picked = shuffle(source).slice(0, Math.min(roundSize, rawList.length));
    const usedSeen = Object.assign({}, seen);
    picked.forEach((x) => {
      usedSeen[x.idx] = true;
    });
    if (Object.keys(usedSeen).length >= rawList.length) {
      state.progress.seenGameItems[typeKey] = {};
    } else {
      state.progress.seenGameItems[typeKey] = usedSeen;
    }
    save();
    return picked.map((x) => x.item);
  }

  let _flashPoolCache = null;
  function buildFlashcardPool() {
    if (_flashPoolCache) return _flashPoolCache;
    const concept = (window.FLASHCARDS || []).map((c, i) => ({
      id: "c" + i,
      front: c.front,
      back: c.back
    }));
    const bankQs = window.QuizGen ? window.QuizGen.allQuestions() : (window.QUESTION_BANK || []);
    const practice = bankQs.map((q) => ({
      id: "q" + q.id,
      front: q.q,
      back: q.options[q.answer] + (q.explain ? " — " + q.explain : "")
    }));
    _flashPoolCache = concept.concat(practice);
    return _flashPoolCache;
  }

  function newFlashBatch(size) {
    const pool = buildFlashcardPool();
    if (!state.progress.seenFlashcards) state.progress.seenFlashcards = {};
    const seen = state.progress.seenFlashcards;
    const unseen = pool.filter((c) => !seen[c.id]);
    const source = unseen.length >= Math.min(size, pool.length) ? unseen : pool;
    const picked = shuffle(source).slice(0, Math.min(size, pool.length));
    const usedSeen = source === pool ? {} : Object.assign({}, seen);
    picked.forEach((c) => {
      usedSeen[c.id] = true;
    });
    if (Object.keys(usedSeen).length >= pool.length) {
      state.progress.seenFlashcards = {};
    } else {
      state.progress.seenFlashcards = usedSeen;
    }
    save();
    return picked;
  }


  function handleCheckFill() {
    const g = state.game;
    const list = g.order || [];
    const item = list[g.i];
    const input = $("#fillIn");
    if (!input || !item) return;
    const user = input.value.trim().toLowerCase().replace(/\s+/g, " ");
    const answers = item.answer.toLowerCase().split("|").map((x) => x.trim());
    const ok = answers.some((a) => user === a);
    const fb = $("#gfb");
    if (ok) {
      g.score++;
      if (fb) {
        fb.className = "fb ok";
        fb.textContent = "Correct! 🎉";
      }
    } else if (fb) {
      fb.className = "fb no";
      fb.textContent = "Answer: " + item.answer.split("|")[0];
    }
    input.disabled = true;
    setTimeout(() => {
      g.i++;
      render();
    }, ok ? 800 : 1500);
  }

  function handleCheckError() {
    const g = state.game;
    const list = g.order || [];
    const item = list[g.i];
    const input = $("#fillIn");
    if (!input || !item) return;
    const user = input.value.trim().toLowerCase().replace(/\s+/g, " ").replace(/[’]/g, "'");
    const right = item.right.toLowerCase().replace(/\s+/g, " ").replace(/[’']/g, "'");
    // accept if close enough: contains key correction
    const ok = user === right || user.includes(right.split(/[./]/)[0].trim());
    const fb = $("#gfb");
    if (ok) {
      g.score++;
      if (fb) {
        fb.className = "fb ok";
        fb.textContent = "Correct! " + item.explain;
      }
    } else if (fb) {
      fb.className = "fb no";
      fb.textContent = item.right + " - " + item.explain;
    }
    input.disabled = true;
    setTimeout(() => {
      g.i++;
      render();
    }, 1800);
  }

  function onAction(action, el) {
    switch (action) {
      case "nav":
        nav(el.getAttribute("data-view"));
        break;
      case "filter-cat":
        state.cat = el.getAttribute("data-cat") || "all";
        nav("lessons");
        break;
      case "open-lesson":
        state.lessonId = el.getAttribute("data-id");
        nav("lesson");
        break;
      case "complete-lesson": {
        const id = el.getAttribute("data-id");
        if (!state.progress.completed[id]) {
          state.progress.completed[id] = true;
          addXP(15);
          toast("Marked complete. +15 XP");
        } else toast("Already completed");
        render();
        break;
      }
      case "lesson-quiz": {
        const les = (window.LESSONS || []).find((l) => l.id === el.getAttribute("data-id"));
        if (les && les.quiz) startQuiz(les.quiz, "lesson:" + les.id);
        break;
      }
      case "quick-quiz":
        startAdaptiveQuiz(10, "mixed", "quick");
        break;
      case "mixed-quiz":
        startAdaptiveQuiz(20, "mixed", "mixed");
        break;
      case "hard-quiz":
        startAdaptiveQuiz(15, "hard", "hard");
        break;
      case "placement-test": {
        const seed = Date.now() % 100000;
        const qs = window.QuizGen ? window.QuizGen.placementTest(seed, state.progress.seenQuestions || {}) : [];
        if (qs.length) {
          if (window.QuizGen) {
            window.QuizGen.markSeen(state.progress, qs.map((q) => q.id));
            save();
          }
          startQuiz(qs, "placement", true);
        }
        break;
      }
      case "review-quiz": {
        const missedIds = window.QuizGen ? window.QuizGen.missedQuestions(state.progress) : [];
        if (missedIds.length) {
          startAdaptiveQuiz(Math.min(12, missedIds.length), "mixed", "review", null, null, { forceIds: missedIds });
        } else {
          const weak = window.QuizGen ? window.QuizGen.weakTopics(state.progress, 6) : [];
          if (!weak.length) {
            toast("No mistakes to review yet - take a quiz first!");
            break;
          }
          startAdaptiveQuiz(10, "mixed", "review", weak);
        }
        break;
      }
      case "lesson-practice": {
        const topics = completedLessonTopics();
        if (!topics.length) {
          toast("Complete at least one lesson first");
          break;
        }
        startAdaptiveQuiz(12, "mixed", "lesson-practice", topics);
        break;
      }
      case "daily": {
        const key = "daily-" + new Date().toISOString().slice(0, 10);
        const seed = key.split("").reduce(function (a, c) { return a + c.charCodeAt(0); }, 0);
        startAdaptiveQuiz(5, "mixed", "daily", null, seed);
        break;
      }
      case "answer": {
        if (!state.quiz || state.quiz.answered) return;
        const i = parseInt(el.getAttribute("data-i"), 10);
        state.quiz.answered = true;
        state.quiz.chosen = i;
        const curQ = state.quiz.qs[state.quiz.i];
        const ok = i === curQ.answer;
        if (ok) state.quiz.score++;
        state.quiz.results[state.quiz.i] = ok;
        if (window.QuizGen && curQ.topic) {
          window.QuizGen.recordAnswer(state.progress, curQ.topic, ok, curQ.id);
        }
        checkBadges();
        save();
        render();
        break;
      }
      case "next-q":
        state.quiz.i++;
        state.quiz.answered = false;
        state.quiz.chosen = null;
        render();
        break;
      case "retry-quiz":
        if (state.quiz.mode === "quick") onAction("quick-quiz", el);
        else if (state.quiz.mode === "mixed") onAction("mixed-quiz", el);
        else if (state.quiz.mode === "hard") onAction("hard-quiz", el);
        else if (state.quiz.mode === "daily") onAction("daily", el);
        else if (state.quiz.mode === "review") onAction("review-quiz", el);
        else if (state.quiz.mode === "placement") onAction("placement-test", el);
        else if (state.quiz.mode === "lesson-practice") onAction("lesson-practice", el);
        else if (String(state.quiz.mode).startsWith("lesson:")) {
          const id = state.quiz.mode.split(":")[1];
          const les = (window.LESSONS || []).find((l) => l.id === id);
          if (les) startQuiz(les.quiz, state.quiz.mode);
        }
        break;
      case "game-scramble":
        state.game = {
          type: "scramble", i: 0, score: 0, cur: null, sel: [],
          order: startGameSession(window.SCRAMBLE_SENTENCES || [], "scramble", 15)
        };
        state.view = "game";
        render();
        break;
      case "game-fill":
        state.game = {
          type: "fill", i: 0, score: 0,
          order: startGameSession(window.FILL_BLANKS || [], "fill", 15)
        };
        state.view = "game";
        render();
        break;
      case "game-error":
        state.game = {
          type: "error", i: 0, score: 0,
          order: startGameSession(window.ERROR_FIX || [], "error", 12)
        };
        state.view = "game";
        render();
        break;
      case "pick": {
        if (!state.game) return;
        const w = el.getAttribute("data-w");
        state.game.sel.push(w);
        render();
        break;
      }
      case "unpick": {
        const idx = parseInt(el.getAttribute("data-i"), 10);
        state.game.sel.splice(idx, 1);
        render();
        break;
      }
      case "clear-scramble":
        state.game.sel = [];
        render();
        break;
      case "check-scramble": {
        const g = state.game;
        const user = g.sel.join(" ");
        const ok = user === g.cur.answer;
        const fb = $("#gfb");
        if (ok) {
          g.score++;
          if (fb) {
            fb.className = "fb ok";
            fb.textContent = "Perfect! ✅";
          }
        } else if (fb) {
          fb.className = "fb no";
          fb.textContent = "Correct: “" + g.cur.answer + "”";
        }
        setTimeout(() => {
          g.i++;
          g.cur = null;
          g.sel = [];
          render();
        }, ok ? 800 : 1600);
        break;
      }
      case "check-fill":
        handleCheckFill();
        break;
      case "check-error":
        handleCheckError();
        break;
      case "tools-tab":
        state.toolsTab = el.getAttribute("data-tab");
        state.flash = { i: 0, show: false, list: [] };
        render();
        break;
      case "flip-flash":
        state.flash.show = !state.flash.show;
        render();
        break;
      case "flash-next":
        if (state.flash.i + 1 >= state.flash.list.length) {
          state.flash.list = newFlashBatch(30);
          state.flash.i = 0;
        } else {
          state.flash.i++;
        }
        state.flash.show = false;
        render();
        break;
      case "flash-prev":
        state.flash.i = Math.max(0, state.flash.i - 1);
        state.flash.show = false;
        render();
        break;
      case "flash-shuffle":
        state.flash.list = newFlashBatch(30);
        state.flash.i = 0;
        state.flash.show = false;
        render();
        break;
      case "edit-name": {
        const current = getUserName();
        const next = prompt("What should we call you?", current || "");
        if (next !== null) {
          if (next.trim()) {
            setUserName(next);
            toast("Got it - hello, " + next.trim());
          } else {
            localStorage.removeItem("gramifyName");
            toast("Name cleared");
          }
          render();
        }
        break;
      }
      case "reset":
        if (confirm("Reset all progress, XP and badges?")) {
          state.progress = {
            completed: {},
            xp: 0,
            quizzes: 0,
            correct: 0,
            streak: 0,
            lastVisit: null,
            badges: {},
            favorites: [],
            verbStudy: false,
            gamesPlayed: 0,
            topicStats: {},
            reviewed: {},
            missed: {},
            answered: 0,
            placementLevel: null,
            seenQuestions: {},
            seenFlashcards: {},
            seenGameItems: {}
          };
          save();
          toast("Progress reset");
          render();
        }
        break;
      case "close-modal":
        $("#modal").classList.add("hidden");
        break;
      default:
        break;
    }
  }

  function bind() {
    document.body.addEventListener("click", function (e) {
      const navEl = e.target.closest("[data-nav]");
      if (navEl && (navEl.classList.contains("nav-item") || navEl.classList.contains("bnav-item") || navEl.classList.contains("logo"))) {
        e.preventDefault();
        nav(navEl.getAttribute("data-nav"));
        return;
      }
      const act = e.target.closest("[data-action]");
      if (act) {
        e.preventDefault();
        onAction(act.getAttribute("data-action"), act);
      }
    });
    const th = $("#themeBtn");
    if (th) th.addEventListener("click", toggleTheme);
  }



  function showNamePrompt() {
    let ov = document.getElementById("tourOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "tourOverlay";
      ov.className = "tour-overlay";
      document.body.appendChild(ov);
    }
    ov.innerHTML =
      '<div class="tour-card">' +
      "<h2>" + timeGreeting() + "</h2>" +
      "<p>What should we call you? You can change this later in Progress.</p>" +
      '<input class="fill-in" id="nameInput" type="text" maxlength="40" placeholder="Your first name" autocomplete="name" style="margin-top:0" />' +
      '<div class="tour-actions" style="margin-top:.85rem">' +
      '<button type="button" class="btn btn-ghost btn-sm" id="nameSkip">Skip for now</button>' +
      '<button type="button" class="btn btn-p btn-sm" id="nameSave">Continue</button>' +
      "</div></div>";
    ov.classList.remove("hidden");
    const input = document.getElementById("nameInput");
    setTimeout(function () { if (input) input.focus(); }, 100);
    function finish() {
      const v = input ? input.value : "";
      if (v && v.trim()) setUserName(v);
      ov.remove();
      render();
      if (!localStorage.getItem("gramifyTourDone")) {
        tourStep = 0;
        setTimeout(showTour, 300);
      }
    }
    document.getElementById("nameSkip").onclick = finish;
    document.getElementById("nameSave").onclick = finish;
    if (input) {
      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") finish();
      });
    }
  }

  /* ---------- First-launch tour ---------- */
  let tourStep = 0;
  function showTour() {
    const steps = window.TOUR_STEPS || [];
    if (!steps.length) return;
    let ov = document.getElementById("tourOverlay");
    if (!ov) {
      ov = document.createElement("div");
      ov.id = "tourOverlay";
      ov.className = "tour-overlay";
      document.body.appendChild(ov);
    }
    const s = steps[tourStep];
    const dots = steps.map((_, i) => '<span class="tour-dot' + (i === tourStep ? " on" : "") + '"></span>').join("");
    const isLast = tourStep >= steps.length - 1;
    let title = s.title;
    if (tourStep === 0 && getUserName()) title = "Welcome, " + getUserName();
    ov.innerHTML =
      '<div class="tour-card">' +
      "<h2>" + title + "</h2>" +
      "<p>" + s.body + "</p>" +
      '<div class="tour-dots">' + dots + "</div>" +
      '<div class="tour-actions">' +
      '<button type="button" class="btn btn-ghost btn-sm" id="tourSkip">Skip</button>' +
      '<button type="button" class="btn btn-p btn-sm" id="tourNext">' + (isLast ? "Get started" : "Next") + "</button>" +
      "</div></div>";
    ov.classList.remove("hidden");
    document.getElementById("tourSkip").onclick = endTour;
    document.getElementById("tourNext").onclick = function () {
      if (isLast) endTour();
      else {
        tourStep++;
        showTour();
      }
    };
  }
  function endTour() {
    localStorage.setItem("gramifyTourDone", "1");
    const ov = document.getElementById("tourOverlay");
    if (ov) ov.remove();
  }

  function init() {
    if (!window.LESSONS) {
      $("#main").innerHTML =
        '<div class="empty"><div class="e">⚠️</div><p>Failed to load data.js. Please open the app through a local server or your hosted URL.</p></div>';
      return;
    }
    if (window.EXTRA_LESSONS && window.EXTRA_LESSONS.length) {
      var ids = {};
      window.LESSONS.forEach(function (l) { ids[l.id] = true; });
      window.EXTRA_LESSONS.forEach(function (l) {
        if (!ids[l.id]) window.LESSONS.push(l);
      });
    }
    state.progress = loadProgress();
    touchStreak();
    initTheme();
    bind();
    updateXP();
    render();
    if (!getUserName()) {
      setTimeout(showNamePrompt, 350);
    } else if (!localStorage.getItem("gramifyTourDone")) {
      tourStep = 0;
      setTimeout(showTour, 400);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
