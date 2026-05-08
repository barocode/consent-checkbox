# ConsentCheckbox.js

Универсальная JS-библиотека для добавления чекбокса согласия на обработку персональных данных ко всем формам на странице. Подходит для соответствия требованиям 152-ФЗ / GDPR на сайтах, которые нельзя или дорого править вручную.

- ✅ Подключается одним `<script>`-тегом
- ✅ Без зависимостей, ~7 KB min
- ✅ UMD: работает как глобальная переменная, в AMD и в CommonJS
- ✅ Авто-режим: находит уже существующий блок согласия и аккуратно правит ссылку
- ✅ Блокирует submit-кнопки до отметки чекбокса (включая программный `form.submit()`)
- ✅ Поддерживает динамически добавляемые формы (`MutationObserver`)
- ✅ Tooltip-режим, который не «висит» поверх скрытых модалок

## Подключение через CDN

```html
<script src="https://cdn.jsdelivr.net/gh/barocode/consent-checkbox@v1.0.5/dist/consent-checkbox.min.js"></script>
<script>
    ConsentCheckbox.init({
        policyUrl: '/privacy-policy'
    });
</script>
```

Также доступно через **unpkg**:

```html
<script src="https://unpkg.com/consent-checkbox@1/dist/consent-checkbox.min.js"></script>
```

## Установка через npm

```bash
npm install consent-checkbox
```

```js
import ConsentCheckbox from 'consent-checkbox';

ConsentCheckbox.init({ policyUrl: '/privacy' });
```

## Быстрый старт

```html
<script src="consent-checkbox.min.js"></script>
<script>
    ConsentCheckbox.init({
        policyUrl: '/privacy-policy',     // ссылка на политику
        excludeSelector: '#login, .search-form'  // что игнорировать
    });
</script>
```

Этого достаточно: библиотека пройдётся по всем `<form>` на странице, найдёт существующие блоки согласия и подставит туда правильную ссылку. Для форм без таких блоков покажет аккуратный tooltip с чекбоксом под кнопкой отправки — но только когда пользователь начал заполнять форму.

## Режимы работы

| Режим           | Когда использовать                                                       |
|-----------------|--------------------------------------------------------------------------|
| `auto`          | По умолчанию. Сначала ищет существующий блок, иначе — `autoFallbackMode` |
| `append`        | Добавляет чекбокс в самый конец формы                                    |
| `after-submit`  | Вставляет чекбокс сразу после первой submit-кнопки                       |
| `tooltip`       | Показывает чекбокс во всплывающей подсказке под кнопкой отправки         |

```js
ConsentCheckbox.init({ mode: 'append' });
```

## Полный список опций

```js
ConsentCheckbox.init({
    // Режим вставки
    mode: 'auto',

    // Ссылка на политику — будет подставлена в href
    policyUrl: '/privacy',

    // Шаблон текста. {link}...{/link} превратится в <a href="policyUrl">
    text: 'Я согласен с условиями {link}обработки персональных данных{/link}',

    // К каким формам применять / какие исключить
    formSelector: 'form',
    excludeSelector: '',

    // Состояние чекбокса по умолчанию
    defaultChecked: true,

    // Имя поля
    name: 'consent_personal_data',

    // CSS-класс обёртки и встроенные стили
    wrapperClass: 'consent-checkbox',
    injectStyles: true,

    // ---- Auto-режим ----
    autoKeywords: ['соглаша', 'согласе', 'политика', 'персонал'],
    autoSkip: true,                  // если блок уже с чекбоксом — не трогать
    autoFallbackMode: 'tooltip',     // что делать, если блок не найден
    autoInjectLink: true,            // дописать ссылку, если её не было
    autoInjectCheckbox: true,        // вставить чекбокс в декларативный блок

    // ---- Кнопки и поля ----

    // Что считать submit-кнопкой. По умолчанию — стандартные варианты.
    // Расширьте, если на сайте используются нестандартные кнопки:
    submitSelector: 'button[type="submit"], input[type="submit"], ' +
                    'input[type="image"], button:not([type])',

    // Какие поля считать "заполняемыми" в tooltip-режиме.
    // Радио и чекбоксы НЕ включены: выбор звёздного рейтинга или подписки
    // на рассылку не должен показывать tooltip.
    fillableSelector: 'input[type="text"], input[type="email"], ' +
        'input[type="tel"], input[type="number"], input[type="url"], ' +
        'input[type="password"], input[type="search"], input[type="date"], ' +
        'input[type="datetime-local"], input[type="month"], input[type="week"], ' +
        'input[type="time"], input:not([type]), textarea, select',

    // Минимум "значимых" символов в значении, чтобы поле считалось заполненным.
    // Для tel — 2 (т.к. в маске часто прошит код страны вроде +7).
    minMeaningfulChars: { tel: 2, _default: 1 },

    // Колбэки
    onChange:    function (checked, form) {},
    onBlock:     function (form) {},          // submit заблокирован
    onAutoMatch: function (element, form) {}  // нашли существующий блок
});
```

### Кастомные submit-кнопки

Если на сайте кнопки отправки сделаны нестандартно — например, `<input type="button">` или просто `<a class="btn-submit">` — расширьте `submitSelector`:

```js
ConsentCheckbox.init({
    submitSelector: 'button[type="submit"], input[type="submit"], ' +
                    'input[type="image"], button:not([type]), ' +
                    'input[type="button"].js-form-submit, a.btn-submit'
});
```

Поддержка внешних кнопок (через атрибут `form="<id>"`) работает автоматически — каждая часть селектора применяется и внутри формы, и снаружи с фильтром `[form="<id>"]`.

### Поля с масками

Стандартное поведение хорошо работает с phone-масками вроде `+7 (___) ___-__-__`: символы маски отбрасываются перед измерением длины значения, поэтому tooltip не «висит» на пустом поле, в которое маска уже вставила плейсхолдеры. Если используете нестандартный mask-плейсхолдер, увеличьте порог:

```js
ConsentCheckbox.init({
    minMeaningfulChars: { tel: 3, text: 2, _default: 1 }
});
```

## API

```js
// Инициализация (применяется ко всем формам страницы)
ConsentCheckbox.init(options);

// Применить только к одной форме вручную
ConsentCheckbox.applyTo(document.querySelector('#myForm'), options);

// Версия
ConsentCheckbox.version; // '1.0.5'
```

## Стилизация

Библиотека внедряет минимальные стили под классом `.consent-checkbox`. Их легко переопределить:

```css
.consent-checkbox {
    font-size: 13px;
    color: #444;
}
.consent-checkbox a {
    color: #c8102e;
}
.cc-tooltip {
    border-color: #c8102e;
}
```

Чтобы полностью отказаться от встроенных стилей:

```js
ConsentCheckbox.init({ injectStyles: false });
```

## Сборка

```bash
git clone https://github.com/barocode/consent-checkbox
cd consent-checkbox.js
npm install
npm run build
```

На выходе:

- `dist/consent-checkbox.js` — полная версия
- `dist/consent-checkbox.min.js` — минифицированная версия для CDN

## Структура репозитория

```
consent-checkbox.js/
├── src/
│   └── consent-checkbox.js   ← исходник
├── dist/                      ← результат сборки (для CDN)
│   ├── consent-checkbox.js
│   └── consent-checkbox.min.js
├── examples/
│   └── index.html            ← демо-страница
├── build.js                   ← скрипт минификации (terser)
├── package.json
├── CHANGELOG.md
├── LICENSE
└── README.md
```

## Совместимость

Поддерживаются все современные браузеры (Chrome / Firefox / Safari / Edge), включая мобильные. Используются `MutationObserver`, `IntersectionObserver` и `getComputedStyle` — это IE11+ при подключении соответствующих полифилов; нативно — Edge 16+.

## Лицензия

[MIT](LICENSE)
