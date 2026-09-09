/* Вишлист v2 — презентация: те же экраны, что и в прототипе, но с подписями и перелистыванием. */
(function () {
  'use strict';
  var V = window.Vue, WL = window.WL;
  var reactive = V.reactive, computed = V.computed;

  /* Каждая история сама приводит состояние в нужный вид — тогда её можно
     открыть в любом порядке и она не покажет остатки предыдущей. */
  var A = WL.A, st = WL.store;
  function base() {
    st.sheet = null;
    st.openMenu = null;
    st.listView = 'items';
    st.ideasFor = 'self';
    st.spot = null;
    A.clearIdeasFilter();
  }
  function firstIdea() {
    var col = st.collections[0];
    return A.live(col.items)[0];
  }
  function freeGift() {
    return st.lists[0].items.filter(function (i) { return !i.reserved; })[0];
  }

  /* Слайды сгруппированы по роли: сначала владелец, потом даритель. */
  var GROUPS = [
    { key: 'own-ideas', title: 'Владелец · Идеи', stories: [
      { route: 'ideas', pre: base, nav: 'Идеи объясняют себя',
        title: 'Мне показывают идеи и объясняют, почему именно эти',
        sub: 'У каждой карточки есть причина: смотрел похожее, в бюджете, к сезону. И я могу сказать «не моё».',
        act: [
          { label: '♥ Добавить в вишлист', run: function () {
              var it = st.ideasSelf.filter(function (i) { return !i.gone && !i.saved; })[0];
              if (it) A.addIdeaToList(it);
              A.spotlight('rail');
            } },
          { label: '✕ Не моё', run: function () {
              var it = st.ideasSelf.filter(function (i) { return !i.gone; })[0];
              if (it) A.dismissIdea(it);
              A.spotlight('screen');
            } }
        ] },
      { route: 'ideas', pre: function () { base(); A.openCollection(st.collections[3]); },
        nav: 'Подборки и фильтры',
        title: 'Я сужаю выбор, а не листаю весь каталог',
        sub: 'Подборки собраны по поводу и бюджету. Активные фильтры видны строкой и снимаются по одному.',
        act: [
          { label: 'Открыть «Для вечеринки»', run: function () { A.openCollection(st.collections[4]); A.spotlight('screen'); } },
          { label: 'Сбросить фильтры', run: function () { A.clearAllFilters(); A.spotlight('screen'); } }
        ] }
    ] },

    { key: 'own-lists', title: 'Владелец · Вишлисты', stories: [
      { route: 'lists', pre: base, nav: 'Вишлисты и приоритеты',
        title: 'Я веду вишлисты по поводам и помечаю, что хочу сильнее всего',
        sub: 'Чтобы даритель сразу понимал, с чего начать, а вишлист не превращался в свалку ссылок.',
        act: [
          { label: 'Переключить вишлист', run: function () {
              var i = st.lists.findIndex(function (l) { return l.id === st.currentListId; });
              A.setList(st.lists[(i + 1) % st.lists.length].id);
              A.spotlight('rail');
            } },
          { label: 'Сменить обложку', run: function () { A.openSheet('cover'); } }
        ] },
      { route: 'lists', pre: function () { base(); st.listView = 'activity'; },
        nav: 'Активность вишлиста',
        title: 'Я вижу, что вишлист работает — но не вижу, кто что сделал',
        sub: 'Просмотры, интерес к вещам и сколько уже разобрано. Без имён — сюрприз цел.',
        act: [
          { label: 'Период: 7 дней', run: function () { st.period = st.period === '7' ? '30' : '7'; A.spotlight('screen'); } },
          { label: 'Вернуться к подаркам', run: function () { A.toggleActivity(); A.spotlight('screen'); } }
        ] }
    ] },

    { key: 'giver', title: 'Даритель', stories: [
      { route: 'ideas', pre: function () { base(); A.setIdeasTarget('r1'); },
        nav: 'Идеи для другого',
        title: 'Я ищу подарок для другого человека — без игры и анкет',
        sub: 'Указываю, кому подбираю: пол, возраст и интересы сразу настраивают фильтры.',
        act: [
          { label: 'Выбрать другого человека', run: function () {
              var i = st.recipients.findIndex(function (r) { return r.id === st.recipientId; });
              A.setIdeasTarget(st.recipients[(i + 1) % st.recipients.length].id);
              A.spotlight('rail');
            } },
          { label: '＋ В подборку', run: function () { var it = firstIdea(); if (it) A.addToShortlist(it); A.spotlight('rail'); } }
        ] },
      { route: 'shortlist', pre: function () {
          base(); A.setIdeasTarget('r1');
          if (!st.shortlists.r1.length) st.collections[0].items.slice(0, 3).forEach(A.addToShortlist);
          st.route = 'shortlist';
        },
        nav: 'Личная подборка',
        title: 'Я складываю кандидатов в подборку — человек её не видит',
        sub: 'Здесь можно сравнить варианты и довести один до конца: зарезервировать или собрать на него деньги.',
        act: [
          { label: 'Добавить кандидата', run: function () {
              var cols = st.recipientCols[st.recipientId] || st.collections;
              var pool = cols[cols.length - 1].items;
              var it = pool.filter(function (x) { return !A.inShortlist(x); })[0];
              if (it) A.addToShortlist(it);
              A.spotlight('screen');
            } },
          { label: 'Убрать первого', run: function () {
              var it = st.shortlists[st.recipientId][0];
              if (it) A.removeFromShortlist(it);
              A.spotlight('screen');
            } }
        ] },
      { route: 'shared', pre: base, nav: 'Резерв подарка',
        title: 'Я резервирую подарок, чтобы никто не купил его дважды',
        sub: 'Владелец видит только счётчик — кто именно занял подарок, остаётся тайной.',
        act: [
          { label: 'Зарезервировать первый', run: function () { var it = freeGift(); if (it) A.reserve(it, 'you'); A.spotlight('screen'); } },
          { label: 'Освободить', run: function () {
              var it = st.lists[0].items.filter(function (i) { return i.reserved === 'you'; })[0];
              if (it) A.reserve(it, null);
              A.spotlight('screen');
            } }
        ] },
      { route: 'pool', pre: function () {
          base();
          var target = null;
          st.lists.forEach(function (l) { l.items.forEach(function (i) { if (!target && i.pool) target = i; }); });
          if (target) { st.poolItemId = target.id; st.pledgeDone = false; }
        }, nav: 'Скинуться вместе',
        title: 'Мы скидываемся на один дорогой подарок вместе',
        sub: 'Сбор и участники видны всем. Подарок занимается за дарителем только после вклада.',
        act: [
          { label: 'Внести 500 ₽', run: function () { A.setPledge(500); A.addPledge(); A.spotlight('screen'); } }
        ] }
    ] }
  ];

  /* плоский список для степпера и клавиш */
  var STORIES = [];
  GROUPS.forEach(function (g) {
    g.stories.forEach(function (s) { s.group = g; s.index = STORIES.length; STORIES.push(s); });
  });

  var deck = reactive({ i: 0 });
  function goStory(n) {
    deck.i = Math.max(0, Math.min(STORIES.length - 1, n));
    STORIES[deck.i].pre();
    WL.store.route = STORIES[deck.i].route;
    WL.store.sheet = null;
    if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  /* переход из экрана (например «Открыть как даритель») перелистывает колоду */
  WL.onNavigate = function (route) {
    /* если текущая история уже про этот маршрут — не перескакиваем
       (истории 1 и 6 обе про «Мои вишлисты») */
    if (STORIES[deck.i].route === route) return;
    var i = -1;
    for (var k = 0; k < STORIES.length; k++) { if (STORIES[k].route === route) { i = k; break; } }
    if (i >= 0) goStory(i);
  };

  var app = V.createApp({
    setup: function () {
      var story = computed(function () { return STORIES[deck.i]; });
      /* экран берём из текущего маршрута — тогда переходы внутри экранов
         (подборка, сбор) работают и в презентации */
      var screenComp = computed(function () { return WL.screenByRoute[WL.store.route]; });
      var showRail = computed(function () { return WL.store.route === 'lists' || WL.store.route === 'ideas'; });
      return { deck: deck, store: WL.store, story: story, screenComp: screenComp,
               showRail: showRail, stories: STORIES, groups: GROUPS, goStory: goStory };
    },
    template: [
      '<div class="deck">',
      '  <header class="deck__top">',
      '    <div class="deck__brand">🎁 Вишлист v2 <span class="proto">презентация</span></div>',
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
      '        <ol>',
      '          <li v-for="s in g.stories" :key="s.index">',
      '            <button :class="{\'is-on\':s.index===deck.i}" @click="goStory(s.index)">',
      '              <span class="num">{{ (s.index+1<10?\"0\":\"\")+(s.index+1) }}</span>{{ s.nav }}',
      '            </button>',
      '          </li>',
      '        </ol>',
      '      </section>',
      '    </nav>',
      '    <main class="deck__stage">',
      '      <p class="eyebrow">{{ story.group.title }} · {{ deck.i+1 }} из {{ stories.length }}</p>',
      '      <h1 class="story-title">{{ story.title }}</h1>',
      '      <p class="story-sub">{{ story.sub }}</p>',
      /* кнопки прогоняют сценарий прямо на макете */
      '      <div class="tryrow">',
      '        <span class="tryrow__label">Попробуйте</span>',
      '        <button v-for="a in story.act" :key="a.label" class="trybtn" @click="a.run()">{{ a.label }}</button>',
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
  });
})();
