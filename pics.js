/* Реальные товары MySanta (mr_geek) — как плейсхолдеры для макетов вишлиста.
   window.WL_GOODS — массив; window.WL_GOOD(i) — по индексу. */
(function () {
  'use strict';
  var S = 'https://storage.mrgeek.ru/';
  var G = [
    { id: 'feba6f24', name: 'Подарочный массажер для лица (роллер и скребок гуаша) (Розовый кварц)', price: 490, cat: 'Уход за собой',
      img: S + '2Kw4Qliak8VzKjN4YfAkZj3MdokTJWG9iVug1yshF2w/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzExMDAwLzExNzAwLzExNzg2L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTE3ODYtMi5qcGc.jpg' },
    { id: '8286705e', name: 'Устройство для успокоения c подсветкой SM09', price: 2350, cat: 'Техника для дома',
      img: S + 'tvHeEW0pz0vzkkO0QbLZ5xbL9kRTA82oo9i389qE-bo/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzEzMDAwLzEzMzAwLzEzMzg4L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTMzODgtMi5qcGc.jpg' },
    { id: 'e93ae41f', name: 'Светильник Magic Tree', price: 1690, cat: 'Светильники',
      img: S + '1o-Ccj7XInL1ZAGE0wz3VbszHPAgHNCpGe4Qfc3zaEk/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE1MDAwLzE1MzAwLzE1MzQ4L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTUzNDgtMS5qcGc.jpg' },
    { id: '56cf68cf', name: 'Беспроводная лампа-колонка Right Meow (Розовый)', price: 2250, cat: 'Колонки',
      img: S + 'tZb7nL_8YrlHcCGFC9zPygwjMexZ9HkggaNdk4_SLUw/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzEzMDAwLzEzMTAwLzEzMTY1L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTMxNjUtMS5qcGc.jpg' },
    { id: '2846045d', name: 'Ручка #Орфосексуал', price: 120, cat: 'Ручки',
      img: S + 'nF7p_o69belpb-eToPQwDhS6hwAx92NZJrXryY9fQTk/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzYwMDAvNjkwMC82OTY3L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvNjk2Ny0xLmpwZw.jpg' },
    { id: '5ffcc4fa', name: 'Светильник Blessing', price: 590, cat: 'Светильники',
      img: S + '2Y7lkmCxHuB4y4g46Eekr6cXZC6y5QWyD5XjtKPb7f4/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE1MDAwLzE1MzAwLzE1MzUwL3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTUzNTAtMS5qcGc.jpg' },
    { id: '64e1304b', name: 'Охлаждающее полотенце Narvik в силиконовом чехле (оранжевый)', price: 850, cat: 'Уход за собой',
      img: S + '8JEBgJ4RyQh6uI6MRGWFa7chxLtbGXer8CXeu46wEVY/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE2MDAwLzE2MjAwLzE2MjkxL3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTYyOTEtMS5qcGc.jpg' },
    { id: 'd2b8f837', name: 'Игрушка на елку Рукавички', price: 390, cat: 'Игрушки',
      img: S + 'pPLQChI92kQ6f0hoIl3ddxpu2YKX41WNET82_tOnFgQ/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE2MDAwLzE2NTAwLzE2NTU1L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTY1NTUtMi5qcGc.jpg' },
    { id: 'a8790ffc', name: 'Набор для приготовления коктейлей Pourpour (Медный)', price: 2750, cat: 'Бар',
      img: S + 'UYLVQc2JtOb_95xHJPnpAlT8TEo1DKgccrU3hiKbHhQ/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE1MDAwLzE1NjAwLzE1NjI4L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTU2MjgtMS5qcGc.jpg' },
    { id: '39933c62', name: 'Ланч-бокс Pascal S (Серый)', price: 490, cat: 'Ланч-боксы',
      img: S + 'qKBpgxy4_ntU6aBrzM3Ns1TnDgtvf1rnnEUR0MafmnM/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzkwMDAvOTIwMC85Mjg2L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvOTI4Ni0xNC5qcGc.jpg' },
    { id: '5a3fb903', name: 'Солонка и перечница Единороги', price: 490, cat: 'Наборы для специй',
      img: S + '764wHJrkg2FqeXQNabCastyJaXLUcsxea4_5AjS3WbM/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzEwMDAwLzEwNzAwLzEwNzE2L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTA3MTYtMS5qcGc.jpg' },
    { id: 'bfb03d4e', name: 'Кашпо Морской котик Suki The Seal Pup', price: 990, cat: 'Интерьер',
      img: S + '9PLFyjuuq1a1BqXjhr9B2wjlZUPJDFrVGeSpYA24ABM/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzEyMDAwLzEyMjAwLzEyMjExL3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTIyMTEtMi5qcGc.jpg' },
    { id: 'a76a7bd5', name: 'Автовизитка «Ваш звонок очень важен для нас»', price: 190, cat: 'Автовизитки',
      img: S + 'lOQkawE3_lZxnQvj6jG3KXUUfLoKBbPtqpYb53GFZSo/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzYwMDAvNjYwMC82NjE0L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvNjYxNC0xLmpwZw.jpg' },
    { id: 'ee8a488f', name: 'Пузырчатый календарь 2026 год XL', price: 1990, cat: 'Календари',
      img: S + 'K2aPlVSjmJSl3dz8QZ9q8ln_Ad9ZbZwZDMMMhCViWFE/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzIwMDAvMjYwMC8yNjEzL3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMjYxMy0yNS5qcGc.jpg' },
    { id: '4ac8751e', name: 'Пазл «Рождественская история»', price: 990, cat: 'Игрушки',
      img: S + 'byTKfCthJuO4KSppWm1Lb_eOcqpqzwBen6C5g510mLs/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE1MDAwLzE1MjAwLzE1MjE5L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTUyMTktMS5qcGc.jpg' },
    { id: '51d45b0d', name: 'Ручка и пресс-папье «Собачка Woof!» (Белый)', price: 1990, cat: 'Настольные органайзеры',
      img: S + 'yk3eIm2Ti_IxSKeZhApm7KBIbRksQ88C7iaRKgexshA/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzEwMDAwLzEwNTAwLzEwNTU5L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTA1NTktMy5qcGc.jpg' },
    { id: 'bee4d606', name: 'Ёлочная игрушка «Снеговик и олень»', price: 550, cat: 'Игрушки',
      img: S + '4I9dYaptl8B5JVOs04BKHl_IRcP46tAUsnZtGRR0gmI/fit/1080/1080/no/1/aHR0cHM6Ly9tcmdlZWsucnUvaW1hZ2VzL3Byb2R1Y3RfcGljdHVyZXNfbmV3LzE1MDAwLzE1MjAwLzE1MjQ1L3Byb2R1Y3RfcGljdHVyZXMvb3JpZ2luYWwvMTUyNDUtMTMuanBn.jpg' }
  ];
  window.WL_GOODS = G;
  window.WL_GOOD = function (i) { return G[i] || G[0]; };
})();
