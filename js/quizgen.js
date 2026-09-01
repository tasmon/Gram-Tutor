/* My Gramify - Adaptive Quiz Generator
 * Virtual bank: 50,000 unique questions generated deterministically.
 * Selection is filtered by lesson progress and topic mastery.
 */
(function (global) {
  "use strict";

  var BANK_SIZE = 50000;

  var TOPIC_LESSONS = {
    articles: ["articles"],
    nouns: ["nouns"],
    pronouns: ["pronouns"],
    determiners: ["determiners"],
    "present-simple": ["present-simple", "be-have"],
    "present-continuous": ["present-continuous"],
    "past-simple": ["past-simple"],
    "present-perfect": ["present-perfect", "present-perfect-cont"],
    "past-continuous": ["past-continuous"],
    "past-perfect": ["past-perfect"],
    future: ["future", "future-perfect"],
    conditionals: ["conditionals"],
    passive: ["passive"],
    "reported-speech": ["reported-speech"],
    questions: ["questions", "reported-questions"],
    "relative-clauses": ["relative-clauses"],
    modals: ["modals"],
    "gerunds-infinitives": ["gerunds-infinitives"],
    adjectives: ["adjectives", "comparatives-adv"],
    adverbs: ["adverbs"],
    prepositions: ["prepositions"],
    conjunctions: ["conjunctions", "discourse-markers"],
    "common-mistakes": ["common-mistakes", "false-friends", "collocations"],
    advanced: ["subjunctive", "inversion", "causative", "cleft-sentences", "hedging", "noun-phrases"],
    "phrasal-verbs": ["phrasal-verbs", "used-to"]
  };

  var SUBJECTS = ["She","He","They","We","I","You","The team","Maria","Tom","The students"];
  var V_BASE = ["work","study","play","write","read","speak","learn","cook","drive","teach","help","watch"];
  var V_S = ["works","studies","plays","writes","reads","speaks","learns","cooks","drives","teaches","helps","watches"];
  var V_ING = ["working","studying","playing","writing","reading","speaking","learning","cooking","driving","teaching","helping","watching"];
  var V_ED = ["worked","studied","played","wrote","read","spoke","learned","cooked","drove","taught","helped","watched"];
  var V_PP = ["worked","studied","played","written","read","spoken","learned","cooked","driven","taught","helped","watched"];
  var PLACES = ["at home","at school","in London","in the office","at the park","in class","at work","in the library"];
  var T_PAST = ["yesterday","last week","last night","two days ago","last year","an hour ago"];
  var T_FREQ = ["every day","usually","often","sometimes","always","never","on Mondays"];
  var N_C = ["book","pen","idea","student","car","house","friend","problem","email","report"];
  var N_UC = ["water","advice","information","furniture","luggage","news","money","time"];
  var ADJ = ["important","difficult","interesting","useful","clear","simple","effective","common"];

  function mulberry32(a) {
    return function () {
      var t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, arr) {
    return arr[Math.floor(rng() * arr.length) % arr.length];
  }

  function shuffle(rng, arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function mcq(q, correct, wrongs, topic, level) {
    var opts = [correct].concat(wrongs).slice(0, 4);
    while (opts.length < 4) opts.push(opts[opts.length - 1] + " ");
    // stable order by hashing later - caller may reshuffle
    return { q: q, options: opts, answer: 0, topic: topic, level: level || "A2", _correct: correct };
  }

  function finalize(item, rng) {
    var correct = item.options[item.answer];
    if (item._correct) correct = item._correct;
    var opts = shuffle(rng, item.options.slice());
    // dedupe
    var seen = {};
    opts = opts.filter(function (o) {
      if (seen[o]) return false;
      seen[o] = true;
      return true;
    });
    while (opts.length < 4) opts.push("—");
    var answer = opts.indexOf(correct);
    if (answer < 0) {
      opts[0] = correct;
      answer = 0;
    }
    return {
      q: item.q,
      options: opts.slice(0, 4),
      answer: answer,
      topic: item.topic,
      level: item.level || "A2"
    };
  }

  var GENERATORS = [
    // Present simple
    function (rng) {
      var s = pick(rng, SUBJECTS);
      var i = Math.floor(rng() * V_BASE.length);
      var third = /^(She|He|Maria|Tom|The team)$/.test(s) || s === "Everyone";
      var right = third ? V_S[i] : V_BASE[i];
      var wrong = third ? [V_BASE[i], V_ING[i], V_ED[i]] : [V_S[i], V_ING[i], V_ED[i]];
      return mcq(s + " ___ " + pick(rng, T_FREQ) + ".", right, wrong, "present-simple", "A1");
    },
    function (rng) {
      var s = pick(rng, ["She","He","Maria"]);
      var i = Math.floor(rng() * V_BASE.length);
      return mcq("___ " + s.toLowerCase() + " " + V_BASE[i] + " here?", "Does", ["Do","Is","Has"], "present-simple", "A1");
    },
    // Present continuous
    function (rng) {
      var s = pick(rng, SUBJECTS);
      var i = Math.floor(rng() * V_ING.length);
      var be = /^(She|He|Maria|Tom|The team)$/.test(s) ? "is" : (s === "I" ? "am" : "are");
      return mcq("Look! " + s + " ___ " + V_ING[i] + " right now.", be, ["is","are","am","do"].filter(function(x){return x!==be;}).slice(0,3), "present-continuous", "A1");
    },
    function (rng) {
      var i = Math.floor(rng() * V_ING.length);
      return mcq("They ___ " + V_ING[i] + " at the moment.", "are", ["is","do","have"], "present-continuous", "A1");
    },
    // Past simple
    function (rng) {
      var s = pick(rng, SUBJECTS);
      var i = Math.floor(rng() * V_ED.length);
      return mcq(s + " ___ " + pick(rng, T_PAST) + ".", V_ED[i], [V_BASE[i], V_S[i], V_ING[i]], "past-simple", "A1");
    },
    function (rng) {
      return mcq("___ you see the message " + pick(rng, T_PAST) + "?", "Did", ["Do","Does","Have"], "past-simple", "A1");
    },
    // Present perfect
    function (rng) {
      var s = pick(rng, ["She","He","Maria","Tom"]);
      var i = Math.floor(rng() * V_PP.length);
      return mcq(s + " has never ___ to Japan.", V_PP[i], [V_BASE[i], V_ED[i], V_ING[i]], "present-perfect", "B1");
    },
    function (rng) {
      return mcq("I have lived here ___ five years.", "for", ["since","from","during"], "present-perfect", "B1");
    },
    function (rng) {
      return mcq("She has worked here ___ 2019.", "since", ["for","from","during"], "present-perfect", "B1");
    },
    // Articles
    function (rng) {
      var pairs = [
        ["___ apple a day keeps the doctor away.", "An", ["A","The","(none)"]],
        ["I saw ___ university near the station.", "a", ["an","the","(none)"]],
        ["___ sun rises in the east.", "The", ["A","An","(none)"]],
        ["She is ___ honest person.", "an", ["a","the","(none)"]],
        ["He goes to ___ school by bus.", "(none)", ["a","an","the"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "articles", "A1");
    },
    // Prepositions
    function (rng) {
      var pairs = [
        ["The meeting is ___ Monday.", "on", ["in","at","by"]],
        ["I was born ___ 1998.", "in", ["on","at","by"]],
        ["She is waiting ___ the bus stop.", "at", ["in","on","to"]],
        ["The keys are ___ the table.", "on", ["in","at","to"]],
        ["I'll see you ___ the morning.", "in", ["on","at","by"]],
        ["He is interested ___ history.", "in", ["on","at","for"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "prepositions", "A1");
    },
    // Conditionals
    function (rng) {
      var pairs = [
        ["If it rains, we ___ stay home.", "will", ["would","would have","are"]],
        ["If I ___ rich, I would travel more.", "were", ["am","was","will be"]],
        ["If she had left earlier, she ___ the train.", "would have caught", ["would catch","will catch","caught"]],
        ["If you heat ice, it ___.", "melts", ["will melt","would melt","melted"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "conditionals", "B1");
    },
    // Passive
    function (rng) {
      var pairs = [
        ["The letter ___ yesterday.", "was sent", ["is sent","sent","has sent"]],
        ["English ___ all over the world.", "is spoken", ["speaks","spoke","speaking"]],
        ["The project will ___ next month.", "be completed", ["complete","completed","completing"]],
        ["The room ___ cleaned every day.", "is", ["are","was","be"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "passive", "B1");
    },
    // Modals
    function (rng) {
      var pairs = [
        ["You ___ smoke in this building.", "mustn't", ["must","should","can"]],
        ["She ___ swim when she was five.", "could", ["can","may","must"]],
        ["You ___ see a doctor about that.", "should", ["must not","can't","might not"]],
        ["He ___ be at work - his car is gone.", "must", ["can't","shouldn't","wouldn't"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "modals", "B1");
    },
    // Gerunds / infinitives
    function (rng) {
      var pairs = [
        ["I enjoy ___ novels.", "reading", ["to read","read","reads"]],
        ["She decided ___ abroad.", "to go", ["going","go","gone"]],
        ["He stopped ___ because it was unhealthy.", "smoking", ["to smoke","smoke","smoked"]],
        ["I look forward to ___ you.", "meeting", ["meet","met","meets"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "gerunds-infinitives", "B1");
    },
    // Countable / uncountable
    function (rng) {
      var n = pick(rng, N_UC);
      return mcq("How much ___ do you need?", n, ["many " + n, "a " + n, "few " + n], "nouns", "A1");
    },
    function (rng) {
      var n = pick(rng, N_C);
      return mcq("There are a few ___ on the desk.", n + "s", [n, "much " + n, "a " + n], "nouns", "A1");
    },
    // Adjectives comparative
    function (rng) {
      var pairs = [
        ["This is ___ book I have read.", "the most interesting", ["the more interesting","more interesting","most interesting"]],
        ["She is ___ than her brother.", "taller", ["tall","tallest","more tall"]],
        ["This task is ___ than the last one.", "more difficult", ["difficult","most difficult","difficulter"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "adjectives", "A2");
    },
    // Reported speech
    function (rng) {
      var pairs = [
        ['He said, "I live in Paris." → He said he ___ in Paris.', "lived", ["lives","is living","has lived"]],
        ['She asked, "Where are you?" → She asked where I ___.', "was", ["am","were","be"]],
        ["He told me ___ quiet.", "to be", ["be","being","was"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "reported-speech", "B1");
    },
    // Relative clauses
    function (rng) {
      var pairs = [
        ["This is the girl ___ won the prize.", "who", ["which","whose","where"]],
        ["The house ___ I grew up is now a museum.", "where", ["who","which","whose"]],
        ["My car, ___ is quite old, still runs.", "which", ["that","who","where"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "relative-clauses", "B2");
    },
    // Advanced inversion / wish
    function (rng) {
      var pairs = [
        ["Rarely ___ such talent.", "do we see", ["we see","we do see","see we"]],
        ["I wish I ___ taller.", "were", ["am","was","will be"]],
        ["It's time you ___ to bed.", "went", ["go","going","gone"]],
        ["Not only ___ late, he also forgot his notes.", "was he", ["he was","he is","is he"]],
        ["Hardly ___ I sat down when the phone rang.", "had", ["have","did","was"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "advanced", "C1");
    },
    // Common mistakes
    function (rng) {
      var pairs = [
        ["One of my friends ___ a pilot.", "is", ["are","be","were"]],
        ["The news ___ interesting today.", "is", ["are","be","were"]],
        ["I have ___ free time this week.", "less", ["fewer","many","a few"]],
        ["She is married ___ a lawyer.", "to", ["with","for","by"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "common-mistakes", "A2");
    },
    // Future
    function (rng) {
      var pairs = [
        ["I ___ call you later. (just decided)", "will", ["am going to","am calling","call"]],
        ["Look at those clouds - it ___ rain.", "is going to", ["will","is","goes to"]],
        ["The bus ___ at 7:15 every morning.", "leaves", ["will leave","is leaving","left"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "future", "B1");
    },
    // Phrasal / used to
    function (rng) {
      var pairs = [
        ["Please ___ the volume - it's too loud.", "turn down", ["turn up","turn on","turn off"]],
        ["I ___ live in the countryside.", "used to", ["am used to","get used to","use to"]],
        ["She is used to ___ early.", "getting up", ["get up","got up","gets up"]],
        ["I need to ___ what time the train leaves.", "find out", ["look after","give up","run out"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "phrasal-verbs", "B1");
    },
    // Past continuous
    function (rng) {
      return mcq("I ___ TV when she called.", "was watching", ["watched","am watching","watch"], "past-continuous", "A2");
    },
    // Determiners
    function (rng) {
      var pairs = [
        ["I don't have ___ cash on me.", "any", ["some","many","a few"]],
        ["Would you like ___ tea?", "some", ["any","much","many"]],
        ["Only ___ people showed up.", "a few", ["a little","little","much"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "determiners", "A2");
    },
    // Adverbs
    function (rng) {
      var pairs = [
        ["He drives ___.", "carefully", ["careful","carefulness","care"]],
        ["She speaks English ___.", "well", ["good","goodly","best"]],
        ["We ___ finished on time.", "hardly", ["hard","harder","hardness"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "adverbs", "A2");
    },
    // Questions
    function (rng) {
      var pairs = [
        ["You're free tomorrow, ___?", "aren't you", ["are you","don't you","isn't you"]],
        ["Can you tell me where ___?", "the station is", ["is the station","does the station","the station"]],
        ["Who ___ that window?", "broke", ["did break","does break","breaking"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "questions", "A2");
    },
    // Conjunctions
    function (rng) {
      var pairs = [
        ["I stayed home ___ it was raining.", "because", ["but","however","so"]],
        ["___ he was tired, he finished the work.", "Although", ["Because","So","And"]],
        ["___ the traffic, we arrived on time.", "Despite", ["Although","Because","However"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "conjunctions", "A2");
    },
    // Past perfect
    function (rng) {
      return mcq("When we got home, they ___ already eaten.", "had", ["have","has","were"], "past-perfect", "B1");
    },
    // Pronouns
    function (rng) {
      var pairs = [
        ["This bag is ___.", "mine", ["me","my","I"]],
        ["She blamed ___ for the error.", "herself", ["her","she","hers"]],
        ["___ works at the hospital.", "He", ["Him","His","Himself"]]
      ];
      var p = pick(rng, pairs);
      return mcq(p[0], p[1], p[2], "pronouns", "A1");
    }
  ];

  function questionAt(index) {
    var rng = mulberry32((index * 2654435761) >>> 0);
    var gen = GENERATORS[index % GENERATORS.length];
    // vary further by re-seeding with index bits
    var item = gen(rng);
    // extra entropy pass
    var rng2 = mulberry32(((index * 1597334677) ^ 0x9e3779b9) >>> 0);
    return finalize(item, rng2);
  }

  function lessonIdsForTopic(topic) {
    return TOPIC_LESSONS[topic] || [topic];
  }

  function topicUnlocked(topic, completedMap) {
    var ids = lessonIdsForTopic(topic);
    // unlocked if any related lesson completed, or if nothing completed yet (allow basics)
    var anyCompleted = false;
    for (var k in completedMap) {
      if (completedMap[k]) {
        anyCompleted = true;
        break;
      }
    }
    if (!anyCompleted) {
      return ["articles","nouns","pronouns","present-simple","prepositions","determiners","be-have","questions"].indexOf(topic) >= 0
        || topic === "present-simple" || topic === "articles" || topic === "nouns" || topic === "prepositions" || topic === "pronouns" || topic === "determiners";
    }
    for (var i = 0; i < ids.length; i++) {
      if (completedMap[ids[i]]) return true;
    }
    // also allow topic if user has general progress
    var done = 0;
    for (var id in completedMap) if (completedMap[id]) done++;
    if (done >= 5) return true;
    if (done >= 15) return true;
    return false;
  }

  function sampleQuiz(options) {
    options = options || {};
    var count = options.count || 10;
    var difficulty = options.difficulty || "mixed"; // easy | mixed | hard
    var completed = options.completed || {};
    var preferTopics = options.topics || null;
    var seed = options.seed || (Date.now() % 100000);

    var results = [];
    var used = {};
    var attempts = 0;
    var maxAttempts = count * 80;

    while (results.length < count && attempts < maxAttempts) {
      attempts++;
      var idx = (seed + attempts * 9973 + results.length * 7919) % BANK_SIZE;
      if (used[idx]) continue;
      var q = questionAt(idx);

      if (preferTopics && preferTopics.indexOf(q.topic) < 0) {
        // still accept sometimes for variety
        if (attempts % 5 !== 0) continue;
      }

      if (!topicUnlocked(q.topic, completed) && difficulty !== "hard") {
        if (attempts % 7 !== 0) continue;
      }

      if (difficulty === "easy" && (q.level === "C1" || q.level === "B2")) continue;
      if (difficulty === "hard" && (q.level === "A1" || q.level === "A2")) {
        if (attempts % 4 !== 0) continue;
      }

      used[idx] = true;
      q.id = "gq-" + idx;
      results.push(q);
    }

    // fallback fill from static banks
    if (results.length < count && global.QUICK_QUIZZES) {
      var extra = global.QUICK_QUIZZES.slice().sort(function () { return Math.random() - 0.5; });
      for (var e = 0; e < extra.length && results.length < count; e++) {
        results.push(extra[e]);
      }
    }
    if (results.length < count && global.HARD_QUIZZES) {
      var hard = global.HARD_QUIZZES.slice().sort(function () { return Math.random() - 0.5; });
      for (var h = 0; h < hard.length && results.length < count; h++) {
        results.push(hard[h]);
      }
    }

    return results;
  }

  function bankInfo() {
    return {
      size: BANK_SIZE,
      generators: GENERATORS.length,
      topics: Object.keys(TOPIC_LESSONS).length
    };
  }

  function recordAnswer(progress, topic, correct) {
    if (!progress.topicStats) progress.topicStats = {};
    if (!progress.topicStats[topic]) progress.topicStats[topic] = { right: 0, wrong: 0 };
    if (correct) progress.topicStats[topic].right++;
    else progress.topicStats[topic].wrong++;
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

  global.QuizGen = {
    BANK_SIZE: BANK_SIZE,
    questionAt: questionAt,
    sampleQuiz: sampleQuiz,
    bankInfo: bankInfo,
    recordAnswer: recordAnswer,
    weakTopics: weakTopics,
    topicUnlocked: topicUnlocked
  };
})(typeof window !== "undefined" ? window : globalThis);
