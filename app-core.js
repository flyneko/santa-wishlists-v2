/* Вишлист v2 — общее ядро: одно реактивное состояние, действия и ВСЕ экраны.
   Презентация и прототип подключают один и тот же файл, поэтому экраны идентичны.
   Товары — реальные (mr_geek) из pics.js. Бэкенда нет. window.WL = { store, A, register(app), ... } */
(function () {
  'use strict';
  var V = window.Vue;
  var reactive = V.reactive, computed = V.computed, ref = V.ref;
  var GOODS = window.WL_GOODS || [];
  function good(i) { return GOODS[i] || GOODS[0] || { name: '', price: 0, img: '' }; }

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
  var LIST_EMOJI = ['🎁', '🎂', '🎄', '💼', '💍', '🏠', '🎓', '👶', '✈️', '🎃', '❤️', '🍀'];
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
  function seedList(id, title, emoji, date, cover, items, grad) {
    return { id: id, title: title, emoji: emoji, date: date, cover: cover, items: items,
             grad: grad || COVERS[0].grad, bg: null };
  }
  function gift(i, tier, note, oldPrice) {
    var g = good(i);
    return { id: uid(), pid: g.id, name: g.name, price: g.price, oldPrice: oldPrice || 0,
             img: g.img, tier: tier || 'want', note: note || '', reserved: null };
  }
  function idea(i, reason, kind, oldPrice) {
    var g = good(i);
    return { id: uid(), pid: g.id, name: g.name, price: g.price, oldPrice: oldPrice || 0,
             img: g.img, reason: reason, kind: kind || '', saved: false, gone: false };
  }

  function freshState() {
    var ideasOtherArr = [
      idea(10, 'повод + интерес «дом»', ''),
      idea(0, 'интерес «уход за собой»', ''),
      idea(8, 'для встреч с друзьями', ''),
      idea(14, 'беспроигрышный вариант', '')
    ];
    var s = {
      route: 'ideas',
      sheet: null,
      editId: null,
      toastMsg: '',
      period: '30',
      surprise: true,
      ideasFor: 'self',
      asideCollapsed: false,
      openMenu: null,             // who | raillist
      poolBack: 'shared',

      /* получатель подарка в режиме «Для другого» */
      recipients: [
        { id: 'r1', name: 'Аня', short: 'Ани', hasWishlist: true,
          color: '#7B61FF', gender: 'f', age: 1, interests: ['дом', 'уход'] },
        { id: 'r2', name: 'Игорь', short: 'Игоря', hasWishlist: false,
          color: '#2D9CDB', gender: 'm', age: 2, interests: ['техника', 'игры'] },
        { id: 'r3', name: 'Коллега', short: 'коллеги', hasWishlist: false,
          color: '#EB5757', gender: 'x', age: 1, interests: ['кофе', 'книги'] }
      ],
      /* черновик анкеты нового человека (модалка) */
      newPerson: { name: '', gender: 'f', age: 1, interests: [] },
      recipientId: 'r1',
      shortlists: { r1: [], r2: [], r3: [] },

      coverUrl: '',
      newList: { title: '', emoji: '🎁', date: '', grad: '' },
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
      listView: 'items',          // items | activity — тело страницы «Мои списки»
      drag: null,                 // { kind:'wish'|'pick', from, over } — перетаскивание в панели

      lists: [
        seedList('l1', 'День рождения', '🎂', '14 марта', good(3).img, [
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
        ], COVERS[1].grad),
        seedList('l2', 'Новый год', '🎄', '31 декабря', good(7).img, [
          gift(5, 'top', ''),
          gift(2, 'top', ''),
          gift(14, 'top', ''),
          gift(16, 'top', ''),
          gift(7, 'top', ''),
          gift(13, 'want', ''),
          gift(8, 'want', ''),
          gift(6, 'want', ''),
          gift(1, 'someday', '')
        ], COVERS[2].grad),
        seedList('l3', 'Коллегам', '💼', '', good(4).img, [
          gift(4, 'top', ''),
          gift(10, 'top', ''),
          gift(12, 'top', ''),
          gift(15, 'top', ''),
          gift(9, 'top', ''),
          gift(0, 'want', ''),
          gift(6, 'want', ''),
          gift(13, 'want', ''),
          gift(7, 'someday', '')
        ], COVERS[3].grad)
      ],

      ideasSelf: [
        idea(8, 'вы смотрели похожие наборы', '', 3240),
        idea(6, 'вы смотрели товары для дома', ''),
        idea(12, 'популярно у похожих людей', ''),
        idea(9, 'в вашем бюджете', ''),
        idea(13, 'к сезону · Новый год', ''),
        idea(1, 'вам нравятся гаджеты', '')
      ],
      ideasView: 'browse',        // browse (карусели) | filtered (список)
      activeFilter: null,         // { title, items } когда включён фильтр
      ideasOther: ideasOtherArr,
      collections: [
        { key: 'picked', title: 'Подобрано для подарка', items: ideasOtherArr },
        { key: 'birthday', title: 'Для дня рождения', items: [3, 8, 2, 11, 1].map(function (i) { return idea(i, ''); }) },
        { key: 'trending', title: 'Сегодня в тренде', items: [2, 3, 8, 13, 15].map(function (i) { return idea(i, ''); }) },
        { key: 'under1000', title: 'До 1000 ₽', items: [0, 5, 10, 12, 7, 4].map(function (i) { return idea(i, ''); }) },
        { key: 'wedding', title: 'Для свадьбы', items: [8, 3, 11, 6, 9].map(function (i) { return idea(i, ''); }) },
        { key: 'home', title: 'Для дома и уюта', items: [2, 5, 11, 1, 6].map(function (i) { return idea(i, ''); }) }
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
  var currentList = computed(function () {
    return store.lists.find(function (l) { return l.id === store.currentListId; }) || store.lists[0];
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
    if (!store.poolItemId) return null;
    var found = null;
    store.lists.forEach(function (l) {
      l.items.forEach(function (i) { if (i.id === store.poolItemId) found = i; });
    });
    if (found) return found;
    Object.keys(store.shortlists).forEach(function (k) {
      store.shortlists[k].forEach(function (i) { if (i.id === store.poolItemId) found = i; });
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
  var toastT;
  function toast(m) {
    store.toastMsg = m;
    clearTimeout(toastT);
    toastT = setTimeout(function () { store.toastMsg = ''; }, 1900);
  }

  var A = {
    money: money,
    toast: toast,
    go: function (route) {
      if (route === 'lists') store.listView = 'items';
      store.route = route;
      store.sheet = null;
      if (WL.onNavigate) WL.onNavigate(route);
      if (window.scrollTo) window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    toggleAside: function () { store.asideCollapsed = !store.asideCollapsed; },
    reset: function () { Object.assign(store, freshState()); toast('Данные сброшены'); },

    openSheet: function (name) {
      if (name === 'gift') { store.addFound = false; store.addNote = ''; store.addTier = 'top'; }
      store.sheet = name; store.openMenu = null;
    },
    isWideSheet: function () {
      return ['person', 'filters', 'cover', 'list'].indexOf(store.sheet) >= 0;
    },
    closeSheet: function () { store.sheet = null; },

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
    isMine: function (it) { return it.reserved === 'you'; },
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
      store.sheet = null; toast('Удалено из списка');
    },

    toggleActivity: function () {
      store.listView = store.listView === 'activity' ? 'items' : 'activity';
    },
    setList: function (id) {
      store.currentListId = id; store.sheet = null; store.openMenu = null;
      toast('Список: ' + currentList.value.title);
    },
    listEmoji: LIST_EMOJI,
    newList: function () {
      store.newList = { title: '', emoji: '🎁', date: '',
                        grad: COVERS[store.lists.length % COVERS.length].grad };
      store.openMenu = null;
      store.sheet = 'list';
    },
    setNewListEmoji: function (e) { store.newList.emoji = e; },
    setNewListGrad: function (g) { store.newList.grad = g; },
    canCreateList: function () { return (store.newList.title || '').trim().length > 0; },
    createList: function () {
      var n = store.newList;
      var title = (n.title || '').trim();
      if (!title) { toast('Назовите список'); return; }
      var id = uid();
      store.lists.push(seedList(id, title, n.emoji, n.date.trim(), good(6).img, [], n.grad));
      store.currentListId = id;
      store.listView = 'items';
      store.sheet = null;
      A.go('lists');
      toast('Список «' + title + '» создан');
    },
    copyLink: function () { toast('Ссылка скопирована'); },

    /* ── обложка шапки списка ── */
    covers: COVERS,
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
        A.applyProfile(store.recipients.find(function (r) { return r.id === id; }));
      }
      store.ideasView = 'browse'; store.activeFilter = null; store.openMenu = null;
    },
    /* ── анкета нового человека (модалка) ── */
    ages: AGES,
    genders: GENDERS,
    openPersonSheet: function () {
      store.newPerson = { name: '', gender: 'f', age: 1, interests: [] };
      store.openMenu = null;
      store.sheet = 'person';
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
      var id = uid();
      store.recipients.push({
        id: id, name: name, short: name, hasWishlist: false, color: freeColor(store.recipients),
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
      store.shortlists[store.recipientId] = shortlist.value.filter(function (x) { return x.id !== it.id; });
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
  var POOL = '<svg viewBox="0 0 24 24" width="17" height="17" aria-hidden="true"><path fill="currentColor" d="M9 11.2a3.1 3.1 0 1 0 0-6.2 3.1 3.1 0 0 0 0 6.2Zm0-4.7a1.6 1.6 0 1 1 0 3.2 1.6 1.6 0 0 1 0-3.2Z"/><path fill="currentColor" d="M16.4 11.4a2.7 2.7 0 1 0 0-5.4 2.7 2.7 0 0 0 0 5.4Zm0-4a1.3 1.3 0 1 1 0 2.6 1.3 1.3 0 0 1 0-2.6Z"/><path fill="currentColor" d="M9 12.6c-3 0-5.5 1.6-5.5 3.6V19h11v-2.8c0-2-2.5-3.6-5.5-3.6Zm4 4.9H5v-1.3c0-1 1.8-2.1 4-2.1s4 1.1 4 2.1Z"/><path fill="currentColor" d="M16.4 12.8c-.6 0-1.2.1-1.7.2.8.8 1.3 1.9 1.3 3.2V19h4.5v-2.5c0-1.9-1.9-3.7-4.1-3.7Z"/></svg>';

  function register(app) {

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
        '    <div v-if="item.reserved" class="present__tape" :class="{\'is-mine\':A.isMine(item)}">',
        '      <svg viewBox="0 0 24 24" width="13" height="13" aria-hidden="true"><path fill="currentColor" d="M17 9V7A5 5 0 0 0 7 7v2H5.8A1.8 1.8 0 0 0 4 10.8v8.4c0 1 .8 1.8 1.8 1.8h12.4c1 0 1.8-.8 1.8-1.8v-8.4c0-1-.8-1.8-1.8-1.8Zm-8-2a3 3 0 0 1 6 0v2H9Z"/></svg>',
        '      {{ A.takenLabel(item) }}',
        '    </div>',
        '  </div>',
        '  <div class="present__info">',
        '    <div class="present__name">{{ item.name }}</div>',
        '    <div class="present__price">',
        '      {{ A.money(item.price) }}',
        '      <s v-if="item.oldPrice">{{ A.money(item.oldPrice) }}</s>',
        '      <span v-if="item.oldPrice" class="cut">−{{ A.discount(item) }}%</span>',
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
        '    <button class="btn btn--green btn--sm btn--block" @click="A.confirmAdd()">Добавить в список</button>',
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
        '    <button class="hero__cover" @click="A.openSheet(\'cover\')">🖼 Обложка</button>',
        '    <div class="hero__body">',
        '      <span class="hero__emoji">{{ currentList.emoji }}</span>',
        '      <h1 class="hero__title">{{ currentList.title }}</h1>',
        '      <div class="hero__meta">',
        '        <span v-if="currentList.date">📅 {{ currentList.date }}</span>',
        '        <span>🎁 {{ currentList.items.length }} подарков</span>',
        '        <span>👁 34 просмотра</span>',
        '        <span v-if="reserved">🔒 {{ reserved }} занято</span>',
        '      </div>',
        '      <div class="hero__acts">',
        '        <button class="hact hact--primary" @click="A.openSheet(\'gift\')"><span>＋</span> Добавить подарок</button>',
        '        <button class="hact" @click="A.openSheet(\'share\')">🔗 Поделиться</button>',
        '        <button class="hact" @click="A.go(\'shared\')">👀 Взгляд дарителя</button>',
        '        <button class="hact" :class="{\'is-on\':store.listView===\'activity\'}" @click="A.toggleActivity()">📊 Активность</button>',
        '      </div>',
        '    </div>',
        '  </header>',


        '  <activity-body v-if="store.listView===\'activity\'" />',
        '  <template v-else>',
        '  <div v-for="g in tierGroups" :key="g.key" class="tier">',
        '    <div class="tier__label"><tier-icon :tier="g.key" /> {{ g.label }} <span class="tier__count">{{ g.items.length }}</span></div>',
        '    <div v-if="g.items.length" class="grid grid--4">',
        '      <gift-card v-for="it in g.items" :key="it.id" :item="it">',
        '        <button v-if="g.key!==\'top\'" class="present__pin" @click="A.bump(it,\'top\')" title="В «Больше всего хочу»"><tier-icon tier="top" /></button>',
        '        <button class="present__add present__add--ghost" @click="A.editItem(it)">Изменить</button>',
        '      </gift-card>',
        '    </div>',
        '    <div v-else class="emptytier">Пусто — добавьте подарок в этот приоритет</div>',
        '  </div>',
        '  </template>',
        '</div>'
      ].join('')
    });

    /* ── Экран: Идеи ── */
    app.component('IdeasScreen', {
      setup: function () {
        /* обе ветки («себе» и «другому») рисуются одной разметкой:
           меняются только подборки и действие на карточке */
        var cols = computed(function () {
          if (store.ideasFor === 'other') return store.collections;
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
        '            <span class="dd__caret">▾</span>',
        '          </button>',
        '          <div v-if="store.openMenu===\'who\'" class="dd__panel dd__panel--left" @click.stop>',
        '            <div class="dd__title">Кому подбираем</div>',
        '            <button class="dd__item" :class="{\'is-on\':isSelf}" @click="A.setIdeasTarget(\'self\')">',
        '              <span class="who__ava who__ava--me">Я</span>',
        '              <span class="dd__who">Себе</span>',
        '              <span v-if="isSelf" class="dd__check">✓</span>',
        '            </button>',
        '            <div class="dd__sep"></div>',
        '            <button v-for="r in store.recipients" :key="r.id" class="dd__item" :class="{\'is-on\':A.isTarget(r)}" @click="A.setIdeasTarget(r.id)">',
        '              <span class="who__ava" :style="{background:r.color}">{{ r.name.charAt(0) }}</span>',
        '              <span class="dd__who">{{ r.name }}</span>',
        '              <span v-if="A.shortlistCount(r)" class="dd__n">{{ A.shortlistCount(r) }}</span>',
        '              <span v-if="A.isTarget(r)" class="dd__check">✓</span>',
        '            </button>',
        '            <button class="dd__item dd__item--add" @click="A.openPersonSheet()">＋ Новый человек</button>',
        '          </div>',
        '        </span>',
        '      </h1>',
        '    </div>',
        '    <div class="ideas-head__right">',
        '      <span class="geo">📍 Москва</span>',
        '    </div>',
        '  </div>',

        '  <div class="searchbar">',
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
        '      <button class="carousel__head" @click="A.openCollection(col)">',
        '        <span class="section-title">{{ col.title }}</span>',
        '        <span class="carousel__all">Все идеи →</span>',
        '      </button>',
        '      <swipe-row :count="A.live(col.items).length">',
        '        <div v-for="it in A.live(col.items)" :key="it.id" class="swiper-slide carousel__card">',
        '          <gift-card :item="it">',
        '            <template v-if="isSelf">',
        '              <button class="present__dismiss" @click="A.dismissIdea(it)" title="Не моё">✕</button>',
        '              <button class="present__add present__add--sm" :class="{\'is-added\':it.saved}" @click="A.addIdeaToList(it)">{{ it.saved ? "В вишлисте" : "Хочу" }}</button>',
        '            </template>',
        '            <template v-else>',
        '              <button class="present__dismiss" @click="A.dismissIdea(it)" title="Не подходит">✕</button>',
        '              <button class="present__add present__add--ghost present__add--sm" :class="{\'is-added\':A.inShortlist(it)}" @click="A.addToShortlist(it)">{{ A.inShortlist(it) ? "✓ В подборке" : "В подборку" }}</button>',
        '            </template>',
        '          </gift-card>',
        '        </div>',
        '        <div class="swiper-slide carousel__card">',
        '          <button class="carousel__more" @click="A.openCollection(col)"><span class="carousel__more-ic">→</span><span>Посмотреть<br>больше</span></button>',
        '        </div>',
        '      </swipe-row>',
        '    </div>',
        '  </template>',

        /* ── фильтр включён: плоский список ── */
        '  <template v-else>',
        '    <div class="activefilter">',
        '      <span v-if="A.fromCollection()" class="chip-active">{{ store.activeFilter.title }}<button @click="A.clearIdeasFilter()">✕</button></span>',
        '      <a class="flink" @click="A.clearIdeasFilter()">← Все подборки</a>',
        '    </div>',
        '    <div class="grid grid--4">',
        '      <gift-card v-for="it in A.live(store.activeFilter.items)" :key="it.id" :item="it">',
        '        <template v-if="isSelf">',
        '          <button class="present__dismiss" @click="A.dismissIdea(it)" title="Не моё">✕</button>',
        '          <button class="present__add" :class="{\'is-added\':it.saved}" @click="A.addIdeaToList(it)">{{ it.saved ? "В вишлисте" : "Хочу" }}</button>',
        '        </template>',
        '        <template v-else>',
        '          <button class="present__dismiss" @click="A.dismissIdea(it)" title="Не подходит">✕</button>',
        '          <button class="present__add present__add--ghost" :class="{\'is-added\':A.inShortlist(it)}" @click="A.addToShortlist(it)">{{ A.inShortlist(it) ? "✓ В подборке" : "В подборку" }}</button>',
        '        </template>',
        '      </gift-card>',
        '    </div>',
        '  </template>',
        '</div>'
      ].join('')
    });

    /* ── Экран: подборка для конкретного человека ── */
    app.component('ShortlistScreen', {
      setup: function () { return { store: store, A: A, recipient: recipient, shortlist: shortlist }; },
      template: [
        '<div>',
        '  <div class="ideas-head">',
        '    <h1 class="ideas-title">Подборка для {{ recipient.short }}</h1>',
        '    <button class="flink" @click="A.go(\'ideas\')">← Вернуться к идеям</button>',
        '  </div>',
        '  <p class="shortlist-hint">Личный список кандидатов — {{ recipient.name }} его не видит. Выберите победителя и зарезервируйте, чтобы никто не купил то же самое.</p>',

        '  <div v-if="recipient.hasWishlist" class="shortlist-note">',
        '    <span>У {{ recipient.short }} есть свой вишлист — проверьте, что человек просил сам.</span>',
        '    <button class="btn btn--outline btn--sm" @click="A.go(\'shared\')">Открыть вишлист</button>',
        '  </div>',

        '  <div v-if="!shortlist.length" class="emptytier" style="margin-top:20px">',
        '    Пока пусто. Добавляйте идеи кнопкой «В подборку» на карточке.',
        '  </div>',
        '  <div v-else class="grid grid--4" style="margin-top:20px">',
        '    <gift-card v-for="it in shortlist" :key="it.id" :item="it">',
        '      <button class="present__dismiss" @click="A.removeFromShortlist(it)" title="Убрать из подборки">✕</button>',
        '      <div class="shortlist-actions">',
        '        <template v-if="!it.reserved">',
        '          <div class="actrow">',
        '            <button class="present__add" @click="A.reserve(it,\'you\')">Зарезервировать</button>',
        '            <button class="iconbtn" @click="A.startPool(it)" title="Скинуться вместе" aria-label="Скинуться вместе">' + POOL + '</button>',
        '          </div>',
        '        </template>',
        '        <template v-else-if="it.reserved===\'you\'">',
        '          <button class="present__add present__add--ghost" @click="A.reserve(it,\'bought\')">Я купил это</button>',
        '          <button class="present__add present__add--sm present__add--flat" @click="A.reserve(it,null)">Снять резерв</button>',
        '        </template>',
        '      </div>',
        '    </gift-card>',
        '  </div>',
        '</div>'
      ].join('')
    });

    /* ── Экран: Активность ── */
    app.component('ActivityBody', {
      setup: function () {
        return {
          store: store, currentList: currentList, reservedCount: reservedCount,
          notReserved: computed(function () {
            return currentList.value.items.filter(function (i) { return !i.reserved; }).slice(0, 3);
          })
        };
      },
      template: [
        '<div>',
        '  <div class="screen__head">',
        '    <div class="tier__label">Активность списка</div>',
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
        '  <div class="locknote locknote--wide" style="margin-top:16px">🔒 Вы не видите, кто именно смотрел или резервировал — сюрприз сохраняется.</div>',
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
        '      <span class="hero__emoji">{{ list.emoji }}</span>',
        '      <h1 class="hero__title">Вишлист Ани — «{{ list.title }}»</h1>',
        '      <div class="hero__meta">',
        '        <span v-if="list.date">📅 {{ list.date }}</span>',
        '        <span>🎁 {{ list.items.length }} подарков</span>',
        '        <span>🔒 {{ taken }} уже разобрано</span>',
        '      </div>',
        '      <div class="hero__acts">',
        '        <button class="hact hact--primary" @click="A.copyLink()">🔗 Скопировать ссылку</button>',
        '      </div>',
        '    </div>',
        '  </header>',

        '  <p class="sharenote">🔒 Аня не увидит, кто и что зарезервировал</p>',

        '  <div v-for="g in groups" :key="g.key" class="tier">',
        '    <div class="tier__label"><tier-icon :tier="g.key" /> {{ g.label }} <span class="tier__count">{{ g.items.length }}</span></div>',
        '    <div class="grid grid--4">',
        '      <gift-card v-for="it in g.items" :key="it.id" :item="it">',
        '        <template v-if="!it.reserved">',
        '          <div class="actrow">',
        '            <button class="present__add" @click="A.reserve(it,\'you\')">Зарезервировать</button>',
        '            <button class="iconbtn" @click="A.startPool(it)" title="Скинуться вместе" aria-label="Скинуться вместе">' + POOL + '</button>',
        '          </div>',
        '        </template>',
        '        <template v-else-if="it.reserved===\'you\'">',
        '          <button class="present__add present__add--ghost" @click="A.reserve(it,\'bought\')">Я купил это</button>',
        '          <button class="present__add present__add--sm present__add--flat" @click="A.reserve(it,null)">Снять резерв</button>',
        '        </template>',
        /* занято кем-то другим: действий нет — кроме открытого сбора, к нему можно присоединиться */
        '        <template v-else-if="A.hasPool(it)">',
        '          <button class="present__add present__add--ghost present__add--sm" @click="A.startPool(it)">Присоединиться к сбору</button>',
        '        </template>',
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
    app.component('WishlistRail', {
      setup: function () {
        return { store: store, A: A, currentList: currentList, recipient: recipient, shortlist: shortlist };
      },
      template: [
        /* ── страница «Мои списки»: все списки вместо вкладок сверху ── */
        '<aside v-if="store.route===\'lists\'" class="wl-rail wl-rail--lists">',
        '  <div class="wl-rail__head">',
        '    <div class="wl-rail__switch is-static">',
        '      <span class="wl-rail__emoji">📋</span>',
        '      <span class="wl-rail__title">Мои списки</span>',
        '      <b>{{ store.lists.length }}</b>',
        '    </div>',
        '  </div>',
        '  <div class="wl-rail__list">',
        '    <button v-for="l in store.lists" :key="l.id" class="wl-rail__row wl-rail__row--list" :class="{\'is-on\':l.id===store.currentListId}" @click="A.setList(l.id)">',
        '      <span class="wl-rail__cover" :style="A.heroStyle(l)">{{ l.emoji }}</span>',
        '      <div class="wl-rail__meta">',
        '        <div class="wl-rail__name">{{ l.title }}</div>',
        '        <div class="wl-rail__price">{{ l.items.length }} подарков<span v-if="l.date"> · {{ l.date }}</span></div>',
        '      </div>',
        '      <span v-if="l.id===store.currentListId" class="wl-rail__dot">✓</span>',
        '    </button>',
        '  </div>',
        '  <button class="wl-rail__open" @click="A.newList()">＋ Новый список</button>',
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
        '  <div v-if="!shortlist.length" class="wl-rail__empty">',
        '    Пока пусто.<br>Добавляйте идеи кнопкой «В подборку».',
        '  </div>',
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
        '  <button v-if="shortlist.length" class="wl-rail__open" @click="A.go(\'shortlist\')">Открыть подборку →</button>',
        '</aside>',

        /* ── идеи себе: мой вишлист ── */
        '<aside v-else class="wl-rail">',
        '  <div class="wl-rail__head">',
        '    <div class="dd">',
        '      <button class="wl-rail__switch" @click.stop="A.toggleMenu(\'raillist\')">',
        '        <span class="wl-rail__emoji">{{ currentList.emoji }}</span>',
        '        <span class="wl-rail__title">{{ currentList.title }}</span>',
        '        <b>{{ currentList.items.length }}</b>',
        '        <span class="dd__caret">▾</span>',
        '      </button>',
        '      <div v-if="store.openMenu===\'raillist\'" class="dd__panel dd__panel--left" @click.stop>',
        '        <div class="dd__title">Мои списки</div>',
        '        <button v-for="l in store.lists" :key="l.id" class="dd__item" :class="{\'is-on\':l.id===store.currentListId}" @click="A.setList(l.id)">',
        '          <span class="dd__emoji">{{ l.emoji }}</span>{{ l.title }}',
        '          <span class="dd__n">{{ l.items.length }}</span>',
        '          <span v-if="l.id===store.currentListId" class="dd__check">✓</span>',
        '        </button>',
        '        <button class="dd__item dd__item--add" @click="A.newList()">＋ Новый список</button>',
        '      </div>',
        '    </div>',
        '  </div>',
        '  <div class="wl-rail__list">',
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
        '      <button class="wl-rail__x" draggable="false" @click="A.removeFromList(it)" title="Убрать из списка">✕</button>',
        '    </div>',
        '  </div>',
        '  <button class="wl-rail__open" @click="A.go(\'lists\')">Открыть список →</button>',
        '</aside>'
      ].join('')
    });

    /* ── шторки ── */
    app.component('SheetEdit', {
      setup: function () { return { store: store, A: A }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Подарок в списке <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
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
        '  <div class="sheet__title">Поделиться списком <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <div class="sheet__row">',
        '    <div class="copyfield">mysanta.ru/wishlist/{{ store.currentListId }}</div>',
        '    <button class="btn btn--green btn--sm btn--block" @click="A.copyLink()">Копировать ссылку</button>',
        '  </div>',
        '  <label class="check"><input type="checkbox" v-model="store.surprise"> Режим сюрприза — вижу только счётчики, не вещи</label>',
        '</div>'
      ].join('')
    });

    /* ── модалка: обложка шапки списка ── */
    /* ── модалка: новый список ── */
    app.component('SheetList', {
      setup: function () { return { store: store, A: A, n: computed(function () { return store.newList; }) }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Новый список <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
        '  <p class="sheet__hint">Отдельный список под повод — так дарителю понятно, к чему подарок.</p>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Название</div>',
        '    <div class="personname">',
        '      <span class="listava" :style="{backgroundImage:n.grad}">{{ n.emoji }}</span>',
        '      <input class="field" v-model="n.title" placeholder="День рождения, Новоселье, Коллегам…" @keyup.enter="A.createList()">',
        '    </div>',
        '  </div>',

        '  <div class="sheet__row">',
        '    <div class="sheet__label">Значок</div>',
        '    <div class="tagcloud">',
        '      <button v-for="e in A.listEmoji" :key="e" class="emochip" :class="{\'is-on\':n.emoji===e}" @click="A.setNewListEmoji(e)">{{ e }}</button>',
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
        '    <button class="btn btn--green" :class="{\'is-off\':!A.canCreateList()}" @click="A.createList()">Создать список</button>',
        '  </div>',
        '</div>'
      ].join('')
    });

    app.component('SheetCover', {
      setup: function () { return { store: store, A: A, currentList: currentList }; },
      template: [
        '<div>',
        '  <div class="sheet__title">Обложка списка <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
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
        '      <span class="coverdrop__ic">🖼</span>',
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
        '  <div class="sheet__title">Для кого подбираем <button class="sheet__x" @click="A.closeSheet()">✕</button></div>',
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
        '    <button class="btn btn--green" :class="{\'is-off\':!A.canCreatePerson()}" @click="A.createPerson()">Подобрать подарок</button>',
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
        '        <sheet-person v-else-if="store.sheet===\'person\'" />',
        '        <sheet-filters v-else-if="store.sheet===\'filters\'" />',
        '        <sheet-cover v-else-if="store.sheet===\'cover\'" />',
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
