/* Вишлист v2 — презентация.
   Сценарии сгруппированы по ролям, каждый слайд проигрывается сам:
   курсор наводится на нужный элемент, «нажимает» и состояние меняется. */
(function () {
  'use strict';
  var V = window.Vue, WL = window.WL;
  var reactive = V.reactive, computed = V.computed;
  var A = WL.A, st = WL.store;

  /* ───────── подготовка состояния ───────── */
  function base() {
    st.sheet = null; st.openMenu = null; st.spot = null;
    st.listView = 'items';
    st.ideasFor = 'self';
    A.clearIdeasFilter();
  }
  function el(sel) { return document.querySelector(sel); }
  function nth(sel, n) { var all = document.querySelectorAll(sel); return all[n || 0] || null; }
  function firstIdeaOf(key) {
    var cols = st.recipientCols[st.recipientId] || st.collections;
    var col = cols.find(function (c) { return c.key === key; }) || cols[0];
    return A.live(col.items)[0];
  }

  /* ───────── сценарии ─────────
     Три роли — три вопроса: «чтобы мне подарили нужное», «мне выпал человек»,
     «дарим вместе». Внутри роли слайды идут по ходу дела. */
  var GROUPS = [
    { key: 'owner', title: 'Владелец вишлиста', lead: 'Чтобы мне подарили то, что нужно', stories: [
      { route: 'ideas', nav: 'Собираю идеи', pre: base,
        title: 'Мне показывают идеи и объясняют, почему именно эти',
        sub: 'У каждой карточки есть причина: смотрел похожее, в бюджете, к сезону. Понравилось — одна кнопка, и вещь в вишлисте.',
        steps: [
          { hint: 'Значок ⓘ у цены объясняет, почему идею показали именно вам',
            at: function () { return nth('.carousel .why'); } },
          { hint: 'Жмём ♥ — идея сразу попадает в вишлист справа',
            at: function () { return nth('.carousel .wantbtn'); },
            run: function () { var i = st.ideasSelf.filter(function (x) { return !x.gone && !x.saved; })[0];
                               if (i) A.addIdeaToList(i); A.spotlight('rail'); } },
          { hint: 'Жмём ✕ «не моё» — карточка исчезает, дальше таких не покажут',
            at: function () { return nth('.carousel .present__dismiss'); },
            run: function () { var i = st.ideasSelf.filter(function (x) { return !x.gone; })[0];
                               if (i) A.dismissIdea(i); } },
          { hint: 'Внизу — бесконечная лента: если ничего не выбрали, просто листайте',
            at: function () { return el('.feed .section-title'); } }
        ] },

      { route: 'lists', nav: 'Раскладываю по поводам', pre: base,
        title: 'Я веду отдельные вишлисты и помечаю, что хочу сильнее всего',
        sub: 'День рождения, Новый год, коллегам — разные поводы не смешиваются. Внутри каждого три приоритета.',
        steps: [
          { hint: 'В шапке видно дату, число подарков и сколько уже разобрали',
            at: function () { return el('.hero__meta'); } },
          { hint: 'Три приоритета сверху вниз — дарителю ясно, с чего начинать',
            at: function () { return nth('.tier__label'); } },
          { hint: 'Кликаем другой вишлист справа — страница переключается на него',
            at: function () { return nth('.wl-rail__row--list', 1); },
            run: function () { var i = st.lists.findIndex(function (l) { return l.id === st.currentListId; });
                               A.setList(st.lists[(i + 1) % st.lists.length].id); A.spotlight('rail'); } },
          { hint: 'Кнопка «Обложка» — можно поставить свой файл или готовый фон',
            at: function () { return el('.hero__cover'); },
            run: function () { A.openSheet('cover'); } },
          { hint: 'Закрываем окно', at: function () { return el('.sheet__x'); }, run: function () { A.closeSheet(); } }
        ] },

      { route: 'lists', nav: 'Делюсь и вижу отклик', pre: function () { base(); st.listView = 'activity'; },
        title: 'Я вижу, что вишлист работает — но не вижу, кто что сделал',
        sub: 'Просмотры, переходы в магазины и сколько уже разобрано. Без имён: сюрприз остаётся сюрпризом.',
        steps: [
          { hint: 'Сколько раз вишлист смотрели и переходили в магазины',
            at: function () { return nth('.stat'); } },
          { hint: 'Переключаем период — цифры пересчитываются',
            at: function () { return nth('.segbar .seg', 1); },
            run: function () { st.period = st.period === '7' ? '30' : '7'; A.spotlight('screen'); } },
          { hint: 'Видно, чем интересуются, но имён дарителей нет — сюрприз цел',
            at: function () { return nth('.rlist .rrow'); } },
          { hint: 'Возвращаемся к списку подарков',
            at: function () { return nth('.hero__acts .hact', 3); },
            run: function () { A.toggleActivity(); } }
        ] }
    ] },

    { key: 'santa', title: 'Тайный Санта', lead: 'Мне выпал человек — что дарить?', stories: [
      { route: 'ideas', nav: 'Мне выпал человек', pre: function () { base(); A.setIdeasTarget('r1'); },
        title: 'Мне выпал человек из игры — и подборка сразу под него',
        sub: 'Подопечные подтягиваются из игр «Мой Санта». Страница перестраивается: сначала то, что человек просил сам, потом — по его интересам.',
        steps: [
          { hint: 'Открываем список: кому подбираем подарок',
            at: function () { return el('.whoswitch'); },
            run: function () { A.toggleMenu('who'); } },
          { hint: 'Подопечные из игр «Мой Санта» — с названием игры под именем',
            at: function () { return nth('.dd__person', 1); } },
          { hint: 'Выбираем Игоря — вся страница перестроится под него',
            at: function () { return nth('.dd__person', 2); },
            run: function () { A.setIdeasTarget('r2'); } },
          { hint: 'Первый блок — то, что человек попросил сам в своём вишлисте',
            at: function () { return nth('.carousel .section-title'); } },
          { hint: 'Второй — подобрано по интересам из его анкеты',
            at: function () { return nth('.carousel .section-title', 1); } }
        ] },

      { route: 'shortlist', nav: 'Собираю подборку', pre: function () {
          base(); A.setIdeasTarget('r1');
          if (st.shortlists.r1.length < 3) {
            (st.recipientCols.r1 || st.collections)[0].items.slice(0, 3).forEach(A.addToShortlist);
          }
          st.route = 'shortlist';
        },
        title: 'Складываю кандидатов и выбираю одного',
        sub: 'Подборку видит только Санта. Резервировать нечего: в игре подарок дарит один человек — вы.',
        steps: [
          { hint: 'Подборка видна только вам: человек в неё не заглянет',
            at: function () { return el('.shortlist-hint'); } },
          { hint: 'Крестик убирает кандидата из подборки',
            at: function () { return nth('.grid .present__dismiss'); },
            run: function () { var it = st.shortlists[st.recipientId][0]; if (it) A.removeFromShortlist(it); } },
          { hint: 'Отсюда можно свериться с его собственным вишлистом',
            at: function () { return el('.shortlist-note .btn'); } }
        ] }
    ] },

    { key: 'together', title: 'Дарим вместе', lead: 'Когда дарителей несколько', stories: [
      { route: 'ideas', nav: 'Свой человек', pre: function () { base(); A.setIdeasTarget('r3'); },
        title: 'Добавляю человека сам — и подбираю по его анкете',
        sub: 'Пол, возраст и интересы сразу превращаются в фильтры. Подборку потом можно показать тем, кто дарит вместе с вами.',
        steps: [
          { hint: 'Открываем список людей',
            at: function () { return el('.whoswitch'); },
            run: function () { A.toggleMenu('who'); } },
          { hint: 'Шестерёнка есть только у своих людей — открывает их анкету',
            at: function () { return el('.dd__cog'); },
            run: function () { A.editPerson(st.recipients.find(function (r) { return r.id === 'r3'; })); } },
          { hint: 'Отмечаем интерес — по нему подстроятся фильтры идей',
            at: function () { return nth('.tagcloud .tagchip', 4); },
            run: function () { A.togglePersonInterest('кухня'); } },
          { hint: 'Сохраняем анкету',
            at: function () { return nth('.sheet__foot .btn', 1); },
            run: function () { A.createPerson(); } },
          { hint: 'Фильтры встали сами: пол, возраст и интересы из анкеты',
            at: function () { return el('.ideafilters'); }, run: function () { A.spotlight('screen'); } }
        ] },

      { route: 'shared', nav: 'Резервирую подарок', pre: base,
        title: 'Смотрю чужой вишлист и резервирую, чтобы не купили дважды',
        sub: 'Владелец видит только счётчик. Кто именно занял подарок — остаётся тайной.',
        steps: [
          { hint: 'Так чужой вишлист видит даритель',
            at: function () { return el('.sharenote'); } },
          { hint: 'Резервируем — подарок помечается занятым для остальных',
            at: function () { return nth('.wantbtn--hold'); },
            run: function () { var it = st.lists[0].items.filter(function (i) { return !i.reserved; })[0];
                               if (it) A.reserve(it, 'you'); } },
          { hint: 'Занятое другим взять нельзя — но кто занял, не показывают',
            at: function () { return nth('.wantbtn--label'); } },
          { hint: 'Передумали — снимаем резерв одним нажатием',
            at: function () { return nth('.wantbtn--label.is-on'); },
            run: function () { var it = st.lists[0].items.filter(function (i) { return i.reserved === 'you'; })[0];
                               if (it) A.reserve(it, null); } }
        ] },

      { route: 'pool', nav: 'Скидываемся', pre: function () {
          base();
          var target = null;
          st.lists.forEach(function (l) { l.items.forEach(function (i) { if (!target && i.pool) target = i; }); });
          if (target) { st.poolItemId = target.id; st.pledgeDone = false; }
        },
        title: 'Скидываемся на один дорогой подарок',
        sub: 'Сбор и участники видны всем. Подарок закрепляется за дарителем только после вклада — открыть сбор мало.',
        steps: [
          { hint: 'Видно, сколько собрано и кто уже скинулся',
            at: function () { return el('.pot'); } },
          { hint: 'Выбираем свою сумму',
            at: function () { return nth('.presets button', 2); },
            run: function () { A.setPledge(500); } },
          { hint: 'Вносим — только теперь подарок закрепляется за нами',
            at: function () { return nth('.pool__form .btn'); },
            run: function () { A.addPledge(); A.spotlight('screen'); } }
        ] }
    ] }
  ];

  var STORIES = [];
  GROUPS.forEach(function (g) {
    g.stories.forEach(function (s) { s.group = g; s.index = STORIES.length; STORIES.push(s); });
  });

  /* ───────── колода ───────── */
  var deck = reactive({ i: 0 });
  /* курсор автопоказа */
  var demo = reactive({ on: false, x: -100, y: -100, down: false, hint: '', step: -1,
                        total: 0, flipX: false, flipY: false,
                        /* прямоугольник подсвеченного элемента: вокруг него затемняем всё */
                        hl: null });
  var timer = null, run = 0;

  function stop() {
    run++; clearTimeout(timer);
    demo.on = false; demo.down = false; demo.step = -1; demo.hint = ''; demo.hl = null;
  }
  /* Цель может оказаться за пределами окна — сначала подкручиваем к ней страницу,
     иначе курсор укажет туда, где зритель ничего не видит.
     Возвращаем, сколько ждать, пока прокрутка доедет. */
  function ensureVisible(node) {
    if (!node || !node.getBoundingClientRect) return 0;
    var r = node.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var pad = 110;                       /* запас под подсказку сверху и снизу */
    if (r.top >= pad && r.bottom <= vh - pad) return 0;
    if (node.scrollIntoView) {
      try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
      catch (e) { node.scrollIntoView(); }
    }
    return 650;
  }

  function moveTo(node) {
    if (!node || !node.getBoundingClientRect) { demo.hl = null; return false; }
    var r = node.getBoundingClientRect();
    if (!r.width && !r.height) { demo.hl = null; return false; }
    demo.x = r.left + r.width / 2;
    demo.y = r.top + r.height / 2;
    var pad = 8;
    demo.hl = { left: r.left - pad, top: r.top - pad,
                width: r.width + pad * 2, height: r.height + pad * 2 };
    /* у правого/нижнего края подсказку разворачиваем, иначе она уедет за экран */
    var vw = window.innerWidth || 1280, vh = window.innerHeight || 800;
    demo.flipX = demo.x > vw - 330;
    demo.flipY = demo.y > vh - 150;
    return true;
  }
  /* проигрываем шаги слайда, затем переходим к следующему */
  function play(from) {
    var my = ++run;
    demo.on = true;
    var steps = STORIES[deck.i].steps || [];
    var k = typeof from === 'number' ? from : 0;
    demo.total = steps.length;

    function step() {
      if (my !== run) return;
      if (k >= steps.length) {
        timer = setTimeout(function () {
          if (my !== run) return;
          if (deck.i < STORIES.length - 1) { goStory(deck.i + 1, true); }
          else { stop(); }
        }, 900);
        return;
      }
      var s = steps[k];
      demo.step = k;
      demo.hint = s.hint;
      var node = s.at ? s.at() : null;
      var scroll = ensureVisible(node);
      timer = setTimeout(function () {
        if (my !== run) return;
        moveTo(node);                       /* координаты берём уже после прокрутки */
        timer = setTimeout(function () {
          if (my !== run) return;
          demo.down = true;
          timer = setTimeout(function () {
            if (my !== run) return;
            demo.down = false;
            if (s.run) s.run();
            k += 1;
            /* держим шаг тем дольше, чем длиннее подсказка: примерно 11 знаков в секунду */
            timer = setTimeout(step, Math.min(4200, 1500 + (s.hint || '').length * 42));
          }, 240);
        }, 1150);
      }, scroll);
    }
    timer = setTimeout(step, 700);
  }

  function goStory(n, keepPlaying) {
    var wasOn = keepPlaying || demo.on;
    stop();
    deck.i = Math.max(0, Math.min(STORIES.length - 1, n));
    STORIES[deck.i].pre();
    st.route = STORIES[deck.i].route;
    st.sheet = STORIES[deck.i].route === 'pool' ? null : st.sheet;
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    if (wasOn) V.nextTick(function () { play(0); });
  }
  function toggle() { if (demo.on) stop(); else play(0); }

  /* переход внутри экрана не должен перескакивать между слайдами одного маршрута */
  WL.onNavigate = function (route) {
    if (STORIES[deck.i].route === route) return;
    var i = -1;
    for (var k = 0; k < STORIES.length; k++) { if (STORIES[k].route === route) { i = k; break; } }
    if (i >= 0) goStory(i);
  };

  var app = V.createApp({
    setup: function () {
      var story = computed(function () { return STORIES[deck.i]; });
      var screenComp = computed(function () { return WL.screenByRoute[st.route]; });
      var showRail = computed(function () { return st.route === 'lists' || st.route === 'ideas'; });
      return { deck: deck, demo: demo, store: st, story: story, screenComp: screenComp,
               showRail: showRail, stories: STORIES, groups: GROUPS,
               goStory: goStory, toggle: toggle, stop: stop };
    },
    template: [
      '<div class="deck">',
      '  <header class="deck__top">',
      '    <div class="deck__brand">🎁 Вишлист v2 <span class="proto">презентация</span></div>',
      '    <button class="deck__play" :class="{\'is-on\':demo.on}" @click="toggle()">',
      '      <svg v-if="demo.on" viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>',
      '      <svg v-else viewBox="0 0 24 24" width="15" height="15"><path fill="currentColor" d="M8 5.5v13l11-6.5z"/></svg>',
      '      {{ demo.on ? "Пауза" : "Показать" }}',
      '    </button>',
      '    <a class="deck__switch" href="prototype/">Открыть прототип →</a>',
      '    <div class="stepper">',
      '      <button class="stepper__btn" @click="goStory(deck.i-1)" aria-label="Назад">',
      '        <svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m14.5 5.5-7 6.5 7 6.5"/></svg>',
      '      </button>',
      '      <span class="stepper__count">{{ deck.i+1 }} / {{ stories.length }}</span>',
      '      <button class="stepper__btn" @click="goStory(deck.i+1)" aria-label="Вперёд">',
      '        <svg viewBox="0 0 24 24" width="17" height="17"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m9.5 5.5 7 6.5-7 6.5"/></svg>',
      '      </button>',
      '    </div>',
      '  </header>',
      '  <div class="deck__body">',
      '    <nav class="deck__rail">',
      '      <section v-for="g in groups" :key="g.key" class="deck__group">',
      '        <h2 class="deck__grouptitle">{{ g.title }}</h2>',
      '        <p class="deck__grouplead">{{ g.lead }}</p>',
      '        <ol>',
      '          <li v-for="s in g.stories" :key="s.index">',
      '            <button :class="{\'is-on\':s.index===deck.i}" @click="goStory(s.index)">',
      '              <span class="num">{{ (s.index+1<10?"0":"")+(s.index+1) }}</span>{{ s.nav }}',
      '            </button>',
      '          </li>',
      '        </ol>',
      '      </section>',
      '    </nav>',
      '    <main class="deck__stage">',
      '      <p class="eyebrow">{{ story.group.title }} · {{ deck.i+1 }} из {{ stories.length }}</p>',
      '      <h1 class="story-title">{{ story.title }}</h1>',
      '      <p class="story-sub">{{ story.sub }}</p>',
      '      <div class="steplist">',
      '        <span v-for="(s,n) in story.steps" :key="n" class="stepdot" :class="{\'is-on\':n===demo.step,\'is-past\':n<demo.step}"></span>',
      '        <span class="stephint" :class="{\'is-on\':demo.on}">',
      '          {{ demo.on ? "Шаг " + (demo.step+1) + " из " + story.steps.length : "Нажмите «Показать» — сценарий пройдёт сам" }}',
      '        </span>',
      '      </div>',
      '      <div class="deck__stagebody" :class="{\'deck__stagebody--rail\':showRail}">',
      '        <transition name="fade" mode="out-in">',
      '          <div class="screen" :class="{\'is-spot\':store.spot===\'screen\'}"',
      '               :key="store.route + store.listView + store.ideasFor"><component :is="screenComp" /></div>',
      '        </transition>',
      '        <wishlist-rail v-if="showRail" />',
      '      </div>',
      '    </main>',
      '  </div>',
      /* затемняем всё, кроме подсвеченного элемента: «окно» вырезано тенью */
      '  <div v-if="demo.hl" class="demo__hole" :class="{\'is-on\':demo.on,\'is-down\':demo.down}"',
      '       :style="{left:demo.hl.left+\'px\',top:demo.hl.top+\'px\',width:demo.hl.width+\'px\',height:demo.hl.height+\'px\'}"></div>',
      /* курсор и подсказка едут вместе: пояснение всегда у той точки, куда жмём */
      '  <div class="demo" :class="{\'is-on\':demo.on,\'is-down\':demo.down,\'flip-x\':demo.flipX,\'flip-y\':demo.flipY}"',
      '       :style="{transform:\'translate(\'+demo.x+\'px,\'+demo.y+\'px)\'}">',
      '    <span class="demo__ring"></span>',
      '    <svg class="demo__arrow" viewBox="0 0 24 24" width="22" height="22"><path fill="#fff" stroke="#1b1b1f" stroke-width="1.4" stroke-linejoin="round" d="M5.5 3.2 19 12.4l-5.7.6 3 6-2.6 1.2-3-6.1-4 3.7z"/></svg>',
      '    <span class="demo__tip">',
      '      <b>{{ demo.step+1 }}/{{ demo.total }}</b>{{ demo.hint }}',
      '    </span>',
      '  </div>',
      '  <overlay-host />',
      '</div>'
    ].join('')
  });

  WL.register(app);
  app.mount('#app');
  goStory(0);

  document.addEventListener('keydown', function (e) {
    if (e.target && /^(INPUT|TEXTAREA)$/.test(e.target.tagName)) return;
    if (e.key === 'ArrowRight') goStory(deck.i + 1);
    if (e.key === 'ArrowLeft') goStory(deck.i - 1);
    if (e.key === ' ') { e.preventDefault(); toggle(); }
  });
  /* живой клик по макету останавливает автопоказ — управление у зрителя */
  document.addEventListener('pointerdown', function (e) {
    if (!demo.on) return;
    if (e.target && e.target.closest && e.target.closest('.deck__play')) return;
    stop();
  }, true);
})();
