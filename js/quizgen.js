/* Gramify Adaptive Quiz Engine v3
 * Draws from a real, deduplicated question bank (window.QUESTION_BANK).
 * No fake infinite generator - every question is genuinely distinct
 * and carries a short explanation.
 */
(function (global) {
  "use strict";

  function bank() {
    return global.QUESTION_BANK || [];
  }

  function mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function seededShuffle(arr, seed) {
    var rng = mulberry32(seed >>> 0);
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  var BEGINNER_TOPICS = ["articles", "nouns", "pronouns", "present-simple", "prepositions", "determiners", "be-have", "questions"];

  function topicUnlocked(topic, completedMap) {
    completedMap = completedMap || {};
    if (completedMap[topic]) return true;
    var anyCompleted = false;
    var doneCount = 0;
    for (var k in completedMap) {
      if (completedMap[k]) {
        anyCompleted = true;
        doneCount++;
      }
    }
    if (!anyCompleted) return BEGINNER_TOPICS.indexOf(topic) >= 0;
    if (doneCount >= 6) return true;
    return false;
  }

  function levelRank(level) {
    return { A1: 0, A2: 1, B1: 2, B2: 3, C1: 4 }[level] || 2;
  }

  function withIds(list) {
    // stable ids based on topic + index within the full bank
    return list;
  }

  function ensureIds() {
    var b = bank();
    for (var i = 0; i < b.length; i++) {
      if (!b[i].id) b[i].id = "qb-" + i;
    }
    return b;
  }

  function sampleQuiz(options) {
    options = options || {};
    var count = options.count || 10;
    var difficulty = options.difficulty || "mixed"; // easy | mixed | hard
    var completed = options.completed || {};
    var preferTopics = options.topics || null;
    var excludeIds = options.excludeIds || {};
    var forceIds = options.forceIds || null; // for review mode: use exactly these ids if present
    var seed = options.seed || (Date.now() % 100000);

    var all = ensureIds().slice();

    if (forceIds && forceIds.length) {
      var byId = {};
      all.forEach(function (q) { byId[q.id] = q; });
      var forced = forceIds.map(function (id) { return byId[id]; }).filter(Boolean);
      return seededShuffle(forced, seed).slice(0, count);
    }

    var byDifficulty = all;
    if (difficulty === "easy") byDifficulty = all.filter(function (q) { return levelRank(q.level) <= 1; });
    else if (difficulty === "hard") byDifficulty = all.filter(function (q) { return levelRank(q.level) >= 3; });

    // Prefer questions the user hasn't seen yet. Only fall back to the full
    // (already-seen) pool for this scope once the unseen supply runs out -
    // that way nothing repeats until the whole relevant set has been shown.
    var unseen = byDifficulty.filter(function (q) { return !excludeIds[q.id]; });
    var source = unseen.length >= count ? unseen : byDifficulty;

    var scored = source.map(function (q) {
      var score = 0;
      if (preferTopics && preferTopics.indexOf(q.topic) >= 0) score += 5;
      if (difficulty !== "hard" && topicUnlocked(q.topic, completed)) score += 2;
      if (!excludeIds[q.id]) score += 1;
      return { q: q, score: score };
    });

    scored = seededShuffle(scored, seed);
    scored.sort(function (a, b) { return b.score - a.score; });

    var chosen = scored.slice(0, Math.max(count * 3, count)).map(function (x) { return x.q; });
    chosen = seededShuffle(chosen, seed + 1).slice(0, count);

    if (chosen.length < count) {
      // top up from whatever is left, ignoring topic/difficulty preference
      var already = {};
      chosen.forEach(function (q) { already[q.id] = true; });
      var rest = byDifficulty.filter(function (q) { return !already[q.id]; });
      rest = seededShuffle(rest, seed + 2);
      chosen = chosen.concat(rest.slice(0, count - chosen.length));
    }
    return chosen;
  }

  function placementTest(seed, excludeIds) {
    excludeIds = excludeIds || {};
    var all = ensureIds();
    var byLevel = { A1: [], A2: [], B1: [], B2: [], C1: [] };
    all.forEach(function (q) { (byLevel[q.level] || byLevel.B1).push(q); });
    var picks = [];
    var perLevel = { A1: 4, A2: 4, B1: 4, B2: 3, C1: 3 };
    Object.keys(perLevel).forEach(function (lvl, idx) {
      var bucket = byLevel[lvl] || [];
      var unseen = bucket.filter(function (q) { return !excludeIds[q.id]; });
      var source = unseen.length >= perLevel[lvl] ? unseen : bucket;
      var pool = seededShuffle(source, (seed || 1) + idx);
      picks = picks.concat(pool.slice(0, perLevel[lvl]));
    });
    return seededShuffle(picks, (seed || 1) + 99);
  }

  function suggestLevel(correctByLevel) {
    // correctByLevel: {A1:{right,total}, ...}
    var order = ["A1", "A2", "B1", "B2", "C1"];
    var best = "A1";
    for (var i = 0; i < order.length; i++) {
      var s = correctByLevel[order[i]];
      if (!s || s.total === 0) continue;
      var rate = s.right / s.total;
      if (rate >= 0.6) best = order[i];
      else break;
    }
    return best;
  }

  function recordAnswer(progress, topic, correct, questionId) {
    if (!progress.topicStats) progress.topicStats = {};
    if (!progress.topicStats[topic]) progress.topicStats[topic] = { right: 0, wrong: 0 };
    if (correct) progress.topicStats[topic].right++;
    else progress.topicStats[topic].wrong++;

    if (!progress.missed) progress.missed = {};
    if (questionId) {
      if (correct) {
        if (progress.missed[questionId]) {
          progress.missed[questionId].streak = (progress.missed[questionId].streak || 0) + 1;
          if (progress.missed[questionId].streak >= 2) delete progress.missed[questionId];
        }
      } else {
        progress.missed[questionId] = { streak: 0, ts: Date.now() };
      }
    }
    progress.answered = (progress.answered || 0) + 1;
  }

  function weakTopics(progress, limit) {
    var stats = progress.topicStats || {};
    var list = [];
    for (var t in stats) {
      var s = stats[t];
      var total = s.right + s.wrong;
      if (total < 3) continue;
      list.push({ topic: t, rate: s.right / total, total: total });
    }
    list.sort(function (a, b) { return a.rate - b.rate; });
    return list.slice(0, limit || 5).map(function (x) { return x.topic; });
  }

  function missedQuestions(progress) {
    var ids = Object.keys(progress.missed || {});
    return ids;
  }

  function markSeen(progress, ids) {
    if (!progress.seenQuestions) progress.seenQuestions = {};
    (ids || []).forEach(function (id) {
      if (id) progress.seenQuestions[id] = true;
    });
    // Once the whole bank has been shown at least once, start a fresh cycle
    // so old questions are eligible again instead of the app "running dry".
    var total = bank().length;
    if (Object.keys(progress.seenQuestions).length >= total) {
      progress.seenQuestions = {};
    }
  }

  function bankInfo() {
    var b = bank();
    var topics = {};
    b.forEach(function (q) { topics[q.topic] = true; });
    return { size: b.length, topics: Object.keys(topics).length };
  }

  global.QuizGen = {
    sampleQuiz: sampleQuiz,
    placementTest: placementTest,
    suggestLevel: suggestLevel,
    bankInfo: bankInfo,
    recordAnswer: recordAnswer,
    weakTopics: weakTopics,
    missedQuestions: missedQuestions,
    topicUnlocked: topicUnlocked,
    markSeen: markSeen,
    allQuestions: ensureIds
  };
})(typeof window !== "undefined" ? window : globalThis);
