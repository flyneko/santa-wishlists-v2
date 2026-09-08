/* Вишлист v2 — презентация: те же экраны, что и в прототипе, но с подписями и перелистыванием. */
(function () {
  'use strict';
  var V = window.Vue, WL = window.WL;
  var reactive = V.reactive, computed = V.computed;

  var STORIES = [
    { route: 'lists', pre: function () { WL.store.listView = 'items'; }, nav: 'Вишлисты и приоритеты',
      eyebrow: 'История 1 из 6 · Владелец',
      title: 'Я веду вишлисты по поводам и помечаю, что хочу сильнее всего',
      sub: 'Чтобы даритель сразу понимал, с чего начать, а вишлист не превращался в свалку ссылок.' },
    { route: 'ideas', pre: function () { WL.store.ideasFor = 'self'; }, nav: 'Идеи, которые объясняют себя',
      eyebrow: 'История 2 из 6 · Владелец',
      title: 'Мне показывают идеи и объясняют, почему именно эти',
      sub: 'И я могу сказать «не моё» — тогда лента подстроится, а не покажет то же самое снова.' },
    { route: 'ideas', pre: function () { WL.store.ideasFor = 'other'; }, nav: 'Идеи для другого человека',
      eyebrow: 'История 3 из 6 · Кто угодно',
      title: 'Я ищу подарок для другого человека — без игры и анкет',
      sub: 'Задаю повод, возраст, бюджет и пару интересов — получаю короткий понятный список.' },
    { route: 'shared', pre: function () {}, nav: 'Зарезервировать подарок',
      eyebrow: 'История 4 из 6 · Даритель',
      title: 'Я резервирую подарок, чтобы никто не купил его дважды',
      sub: 'А в режиме Тайного Санты владелец не увидит, кто это сделал — сюрприз сохраняется.' },
    { route: 'pool', pre: function () {}, nav: 'Скинуться вместе',
      eyebrow: 'История 5 из 6 · Дарители',
      title: 'Мы скидываемся на один дорогой подарок вместе',
      sub: 'Сбор и участники видны всем. Деньги переводятся между людьми напрямую.' },
    { route: 'lists', pre: function () { WL.store.listView = 'activity'; }, nav: 'Активность вишлиста',
      eyebrow: 'История 6 из 6 · Владелец',
      title: 'Я вижу, что вишлист работает — но не вижу, кто что сделал',
      sub: 'Просмотры, интерес к вещам и сколько уже разобрано. Без имён — сюрприз цел.' }
  ];

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
    var i = -1;
    for (var k = 0; k < STORIES.length; k++) { if (STORIES[k].route === route) { i = k; break; } }
    if (i >= 0 && i !== deck.i) goStory(i);
  };

  var app = V.createApp({
    setup: function () {
      var story = computed(function () { return STORIES[deck.i]; });
      /* экран берём из текущего маршрута — тогда переходы внутри экранов
         (подборка, сбор) работают и в презентации */
      var screenComp = computed(function () { return WL.screenByRoute[WL.store.route]; });
      var showRail = computed(function () { return WL.store.route === 'lists' || WL.store.route === 'ideas'; });
      return { deck: deck, store: WL.store, story: story, screenComp: screenComp,
               showRail: showRail, stories: STORIES, goStory: goStory };
    },
    template: [
      '<div class="deck">',
      '  <header class="deck__top">',
      '    <div class="deck__brand">🎁 Вишлист v2 <span class="proto">презентация</span></div>',
      '    <a class="deck__switch" href="prototype/">Открыть прототип →</a>',
      '    <div class="stepper">',
      '      <button class="stepper__btn" @click="goStory(deck.i-1)" aria-label="Назад">‹</button>',
      '      <span class="stepper__count">{{ deck.i+1 }} / {{ stories.length }}</span>',
      '      <button class="stepper__btn" @click="goStory(deck.i+1)" aria-label="Вперёд">›</button>',
      '    </div>',
      '  </header>',
      '  <div class="deck__body">',
      '    <nav class="deck__rail">',
      '      <ol>',
      '        <li v-for="(s,n) in stories" :key="n">',
      '          <button :class="{\'is-on\':n===deck.i}" @click="goStory(n)"><span class="num">{{ (n+1<10?\"0\":\"\")+(n+1) }}</span>{{ s.nav }}</button>',
      '        </li>',
      '      </ol>',
      '    </nav>',
      '    <main class="deck__stage">',
      '      <p class="eyebrow">{{ story.eyebrow }}</p>',
      '      <h1 class="story-title">{{ story.title }}</h1>',
      '      <p class="story-sub">{{ story.sub }}</p>',
      '      <div class="deck__stagebody" :class="{\'deck__stagebody--rail\':showRail}">',
      '        <transition name="fade" mode="out-in">',
      '          <div class="screen" :key="store.route + store.listView + store.ideasFor"><component :is="screenComp" /></div>',
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
