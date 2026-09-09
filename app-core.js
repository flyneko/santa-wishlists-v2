/* Вишлист v2 — общее ядро: одно реактивное состояние, действия и ВСЕ экраны.
   Презентация и прототип подключают один и тот же файл, поэтому экраны идентичны.
   Товары — реальные (mr_geek) из pics.js. Бэкенда нет. window.WL = { store, A, register(app), ... } */
(function () {
  'use strict';
  var V = window.Vue;
  var reactive = V.reactive, computed = V.computed, ref = V.ref;
  var GOODS = window.WL_GOODS || [];
  function good(i) { return GOODS[i] || GOODS[0] || { name: '', price: 0, img: '' }; }

  /* прототип лежит в корне, презентация — в подпапке: путь к картинкам берём
     от самого app-core.js, чтобы обе оболочки грузили одни и те же файлы */
  var BASE = (function () {
    if (typeof document === 'undefined') return '';
    var els = document.getElementsByTagName ? document.getElementsByTagName('script') : [];
    for (var i = 0; i < els.length; i++) {
      var m = (els[i].src || '').match(/^(.*\/)app-core\.js(?:\?.*)?$/);
      if (m) return m[1];
    }
    return '';
  })();

  var _id = 200;
  function uid() { return 'i' + (++_id); }

  /* интересы — теги с эмодзи, общий каталог для фильтров и анкеты человека */
  var INTERESTS = [
    { key: 'дом', emoji: '🏠' }, { key: 'техника', emoji: '💻' },
    { key: 'бар', emoji: '🍸' }, { key: 'игры', emoji: '🎮' },
    { key: 'спорт', emoji: '🏃' }, { key: 'книги', emoji: '📚' },
    { key: 'кухня', emoji: '🍳' }, { key: 'уход', emoji: '🛁' },
    { key: 'кофе', emoji: '☕' }, { key: 'растения', emoji: '🌿' },
    { key: 'музыка', emoji: '🎵' }, { key: 'путешествия', emoji: '✈️' },
    { key: 'творчество', emoji: '🎨' }, { key: 'питомцы', emoji: '🐾' }
  ];
  /* значки вишлистов — Lucide (ISC), контурные, вместо эмодзи:
     эмодзи рисуются разными шрифтами и в кружке смотрятся чужеродно */
  var LIST_ICONS = [
    { key: 'gift', label: 'Подарок', d: '<rect x="3" y="8" width="18" height="4" rx="1" /> <path d="M12 8v13" /> <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /> <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />' },
    { key: 'cake', label: 'День рождения', d: '<path d="M20 21v-8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8" /> <path d="M4 16s.5-1 2-1 2.5 2 4 2 2.5-2 4-2 2.5 2 4 2 2-1 2-1" /> <path d="M2 21h20" /> <path d="M7 8v3" /> <path d="M12 8v3" /> <path d="M17 8v3" /> <path d="M7 4h.01" /> <path d="M12 4h.01" /> <path d="M17 4h.01" />' },
    { key: 'tree-pine', label: 'Новый год', d: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z" /> <path d="M12 22v-3" />' },
    { key: 'briefcase', label: 'Работа', d: '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /> <rect width="20" height="14" x="2" y="6" rx="2" />' },
    { key: 'heart', label: 'Любимым', d: '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />' },
    { key: 'house', label: 'Новоселье', d: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8" /> <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />' },
    { key: 'graduation-cap', label: 'Выпускной', d: '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z" /> <path d="M22 10v6" /> <path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5" />' },
    { key: 'baby', label: 'Малышу', d: '<path d="M9 12h.01" /> <path d="M15 12h.01" /> <path d="M10 16c.5.3 1.2.5 2 .5s1.5-.2 2-.5" /> <path d="M19 6.3a9 9 0 0 1 1.8 3.9 2 2 0 0 1 0 3.6 9 9 0 0 1-17.6 0 2 2 0 0 1 0-3.6A9 9 0 0 1 12 3c2 0 3.5 1.1 3.5 2.5s-.9 2.5-2 2.5c-.8 0-1.5-.4-1.5-1" />' },
    { key: 'plane', label: 'Путешествие', d: '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />' },
    { key: 'party-popper', label: 'Праздник', d: '<path d="M5.8 11.3 2 22l10.7-3.79" /> <path d="M4 3h.01" /> <path d="M22 8h.01" /> <path d="M15 2h.01" /> <path d="M22 20h.01" /> <path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12c.1.86-.57 1.63-1.45 1.63h-.38c-.86 0-1.6.6-1.76 1.44L14 10" /> <path d="m22 13-.82-.33c-.86-.34-1.82.2-1.98 1.11c-.11.7-.72 1.22-1.43 1.22H17" /> <path d="m11 2 .33.82c.34.86-.2 1.82-1.11 1.98C9.52 4.9 9 5.52 9 6.23V7" /> <path d="M11 13c1.93 1.93 2.83 4.17 2 5-.83.83-3.07-.07-5-2-1.93-1.93-2.83-4.17-2-5 .83-.83 3.07.07 5 2Z" />' },
    { key: 'star', label: 'Особое', d: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />' },
    { key: 'clover', label: 'На удачу', d: '<path d="M16.17 7.83 2 22" /> <path d="M4.02 12a2.827 2.827 0 1 1 3.81-4.17A2.827 2.827 0 1 1 12 4.02a2.827 2.827 0 1 1 4.17 3.81A2.827 2.827 0 1 1 19.98 12a2.827 2.827 0 1 1-3.81 4.17A2.827 2.827 0 1 1 12 19.98a2.827 2.827 0 1 1-4.17-3.81A1 1 0 1 1 4 12" /> <path d="m7.83 7.83 8.34 8.34" />' }
  ];
  /* значки интерфейса — тоже Lucide (ISC): в шапке вишлиста эмодзи выглядели
     инородно и рисовались по-разному в разных системах */
  var UI_ICONS = {
    'calendar-days': '<path d="M8 2v4" /> <path d="M16 2v4" /> <rect width="18" height="18" x="3" y="4" rx="2" /> <path d="M3 10h18" /> <path d="M8 14h.01" /> <path d="M12 14h.01" /> <path d="M16 14h.01" /> <path d="M8 18h.01" /> <path d="M12 18h.01" /> <path d="M16 18h.01" />',
    'gift': '<rect x="3" y="8" width="18" height="4" rx="1" /> <path d="M12 8v13" /> <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /> <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />',
    'eye': '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /> <circle cx="12" cy="12" r="3" />',
    'lock': '<rect width="18" height="11" x="3" y="11" rx="2" ry="2" /> <path d="M7 11V7a5 5 0 0 1 10 0v4" />',
    'plus': '<path d="M5 12h14" /> <path d="M12 5v14" />',
    'share-2': '<circle cx="18" cy="5" r="3" /> <circle cx="6" cy="12" r="3" /> <circle cx="18" cy="19" r="3" /> <line x1="8.59" x2="15.42" y1="13.51" y2="17.49" /> <line x1="15.41" x2="8.59" y1="6.51" y2="10.49" />',
    'image': '<rect width="18" height="18" x="3" y="3" rx="2" ry="2" /> <circle cx="9" cy="9" r="2" /> <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    'bar-chart-3': '<path d="M3 3v18h18" /> <path d="M18 17V9" /> <path d="M13 17V5" /> <path d="M8 17v-3" />',
    'users': '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /> <circle cx="9" cy="7" r="4" /> <path d="M22 21v-2a4 4 0 0 0-3-3.87" /> <path d="M16 3.13a4 4 0 0 1 0 7.75" />',
    'hand-coins': '<path d="M11 15h2a2 2 0 1 0 0-4h-3c-.6 0-1.1.2-1.4.6L3 17" /> <path d="m7 21 1.6-1.4c.3-.4.8-.6 1.4-.6h4c1.1 0 2.1-.4 2.8-1.2l4.6-4.4a2 2 0 0 0-2.75-2.91l-4.2 3.9" /> <path d="m2 16 6 6" /> <circle cx="16" cy="9" r="2.9" /> <circle cx="6" cy="5" r="3" />',
    'chevron-right': '<path d="m9 18 6-6-6-6" />',
    'chevron-left': '<path d="m15 18-6-6 6-6" />',
    'arrow-right': '<path d="M5 12h14" /> <path d="m12 5 7 7-7 7" />',
    'settings': '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /> <circle cx="12" cy="12" r="3" />',
    'bold': '<path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />',
    'italic': '<line x1="19" x2="10" y1="4" y2="4" /> <line x1="14" x2="5" y1="20" y2="20" /> <line x1="15" x2="9" y1="4" y2="20" />',
    'list': '<line x1="8" x2="21" y1="6" y2="6" /> <line x1="8" x2="21" y1="12" y2="12" /> <line x1="8" x2="21" y1="18" y2="18" /> <line x1="3" x2="3.01" y1="6" y2="6" /> <line x1="3" x2="3.01" y1="12" y2="12" /> <line x1="3" x2="3.01" y1="18" y2="18" />',
    'link': '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /> <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />',
    'ban': '<circle cx="12" cy="12" r="10" /> <path d="m4.9 4.9 14.2 14.2" />'
  };

  function iconOf(key) {
    return LIST_ICONS.find(function (i) { return i.key === key; }) || LIST_ICONS[0];
  }
  /* какие категории каталога отвечают каждому интересу из анкеты */
  var INTEREST_CATS = {
    'дом':          ['Интерьер', 'Светильники', 'Техника для дома'],
    'техника':      ['Техника для дома', 'Колонки'],
    'бар':          ['Бар', 'Алкоигры'],
    'игры':         ['Настольные игры', 'Игрушки', 'Алкоигры'],
    'спорт':        ['Подарочные наборы'],
    'книги':        ['Постеры', 'Календари'],
    'кухня':        ['Кухня', 'Наборы для специй', 'Ланч-боксы', 'Шоколадные фонтаны'],
    'уход':         ['Уход за собой', 'Маски для сна'],
    'кофе':         ['Кухня', 'Бар'],
    'растения':     ['Интерьер'],
    'музыка':       ['Колонки'],
    'путешествия':  ['Ланч-боксы', 'Сумки, кошельки, косметички'],
    'творчество':   ['Наборы для творчества', 'Ручки', 'Стикеры', 'Постеры'],
    'питомцы':      ['Игрушки', 'Интерьер']
  };

  var AVA_COLORS = ['#7B61FF', '#2D9CDB', '#EB5757', '#F2994A', '#00A99D', '#BB6BD9', '#E4A11B'];
  /* берём первый свободный цвет — иначе новый человек дублирует аватар Ани */
  function freeColor(taken) {
    var used = {};
    taken.forEach(function (r) { used[r.color] = 1; });
    for (var i = 0; i < AVA_COLORS.length; i++) { if (!used[AVA_COLORS[i]]) return AVA_COLORS[i]; }
    return AVA_COLORS[taken.length % AVA_COLORS.length];
  }
  var AGES = ['18–24', '25–34', '35–44', '45+'];

  /* обложки шапки списка: градиенты-пресеты + своя картинка (url или файл) */
  var COVERS = [
    { key: 'mint', grad: 'linear-gradient(135deg,#27AE60 0%,#6FCF97 100%)' },
    { key: 'sunset', grad: 'linear-gradient(135deg,#F74F4F 0%,#F2994A 100%)' },
    { key: 'night', grad: 'linear-gradient(135deg,#2C3E50 0%,#4CA1AF 100%)' },
    { key: 'violet', grad: 'linear-gradient(135deg,#7B61FF 0%,#BB6BD9 100%)' },
    { key: 'gold', grad: 'linear-gradient(135deg,#B8860B 0%,#F2C94C 100%)' },
    { key: 'ice', grad: 'linear-gradient(135deg,#2D9CDB 0%,#56CCF2 100%)' }
  ];
  var GENDERS = [{ key: 'f', label: 'Женщина' }, { key: 'm', label: 'Мужчина' }, { key: 'x', label: 'Не важно' }];
  function seedList(id, title, icon, date, cover, items, grad, desc, stop) {
    return { id: id, title: title, icon: icon, date: date, cover: cover, items: items,
             grad: grad || COVERS[0].grad, bg: null,
             desc: desc || '', stop: stop || '' };
  }

  /* ── маленький markdown ──
     Поддерживаем ровно то, что даёт панель редактора: **жирный**, *курсив*,
     ссылки, списки и абзацы. Больше в описании вишлиста и не нужно. */
  function esc(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  function inline(t) {
    return esc(t)
      .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
      .replace(/(^|[^*])\*([^*]+)\*/g, '$1<i>$2</i>')
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  function mdToHtml(md) {
    var out = [], list = null;
    (md || '').split(/\r?\n/).forEach(function (line) {
      var li = line.match(/^\s*[-*+]\s+(.*)$/);
      if (li) { if (!list) { list = []; } list.push('<li>' + inline(li[1]) + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (line.trim()) out.push('<p>' + inline(line) + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  function htmlToMd(html) {
    var t = (html || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/(p|div)>/gi, '\n')
      .replace(/<(b|strong)>/gi, '**').replace(/<\/(b|strong)>/gi, '**')
      .replace(/<(i|em)>/gi, '*').replace(/<\/(i|em)>/gi, '*')
      .replace(/<li>/gi, '- ').replace(/<\/li>/gi, '\n')
      .replace(/<a [^>]*href="([^"]*)"[^>]*>([^<]*)<\/a>/gi, '[$2]($1)')
      .replace(/<[^>]+>/g, '');
    return t.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
            .replace(/\n{3,}/g, '\n\n').trim();
  }
  /* товары со скидкой: индекс в каталоге -> старая цена.
     Скидка принадлежит товару, поэтому одинакова во всех подборках и списках. */
  var SALE = {
    3: 2790,    // лампа-колонка Right Meow
    8: 3240,    // набор для коктейлей Pourpour
    18: 1990,   // диск здоровья SpinTeam
    26: 3490,   // увлажнитель PH11
    34: 2990    // шоколадный фонтан
  };
  function was(i, oldPrice) { return oldPrice || SALE[i] || 0; }

  function gift(i, tier, note, oldPrice) {
    var g = good(i);
    return { id: uid(), pid: g.id, name: g.name, price: g.price, oldPrice: was(i, oldPrice),
             img: g.img, tier: tier || 'want', note: note || '', reserved: null };
  }
  function idea(i, reason, kind, oldPrice) {
    var g = good(i);
    return { id: uid(), pid: g.id, name: g.name, price: g.price, oldPrice: was(i, oldPrice),
             img: g.img, reason: reason, kind: kind || '', saved: false, gone: false };
  }

  function freshState() {
    var ideasOtherArr = [
      idea(26, 'повод + интерес «дом»', ''),
      idea(21, 'популярно у похожих людей', ''),
      idea(8, 'для встреч с друзьями', ''),
      idea(33, 'в вашем бюджете', ''),
      idea(20, 'необычный вариант', ''),
      idea(32, 'беспроигрышный вариант', '')
    ];
    var s = {
      route: 'ideas',
      sheet: null,
      deck: false,          /* презентация: часть прототипной навигации там лишняя */
      editId: null,
      buyItem: null,        /* подарок, покупку которого подтверждают */
      toastMsg: '',
      period: '30',
      ideasFor: 'self',
      asideCollapsed: false,
      openMenu: null,             // who | raillist
      poolBack: 'shared',

      /* получатель подарка в режиме «Для другого» */
      /* source: 'game' — подопечный из игры «Мой Санта», их анкету не меняем;
         'own' — человек, которого добавили здесь сами */
      recipients: [
        { id: 'r1', name: 'Аня', short: 'Ани', hasWishlist: true, source: 'game', game: 'Офис · Новый год 2025',
          color: '#7B61FF', gender: 'f', age: 1, interests: ['дом', 'уход'],
          wishlist: [0, 11, 2, 30, 22, 27] },
        { id: 'r2', name: 'Игорь', short: 'Игоря', hasWishlist: true, source: 'game', game: 'Семья · Дни рождения',
          color: '#2D9CDB', gender: 'm', age: 2, interests: ['техника', 'игры'],
          wishlist: [33, 29, 24, 1, 18] },
        { id: 'r3', name: 'Коллега', short: 'коллеги', hasWishlist: false, source: 'own', game: '',
          color: '#EB5757', gender: 'x', age: 1, interests: ['кофе', 'книги'] }
      ],
      /* черновик анкеты (модалка). id !== null — правим существующего */
      newPerson: { id: null, name: '', gender: 'f', age: 1, interests: [] },
      recipientId: 'r1',
      shortlists: { r1: [], r2: [], r3: [] },

      coverUrl: '',
      newList: { title: '', icon: 'gift', date: '', grad: '' },
      addUrl: 'https://mrgeek.ru/product/solonka-i-perechnica-edinorogi/',
      addFound: false,
      addTier: 'top',
      addNote: '',
      editTier: 'want',
      editNote: '',

      pledgeName: 'Пётр',
      pledgeAmount: 500,
      pledgeDone: false,

      me: { name: 'Evgeniy Unknown' },
      currentListId: 'l1',
      drag: null,                 // { kind:'wish'|'pick', from, over } — перетаскивание в панели
      spot: null,                 // подсвеченная область в презентации: screen | rail

      lists: [
        seedList('l1', 'День рождения', 'cake', '14 марта', good(3).img, [
          gift(3, 'top', 'розовый'),
          gift(1, 'top', ''),
          gift(2, 'top', ''),
          gift(8, 'top', ''),
          gift(0, 'top', ''),
          gift(11, 'want', ''),
          gift(6, 'want', ''),
          gift(9, 'want', ''),
          gift(12, 'want', ''),
          gift(13, 'someday', ''),
          gift(5, 'someday', '')
        ], COVERS[1].grad,
          'Собираю на **14 марта**. Если сомневаетесь — берите из верхнего приоритета,\n' +
          'там всё точно в тему.\n\n' +
          '- размер одежды S, обувь 38\n' +
          '- люблю всё для дома и ухода за собой',
          'свечи с сильным запахом\nсладости и шоколад\nодежда без размера\nсувениры «на память»'),
        seedList('l2', 'Новый год', 'tree-pine', '31 декабря', good(7).img, [
          gift(31, 'top', ''),
          gift(2, 'top', ''),
          gift(14, 'top', ''),
          gift(16, 'top', ''),
          gift(7, 'top', ''),
          gift(27, 'want', ''),
          gift(13, 'want', ''),
          gift(8, 'want', ''),
          gift(32, 'want', ''),
          gift(5, 'someday', ''),
          gift(1, 'someday', '')
        ], COVERS[2].grad),
        seedList('l3', 'Коллегам', 'briefcase', '', good(4).img, [
          gift(4, 'top', ''),
          gift(10, 'top', ''),
          gift(12, 'top', ''),
          gift(30, 'top', ''),
          gift(9, 'top', ''),
          gift(17, 'want', ''),
          gift(27, 'want', ''),
          gift(35, 'want', ''),
          gift(23, 'want', ''),
          gift(15, 'someday', '')
        ], COVERS[3].grad)
      ],

      ideasSelf: [
        idea(8, 'вы смотрели похожие наборы', ''),
        idea(26, 'вы смотрели товары для дома', ''),
        idea(21, 'популярно у похожих людей', ''),
        idea(30, 'в вашем бюджете', ''),
        idea(31, 'к сезону · Новый год', ''),
        idea(18, 'вам нравятся гаджеты', ''),
        idea(28, 'по вашим интересам', ''),
        idea(33, 'часто берут к этому набору', '')
      ],
      ideasView: 'browse',        // browse (карусели) | filtered (список)
      feed: [],                   // бесконечная лента внизу страницы идей
      feedPage: 0,
      feedLoading: false,
      feedDone: false,
      activeFilter: null,         // { title, items } когда включён фильтр
      ideasOther: ideasOtherArr,
      collections: [
        { key: 'picked', title: 'Подобрано для подарка', items: ideasOtherArr },
        { key: 'birthday', title: 'Для дня рождения',
          items: [3, 8, 34, 29, 20, 25, 1, 18].map(function (i) { return idea(i, ''); }) },
        { key: 'trending', title: 'Сегодня в тренде',
          items: [21, 32, 28, 18, 26, 13, 24, 2].map(function (i) { return idea(i, ''); }) },
        /* цену не выдумываем — берём из каталога всё, что укладывается в 1000 ₽ */
        { key: 'under1000', title: 'До 1000 ₽',
          items: GOODS.map(function (g, i) { return i; })
            .filter(function (i) { return good(i).price <= 1000; })
            .map(function (i) { return idea(i, ''); }) },
        { key: 'party', title: 'Для вечеринки',
          items: [29, 24, 21, 35, 8, 33].map(function (i) { return idea(i, ''); }) },
        { key: 'newyear', title: 'К Новому году',
          items: [31, 7, 16, 14, 27, 13, 2].map(function (i) { return idea(i, ''); }) },
        { key: 'wedding', title: 'Для свадьбы',
          items: [8, 22, 34, 33, 25, 11, 9].map(function (i) { return idea(i, ''); }) },
        { key: 'home', title: 'Для дома и уюта',
          items: [2, 5, 11, 22, 19, 26, 1, 6].map(function (i) { return idea(i, ''); }) }
      ],

      selfFilters: [
        { label: '25–34', on: true },
        { label: 'М', on: true },
        { label: 'Цена', on: false },
        { label: 'Категория', on: false }
      ],
      /* фильтры идей: i = -1 → не задан, чип не показывается */
      ideaChips: [
        { key: 'occasion', label: 'Повод', opts: ['День рождения', 'Новый год', 'Свадьба', 'Новоселье'], i: -1 },
        { key: 'gender', label: 'Пол', opts: ['Женщина', 'Мужчина'], i: -1 },
        { key: 'age', label: 'Возраст', opts: AGES, i: -1 },
        { key: 'budget', label: 'Бюджет', opts: ['до 1к ₽', '1–5к ₽', '5–10к ₽', '10к+ ₽'], i: -1 }
      ],
      interests: INTERESTS.map(function (t) { return { key: t.key, emoji: t.emoji, on: false }; }),

      recipientCols: {},          // подборки, собранные под конкретного человека
      poolItemId: null            // товар, который открыт на экране сбора
    };
    s.lists[0].items[2].reserved = 'someone';
    s.lists[0].items[1].pool = { organiser: 'Мария', pledges: [
      { name: 'Игорь', amount: 900 }, { name: 'Мария', amount: 1000 }
    ] };
    s.lists[1].items[3].reserved = 'someone';
    s.lists[2].items[1].reserved = 'someone';
    return s;
  }

  var store = reactive(freshState());

  /* ───────── производные ───────── */
  /* заглушка на случай, когда вишлистов нет: экран и панель обращаются
     к currentList напрямую, иначе рендер падает на undefined */
  var EMPTY_LIST = { id: '', title: 'Нет вишлиста', icon: 'gift', date: '', cover: '',
                     items: [], grad: COVERS[0].grad, bg: null };
  var currentList = computed(function () {
    return store.lists.find(function (l) { return l.id === store.currentListId; }) ||
           store.lists[0] || EMPTY_LIST;
  });
  var TIERS = [
    { key: 'top', label: 'Больше всего хочу' },
    { key: 'want', label: 'Хочу' },
    { key: 'someday', label: 'Когда-нибудь' }
  ];
  function groupByTier(list) {
    return TIERS.map(function (t) {
      return { key: t.key, label: t.label,
               items: list.items.filter(function (i) { return i.tier === t.key; }) };
    });
  }
  var tierGroups = computed(function () { return groupByTier(currentList.value); });
  var reservedCount = computed(function () {
    return currentList.value.items.filter(function (i) { return i.reserved; }).length;
  });
  function poolItem() {
    var found = null;
    if (store.poolItemId) {
      store.lists.forEach(function (l) {
        l.items.forEach(function (i) { if (i.id === store.poolItemId) found = i; });
      });
      if (found) return found;
      Object.keys(store.shortlists).forEach(function (k) {
        store.shortlists[k].forEach(function (i) { if (i.id === store.poolItemId) found = i; });
      });
      if (found) return found;
    }
    /* на экран зашли не по кнопке (прямая ссылка, история в презентации) —
       показываем товар, по которому сбор уже идёт, вместо пустой страницы */
    store.lists.forEach(function (l) {
      l.items.forEach(function (i) { if (!found && i.pool) found = i; });
    });
    return found;
  }
  var poolTotal = computed(function () {
    var it = poolItem();
    return it ? raised(it) : 0;
  });
  var poolPct = computed(function () {
    var it = poolItem();
    return it ? pct(it) : 0;
  });
  function raised(it) {
    if (!it) return 0;
    if (!it.pool) return 0;
    return it.pool.pledges.reduce(function (a, p) { return a + p.amount; }, 0);
  }
  function pct(it) {
    if (!it) return 0;
    if (!it.price) return 0;
    return Math.min(100, Math.round(raised(it) / it.price * 100));
  }
  var recipient = computed(function () {
    return store.recipients.find(function (r) { return r.id === store.recipientId; }) || store.recipients[0];
  });
  var shortlist = computed(function () { return store.shortlists[store.recipientId] || []; });

  /* ───────── действия ───────── */
  var money = function (n) { return n.toLocaleString('ru-RU') + ' ₽'; };
  var toastT, spotT;
  function toast(m) {
    store.toastMsg = m;
    clearTimeout(toastT);
    toastT = setTimeout(function () { store.toastMsg = ''; }, 1900);
  }

  /* осветляем hex, чтобы из одного цвета получить градиент шапки */
  function lighten(hex, k) {
    var n = parseInt(String(hex || '#7B61FF').slice(1), 16);
    var up = function (v) { return Math.round(v + (255 - v) * k); };
    return '#' + ((1 << 24) + (up(n >> 16) << 16) + (up((n >> 8) & 255) << 8) + up(n & 255)).toString(16).slice(1);
  }

  var A = {
    money: money,
    toast: toast,
    go: function (route) {
      store.route = route;
      store.sheet = null;
      if (WL.onNavigate) WL.onNavigate(route);
      if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    toggleAside: function () { store.asideCollapsed = !store.asideCollapsed; },
    /* короткая подсветка области — «смотрите сюда» в презентации */
    spotlight: function (name) {
      store.spot = name;
      clearTimeout(spotT);
      spotT = setTimeout(function () { store.spot = null; }, 1900);
    },
    reset: function () { Object.assign(store, freshState()); toast('Данные сброшены'); },

    openSheet: function (name) {
      if (name === 'gift') { store.addFound = false; store.addNote = ''; store.addTier = 'top'; }
      store.sheet = name; store.openMenu = null;
    },
    isWideSheet: function () {
      return ['person', 'filters', 'cover', 'list', 'listsettings', 'activity'].indexOf(store.sheet) >= 0;
    },
    closeSheet: function () { store.sheet = null; store.buyItem = null; },

    /* «купил» отменить нельзя одним кликом — сначала спрашиваем */
    askBought: function (item) { store.buyItem = item; store.sheet = 'bought'; },
    confirmBought: function () {
      var it = store.buyItem;
      store.sheet = null; store.buyItem = null;
      if (it) A.reserve(it, 'bought');
    },

    findByUrl: function () { store.addFound = true; },
    confirmAdd: function () {
      var g = window.WL_GOOD(10);
      currentList.value.items.unshift({
        id: uid(), pid: g.id, name: g.name, price: g.price, oldPrice: 0,
        img: g.img, tier: store.addTier, note: store.addNote, reserved: null
      });
      store.addFound = false; store.addNote = ''; store.sheet = null;
      toast('Добавлено в «' + currentList.value.title + '»');
    },
    bump: function (item, tier) { item.tier = tier; toast('Приоритет изменён'); },

    discount: function (it) {
      if (!it.oldPrice) return 0;
      return Math.round((1 - it.price / it.oldPrice) * 100);
    },
    dismissTitle: function () { return store.ideasFor === 'self' ? 'Не моё' : 'Не подходит'; },
    isMine: function (it) { return it.reserved === 'you'; },
    /* занято другим — резерв недоступен */
    otherHolds: function (it) {
      if (!it.reserved) return false;
      return it.reserved !== 'you';
    },
    takenLabel: function (it) {
      if (it.reserved === 'bought') return 'Куплено';
      if (A.hasPool(it)) return it.reserved === 'you' ? 'Вы скинулись' : 'Скидываются';
      if (it.reserved === 'you') return 'Вы дарите';
      return 'Уже дарят';
    },

    editItem: function (item) {
      store.editId = item.id; store.editTier = item.tier; store.editNote = item.note;
      store.sheet = 'edit';
    },
    saveEdit: function () {
      var it = currentList.value.items.find(function (i) { return i.id === store.editId; });
      if (it) { it.tier = store.editTier; it.note = store.editNote; }
      store.sheet = null; toast('Сохранено');
    },
    /* ── перетаскивание строк в правой панели ── */
    _dragArr: function (kind) {
      return kind === 'wish' ? currentList.value.items : (store.shortlists[store.recipientId] || []);
    },
    dragStart: function (kind, i, e) {
      store.drag = { kind: kind, from: i, over: i };
      if (e && e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        /* Firefox не начинает перетаскивание без данных */
        try { e.dataTransfer.setData('text/plain', String(i)); } catch (err) {}
      }
    },
    dragOver: function (kind, i) {
      var d = store.drag;
      if (!d) return;
      if (d.kind !== kind) return;
      d.over = i;
    },
    dragDrop: function (kind, i) {
      var d = store.drag;
      store.drag = null;
      if (!d) return;
      if (d.kind !== kind) return;
      if (d.from === i) return;
      var arr = A._dragArr(kind);
      var moved = arr.splice(d.from, 1)[0];
      arr.splice(i, 0, moved);
      toast('Порядок обновлён');
    },
    dragEnd: function () { store.drag = null; },
    /* `&&` в атрибуте ломает парсер этой сборки Vue — выносим в функции */
    isDragging: function (kind, i) {
      var d = store.drag;
      if (!d) return false;
      if (d.kind !== kind) return false;
      return d.from === i;
    },
    isDropTarget: function (kind, i) {
      var d = store.drag;
      if (!d) return false;
      if (d.kind !== kind) return false;
      if (d.from === i) return false;
      return d.over === i;
    },

    removeFromList: function (it) {
      currentList.value.items = currentList.value.items.filter(function (x) { return x.id !== it.id; });
      /* снимаем отметку на карточке идеи, чтобы её снова можно было добавить */
      store.ideasSelf.concat(A._pool()).forEach(function (i) { if (i.pid === it.pid) i.saved = false; });
      toast('Убрано из «' + currentList.value.title + '»');
    },
    removeItem: function () {
      currentList.value.items = currentList.value.items.filter(function (i) { return i.id !== store.editId; });
      store.sheet = null; toast('Удалено из вишлиста');
    },

    setList: function (id) {
      store.currentListId = id; store.sheet = null; store.openMenu = null;
      toast('Вишлист: ' + currentList.value.title);
    },
    /* пустые приоритеты не показываем — пустой вишлист получает одну заглушку */
    filledTiers: function (groups) {
      return groups.filter(function (g) { return g.items.length > 0; });
    },
    /* пустая правая панель: один и тот же вид во всех режимах.
       В подсказке показываем настоящую кнопку карточки, а не её символ. */
    railEmpty: function () {
      if (store.route === 'lists') {
        return { title: 'Вишлистов пока нет.', before: 'Создайте первый кнопкой ниже.', icon: '', after: '' };
      }
      if (store.ideasFor === 'other') {
        return { title: 'Подборка пока пуста.', before: 'Добавляйте идеи кнопкой', icon: 'pick', after: 'на карточке.' };
      }
      return { title: 'Вишлист пока пуст.', before: 'Добавляйте идеи кнопкой', icon: 'want', after: 'на карточке.' };
    },
    /* карточка-переход: со списков ведёт к идеям и наоборот */
    navCard: function () {
      if (store.route === 'lists') {
        return { route: 'ideas', cls: 'navcard--ideas', cta: 'Смотреть',
                 title: 'Идеи<br>подарков',
                 main: BASE + 'img/1f381.svg', side: BASE + 'img/2728.svg' };
      }
      return { route: 'lists', cls: 'navcard--lists', cta: 'Открыть',
               title: 'Мои<br>вишлисты',
               main: BASE + 'img/1f4cb.svg', side: BASE + 'img/2b50.svg' };
    },
    listIcons: LIST_ICONS,
    newList: function () {
      store.newList = { title: '', icon: 'gift', date: '',
                        grad: COVERS[store.lists.length % COVERS.length].grad };
      store.openMenu = null;
      store.sheet = 'list';
    },
    setNewListIcon: function (k) { store.newList.icon = k; },
    setNewListGrad: function (g) { store.newList.grad = g; },
    canCreateList: function () { return (store.newList.title || '').trim().length > 0; },
    createList: function () {
      var n = store.newList;
      var title = (n.title || '').trim();
      if (!title) { toast('Назовите вишлист'); return; }
      var id = uid();
      store.lists.push(seedList(id, title, n.icon, n.date.trim(), good(6).img, [], n.grad));
      store.currentListId = id;
      store.sheet = null;
      /* с экрана идей остаёмся на месте: новый вишлист сразу виден в панели справа */
      if (store.route !== 'ideas') A.go('lists');
      toast('Вишлист «' + title + '» создан');
    },
    copyLink: function () { toast('Ссылка скопирована'); },

    /* ── настройки вишлиста ── */
    openListSettings: function () { store.sheet = 'listsettings'; store.openMenu = null; },
    setListIcon: function (k) { currentList.value.icon = k; },
    mdToHtml: mdToHtml,
    htmlToMd: htmlToMd,
    /* стоп-лист хранится строками, показываем списком */
    stopItems: function (l) {
      return ((l && l.stop) || '').split(/\r?\n/)
        .map(function (x) { return x.trim(); })
        .filter(function (x) { return x.length > 0; });
    },

    /* ── обложка шапки списка ── */
    covers: COVERS,
    /* до четырёх последних подарков — из них складывается веер в шапке */
    heroFan: function (l) {
      if (!l || !l.items) return [];
      return l.items.slice(0, 4);
    },
    /* у подборки нет обложки — красим шапку в цвет аватарки человека */
    heroTint: function (color) {
      return { backgroundImage: 'linear-gradient(135deg,' + (color || '#7B61FF') + ' 0%,' + lighten(color, .4) + ' 100%)' };
    },
    shortFan: function () { return shortlist.value.slice(0, 4); },
    plural: function (n, forms) {
      var a = Math.abs(n) % 100, b = a % 10;
      if (a > 10 && a < 20) return forms[2];
      if (b > 1 && b < 5) return forms[1];
      if (b === 1) return forms[0];
      return forms[2];
    },
    heroStyle: function (l) {
      if (!l) return {};
      if (l.bg) return { backgroundImage: 'url(' + l.bg + ')' };
      return { backgroundImage: l.grad };
    },
    setCoverGrad: function (g) {
      currentList.value.grad = g; currentList.value.bg = null;
      toast('Обложка обновлена');
    },
    isCoverGrad: function (g) {
      var l = currentList.value;
      return l.bg ? false : l.grad === g;
    },
    setCoverUrl: function () {
      var url = (store.coverUrl || '').trim();
      if (!url) { toast('Вставьте ссылку на картинку'); return; }
      currentList.value.bg = url;
      store.coverUrl = '';
      toast('Обложка обновлена');
    },
    /* файл читаем в data-URL — бэкенда нет, картинка живёт только в браузере */
    pickCoverFile: function (e) {
      var f = e.target.files ? e.target.files[0] : null;
      if (!f) return;
      if (typeof FileReader === 'undefined') return;
      var fr = new FileReader();
      fr.onload = function () { currentList.value.bg = fr.result; toast('Обложка загружена'); };
      fr.readAsDataURL(f);
      e.target.value = '';
    },
    clearCover: function () { currentList.value.bg = null; toast('Своя картинка убрана'); },

    reserve: function (item, state) {
      item.reserved = state;
      if (state === 'you') toast('Зарезервировано — владелец не увидит, кто');
      else if (state === 'bought') toast('Отмечено как купленное');
      else toast('Резерв отменён');
    },
    /* открыть сбор — ещё не участие: резерв ставится только вместе с вкладом */
    startPool: function (item) {
      if (!item.pool) item.pool = { organiser: store.pledgeName || 'Вы', pledges: [] };
      store.poolItemId = item.id;
      store.pledgeDone = false;
      store.poolBack = store.route === 'shortlist' ? 'shortlist' : 'shared';
      A.go('pool');
    },
    setPledge: function (n) { store.pledgeAmount = n; },
    addPledge: function () {
      if (store.pledgeDone) return;
      var it = poolItem();
      if (!it) return;
      if (!it.pool) it.pool = { organiser: store.pledgeName || 'Вы', pledges: [] };
      it.pool.pledges.push({ name: store.pledgeName || 'Вы', amount: store.pledgeAmount });
      store.pledgeDone = true;
      /* вклад внесён — вот теперь подарок занят */
      if (!it.reserved) it.reserved = 'you';
      toast('Ваш вклад учтён — подарок отмечен как занятый');
    },
    poolItem: poolItem,
    hasPool: function (it) {
      if (!it.pool) return false;
      return it.pool.pledges.length > 0;
    },
    poolRaised: raised,
    poolPct: pct,
    poolPeople: function (it) { return it.pool ? it.pool.pledges.length : 0; },
    poolLeft: function (it) { return Math.max(0, it.price - raised(it)); },

    setIdeasFor: function (v) { store.ideasFor = v; store.ideasView = 'browse'; store.activeFilter = null; },
    toggleFilter: function (f) { f.on = !f.on; },
    resetFilters: function () { store.selfFilters.forEach(function (f) { f.on = false; }); toast('Фильтры сброшены'); },

    _pool: function () {
      var seen = {}, out = [];
      store.collections.forEach(function (c) {
        c.items.forEach(function (it) { if (!seen[it.pid]) { seen[it.pid] = 1; out.push(it); } });
      });
      return out;
    },
    /* ── фильтры: чипы + интересы ── */
    activeChips: function () {
      return store.ideaChips.filter(function (c) { return c.i >= 0; });
    },
    activeInterests: function () {
      return store.interests.filter(function (i) { return i.on; });
    },
    filterCount: function () { return A.activeChips().length + A.activeInterests().length; },
    setChip: function (c, i) { c.i = c.i === i ? -1 : i; A._enterFiltered(); },
    clearChip: function (c) { c.i = -1; A._enterFiltered(); },
    toggleInterest: function (i) { i.on = !i.on; A._enterFiltered(); },
    clearAllFilters: function () {
      store.ideaChips.forEach(function (c) { c.i = -1; });
      store.interests.forEach(function (i) { i.on = false; });
      A.clearIdeasFilter();
      toast('Фильтры сброшены');
    },
    _enterFiltered: function () {
      var parts = A.activeChips().map(function (c) { return c.opts[c.i]; })
        .concat(A.activeInterests().map(function (i) { return i.key; }));
      if (!parts.length) { A.clearIdeasFilter(); return; }
      store.activeFilter = { from: 'chips', title: parts.join(' · '), items: A._pool() };
      store.ideasView = 'filtered';
    },
    /* у блока может быть свой переход: «К вишлисту Ани» ведёт к вишлисту, а не в фильтр */
    openCollectionOrGo: function (col) {
      if (col.go) { A.go(col.go); return; }
      A.openCollection(col);
    },
    openCollection: function (col) {
      store.activeFilter = { from: 'collection', title: col.title, items: col.items };
      store.ideasView = 'filtered';
      toast('Подборка: ' + col.title);
    },
    fromCollection: function () {
      var f = store.activeFilter;
      return f ? f.from === 'collection' : false;
    },
    clearIdeasFilter: function () { store.ideasView = 'browse'; store.activeFilter = null; },

    /* ── бесконечная лента: подгружаем порциями, пока не упрёмся в предел ── */
    /* подопечный из игры — под него собраны свои блоки */
    isGameTarget: function () {
      if (store.ideasFor !== 'other') return false;
      var r = store.recipients.find(function (x) { return x.id === store.recipientId; });
      return r ? r.source === 'game' : false;
    },
    feedTitle: function () {
      return A.isGameTarget() ? 'Все подряд' : 'Бесконечная лента подарков';
    },
    feedMore: function () {
      if (store.feedLoading) return;
      if (store.feedDone) return;
      store.feedLoading = true;
      setTimeout(function () {
        var page = store.feedPage, step = 12;
        for (var k = 0; k < step; k++) {
          /* шаг 7 по каталогу — чтобы соседние карточки не повторяли друг друга */
          store.feed.push(idea((page * step + k * 7 + page) % GOODS.length, ''));
        }
        store.feedPage = page + 1;
        store.feedLoading = false;
        if (store.feed.length >= 96) store.feedDone = true;   /* предел макета */
      }, 420);
    },

    addIdeaToList: function (it) {
      if (it.saved) return;
      it.saved = true;
      currentList.value.items.unshift({
        id: uid(), pid: it.pid, name: it.name, price: it.price, oldPrice: it.oldPrice,
        img: it.img, tier: 'want', note: '', reserved: null
      });
      toast('Добавлено в вишлист «' + currentList.value.title + '»');
    },
    toggleMenu: function (name) { store.openMenu = store.openMenu === name ? null : name; },
    closeMenu: function () { store.openMenu = null; },

    /* вынесено в функцию: `&&` в шаблоне ломает парсер этой сборки Vue */
    isTarget: function (r) { return store.ideasFor === 'other' ? r.id === store.recipientId : false; },
    shortlistCount: function (r) {
      var l = store.shortlists[r.id];
      return l ? l.length : 0;
    },
    setIdeasTarget: function (id) {
      if (id === 'self') { store.ideasFor = 'self'; }
      else {
        store.ideasFor = 'other'; store.recipientId = id;
        var r = store.recipients.find(function (x) { return x.id === id; });
        A.applyProfile(r);
        A.buildRecipientCols(r);
      }
      store.ideasView = 'browse'; store.activeFilter = null; store.openMenu = null;
    },

    /* ── подборки под конкретного человека ──
       Собираем один раз и кладём в кэш: если пересобирать на каждый рендер,
       у карточек менялись бы id и слетали бы отметки «в подборке». */
    buildRecipientCols: function (r) {
      if (!r) return;
      /* свои люди получают обычные подборки каталога — их анкета уже настроила фильтры */
      if (r.source !== 'game') return;
      if (store.recipientCols[r.id]) return;
      var cols = [];
      if (r.hasWishlist) {
        cols.push({ key: 'their', title: 'Из вишлиста ' + r.short,
                    link: 'К вишлисту ' + r.short, go: 'shared',
                    items: (r.wishlist || []).map(function (i) { return idea(i, 'человек попросил сам'); }) });
      }
      var picked = A.interestGoods(r);
      if (picked.length) {
        cols.push({ key: 'interests', title: 'На основании интересов ' + r.short,
                    items: picked.map(function (i) { return idea(i, ''); }) });
      }
      var trending = store.collections.find(function (c) { return c.key === 'trending'; });
      cols.push({ key: 'trending', title: 'В тренде', items: trending ? trending.items : [] });
      store.recipientCols[r.id] = cols;
    },
    /* индексы товаров, попадающих в интересы человека */
    interestGoods: function (r) {
      var cats = {};
      (r.interests || []).forEach(function (k) {
        (INTEREST_CATS[k] || []).forEach(function (c) { cats[c] = 1; });
      });
      var out = [];
      GOODS.forEach(function (g, i) { if (cats[g.cat]) out.push(i); });
      return out.slice(0, 10);
    },
    /* ── анкета нового человека (модалка) ── */
    ages: AGES,
    genders: GENDERS,
    openPersonSheet: function () {
      store.newPerson = { id: null, name: '', gender: 'f', age: 1, interests: [] };
      store.openMenu = null;
      store.sheet = 'person';
    },
    editPerson: function (r) {
      store.newPerson = { id: r.id, name: r.name, gender: r.gender, age: r.age,
                          interests: (r.interests || []).slice() };
      store.openMenu = null;
      store.sheet = 'person';
    },
    editingPerson: function () { return !!store.newPerson.id; },
    /* подопечные из игр и добавленные вручную показываем отдельными списками */
    gameRecipients: function () {
      return store.recipients.filter(function (r) { return r.source === 'game'; });
    },
    ownRecipients: function () {
      return store.recipients.filter(function (r) { return r.source !== 'game'; });
    },
    setPersonGender: function (g) { store.newPerson.gender = g; },
    setPersonAge: function (i) { store.newPerson.age = i; },
    togglePersonInterest: function (key) {
      var list = store.newPerson.interests;
      var at = list.indexOf(key);
      if (at >= 0) list.splice(at, 1); else list.push(key);
    },
    hasPersonInterest: function (key) { return store.newPerson.interests.indexOf(key) >= 0; },
    canCreatePerson: function () { return (store.newPerson.name || '').trim().length > 0; },
    createPerson: function () {
      var p = store.newPerson;
      var name = (p.name || '').trim();
      if (!name) { toast('Введите имя'); return; }
      if (p.id) {
        var r = store.recipients.find(function (x) { return x.id === p.id; });
        if (r) {
          r.name = name; r.short = name;
          r.gender = p.gender; r.age = p.age; r.interests = p.interests.slice();
        }
        store.sheet = null;
        A.setIdeasTarget(p.id);
        toast('Анкета обновлена');
        return;
      }
      var id = uid();
      store.recipients.push({
        id: id, name: name, short: name, hasWishlist: false, source: 'own', game: '',
        color: freeColor(store.recipients),
        gender: p.gender, age: p.age, interests: p.interests.slice()
      });
      store.shortlists[id] = [];
      store.sheet = null;
      A.setIdeasTarget(id);
      toast('Подбираем подарок для: ' + name);
    },
    /* профиль человека сразу настраивает фильтры идей */
    applyProfile: function (r) {
      if (!r) return;
      var age = store.ideaChips.find(function (c) { return c.key === 'age'; });
      var gen = store.ideaChips.find(function (c) { return c.key === 'gender'; });
      if (age) { if (typeof r.age === 'number') age.i = r.age; }
      if (gen) { gen.i = r.gender === 'f' ? 0 : (r.gender === 'm' ? 1 : -1); }
      var on = {};
      (r.interests || []).forEach(function (k) { on[k] = 1; });
      store.interests.forEach(function (i) { i.on = on[i.key] ? true : false; });
    },
    setRecipient: function (id) {
      store.recipientId = id;
      toast('Подбираем для: ' + recipient.value.name);
    },
    inShortlist: function (it) {
      return shortlist.value.some(function (x) { return x.pid === it.pid; });
    },
    addToShortlist: function (it) {
      var list = store.shortlists[store.recipientId];
      if (list.some(function (x) { return x.pid === it.pid; })) return;
      list.unshift({
        id: uid(), pid: it.pid, name: it.name, price: it.price,
        oldPrice: it.oldPrice, img: it.img, reserved: null
      });
      toast('В подборке для ' + recipient.value.short);
    },
    removeFromShortlist: function (it) {
      /* в подборке лежит копия со своим id — с карточки идеи совпадёт только pid */
      store.shortlists[store.recipientId] = shortlist.value.filter(function (x) {
        if (x.id === it.id) return false;
        if (x.pid === it.pid) return false;
        return true;
      });
      toast('Убрано из подборки');
    },
    /* скрытые «не моё» идеи не показываем ни в каруселях, ни в фильтре */
    live: function (arr) { return (arr || []).filter(function (x) { return !x.gone; }); },
    dismissIdea: function (it) {
      it.gone = true; toast('Учли — таких идей будет меньше');
      setTimeout(function () { store.ideasSelf = store.ideasSelf.filter(function (x) { return !x.gone; }); }, 240);
    }
  };

  /* закрывать выпадашки по клику вне */
  if (typeof document !== 'undefined' && document.addEventListener) {
    document.addEventListener('click', function () { store.openMenu = null; });
  }

  /* ───────── компоненты ───────── */

  function register(app) {

    /* ── действие на карточке идеи: одна кнопка в углу снимка ──
       себе — сердце «Хочу», другому — плюс «В подборку». Форма одна, меняется значок. */
    app.component('WantButton', {
      props: ['item'],
      setup: function () { return { store: store, A: A }; },
      computed: {
        self: function () { return store.ideasFor === 'self'; },
        on: function () { return this.self ? !!this.item.saved : A.inShortlist(this.item); },
        label: function () {
          if (this.self) return this.item.saved ? 'Уже в вишлисте' : 'Хочу';
          return this.on ? 'Уже в подборке' : 'В подборку';
        }
      },
      methods: {
        act: function () {
          if (this.self) { A.addIdeaToList(this.item); return; }
          if (this.on) { A.removeFromShortlist(this.item); return; }
          A.addToShortlist(this.item);
        }
      },
      template: [
        '<button class="wantbtn" :class="{\'is-on\':on,\'wantbtn--pick\':!self}" @click="act()" :title="label" :aria-label="label">',
        '  <svg v-if="self" viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">',
        '    <path :fill="on ? \'currentColor\' : \'none\'" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"',
        '          d="M12 20.3s-7.6-4.7-7.6-9.8a4.4 4.4 0 0 1 8-2.5 4.4 4.4 0 0 1 8 2.5c0 5.1-7.6 9.8-7.6 9.8Z"/>',
        '  </svg>',
        '  <svg v-else-if="on" viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">',
        '    <path fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" d="m5.5 12.4 4.2 4.2 8.8-9.2"/>',
        '  </svg>',
        '  <svg v-else viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">',
        '    <path fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" d="M12 5.6v12.8M5.6 12h12.8"/>',
        '  </svg>',
        '</button>'
      ].join('')
    });

    /* ── статус «занято» подписью прямо в кнопке-действии ── */
    app.component('TakenPill', {
      props: ['item'],
      setup: function () { return { A: A }; },
      computed: {
        mine: function () { return A.isMine(this.item); },
        label: function () { return A.takenLabel(this.item); },
        hint: function () { return this.mine ? 'Снять резерв' : this.label; }
      },
      methods: { release: function () { if (this.mine) A.reserve(this.item, null); } },
      template: [
        '<span class="wantbtn wantbtn--label" :class="{\'is-on\':mine}"',
        '      :title="hint" @click="release()">',
        '  <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">',
        '    <path fill="currentColor" d="M17 9V7A5 5 0 0 0 7 7v2H5.8A1.8 1.8 0 0 0 4 10.8v8.4c0 1 .8 1.8 1.8 1.8h12.4c1 0 1.8-.8 1.8-1.8v-8.4c0-1-.8-1.8-1.8-1.8Zm-8-2a3 3 0 0 1 6 0v2H9Z"/>',
        '  </svg>',
        '  {{ label }}',
        '</span>'
      ].join('')
    });

    /* ── действия дарителя в углу снимка ──
       Резерв — основная кнопка, того же размера и формы, что «Хочу».
       Сбор нужен реже, поэтому стоит рядом уменьшённым и тихим. */
    app.component('GiverActions', {
      props: ['item'],
      setup: function () { return { store: store, A: A }; },
      computed: {
        mine: function () { return this.item.reserved === 'you'; },
        free: function () { return !this.item.reserved; },
        bought: function () { return this.item.reserved === 'bought'; },
        pooled: function () { return A.hasPool(this.item); },
        /* открыт общий сбор — личного резерва уже нет, остаётся только скинуться */
        showHold: function () {
          if (this.bought) return false;
          if (this.item.reserved) return false;   /* статус показывает taken-pill */
          return !this.pooled;
        },
        joinable: function () {
          if (this.bought) return false;
          if (this.free) return true;
          /* к чужому открытому сбору присоединиться можно, к чужому резерву — нет */
          return this.pooled;
        },
        /* свой резерв держится не подписью, а следующим шагом: «я купил это» */
        buyMode: function () {
          if (this.bought) return false;
          if (this.pooled) return false;   /* в общем сборе покупает организатор, статус другой */
          return this.mine;
        },
        showPill: function () { return !!this.item.reserved && !this.buyMode; },
        reserveLabel: function () { return this.mine ? 'Вы дарите — снять резерв' : 'Зарезервировать'; },
        poolLabel: function () {
          if (!this.pooled) return 'Скинуться вместе';
          return this.mine ? 'Вы участвуете в сборе' : 'Присоединиться к сбору';
        }
      },
      methods: {
        toggle: function () {
          if (this.mine) { A.reserve(this.item, null); return; }
          A.reserve(this.item, 'you');
        }
      },
      template: [
        '<div class="cornerset">',
        /* когда идёт сбор, кнопка сбора остаётся единственной — значит, основной */
        '  <button v-if="joinable" class="wantbtn wantbtn--pool" :class="{\'wantbtn--sm\':showHold,\'is-on\':pooled}"',
        '          @click="A.startPool(item)" :title="poolLabel" :aria-label="poolLabel">',
        '    <svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true">',
        '      <circle fill="none" stroke="currentColor" stroke-width="1.8" cx="9" cy="8.2" r="3.1"/>',
        '      <circle fill="none" stroke="currentColor" stroke-width="1.8" cx="16.6" cy="8.7" r="2.4"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M3.6 18.4c0-2.4 2.4-4.1 5.4-4.1s5.4 1.7 5.4 4.1"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M16.3 14.6c2.3.2 4.1 1.7 4.1 3.8"/>',
        '    </svg>',
        '  </button>',
        /* резерв за вами: маленький крестик снимает его, крупная кнопка ведёт дальше */
        '  <button v-if="buyMode" class="wantbtn wantbtn--sm wantbtn--cancel" @click="A.reserve(item,null)"',
        '          title="Снять резерв" aria-label="Снять резерв">',
        '    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">',
        '      <path fill="none" stroke="currentColor" stroke-width="2.1" stroke-linecap="round" d="M7 7l10 10M17 7L7 17"/>',
        '    </svg>',
        '  </button>',
        '  <button v-if="buyMode" class="wantbtn wantbtn--label wantbtn--buy" @click="A.askBought(item)"',
        '          title="Отметить купленным" aria-label="Отметить купленным">',
        '    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">',
        '      <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" d="M6.6 3h10.8l2.6 3.6v12.6a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 19.2V6.6Z"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M4 6.6h16"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="M15.6 10.2a3.6 3.6 0 0 1-7.2 0"/>',
        '    </svg>',
        '    Я купил это',
        '  </button>',
        '  <taken-pill v-if="showPill" :item="item" />',
        '  <button v-if="showHold" class="wantbtn wantbtn--hold" :class="{\'is-on\':mine}" @click="toggle()"',
        '          :title="reserveLabel" :aria-label="reserveLabel" :disabled="A.otherHolds(item)">',
        '    <svg v-if="mine" viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">',
        '      <path fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" d="m5.5 12.4 4.2 4.2 8.8-9.2"/>',
        '    </svg>',
        '    <svg v-else viewBox="0 0 24 24" width="21" height="21" aria-hidden="true">',
        '      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M3.9 8.9h16.2v3.4H3.9zM5.3 12.3h13.4v7.4H5.3z"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" d="M12 8.9v10.8"/>',
        '      <path fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" d="M12 8.9S10.6 4.3 8.4 4.3a2.3 2.3 0 0 0 0 4.6Zm0 0s1.4-4.6 3.6-4.6a2.3 2.3 0 0 1 0 4.6Z"/>',
        '    </svg>',
        '  </button>',
        '</div>'
      ].join('')
    });

    /* ── бесконечная лента подарков внизу страницы идей ── */
    app.component('FeedBlock', {
      setup: function () { return { store: store, A: A }; },
      mounted: function () {
        if (!store.feed.length) A.feedMore();
        var self = this;
        if (typeof IntersectionObserver !== 'function') return;   /* кнопка «Показать ещё» остаётся запасным вариантом */
        this.io = new IntersectionObserver(function (rows) {
          rows.forEach(function (r) { if (r.isIntersecting) A.feedMore(); });
        }, { rootMargin: '400px 0px' });
        if (this.$refs.sentinel) this.io.observe(this.$refs.sentinel);
      },
      beforeUnmount: function () { if (this.io) this.io.disconnect(); },
      template: [
        '<section class="feed">',
        '  <div class="feed__head"><span class="section-title">{{ A.feedTitle() }}</span></div>',
        '  <div class="grid grid--4">',
        '    <gift-card v-for="it in A.live(store.feed)" :key="it.id" :item="it">',
        '      <template #media>'
        + '<want-button :item="it" />'
        + '<button class="present__dismiss" @click="A.dismissIdea(it)" :title="A.dismissTitle()">✕</button>'
        + '</template>',
        '    </gift-card>',
        '  </div>',
        '  <div ref="sentinel" class="feed__more">',
        '    <span v-if="store.feedLoading" class="feed__spin" aria-label="Загружаем"></span>',
        '    <button v-else-if="!store.feedDone" class="btn btn--outline btn--sm" @click="A.feedMore()">Показать ещё</button>',
        '    <span v-else class="feed__end">Вы посмотрели все идеи на сегодня</span>',
        '  </div>',
        '</section>'
      ].join('')
    });

    /* ── карусель на Swiper: обёртка вокруг слотовых .swiper-slide ── */
    app.component('SwipeRow', {
      props: ['count'],
      /* по умолчанию растворения нет — включаем, только когда Swiper померил дорожку */
      data: function () { return { atStart: true, atEnd: true }; },
      mounted: function () {
        var self = this;
        if (typeof window.Swiper !== 'function') return;   /* без плагина остаётся обычный скролл */
        this.sw = new window.Swiper(this.$refs.root, {
          slidesPerView: 'auto',
          spaceBetween: 16,
          slidesPerGroup: 2,
          watchOverflow: true,
          resizeObserver: true,
          grabCursor: true,
          navigation: { nextEl: this.$refs.next, prevEl: this.$refs.prev },
          keyboard: { enabled: true, onlyInViewport: true },
          mousewheel: { forceToAxis: true },
          on: {
            init: function (sw) { self.sync(sw); },
            slideChange: function (sw) { self.sync(sw); },
            reachBeginning: function (sw) { self.sync(sw); },
            reachEnd: function (sw) { self.sync(sw); },
            resize: function (sw) { self.sync(sw); },
            lock: function (sw) { self.sync(sw); },
            unlock: function (sw) { self.sync(sw); }
          }
        });
      },
      updated: function () { if (this.sw) this.sw.update(); },
      beforeUnmount: function () { if (this.sw) this.sw.destroy(true, true); },
      methods: {
        sync: function (sw) {
          /* нечего листать (всё влезло или размеры ещё не посчитаны) — края чёткие */
          if (!sw.slides || !sw.slides.length || sw.isLocked) {
            this.atStart = true; this.atEnd = true; return;
          }
          this.atStart = sw.isBeginning;
          this.atEnd = sw.isEnd;
        }
      },
      template: [
        '<div class="carousel__box" :class="{\'has-prev\':!atStart,\'has-next\':!atEnd}">',
        '  <div class="swiper carousel__swiper" ref="root">',
        '    <div class="swiper-wrapper"><slot /></div>',
        '  </div>',
        '  <button class="cnav cnav--prev" :class="{\'is-off\':atStart}" ref="prev" aria-label="Назад">‹</button>',
        '  <button class="cnav cnav--next" :class="{\'is-off\':atEnd}" ref="next" aria-label="Вперёд">›</button>',
        '</div>'
      ].join('')
    });

    app.component('Thumb', {
      props: ['image', 'cls'],
      data: function () { return { broken: false }; },
      computed: { show: function () { return this.image ? !this.broken : false; } },
      methods: { onErr: function () { this.broken = true; } },
      template: '<div class="thumb" :class="[cls,{\'is-broken\':broken}]"><img v-if="show" class="thumb__img" :src="image" alt="" loading="lazy" referrerpolicy="no-referrer" @error="onErr"></div>'
    });

    /* иконки приоритетов — inline SVG, без ассетов */
    app.component('TierIcon', {
      props: ['tier'],
      template: [
        '<span class="tico" :class="\'tico--\'+tier">',
        '  <svg v-if="tier===\'top\'" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">',
        '    <path fill="currentColor" d="M13.6 1.5c.3 3-.9 4.6-2.3 6C9.6 9 7.5 10.6 7.5 14a6.6 6.6 0 0 0 3 5.6c-.5-1-.7-2-.4-3 .4-1.6 2-2.7 2.4-4.3.7 1 1 1.9 1 2.9 1-1.1 1.6-2.5 1.6-3.9 1.6 1.7 2.6 3.8 2.6 5.7a6.6 6.6 0 0 1-2.4 5.1A7.5 7.5 0 0 0 20 15c0-5.3-3.2-9.4-6.4-13.5Z"/>',
        '  </svg>',
        '  <svg v-else-if="tier===\'want\'" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">',
        '    <path fill="currentColor" d="M12 20.3l-1.5-1.35C5.4 14.36 2 11.28 2 7.5 2 4.42 4.42 2 7.5 2c1.74 0 3.41.81 4.5 2.09C13.09 2.81 14.76 2 16.5 2 19.58 2 22 4.42 22 7.5c0 3.78-3.4 6.86-8.5 11.45L12 20.3Z"/>',
        '  </svg>',
        '  <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">',
        '    <path fill="none" stroke="currentColor" stroke-width="2" d="M12 3a9 9 0 1 0 9 9"/>',
        '    <path fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" d="M12 7v5l3.5 2"/>',
        '  </svg>',
        '</span>'
      ].join('')
    });

    app.component('GiftCard', {
      props: ['item'],
      setup: function () { return { A: A }; },
      template: [
        '<article class="present" :class="{\'is-taken\':item.reserved}">',
        '  <div class="present__media">',
        '    <thumb :image="item.img" cls="present__thumb" />',
        /* лента с плотной заливкой — читается на любом фото */
        '    <div v-if="item.oldPrice" class="present__sale">−{{ A.discount(item) }}%</div>',
        /* угол снимка — для действий, которые должны лежать на фото */
        '    <slot name="media" />',
        '  </div>',
        '  <div class="present__info">',
        '    <div class="present__name">{{ item.name }}</div>',
        '    <div class="present__price">',
        '      {{ A.money(item.price) }}',
        '      <s v-if="item.oldPrice">{{ A.money(item.oldPrice) }}</s>',
        /* «почему это здесь» — значок у цены, текст всплывает по наведению */
        '      <span v-if="item.reason" class="why" tabindex="0" :aria-label="item.reason">',
        '        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">',
        '          <path fill="currentColor" d="M12 2.8A9.2 9.2 0 1 0 21.2 12 9.2 9.2 0 0 0 12 2.8Zm0 16.9A7.7 7.7 0 1 1 19.7 12 7.7 7.7 0 0 1 12 19.7Z"/>',
        '          <path fill="currentColor" d="M12 10.3a.75.75 0 0 0-.75.75v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-.75-.75Z"/>',
        '          <circle fill="currentColor" cx="12" cy="8" r="1"/>',
        '        </svg>',
        '        <span class="why__tip">{{ item.reason }}</span>',
        '      </span>',
        '    </div>',
        '    <div v-if="A.hasPool(item)" class="fund">',
        '      <div class="fund__track"><div class="fund__fill" :style="{width:A.poolPct(item)+\'%\'}"></div></div>',
        '      <div class="fund__nums">',
        '        <b>{{ A.money(A.poolRaised(item)) }}</b> из {{ A.money(item.price) }}',
        '        <span class="fund__who">👥 {{ A.poolPeople(item) }}</span>',
        '      </div>',
        '    </div>',
        '    <div class="present__foot"><slot /></div>',
        '  </div>',
        '</article>'
      ].join('')
    });

    app.component('GiftRow', {
      props: ['item', 'flat'],
      setup: function () { return { A: A }; },
      template: [
        '<div class="rrow" :class="{\'rrow--flat\':flat,\'is-mine\':item.reserved===\'you\',\'is-taken\':item.reserved===\'bought\'||item.reserved===\'someone\'}">',
        '  <thumb :image="item.img" />',
        '  <div class="rrow__main">',
        '    <div class="card__name">{{ item.name }}</div>',
        '    <div v-if="item.note" class="card__note">«{{ item.note }}»</div>',
        '    <div class="card__price">{{ A.money(item.price) }}<s v-if="item.oldPrice"> {{ A.money(item.oldPrice) }}</s></div>',
        '    <slot />',
        '  </div>',
        '</div>'
      ].join('')
    });

    app.component('AddGiftForm', {
      setup: function () { return { store: store, A: A, preview: window.WL_GOOD(10) }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Свой подарок <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Вставьте ссылку из любого магазина — заполним карточку сами.</p>',
        '  <div class="field-row">',
        '    <input class="field" v-model="store.addUrl" spellcheck="false">',
        '    <button class="btn btn--red btn--sm" @click="A.findByUrl()">Найти</button>',
        '  </div>',
        '  <div v-if="store.addFound" class="preview">',
        '    <div class="preview__row">',
        '      <thumb :image="preview.img" cls="" style="width:56px;height:56px;flex:none;border-radius:8px" />',
        '      <div><div class="card__name">{{ preview.name }}</div><div class="card__price">{{ A.money(preview.price) }}</div></div>',
        '    </div>',
        '    <div class="preview__tiers">',
        '      <button class="tchip" :class="{\'is-on\':store.addTier===\'top\'}" @click="store.addTier=\'top\'"><tier-icon tier="top" /> Больше всего</button>',
        '      <button class="tchip" :class="{\'is-on\':store.addTier===\'want\'}" @click="store.addTier=\'want\'"><tier-icon tier="want" /> Хочу</button>',
        '      <button class="tchip" :class="{\'is-on\':store.addTier===\'someday\'}" @click="store.addTier=\'someday\'"><tier-icon tier="someday" /> Когда-нибудь</button>',
        '      <input class="field field--mini" v-model="store.addNote" placeholder="Заметка: цвет, размер…">',
        '    </div>',
        '    <button class="btn btn--green btn--sm btn--block" @click="A.confirmAdd()">Добавить в вишлист</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: Списки ── */
    app.component('ListsScreen', {
      setup: function () {
        return { store: store, A: A, currentList: currentList, tierGroups: tierGroups,
                 reserved: reservedCount };
      },
      template: [
        '<div>',
        /* ── шапка списка: обложка + все действия ── */
        '  <header class="hero" :style="A.heroStyle(currentList)">',
        '    <div class="hero__scrim"></div>',
        /* веер из фотографий самого вишлиста: обложка перестаёт быть просто фоном */
        '    <div class="hero__fan" aria-hidden="true">',
        '      <span v-for="(it,n) in A.heroFan(currentList)" :key="it.id" class="hero__fancard" :class="\'i\'+n">',
        '        <thumb :image="it.img" cls="" />',
        '      </span>',
        '      <span v-if="!A.heroFan(currentList).length" class="hero__fanempty">',
        '        <list-icon :name="currentList.icon" :size="40" />',
        '      </span>',
        '    </div>',
        '    <button class="hero__cover" @click="A.openListSettings()"><ui-icon name="settings" :size="15" /> Настройки</button>',
        '    <div class="hero__body">',
        '      <span class="hero__emoji"><list-icon :name="currentList.icon" :size="24" /></span>',
        '      <div class="hero__head">',
        '        <h1 class="hero__title">{{ currentList.title }}</h1>',
        '        <span v-if="currentList.date" class="hero__date"><ui-icon name="calendar-days" :size="15" /> {{ currentList.date }}</span>',
        '      </div>',
        '      <div class="hero__meta">',
        '        <span><ui-icon name="gift" /> {{ currentList.items.length }} подарков</span>',
        '        <span v-if="reserved"><ui-icon name="lock" /> {{ reserved }} занято</span>',
        '      </div>',
        '      <hero-desc :list="currentList" />',
        '      <div class="hero__acts">',
        '        <button class="hact hact--primary" @click="A.openSheet(\'gift\')"><ui-icon name="plus" :size="18" /> Добавить подарок</button>',
        '        <button class="hact" @click="A.openSheet(\'share\')"><ui-icon name="share-2" /> Поделиться</button>',
        '        <button class="hact hact--icon" @click="A.openSheet(\'activity\')" title="Активность" aria-label="Активность"><ui-icon name="bar-chart-3" :size="18" /></button>',
        '      </div>',
        '    </div>',
        '  </header>',


        '  <div v-for="g in A.filledTiers(tierGroups)" :key="g.key" class="tier">',
        '    <div class="tier__label"><tier-icon :tier="g.key" /> {{ g.label }} <span class="tier__count">{{ g.items.length }}</span></div>',
        '    <div class="grid grid--4">',
        '      <gift-card v-for="it in g.items" :key="it.id" :item="it">',
        /* действие в углу снимка — как на карточках идей */
        '        <template #media>'
        /* статус и действие — одной группой в углу, как у дарителя */
        + '<div class="cornerset">'
        + '<taken-pill v-if="it.reserved" :item="it" />'
        + '<button class="wantbtn wantbtn--edit" @click="A.editItem(it)" title="Изменить" aria-label="Изменить">'
        + '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">'
        + '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"'
        + ' d="M16.5 4.4a2 2 0 0 1 2.8 2.8L8.8 17.7l-3.7.9.9-3.7Z"/>'
        + '<path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" d="m14.8 6.1 3.1 3.1"/>'
        + '</svg></button>'
        + '</div>'
        + '<button v-if="g.key!==\'top\'" class="present__pin" @click="A.bump(it,\'top\')" title="В «Больше всего хочу»">'
        + '<tier-icon tier="top" /></button>'
        + '</template>',
        '      </gift-card>',
        '    </div>',
        '  </div>',
        /* совсем пустой вишлист — одна заглушка вместо трёх пустых приоритетов */
        '  <div v-if="!currentList.items.length" class="listempty">',
        '    <div class="listempty__title">В этом вишлисте пока пусто</div>',
        '    <p class="listempty__hint">Добавьте подарок ссылкой из магазина или отметьте идею на странице «Идеи подарков».</p>',
        '    <div class="listempty__acts">',
        '      <button class="btn btn--green btn--sm" @click="A.openSheet(\'gift\')"><ui-icon name="plus" :size="16" /> Добавить подарок</button>',
        '      <button class="btn btn--ghost btn--sm" @click="A.go(\'ideas\')">Смотреть идеи</button>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: Идеи ── */
    app.component('IdeasScreen', {
      setup: function () {
        /* обе ветки («себе» и «другому») рисуются одной разметкой:
           меняются только подборки и действие на карточке */
        var cols = computed(function () {
          if (store.ideasFor === 'other') {
            return store.recipientCols[store.recipientId] || store.collections;
          }
          var rest = store.collections.filter(function (c) { return c.key !== 'picked'; });
          return [{ key: 'self', title: 'Подобрано для вас', items: store.ideasSelf }].concat(rest);
        });
        return {
          store: store, A: A, recipient: recipient, shortlist: shortlist, cols: cols,
          isSelf: computed(function () { return store.ideasFor === 'self'; }),
          who: computed(function () { return store.ideasFor === 'self' ? 'себя' : recipient.value.short; })
        };
      },
      template: [
        '<div>',
        '  <div class="ideas-head">',
        '    <div class="ideas-head__left">',
        '      <h1 class="ideas-title">',
        '        Идеи подарков для',
        '        <span class="dd">',
        '          <button class="whoswitch" :class="{\'is-other\':store.ideasFor===\'other\'}" @click.stop="A.toggleMenu(\'who\')" title="Выбрать, кому подбираем">',
        '            <span v-if="isSelf">себя</span>',
        '            <span v-else><span class="who__ava" :style="{background:recipient.color}">{{ recipient.name.charAt(0) }}</span>{{ recipient.short }}</span>',
        '            <span class="dd__caret" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m6 9.5 6 6 6-6"/></svg></span>',
        '          </button>',
        '          <div v-if="store.openMenu===\'who\'" class="dd__panel dd__panel--left" @click.stop>',
        '            <div class="dd__title">Кому подбираем</div>',
        '            <person-row who="self" />',
        '            <template v-if="A.gameRecipients().length">',
        '              <div class="dd__title dd__title--sub">Из игр «Мой Санта»</div>',
        '              <person-row v-for="r in A.gameRecipients()" :key="r.id" :person="r" />',
        '            </template>',
        '            <template v-if="A.ownRecipients().length">',
        '              <div class="dd__title dd__title--sub">Мои люди</div>',
        '              <person-row v-for="r in A.ownRecipients()" :key="r.id" :person="r" />',
        '            </template>',
        '            <button class="dd__item dd__item--add" @click="A.openPersonSheet()"><ui-icon name="plus" :size="16" /> Новый человек</button>',
        '          </div>',
        '        </span>',
        '      </h1>',
        '    </div>',
        '  </div>',

        '  <div class="searchbar" :class="{\'has-chips\':A.filterCount()}">',
        '    <input class="field" placeholder="Начните искать, найдётся всё">',
        '    <button class="field__go" @click="A.toast(\'Поиск по каталогу — в прототипе\')" aria-label="Искать">🔍</button>',
        '    <button class="field__cog" :class="{\'is-on\':A.filterCount()}" @click="A.openSheet(\'filters\')" title="Фильтры">',
        '      <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">',
        '        <path fill="currentColor" d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm0 5.6a2.1 2.1 0 1 1 0-4.2 2.1 2.1 0 0 1 0 4.2Z"/>',
        '        <path fill="currentColor" d="m20.3 13.6-.1-1.6.1-1.6a.7.7 0 0 0-.4-.7l-1.6-.7a6.6 6.6 0 0 0-.6-1l.2-1.8a.7.7 0 0 0-.3-.7l-1.4-1a.7.7 0 0 0-.7-.1l-1.7.6a6.9 6.9 0 0 0-1-.4L11.9 2.7a.7.7 0 0 0-.6-.4H9.6a.7.7 0 0 0-.7.4l-.6 1.7-1 .4-1.7-.6a.7.7 0 0 0-.7.1l-1.4 1a.7.7 0 0 0-.3.7l.3 1.8-.6 1-1.7.7a.7.7 0 0 0-.4.7l.1 1.6-.1 1.6a.7.7 0 0 0 .4.7l1.7.7.6 1-.3 1.8a.7.7 0 0 0 .3.7l1.4 1a.7.7 0 0 0 .7.1l1.7-.6 1 .4.6 1.7a.7.7 0 0 0 .7.4h1.7a.7.7 0 0 0 .7-.4l.6-1.7 1-.4 1.7.6a.7.7 0 0 0 .7-.1l1.4-1a.7.7 0 0 0 .3-.7l-.3-1.8.6-1 1.7-.7a.7.7 0 0 0 .4-.7Z" opacity=".16"/>',
        '        <path fill="currentColor" d="M20.6 10.2 19 9.6a7.5 7.5 0 0 0-.6-1.4l.7-1.5a.8.8 0 0 0-.2-.9l-1.7-1.7a.8.8 0 0 0-.9-.2l-1.5.7a7.5 7.5 0 0 0-1.4-.6l-.6-1.6a.8.8 0 0 0-.7-.5h-2.4a.8.8 0 0 0-.7.5l-.6 1.6c-.5.2-1 .4-1.4.6l-1.5-.7a.8.8 0 0 0-.9.2L2.9 5.8a.8.8 0 0 0-.2.9l.7 1.5c-.2.4-.4.9-.6 1.4l-1.6.6a.8.8 0 0 0-.5.7v2.4c0 .3.2.6.5.7l1.6.6c.2.5.4 1 .6 1.4l-.7 1.5a.8.8 0 0 0 .2.9l1.7 1.7a.8.8 0 0 0 .9.2l1.5-.7c.4.2.9.4 1.4.6l.6 1.6c.1.3.4.5.7.5h2.4a.8.8 0 0 0 .7-.5l.6-1.6c.5-.2 1-.4 1.4-.6l1.5.7a.8.8 0 0 0 .9-.2l1.7-1.7a.8.8 0 0 0 .2-.9l-.7-1.5c.2-.4.4-.9.6-1.4l1.6-.6a.8.8 0 0 0 .5-.7v-2.4a.8.8 0 0 0-.5-.7Zm-1 2.6-1.4.5a.8.8 0 0 0-.5.5 6 6 0 0 1-.8 1.9.8.8 0 0 0 0 .7l.6 1.3-1 1-1.3-.6a.8.8 0 0 0-.7 0 6 6 0 0 1-1.9.8.8.8 0 0 0-.5.5l-.5 1.4h-1.4l-.5-1.4a.8.8 0 0 0-.5-.5 6 6 0 0 1-1.9-.8.8.8 0 0 0-.7 0l-1.3.6-1-1 .6-1.3a.8.8 0 0 0 0-.7 6 6 0 0 1-.8-1.9.8.8 0 0 0-.5-.5l-1.4-.5v-1.4l1.4-.5a.8.8 0 0 0 .5-.5 6 6 0 0 1 .8-1.9.8.8 0 0 0 0-.7l-.6-1.3 1-1 1.3.6a.8.8 0 0 0 .7 0 6 6 0 0 1 1.9-.8.8.8 0 0 0 .5-.5l.5-1.4h1.4l.5 1.4c.1.3.3.4.5.5a6 6 0 0 1 1.9.8c.2.1.5.1.7 0l1.3-.6 1 1-.6 1.3a.8.8 0 0 0 0 .7 6 6 0 0 1 .8 1.9c.1.2.2.4.5.5l1.4.5Z"/>',
        '      </svg>',
        '      <b v-if="A.filterCount()">{{ A.filterCount() }}</b>',
        '    </button>',
        '  </div>',

        /* только активные фильтры, каждый снимается крестиком */
        '  <div v-if="A.filterCount()" class="ideafilters">',
        '    <button v-for="c in A.activeChips()" :key="c.key" class="fchip is-on" @click="A.clearChip(c)">',
        '      {{ c.opts[c.i] }}<span class="fchip__x">✕</span>',
        '    </button>',
        '    <button v-for="i in A.activeInterests()" :key="i.key" class="fchip is-on" @click="A.toggleInterest(i)">',
        '      {{ i.emoji }} {{ i.key }}<span class="fchip__x">✕</span>',
        '    </button>',
        '    <a class="flink" @click="A.clearAllFilters()">Сбросить всё</a>',
        '  </div>',

        /* ── обзор: карусели подборок ── */
        '  <template v-if="store.ideasView===\'browse\'">',
        '    <div v-for="col in cols" :key="col.key" class="carousel">',
        '      <button class="carousel__head" @click="A.openCollectionOrGo(col)">',
        '        <span class="section-title">{{ col.title }}</span>',
        '        <span class="carousel__all">{{ col.link || "Все идеи" }}',
        '          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">',
        '            <path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m9.5 5.5 7 6.5-7 6.5"/>',
        '          </svg>',
        '        </span>',
        '      </button>',
        '      <swipe-row :count="A.live(col.items).length">',
        '        <div v-for="it in A.live(col.items)" :key="it.id" class="swiper-slide carousel__card">',
        '          <gift-card :item="it">',
        /* именованный слот — прямой потомок компонента, условие вешаем на саму кнопку */
        '            <template #media>'
        + '<want-button :item="it" />'
        + '<button class="present__dismiss" @click="A.dismissIdea(it)" :title="A.dismissTitle()">✕</button>'
        + '</template>',
        '          </gift-card>',
        '        </div>',
        '        <div class="swiper-slide carousel__card">',
        '          <button class="carousel__more" @click="A.openCollectionOrGo(col)">',
        '            <span class="carousel__more-ic"><ui-icon name="arrow-right" :size="19" /></span>',
        '            <span>{{ col.link || "Посмотреть больше" }}</span>',
        '          </button>',
        '        </div>',
        '      </swipe-row>',
        '    </div>',
        '    <feed-block />',
        '  </template>',

        /* ── фильтр включён: плоский список ── */
        '  <template v-else>',
        '    <div class="activefilter">',
        '      <span v-if="A.fromCollection()" class="chip-active">{{ store.activeFilter.title }}<button @click="A.clearIdeasFilter()">✕</button></span>',
        '      <a class="flink" @click="A.clearIdeasFilter()"><ui-icon name="chevron-left" :size="15" /> Все подборки</a>',
        '    </div>',
        '    <div class="grid grid--4">',
        '      <gift-card v-for="it in A.live(store.activeFilter.items)" :key="it.id" :item="it">',
        '        <template #media>'
        + '<want-button :item="it" />'
        + '<button class="present__dismiss" @click="A.dismissIdea(it)" :title="A.dismissTitle()">✕</button>'
        + '</template>',
        '      </gift-card>',
        '    </div>',
        '  </template>',
        '</div>'
      ].join('')
    });

    /* ── Экран: подборка для конкретного человека ── */
    app.component('ShortlistScreen', {
      setup: function () { return { store: store, A: A, recipient: recipient, shortlist: shortlist }; },
      computed: {
        game: function () { return A.isGameTarget(); },
        /* в игре дарит один человек: ни резерва, ни сбора здесь не нужно */
        note: function () {
          return this.game
            ? 'Вы тайный Санта для ' + recipient.value.short + ' — дарите только вы, '
              + 'поэтому резервировать кандидатов не нужно. ' + recipient.value.name + ' подборку не видит.'
            : 'Личный список кандидатов. Поделитесь им с теми, кто дарит вместе с вами: '
              + 'подарок можно занять за собой или собрать на него вместе.';
        },
        countLabel: function () {
          return shortlist.value.length + ' ' + A.plural(shortlist.value.length, ['идея', 'идеи', 'идей']);
        }
      },
      template: [
        '<div>',
        /* шапка как у вишлиста: тот же веер, аватарка вместо значка списка */
        '  <header class="hero" :style="A.heroTint(recipient.color)">',
        '    <div class="hero__scrim"></div>',
        '    <div class="hero__fan" aria-hidden="true">',
        '      <span v-for="(it,n) in A.shortFan()" :key="it.id" class="hero__fancard" :class="\'i\'+n">',
        '        <thumb :image="it.img" cls="" />',
        '      </span>',
        '      <span v-if="!A.shortFan().length" class="hero__fanempty">',
        '        <ui-icon name="gift" :size="38" />',
        '      </span>',
        '    </div>',
        '    <div class="hero__body">',
        '      <span class="hero__ava" :style="{background:recipient.color}">{{ recipient.name.charAt(0) }}</span>',
        '      <div class="hero__head">',
        '        <h1 class="hero__title">Подборка для {{ recipient.short }}</h1>',
        '        <span v-if="recipient.game" class="hero__date"><ui-icon name="users" :size="15" /> {{ recipient.game }}</span>',
        '      </div>',
        '      <div class="hero__meta">',
        '        <span><ui-icon name="gift" /> {{ countLabel }}</span>',
        '        <span><ui-icon name="lock" /> {{ recipient.name }} не видит</span>',
        '      </div>',
        '      <p class="hero__note">{{ note }}</p>',
        '      <div class="hero__acts">',
        '        <button class="hact hact--primary" @click="A.openSheet(\'pickshare\')">',
        '          <ui-icon name="share-2" :size="18" /> Поделиться подборкой</button>',
        '      </div>',
        '    </div>',
        '  </header>',

        '  <div v-if="!shortlist.length" class="emptytier" style="margin-top:20px">',
        '    Пока пусто. Добавляйте идеи кнопкой ＋ в углу карточки.',
        '  </div>',
        '  <div v-else class="grid grid--4" style="margin-top:20px">',
        '    <gift-card v-for="it in shortlist" :key="it.id" :item="it">',
        /* в игре дарит один человек — резервировать не у кого, остаётся сама вещь;
           для своих людей действуют те же кнопки, что у дарителя в чужом вишлисте */
        '      <template #media>'
        + '<button class="present__dismiss" @click="A.removeFromShortlist(it)" title="Убрать из подборки">✕</button>'
        + '<giver-actions v-if="!game" :item="it" />'
        + '</template>',
        '    </gift-card>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: Активность ── */
    app.component('ActivityBody', {
      setup: function () {
        return {
          store: store, A: A, currentList: currentList, reservedCount: reservedCount,
          notReserved: computed(function () {
            return currentList.value.items.filter(function (i) { return !i.reserved; }).slice(0, 3);
          })
        };
      },
      template: [
        '<div>',
        '  <div class="sheet__title">Активность вишлиста <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <div class="screen__head">',
        '    <div class="sheet__hint">Без имён: кто смотрел и кто зарезервировал — не видно.</div>',
        '    <div class="segbar">',
        '      <button class="seg" :class="{\'is-on\':store.period===\'30\'}" @click="store.period=\'30\'">30 дней</button>',
        '      <button class="seg" :class="{\'is-on\':store.period===\'7\'}" @click="store.period=\'7\'">7 дней</button>',
        '    </div>',
        '  </div>',
        '  <div class="stats">',
        '    <div class="stat">',
        '      <div class="stat__label">Просмотры</div>',
        '      <div class="stat__num">{{ store.period===\'7\' ? 9 : 34 }}</div>',
        '      <svg class="spark" viewBox="0 0 160 40" preserveAspectRatio="none"><polyline points="0,33 20,28 40,30 60,18 80,22 100,12 120,15 140,6 160,9" fill="none" stroke="var(--green)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="160" cy="9" r="3.5" fill="var(--green)"/></svg>',
        '    </div>',
        '    <div class="stat">',
        '      <div class="stat__label">Зарезервировано</div>',
        '      <div class="stat__num">{{ reservedCount }} <span class="stat__of">/ {{ currentList.items.length }}</span></div>',
        '      <div class="pot__track"><div class="pot__filled" :style="{width: Math.round(reservedCount/currentList.items.length*100)+\'%\'}"></div></div>',
        '    </div>',
        '    <div class="stat">',
        '      <div class="stat__label">Переходы в магазины</div>',
        '      <div class="stat__num">{{ store.period===\'7\' ? 14 : 57 }}</div>',
        '      <div class="stat__hint">за выбранный период</div>',
        '    </div>',
        '  </div>',
        '  <div class="tier__label">Чаще смотрят, но не зарезервировали</div>',
        '  <div class="rlist">',
        '    <gift-row v-for="(it,n) in notReserved" :key="it.id" :item="it" flat>',
        '      <div class="card__note">{{ [18,11,9][n] || 5 }} переходов</div>',
        '    </gift-row>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: список глазами дарителя ── */
    app.component('SharedScreen', {
      setup: function () {
        var list = store.lists[0];
        var groups = computed(function () {
          return groupByTier(list).filter(function (g) { return g.items.length; });
        });
        var taken = computed(function () {
          return list.items.filter(function (i) { return i.reserved; }).length;
        });
        return { store: store, A: A, list: list, groups: groups, taken: taken };
      },
      /* та же шапка и та же сетка карточек, что у владельца — меняются действия */
      template: [
        '<div>',
        '  <header class="hero" :style="A.heroStyle(list)">',
        '    <div class="hero__scrim"></div>',
        '    <div class="hero__body">',
        '      <span class="hero__emoji"><list-icon :name="list.icon" :size="24" /></span>',
        '      <div class="hero__head">',
        '        <h1 class="hero__title">Вишлист Ани — «{{ list.title }}»</h1>',
        '        <span v-if="list.date" class="hero__date"><ui-icon name="calendar-days" :size="15" /> {{ list.date }}</span>',
        '      </div>',
        '      <div class="hero__meta">',
        '        <span><ui-icon name="gift" /> {{ list.items.length }} подарков</span>',
        '        <span><ui-icon name="lock" /> {{ taken }} уже разобрано</span>',
        '      </div>',
        '      <hero-desc :list="list" />',
        '      <div class="hero__acts">',
        '        <button class="hact hact--primary" @click="A.copyLink()"><ui-icon name="link" :size="18" /> Скопировать ссылку</button>',
        '      </div>',
        '    </div>',
        '  </header>',

        '  <p class="sharenote"><ui-icon name="lock" :size="15" /> Аня не увидит, кто и что зарезервировал</p>',


        '  <div v-for="g in groups" :key="g.key" class="tier">',
        '    <div class="tier__label"><tier-icon :tier="g.key" /> {{ g.label }} <span class="tier__count">{{ g.items.length }}</span></div>',
        '    <div class="grid grid--4">',
        '      <gift-card v-for="it in g.items" :key="it.id" :item="it">',
        '        <template #media><giver-actions :item="it" /></template>',
        '      </gift-card>',
        '    </div>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: совместный сбор ── */
    app.component('PoolScreen', {
      setup: function () {
        return { store: store, A: A, poolTotal: poolTotal, poolPct: poolPct,
                 it: computed(function () { return A.poolItem(); }) };
      },
      template: [
        '<div v-if="it" class="pool">',
        '  <div class="pool__item">',
        '    <thumb :image="it.img" cls="" style="width:72px;height:72px;flex:none;border-radius:10px" />',
        '    <div><div class="card__name">{{ it.name }}</div><div class="card__price">Цель: {{ A.money(it.price) }}</div></div>',
        '  </div>',
        '  <div class="pot">',
        '    <div class="pot__track"><div class="pot__filled" :style="{width: poolPct+\'%\'}"></div></div>',
        '    <div class="pot__nums"><b>{{ A.money(poolTotal) }}</b> собрано из {{ A.money(it.price) }} · {{ poolPct }}%</div>',
        '  </div>',
        '  <ul v-if="it.pool.pledges.length" class="pledges">',
        '    <li v-for="(p,n) in it.pool.pledges" :key="n"><span>{{ p.name }}</span><span>{{ A.money(p.amount) }}</span></li>',
        '  </ul>',
        '  <p v-else class="poolempty">Сбор только открыт — вы первый. Никто ещё не внёс вклад.</p>',
        '  <div class="pool__form">',
        '    <label class="pool__label">Ваш вклад: <b>{{ A.money(store.pledgeAmount) }}</b></label>',
        '    <input type="range" class="range" min="100" max="1500" step="100" v-model.number="store.pledgeAmount">',
        '    <div class="presets">',
        '      <button v-for="p in [100,300,500,1000]" :key="p" @click="A.setPledge(p)">+{{ p }} ₽</button>',
        '    </div>',
        '    <div class="field-row">',
        '      <input class="field" v-model="store.pledgeName" placeholder="Ваше имя">',
        '      <button class="btn btn--green btn--sm" :disabled="store.pledgeDone" @click="A.addPledge()">{{ store.pledgeDone ? "Внесено" : "Внести" }}</button>',
        '    </div>',
        '    <div class="locknote">Подарок займётся за вами только после вклада. Организатор — {{ it.pool.organiser }}: отметит, когда подарок куплен. Деньги переводятся между людьми напрямую.</div>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── правая панель «Вишлист» (как на экране MySanta) ── */
    /* ── строка человека в списке «кому подбираем» ── */
    app.component('PersonRow', {
      props: ['person', 'who'],
      setup: function () { return { store: store, A: A }; },
      computed: {
        self: function () { return this.who === 'self'; },
        on: function () { return this.self ? store.ideasFor === 'self' : A.isTarget(this.person); },
        editable: function () { return this.self ? false : this.person.source !== 'game'; },
        sub: function () {
          if (this.self) return 'мой вишлист';
          if (this.person.game) return this.person.game;
          var n = A.shortlistCount(this.person);
          return n ? n + ' в подборке' : 'добавлен вручную';
        }
      },
      methods: {
        pick: function () { A.setIdeasTarget(this.self ? 'self' : this.person.id); }
      },
      template: [
        '<div class="dd__person" :class="{\'is-on\':on}" role="button" tabindex="0"',
        '     @click="pick()" @keyup.enter="pick()">',
        '  <span v-if="self" class="who__ava who__ava--me">Я</span>',
        '  <span v-else class="who__ava" :style="{background:person.color}">{{ person.name.charAt(0) }}</span>',
        '  <span class="dd__who">',
        '    <b>{{ self ? "Себе" : person.name }}</b>',
        '    <em>{{ sub }}</em>',
        '  </span>',
        /* анкету можно править только у своих людей — из игры она приходит готовой */
        '  <button v-if="editable" class="dd__cog" @click.stop="A.editPerson(person)" title="Изменить анкету" aria-label="Изменить анкету">',
        /* шестерёнка — Feather Icons «settings» (MIT), а не рисованная от руки */
        '    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor"'
        + ' stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
        + '<circle cx="12" cy="12" r="3"/>'
        + '<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
        + '</svg>',
        '  </button>',
        '  ' + '<span class="wl-rail__check" :class="{\'is-on\':on}" aria-hidden="true">'
        + '<svg viewBox="0 0 24 24" width="13" height="13"><path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m5.5 12.4 4.2 4.2 8.8-9.2"/></svg>'
        + '</span>',
        '</div>'
      ].join('')
    });

    /* ── значок интерфейса ── */
    app.component('UiIcon', {
      props: ['name', 'size'],
      computed: {
        body: function () { return UI_ICONS[this.name] || ''; },
        px: function () { return this.size || 16; }
      },
      template: '<svg class="uiicon" :width="px" :height="px" viewBox="0 0 24 24" fill="none"'
              + ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
              + ' aria-hidden="true" v-html="body"></svg>'
    });

    /* ── значок вишлиста: контурная иконка вместо эмодзи ── */
    app.component('ListIcon', {
      props: ['name', 'size'],
      computed: {
        body: function () { return iconOf(this.name).d; },
        px: function () { return this.size || 22; }
      },
      template: '<svg class="listicon" :width="px" :height="px" viewBox="0 0 24 24" fill="none"'
              + ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"'
              + ' aria-hidden="true" v-html="body"></svg>'
    });

    /* ── строка вишлиста: одна и та же в панели и в выпадающем списке ── */
    app.component('WishlistRow', {
      props: ['list'],
      setup: function () { return { store: store, A: A }; },
      computed: { on: function () { return this.list.id === store.currentListId; } },
      template: [
        '<button class="wl-rail__row wl-rail__row--list" :class="{\'is-on\':on}" @click="A.setList(list.id)">',
        '  <span class="wl-rail__cover" :style="A.heroStyle(list)"><list-icon :name="list.icon" :size="20" /></span>',
        '  <div class="wl-rail__meta">',
        '    <div class="wl-rail__name wl-rail__name--list">{{ list.title }}</div>',
        /* счётчик рядом с названием, дата — следом через точку */
        '    <div class="wl-rail__meta-line">',
        '      <span class="wl-rail__count">{{ list.items.length }} подарков</span>',
        '      <span v-if="list.date" class="wl-rail__date">{{ list.date }}</span>',
        '    </div>',
        '  </div>',
        /* выбранный вишлист помечаем галочкой, а не заливкой строки */
        '  <span class="wl-rail__check" :class="{\'is-on\':on}" aria-hidden="true">',
        '    <svg viewBox="0 0 24 24" width="13" height="13">',
        '      <path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" d="m5.5 12.4 4.2 4.2 8.8-9.2"/>',
        '    </svg>',
        '  </span>',
        '</button>'
      ].join('')
    });

    /* ── заглушка пустой правой панели (одна на все режимы) ── */
    app.component('RailEmpty', {
      setup: function () { return { A: A }; },
      computed: { e: function () { return A.railEmpty(); } },
      template: [
        '<p class="wl-rail__empty">',
        '  <span class="wl-rail__empty-title">{{ e.title }}</span>',
        '  <span class="wl-rail__empty-hint">',
        '    {{ e.before }}<template v-if="e.icon"> </template>',
        '    <span v-if="e.icon" class="nowrap">',
        '    <span class="wantbtn wantbtn--mini" :class="{\'wantbtn--pick\':e.icon===\'pick\'}" aria-hidden="true">',
        '      <svg v-if="e.icon===\'want\'" viewBox="0 0 24 24" width="13" height="13">',
        '        <path fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"',
        '              d="M12 20.3s-7.6-4.7-7.6-9.8a4.4 4.4 0 0 1 8-2.5 4.4 4.4 0 0 1 8 2.5c0 5.1-7.6 9.8-7.6 9.8Z"/>',
        '      </svg>',
        '      <svg v-else viewBox="0 0 24 24" width="13" height="13">',
        '        <path fill="none" stroke="currentColor" stroke-width="2.3" stroke-linecap="round" d="M12 5.6v12.8M5.6 12h12.8"/>',
        '      </svg>',
        '    </span>{{ e.after }}</span>',
        '  </span>',
        '</p>'
      ].join('')
    });

    app.component('WishlistRail', {
      setup: function () {
        return { store: store, A: A, currentList: currentList, recipient: recipient, shortlist: shortlist };
      },
      template: [
        '<div class="railcol" :class="{\'is-spot\':store.spot===\'rail\'}">',
        /* переход между идеями и списками — вместо верхних вкладок */
        /* крупная карточка-переход вместо верхних вкладок */
        '  <button v-if="!store.deck" class="navcard" :class="A.navCard().cls" @click="A.go(A.navCard().route)">',
        '    <span class="navcard__art">',
        '      <img class="navcard__art-main" :src="A.navCard().main" alt="">',
        '      <img class="navcard__art-side" :src="A.navCard().side" alt="">',
        '    </span>',
        '    <span class="navcard__title" v-html="A.navCard().title"></span>',
        '    <span class="navcard__cta">{{ A.navCard().cta }}',
        '      <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">',
        '        <path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M4.5 12h14m-5.5-6 6 6-6 6"/>',
        '      </svg>',
        '    </span>',
        '  </button>',

        /* ── страница «Мои списки»: все списки вместо вкладок сверху ── */
        '<aside v-if="store.route===\'lists\'" class="wl-rail wl-rail--lists">',
        '  <div class="wl-rail__head">',
        '    <div class="wl-rail__switch is-static">',
        '      <span class="wl-rail__emoji">📋</span>',
        '      <span class="wl-rail__title">Мои вишлисты</span>',
        '      <b>{{ store.lists.length }}</b>',
        '    </div>',
        '  </div>',
        '  <rail-empty v-if="!store.lists.length" />',
        '  <div v-else class="wl-rail__list">',
        '    <wishlist-row v-for="l in store.lists" :key="l.id" :list="l" />',
        '  </div>',
        '  <button class="wl-rail__open" @click="A.newList()"><ui-icon name="plus" :size="16" /> Новый вишлист</button>',
        '</aside>',

        /* ── идеи для другого: подборка для выбранного человека ── */
        '<aside v-else-if="store.ideasFor===\'other\'" class="wl-rail wl-rail--pick">',
        '  <div class="wl-rail__head">',
        '    <div class="wl-rail__switch is-static">',
        '      <span class="who__ava" :style="{background:recipient.color}">{{ recipient.name.charAt(0) }}</span>',
        '      <span class="wl-rail__title">Подборка для {{ recipient.short }}</span>',
        '      <b>{{ shortlist.length }}</b>',
        '    </div>',
        '  </div>',
        '  <rail-empty v-if="!shortlist.length" />',
        '  <div v-else class="wl-rail__list">',
        '    <div v-for="(it,i) in shortlist" :key="it.id" class="wl-rail__row"',
        '         :class="{\'is-dragging\':A.isDragging(\'pick\',i),\'is-over\':A.isDropTarget(\'pick\',i)}"',
        '         draggable="true" @dragstart="A.dragStart(\'pick\',i,$event)" @dragover.prevent="A.dragOver(\'pick\',i)"',
        '         @drop.prevent="A.dragDrop(\'pick\',i)" @dragend="A.dragEnd()">',
        '      <span class="wl-rail__grip" title="Перетащите, чтобы поменять порядок">⣿</span>',
        '      <thumb :image="it.img" cls="wl-rail__thumb" />',
        '      <div class="wl-rail__meta">',
        '        <div class="wl-rail__name">{{ it.name }}</div>',
        '        <div class="wl-rail__price">{{ A.money(it.price) }}<span v-if="it.reserved" class="wl-rail__mark">занято вами</span></div>',
        '      </div>',
        '      <button class="wl-rail__x" draggable="false" @click="A.removeFromShortlist(it)" title="Убрать">✕</button>',
        '    </div>',
        '  </div>',
        '  <button v-if="shortlist.length" class="wl-rail__open" @click="A.go(\'shortlist\')">Открыть подборку <ui-icon name="chevron-right" :size="17" /></button>',
        '</aside>',

        /* ── идеи себе: мой вишлист ── */
        '<aside v-else class="wl-rail">',
        '  <div class="wl-rail__head">',
        '    <div class="dd">',
        '      <button class="wl-rail__switch" @click.stop="A.toggleMenu(\'raillist\')">',
        /* обложка вишлиста — та же плитка, что в строках списка */
        '        <span class="wl-rail__cover wl-rail__cover--ava" :style="A.heroStyle(currentList)"><list-icon :name="currentList.icon" :size="15" /></span>',
        '        <span class="wl-rail__title">{{ currentList.title }}</span>',
        '        <b>{{ currentList.items.length }}</b>',
        '        <span class="dd__caret" aria-hidden="true"><svg viewBox="0 0 24 24" width="14" height="14"><path fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="m6 9.5 6 6 6-6"/></svg></span>',
        '      </button>',
        '      <div v-if="store.openMenu===\'raillist\'" class="dd__panel dd__panel--left" @click.stop>',
        '        <div class="dd__title">Мои вишлисты</div>',
        '        <wishlist-row v-for="l in store.lists" :key="l.id" :list="l" />',
        '        <button class="dd__item dd__item--add" @click="A.newList()"><ui-icon name="plus" :size="16" /> Новый вишлист</button>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <rail-empty v-if="!currentList.items.length" />',
        '  <div v-else class="wl-rail__list">',
        '    <div v-for="(it,i) in currentList.items" :key="it.id" class="wl-rail__row"',
        '         :class="{\'is-dragging\':A.isDragging(\'wish\',i),\'is-over\':A.isDropTarget(\'wish\',i)}"',
        '         draggable="true" @dragstart="A.dragStart(\'wish\',i,$event)" @dragover.prevent="A.dragOver(\'wish\',i)"',
        '         @drop.prevent="A.dragDrop(\'wish\',i)" @dragend="A.dragEnd()">',
        '      <span class="wl-rail__grip" title="Перетащите, чтобы поменять порядок">⣿</span>',
        '      <thumb :image="it.img" cls="wl-rail__thumb" />',
        '      <div class="wl-rail__meta">',
        '        <div class="wl-rail__name">{{ it.name }}</div>',
        '        <div class="wl-rail__price">{{ A.money(it.price) }}<span v-if="it.reserved" class="wl-rail__mark">уже дарят</span></div>',
        '      </div>',
        '      <button class="wl-rail__x" draggable="false" @click="A.removeFromList(it)" title="Убрать из вишлиста">✕</button>',
        '    </div>',
        '  </div>',
        '  <button class="wl-rail__open" @click="A.go(\'lists\')">Открыть вишлист <ui-icon name="chevron-right" :size="17" /></button>',
        '</aside>',
        '</div>'
      ].join('')
    });

    /* ── шторки ── */
    app.component('SheetEdit', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Подарок в вишлисте <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <div class="sheet__row">',
        '    <div class="sheet__label">Приоритет</div>',
        '    <div class="preview__tiers">',
        '      <button class="tchip" :class="{\'is-on\':store.editTier===\'top\'}" @click="store.editTier=\'top\'"><tier-icon tier="top" /> Больше всего</button>',
        '      <button class="tchip" :class="{\'is-on\':store.editTier===\'want\'}" @click="store.editTier=\'want\'"><tier-icon tier="want" /> Хочу</button>',
        '      <button class="tchip" :class="{\'is-on\':store.editTier===\'someday\'}" @click="store.editTier=\'someday\'"><tier-icon tier="someday" /> Когда-нибудь</button>',
        '    </div>',
        '  </div>',
        '  <div class="sheet__row">',
        '    <div class="sheet__label">Заметка для дарителя</div>',
        '    <input class="field" v-model="store.editNote" placeholder="цвет, размер, модель…">',
        '  </div>',
        '  <div style="display:flex;gap:8px">',
        '    <button class="btn btn--white btn--sm" style="flex:none" @click="A.removeItem()">Удалить</button>',
        '    <button class="btn btn--green btn--sm" style="flex:1" @click="A.saveEdit()">Сохранить</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── видимый переключатель списков ── */
    app.component('SheetShare', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Поделиться вишлистом <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <div class="sheet__row">',
        '    <div class="copyfield">mysanta.ru/wishlist/{{ store.currentListId }}</div>',
        '    <button class="btn btn--green btn--sm btn--block" @click="A.copyLink()">Копировать ссылку</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── описание в шапке: две строки, дальше «Показать» ── */
    app.component('HeroDesc', {
      props: ['list'],
      setup: function () { return { A: A, store: store }; },
      data: function () { return { over: false }; },
      mounted: function () { this.measure(); },
      updated: function () { this.measure(); },
      methods: {
        /* ссылку показываем, только если текст правда не поместился */
        measure: function () {
          var n = this.$refs.text;
          if (!n) { this.over = false; return; }
          var over = n.scrollHeight - n.clientHeight > 2;
          if (over !== this.over) this.over = over;
        }
      },
      computed: {
        html: function () { return A.mdToHtml(this.list.desc || ''); },
        stop: function () { return A.stopItems(this.list); },
        show: function () { return !!this.list.desc || this.stop.length > 0; }
      },
      template: [
        '<div v-if="show" class="hero__desc">',
        '  <div v-if="list.desc" ref="text" class="hero__desc-text" v-html="html"></div>',
        '  <div class="hero__desc-links">',
        '    <button v-if="over" class="hero__desc-more" @click="A.openSheet(\'desc\')">Показать</button>',
        '    <button v-if="stop.length" class="hero__stop" @click="A.openSheet(\'stop\')">',
        '      <ui-icon name="ban" :size="14" /> Стоп-лист',
        '    </button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: полное описание ── */
    app.component('SheetDesc', {
      setup: function () { return { A: A, currentList: currentList }; },
      template: [
        '<div>',
        '  <div class="sheet__title">О вишлисте <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <div class="wl-desc" v-html="A.mdToHtml(currentList.desc)"></div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: стоп-лист ── */
    app.component('SheetBought', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Отметить купленным? <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Подарок останется занятым за вами, а владелец по-прежнему не увидит, кто его дарит.</p>',
        '  <div v-if="store.buyItem" class="buyrow">',
        '    <thumb :image="store.buyItem.img" cls="buyrow__img" />',
        '    <div class="buyrow__body">',
        '      <div class="buyrow__name">{{ store.buyItem.name }}</div>',
        '      <div class="buyrow__price">{{ A.money(store.buyItem.price) }}</div>',
        '    </div>',
        '  </div>',
        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" @click="A.closeSheet()">Отмена</button>',
        '    <button class="btn btn--green" @click="A.confirmBought()">Да, купил</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    app.component('SheetStop', {
      setup: function () { return { A: A, currentList: currentList }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Пожалуйста, не дарите <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Список от владельца вишлиста — этого лучше избежать.</p>',
        '  <div class="stoplist__items">',
        '    <span v-for="(x,n) in A.stopItems(currentList)" :key="n" class="stoplist__x">',
        '      <ui-icon name="ban" :size="13" /> {{ x }}',
        '    </span>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── редактор описания ──
       Пишем визуально, храним markdown: панель форматирует выделение,
       а «Markdown» показывает тот же текст исходником. */
    app.component('MdEditor', {
      props: ['value'],
      emits: ['update'],
      data: function () { return { raw: false }; },
      mounted: function () { this.paint(); },
      methods: {
        paint: function () {
          if (this.$refs.rich) this.$refs.rich.innerHTML = A.mdToHtml(this.value || '');
        },
        cmd: function (name, arg) {
          this.$refs.rich.focus();
          try { document.execCommand(name, false, arg || null); } catch (e) {}
          this.sync();
        },
        addLink: function () {
          var url = window.prompt ? window.prompt('Ссылка', 'https://') : '';
          if (url) this.cmd('createLink', url);
        },
        sync: function () { this.$emit('update', A.htmlToMd(this.$refs.rich.innerHTML)); },
        toggleRaw: function () {
          this.raw = !this.raw;
          if (!this.raw) this.$nextTick(this.paint);
        }
      },
      template: [
        '<div class="mde">',
        '  <div class="mde__bar">',
        '    <button class="mde__b" @click="cmd(\'bold\')" title="Жирный"><ui-icon name="bold" :size="15" /></button>',
        '    <button class="mde__b" @click="cmd(\'italic\')" title="Курсив"><ui-icon name="italic" :size="15" /></button>',
        '    <button class="mde__b" @click="cmd(\'insertUnorderedList\')" title="Список"><ui-icon name="list" :size="15" /></button>',
        '    <button class="mde__b" @click="addLink()" title="Ссылка"><ui-icon name="link" :size="15" /></button>',
        '    <button class="mde__raw" :class="{\'is-on\':raw}" @click="toggleRaw()">Markdown</button>',
        '  </div>',
        '  <div v-show="!raw" ref="rich" class="mde__rich" contenteditable="true"',
        '       @input="sync" @blur="sync" data-ph="Пара слов для дарителя…"></div>',
        '  <textarea v-show="raw" class="mde__raw-area" :value="value"',
        '            @input="$emit(\'update\', $event.target.value)"></textarea>',
        '</div>'
      ].join('')
    });

    /* ── модалка: настройки вишлиста ── */
    app.component('SheetListSettings', {
      setup: function () { return { store: store, A: A, currentList: currentList }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Настройки вишлиста <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Название</div>',
        '    <div class="personname">',
        '      <span class="listava" :style="A.heroStyle(currentList)"><list-icon :name="currentList.icon" :size="24" /></span>',
        '      <input class="field" v-model="currentList.title" placeholder="День рождения">',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Значок</div>',
        '    <div class="tagcloud">',
        '      <button v-for="i in A.listIcons" :key="i.key" class="emochip" :class="{\'is-on\':currentList.icon===i.key}"',
        '              @click="A.setListIcon(i.key)" :title="i.label" :aria-label="i.label"><list-icon :name="i.key" :size="21" /></button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Дата <span class="sheet__count">необязательно</span></div>',
        '    <input class="field" v-model="currentList.date" placeholder="14 марта">',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Описание <span class="sheet__count">увидят дарители</span></div>',
        '    <md-editor :value="currentList.desc" @update="currentList.desc = $event" />',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label"><ui-icon name="ban" :size="14" /> Стоп-лист <span class="sheet__count">по одному пункту в строке</span></div>',
        '    <textarea class="field field--area" v-model="currentList.stop"',
        '              placeholder="свечи с сильным запахом&#10;сладости&#10;сувениры «на память»"></textarea>',
        '    <p class="sheet__note">Дарители увидят это списком — что дарить точно не стоит.</p>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Обложка</div>',
        '    <div class="covergrid">',
        '      <button v-for="c in A.covers" :key="c.key" class="coverswatch" :class="{\'is-on\':A.isCoverGrad(c.grad)}" :style="{backgroundImage:c.grad}" @click="A.setCoverGrad(c.grad)">',
        '        <span v-if="A.isCoverGrad(c.grad)" class="coverswatch__on">✓</span>',
        '      </button>',
        '    </div>',
        '    <label class="coverdrop">',
        '      <input type="file" accept="image/*" @change="A.pickCoverFile($event)">',
        '      <span class="coverdrop__ic"><ui-icon name="image" :size="22" /></span>',
        '      <span>Загрузить свою картинку<em>JPG или PNG, лучше горизонтальную</em></span>',
        '    </label>',
        '  </div>',

        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" :class="{\'is-off\':!currentList.bg}" @click="A.clearCover()">Убрать картинку</button>',
        '    <button class="btn btn--green" @click="A.closeSheet()">Готово</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: обложка шапки списка ── */
    /* ── модалка: новый список ── */
    app.component('SheetList', {
      setup: function () { return { store: store, A: A, n: computed(function () { return store.newList; }) }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Новый вишлист <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Отдельный вишлист под повод — так дарителю понятно, к чему подарок.</p>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Название</div>',
        '    <div class="personname">',
        '      <span class="listava" :style="{backgroundImage:n.grad}"><list-icon :name="n.icon" :size="24" /></span>',
        '      <input class="field" v-model="n.title" placeholder="День рождения, Новоселье, Коллегам…" @keyup.enter="A.createList()">',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Значок</div>',
        '    <div class="tagcloud">',
        '      <button v-for="i in A.listIcons" :key="i.key" class="emochip" :class="{\'is-on\':n.icon===i.key}"',
        '              @click="A.setNewListIcon(i.key)" :title="i.label" :aria-label="i.label"><list-icon :name="i.key" :size="21" /></button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Дата <span class="sheet__count">необязательно</span></div>',
        '    <input class="field" v-model="n.date" placeholder="14 марта">',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Обложка</div>',
        '    <div class="covergrid">',
        '      <button v-for="c in A.covers" :key="c.key" class="coverswatch" :class="{\'is-on\':n.grad===c.grad}" :style="{backgroundImage:c.grad}" @click="A.setNewListGrad(c.grad)">',
        '        <span v-if="n.grad===c.grad" class="coverswatch__on">✓</span>',
        '      </button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" @click="A.closeSheet()">Отмена</button>',
        '    <button class="btn btn--green" :class="{\'is-off\':!A.canCreateList()}" @click="A.createList()">Создать вишлист</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: поделиться подборкой для человека ── */
    app.component('SheetPickShare', {
      setup: function () { return { store: store, A: A, recipient: recipient, shortlist: shortlist }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Поделиться подборкой <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Ссылка для тех, кто дарит {{ recipient.short }} вместе с вами: видно {{ shortlist.length }} идей. Сам {{ recipient.name }} по ней ничего не увидит.</p>',
        '  <div class="sheet__row">',
        '    <div class="copyfield">mysanta.ru/pick/{{ recipient.id }}</div>',
        '    <button class="btn btn--green btn--sm btn--block" @click="A.copyLink()">Копировать ссылку</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    app.component('SheetCover', {
      setup: function () { return { store: store, A: A, currentList: currentList }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Обложка вишлиста <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Так шапка «{{ currentList.title }}» выглядит для вас и для дарителей.</p>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Готовые фоны</div>',
        '    <div class="covergrid">',
        '      <button v-for="c in A.covers" :key="c.key" class="coverswatch" :class="{\'is-on\':A.isCoverGrad(c.grad)}" :style="{backgroundImage:c.grad}" @click="A.setCoverGrad(c.grad)">',
        '        <span v-if="A.isCoverGrad(c.grad)" class="coverswatch__on">✓</span>',
        '      </button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Своя картинка</div>',
        '    <label class="coverdrop">',
        '      <input type="file" accept="image/*" @change="A.pickCoverFile($event)">',
        '      <span class="coverdrop__ic"><ui-icon name="image" :size="22" /></span>',
        '      <span>Загрузить с компьютера<em>JPG или PNG, лучше горизонтальную</em></span>',
        '    </label>',
        '    <div class="field-row">',
        '      <input class="field" v-model="store.coverUrl" placeholder="…или вставьте ссылку на картинку" @keyup.enter="A.setCoverUrl()">',
        '      <button class="btn btn--green btn--sm" @click="A.setCoverUrl()">Применить</button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" :class="{\'is-off\':!currentList.bg}" @click="A.clearCover()">Убрать картинку</button>',
        '    <button class="btn btn--green" @click="A.closeSheet()">Готово</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: фильтры идей ── */
    app.component('SheetFilters', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Фильтры <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Что учесть при подборе идей. Пустое поле — значит не важно.</p>',

        '  <div v-for="c in store.ideaChips" :key="c.key" class="sheet__row">',
        '    <div class="sheet__label">{{ c.label }}</div>',
        '    <div class="segset">',
        '      <button v-for="(o,n) in c.opts" :key="o" class="seg__b" :class="{\'is-on\':c.i===n}" @click="A.setChip(c,n)">{{ o }}</button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Интересы <span class="sheet__count">выбрано: {{ A.activeInterests().length }}</span></div>',
        '    <div class="tagcloud">',
        '      <button v-for="t in store.interests" :key="t.key" class="tagchip" :class="{\'is-on\':t.on}" @click="A.toggleInterest(t)">',
        '        <span class="tagchip__e">{{ t.emoji }}</span>{{ t.key }}',
        '      </button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" @click="A.clearAllFilters()">Сбросить всё</button>',
        '    <button class="btn btn--green" @click="A.closeSheet()">Показать идеи</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── модалка: новый человек, для кого подбираем ── */
    app.component('SheetPerson', {
      setup: function () { return { store: store, A: A, p: computed(function () { return store.newPerson; }) }; },
      template: [
        '<div>',
        '  <div class="sheet__title">{{ A.editingPerson() ? "Анкета человека" : "Для кого подбираем" }}',
        '    <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Чем точнее анкета, тем ближе подборка. Человек её не видит.</p>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Имя</div>',
        '    <div class="personname">',
        '      <span class="who__ava who__ava--lg">{{ p.name ? p.name.charAt(0) : "?" }}</span>',
        '      <input class="field" v-model="p.name" placeholder="Мама, Стас, коллега Лена…" @keyup.enter="A.createPerson()">',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Пол</div>',
        '    <div class="segset">',
        '      <button v-for="g in A.genders" :key="g.key" class="seg__b" :class="{\'is-on\':p.gender===g.key}" @click="A.setPersonGender(g.key)">{{ g.label }}</button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Возраст</div>',
        '    <div class="segset">',
        '      <button v-for="(a,n) in A.ages" :key="a" class="seg__b" :class="{\'is-on\':p.age===n}" @click="A.setPersonAge(n)">{{ a }}</button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Интересы <span class="sheet__count">выбрано: {{ p.interests.length }}</span></div>',
        '    <div class="tagcloud">',
        '      <button v-for="t in store.interests" :key="t.key" class="tagchip" :class="{\'is-on\':A.hasPersonInterest(t.key)}" @click="A.togglePersonInterest(t.key)">',
        '        <span class="tagchip__e">{{ t.emoji }}</span>{{ t.key }}',
        '      </button>',
        '    </div>',
        '  </div>',

        '  <div class="sheet__foot">',
        '    <button class="btn btn--ghost" @click="A.closeSheet()">Отмена</button>',
        '    <button class="btn btn--green" :class="{\'is-off\':!A.canCreatePerson()}" @click="A.createPerson()">{{ A.editingPerson() ? "Сохранить" : "Подобрать подарок" }}</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    app.component('OverlayHost', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <transition name="slide">',
        '    <div v-if="store.sheet" class="sheet-backdrop" @click.self="A.closeSheet()">',
        '      <div class="sheet" :class="{\'sheet--wide\':A.isWideSheet()}">',
        '        <div class="sheet__grip"></div>',
        '        <sheet-edit v-if="store.sheet===\'edit\'" />',
        '        <sheet-share v-else-if="store.sheet===\'share\'" />',
        '        <sheet-pick-share v-else-if="store.sheet===\'pickshare\'" />',
        '        <sheet-person v-else-if="store.sheet===\'person\'" />',
        '        <sheet-filters v-else-if="store.sheet===\'filters\'" />',
        '        <sheet-cover v-else-if="store.sheet===\'cover\'" />',
        '        <sheet-list-settings v-else-if="store.sheet===\'listsettings\'" />',
        '        <sheet-desc v-else-if="store.sheet===\'desc\'" />',
        '        <sheet-stop v-else-if="store.sheet===\'stop\'" />',
        '        <sheet-bought v-else-if="store.sheet===\'bought\'" />',
        '        <activity-body v-else-if="store.sheet===\'activity\'" />',
        '        <sheet-list v-else-if="store.sheet===\'list\'" />',
        '        <add-gift-form v-else-if="store.sheet===\'gift\'" />',
        '      </div>',
        '    </div>',
        '  </transition>',
        '  <transition name="fade"><div v-if="store.toastMsg" class="toast is-show">{{ store.toastMsg }}</div></transition>',
        '</div>'
      ].join('')
    });
  }

  var SCREEN_BY_ROUTE = {
    lists: 'ListsScreen', ideas: 'IdeasScreen',
    shared: 'SharedScreen', pool: 'PoolScreen', shortlist: 'ShortlistScreen'
  };

  var WL = {
    store: store, A: A, register: register,
    currentList: currentList, tierGroups: tierGroups,
    reservedCount: reservedCount, poolTotal: poolTotal, poolPct: poolPct,
    recipient: recipient, shortlist: shortlist,
    screenByRoute: SCREEN_BY_ROUTE, onNavigate: null
  };
  window.WL = WL;
})();
