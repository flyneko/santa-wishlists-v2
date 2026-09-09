/* Вишлист v2 — интерактивный прототип.
   Раскладка MySanta: сайдбар (копия .aside, с оригинальными иконками) + контент.
   Домашняя страница раздела — «Идеи подарков». Переключатель списков — на виду.
   Экраны — из общего app-core.js, поэтому совпадают с презентацией. */
(function () {
  'use strict';
  var V = window.Vue, WL = window.WL;
  var computed = V.computed;
  var IC = '../icons/';

  var app = V.createApp({
    setup: function () {
      var store = WL.store, A = WL.A;

      /* правая панель — только на двух главных экранах, остальное подстраницы */
      var isMain = computed(function () { return store.route === 'ideas' || store.route === 'lists'; });
      var screenComp = computed(function () { return WL.screenByRoute[store.route]; });
      /* панель справа — и на идеях, и на списках (там в ней сами списки) */
      var showRail = computed(function () { return isMain.value; });
      var backTo = computed(function () {
        if (store.route === 'shared') return { route: 'lists', label: '← Мой вишлист', note: 'так вишлист видит даритель' };
        if (store.route === 'shortlist') return { route: 'ideas', label: '← Идеи подарков' };
        if (store.route === 'pool') return { route: store.poolBack, label: '← Назад' };
        return null;
      });

      function msNav(name) { A.toast(name + ' — раздел MySanta, вне макета вишлиста'); }

      return {
        store: store, A: A, IC: IC, isMain: isMain, screenComp: screenComp,
        showRail: showRail, backTo: backTo,
        currentList: WL.currentList, msNav: msNav
      };
    },
    template: [
      '<div class="ms-app">',

      '  <aside class="ms-side" :class="{\'is-collapsed\':store.asideCollapsed}">',
      '    <div class="ms-side__inn">',
      '      <button class="ms-side__collapse" @click="A.toggleAside()" aria-label="Свернуть меню">◀</button>',
      '      <div class="ms-side__logo">Мой С<img class="ms-side__santa" :src="IC+\'santa.png\'" alt="">нта</div>',
      '      <ul class="ms-side__menu">',
      '        <li class="ms-side__row"><button class="ms-side__item ms-side__item--user" @click="msNav(\'Профиль\')"><span class="ms-side__chev">›</span><span class="ms-side__ava">E</span><span class="ms-side__labeltext">{{ store.me.name }}</span></button></li>',
      '        <li class="ms-side__row"><button class="ms-side__item" @click="msNav(\'Главное меню\')"><img class="ms-side__ico" :src="IC+\'house.png\'" alt=""><span class="ms-side__labeltext">Главное меню</span></button></li>',
      '        <li class="ms-side__row">',
      '          <button class="ms-side__item is-active" @click="A.go(\'ideas\')"><img class="ms-side__ico" :src="IC+\'shop.png\'" alt=""><span class="ms-side__labeltext">Вишлист</span></button>',
      /* взгляд дарителя — не действие владельца, а отдельный вход в тот же вишлист */
      '          <button class="ms-side__sub" :class="{\'is-active\':store.route===\'shared\'}" @click="A.go(\'shared\')">',
      '            <ui-icon name="eye" :size="15" /><span class="ms-side__labeltext">Взгляд дарителя</span>',
      '          </button>',
      '        </li>',
      '        <li class="ms-side__row"><button class="ms-side__item" @click="msNav(\'Санта AI\')"><img class="ms-side__ico" :src="IC+\'magic-wand.png\'" alt=""><span class="ms-side__labeltext">Санта AI</span></button></li>',
      '        <li class="ms-side__row"><span class="ms-side__item ms-side__item--section"><span class="ms-side__chev">›</span><span class="ms-side__labeltext">Игры по годам</span></span></li>',
      '        <li class="ms-side__row ms-side__row--sm"><button class="ms-side__button" @click="msNav(\'Создать игру\')"><img class="ms-side__ico" :src="IC+\'present.png\'" alt=""><span class="ms-side__labeltext">Создать игру</span></button></li>',
      '        <li class="ms-side__row"><button class="ms-side__item" @click="msNav(\'Поддержка\')"><img class="ms-side__ico" :src="IC+\'heart.png\'" alt=""><span class="ms-side__labeltext">Поддержка</span></button></li>',
      '      </ul>',
      '    </div>',
      '  </aside>',

      '  <div class="ms-main">',
      /* шапка только на подстраницах: на главных ей нечего показывать,
         а пустая она отъедала полосу сверху */
      '    <header v-if="backTo" class="ms-topbar">',
      '      <button class="ms-back" @click="A.go(backTo.route)">{{ backTo.label }}</button>',
      '      <span v-if="backTo.note" class="ms-crumb-note">{{ backTo.note }}</span>',
      '    </header>',

      '    <div class="ms-body" :class="{\'ms-body--rail\':showRail}">',
      '      <div>',
      '        <transition name="fade" mode="out-in">',
      '          <div :key="store.route + store.ideasFor"><component :is="screenComp" /></div>',
      '        </transition>',
      '      </div>',
      '      <wishlist-rail v-if="showRail" />',
      '    </div>',
      '  </div>',

      '  <overlay-host />',
      '</div>'
    ].join('')
  });

  WL.register(app);
  app.mount('#app');
})();
