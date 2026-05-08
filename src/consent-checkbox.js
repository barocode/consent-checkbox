/*!
 * ConsentCheckbox.js v1.0.6
 * Универсальная библиотека для добавления чекбокса согласия на обработку
 * персональных данных ко всем формам на странице.
 *
 * https://github.com/barocode/consent-checkbox
 * Лицензия: MIT
 */
(function (root, factory) {
    'use strict';
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.ConsentCheckbox = factory();
    }
}(typeof self !== 'undefined' ? self : this, function () {
    'use strict';

    // ====================================================================
    // Настройки по умолчанию
    // ====================================================================
    var DEFAULTS = {
        // Режим вставки: 'auto' | 'append' | 'after-submit' | 'tooltip'
        // 'auto' (по умолчанию): пытается найти существующий блок согласия в форме,
        // правит ссылку и текст. Если не нашёл - использует autoFallbackMode.
        mode: 'auto',

        // Ссылка на политику конфиденциальности.
        // Используется как для генерации новой ссылки, так и для замены href
        // в найденном auto-режимом блоке.
        policyUrl: '/privacy',

        // Шаблон текста для генерируемого чекбокса.
        // {link}...{/link} - часть, которая станет ссылкой на policyUrl.
        // Если плейсхолдеров нет - текст вставится как есть (без ссылки).
        text: 'Я согласен с условиями {link}обработки персональных данных{/link}',

        // CSS-селектор для форм, к которым применять (по умолчанию все)
        formSelector: 'form',

        // Селекторы форм, которые надо игнорировать (поиск, авторизация и т.п.)
        excludeSelector: '',

        // Состояние чекбокса по умолчанию
        defaultChecked: true,

        // Имя/ID для атрибута
        name: 'consent_personal_data',

        // CSS-класс-обёртка
        wrapperClass: 'consent-checkbox',

        // Применять ли встроенные стили
        injectStyles: true,

        // Текст подсказки (tooltip-режим)
        tooltipShowDelay: 0,

        // ---- Настройки auto-режима ----

        // Ключевые слова (в нижнем регистре) для поиска существующего блока согласия.
        // Поиск регистронезависимый, ищется как подстрока в textContent элемента.
        autoKeywords: ['соглаша', 'согласе', 'политика', 'персонал'],

        // Если найденный блок уже содержит чекбокс - не делать ничего с этой формой.
        // false - всё равно применить fallback-режим.
        autoSkip: true,

        // Режим, который применяется, если auto-поиск не нашёл подходящий блок
        autoFallbackMode: 'tooltip',

        // Если найденный блок не содержит ссылку - добавить её к тексту.
        // false - оставить блок как есть (только привязать к нему submit-блокировку).
        autoInjectLink: true,

        // Если найденный блок декларативный ("Нажимая кнопку, вы соглашаетесь...")
        // и не содержит чекбокса - заменить его текст на options.text и
        // вставить настоящий <input type="checkbox"> в начало блока,
        // привязав к нему блокировку submit. URL для ссылки берётся из
        // существующей ссылки блока (если была), иначе из options.policyUrl.
        // false - оставить текст блока как есть, только править/добавлять ссылку.
        autoInjectCheckbox: true,

        // Селектор для submit-элементов внутри формы.
        // По умолчанию учитывает <button type=submit>, <input type=submit/image>
        // и <button> без type (по умолчанию это submit).
        // Расширьте, если на сайте кнопки сделаны нестандартно, например:
        //   submitSelector: 'button[type="submit"], input[type="submit"], ' +
        //                   'input[type="image"], button:not([type]), ' +
        //                   'input[type="button"].js-submit, .form-submit'
        // Для каждой части селектора автоматически также проверяется
        // соответствие атрибуту form="<id>" (внешние кнопки).
        submitSelector: 'button[type="submit"], input[type="submit"], input[type="image"], button:not([type])',

        // Селектор для "заполняемых" полей формы.
        // По умолчанию - текстовые/числовые типы и textarea/select.
        // Чекбоксы и радио НЕ включены: их состояние не считается признаком
        // того, что пользователь собирается отправить форму (например, выбор
        // звезды в рейтинге не должен показывать tooltip согласия).
        fillableSelector: 'input[type="text"], input[type="email"], input[type="tel"], ' +
            'input[type="number"], input[type="url"], input[type="password"], ' +
            'input[type="search"], input[type="date"], input[type="datetime-local"], ' +
            'input[type="month"], input[type="week"], input[type="time"], ' +
            'input:not([type]), textarea, select',

        // Минимальное количество "значимых" символов в значении поля,
        // чтобы оно считалось реально заполненным. Для tel-полей - 2
        // (потому что в маске часто прошит код страны вроде +7, +1).
        // Для остальных типов - 1.
        // Значимыми считаются буквы и цифры; mask-плейсхолдеры (_ # *)
        // и форматирующие символы (- + ( ) пробелы . , / \) отбрасываются.
        minMeaningfulChars: { tel: 2, _default: 1 },

        // Колбэки
        onChange: null, // function(checked, form) {}
        onBlock: null,  // function(form) {} вызывается при попытке submit без согласия
        onAutoMatch: null, // function(element, form) {} вызывается при успешном поиске
    };

    // ====================================================================
    // Утилиты
    // ====================================================================
    function extend(target) {
        for (var i = 1; i < arguments.length; i++) {
            var src = arguments[i];
            if (!src) continue;
            for (var key in src) {
                if (Object.prototype.hasOwnProperty.call(src, key)) {
                    target[key] = src[key];
                }
            }
        }
        return target;
    }

    function generateId() {
        return 'cc_' + Math.random().toString(36).slice(2, 10);
    }

    // Безопасно делит CSS-селектор по запятым с учётом скобок (), [].
    // Чтобы не сломать конструкции вроде :is(a, b) или [data-x="a,b"].
    function splitSelectorByCommas(sel) {
        var parts = [];
        var depth = 0;
        var current = '';
        for (var i = 0; i < sel.length; i++) {
            var c = sel.charAt(i);
            if (c === '(' || c === '[') depth++;
            else if (c === ')' || c === ']') depth--;
            else if (c === ',' && depth === 0) {
                if (current.trim()) parts.push(current.trim());
                current = '';
                continue;
            }
            current += c;
        }
        if (current.trim()) parts.push(current.trim());
        return parts;
    }

    function getSubmitButtons(form, options) {
        var sel = options.submitSelector;
        var inForm = form.querySelectorAll(sel);
        var external = [];
        if (form.id) {
            // Для каждой части селектора добавляем фильтр [form="id"],
            // чтобы найти внешние кнопки, привязанные к форме через form-attr.
            var parts = splitSelectorByCommas(sel);
            var externalSel = parts.map(function (p) {
                return p + '[form="' + form.id + '"]';
            }).join(', ');
            try {
                external = document.querySelectorAll(externalSel);
            } catch (e) {
                external = [];
            }
        }
        var result = Array.prototype.slice.call(inForm);
        Array.prototype.forEach.call(external, function (btn) {
            if (result.indexOf(btn) === -1) result.push(btn);
        });
        return result;
    }

    function setSubmitState(form, enabled, options) {
        var buttons = getSubmitButtons(form, options);
        buttons.forEach(function (btn) {
            if (enabled) {
                btn.disabled = false;
                btn.removeAttribute('aria-disabled');
                btn.classList.remove('cc-disabled');
            } else {
                btn.disabled = true;
                btn.setAttribute('aria-disabled', 'true');
                btn.classList.add('cc-disabled');
            }
        });
    }

    // Определяет, содержит ли значение реальный пользовательский ввод
    // (а не только символы маски). Маски телефонов вроде "+7 (___) ___-__-__"
    // оставляли поле "не пустым" - из-за чего tooltip висел постоянно.
    function hasMeaningfulValue(el, options) {
        var raw = el.value;
        if (raw == null) return false;
        var value = String(raw).trim();
        if (!value) return false;

        // У <select> любое выбранное значение != "" - осмысленный выбор.
        if (el.tagName === 'SELECT') return true;

        // Срезаем mask-плейсхолдеры (_ # *) и типичное форматирование.
        // То, что осталось - реально введённые буквы/цифры (или цифры
        // из самой маски, например "+7").
        // Дефис обязательно в конце класса - чтобы он гарантированно
        // трактовался как литерал и при минификации не превратился в range
        // (например, "+-(" стал бы range от + до ( и сломал regex).
        var clean = value.replace(/[\s_#*+().,/-]/g, '');
        if (!clean) return false;

        var min = options.minMeaningfulChars || {};
        var threshold = min[el.type] || min._default || 1;
        return clean.length >= threshold;
    }

    function isFormFilled(form, options) {
        var ae = document.activeElement;
        if (ae && ae !== document.body && form.contains(ae)) {
            if (ae.matches && ae.matches(options.fillableSelector)) return true;
        }

        var fields = form.querySelectorAll(options.fillableSelector);
        for (var i = 0; i < fields.length; i++) {
            if (hasMeaningfulValue(fields[i], options)) return true;
        }
        return false;
    }

    // ====================================================================
    // Стили
    // ====================================================================
    var STYLES_INJECTED = false;
    var BASE_STYLES = [
        '.consent-checkbox{display:flex;align-items:flex-start;gap:8px;margin:10px 0;font-size:14px;line-height:1.4;color:#333;font-family:inherit}',
        '.consent-checkbox input[type="checkbox"]{margin-top:3px;flex-shrink:0;cursor:pointer}',
        '.consent-checkbox label{cursor:pointer;user-select:none}',
        '.consent-checkbox a{color:#0066cc;text-decoration:underline}',
        '.consent-checkbox a:hover{text-decoration:none}',
        'button.cc-disabled,input.cc-disabled{opacity:.6;cursor:not-allowed!important}',
        '.cc-tooltip{position:fixed;z-index:2147483647;background:#fff;border:1px solid #d0d0d0;border-radius:6px;padding:10px 14px;box-shadow:0 4px 16px rgba(0,0,0,.12);font-size:13px;line-height:1.4;color:#333;max-width:340px;font-family:inherit;animation:cc-fade .2s ease}',
        '.cc-tooltip::before{content:"";position:absolute;top:-6px;left:20px;width:10px;height:10px;background:#fff;border-left:1px solid #d0d0d0;border-top:1px solid #d0d0d0;transform:rotate(45deg)}',
        '.cc-tooltip .consent-checkbox{margin:0}',
        '.cc-converted-block{display:block;opacity:1}',
        '.cc-converted-block input.cc-injected-input{width:auto;height:auto;display:inline-block;margin-right:8px;vertical-align:middle}',
        '@keyframes cc-fade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}'
    ].join('');

    function injectStyles() {
        if (STYLES_INJECTED) return;
        STYLES_INJECTED = true;
        var style = document.createElement('style');
        style.setAttribute('data-consent-checkbox', 'true');
        style.textContent = BASE_STYLES;
        (document.head || document.documentElement).appendChild(style);
    }

    // ====================================================================
    // Безопасный рендеринг шаблона текста
    // ====================================================================
    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function escapeAttr(str) {
        return String(str).replace(/"/g, '&quot;');
    }

    // Превращает шаблон 'Согласен с {link}политикой{/link}' в HTML.
    // Текст вне плейсхолдеров и текст внутри плейсхолдера экранируются.
    // Если плейсхолдеров в шаблоне нет - текст возвращается как есть (escaped).
    function renderTextTemplate(template, url) {
        var re = /\{link\}([\s\S]*?)\{\/link\}/g;
        var result = '';
        var lastIndex = 0;
        var m;
        var hasMatch = false;

        while ((m = re.exec(template)) !== null) {
            hasMatch = true;
            result += escapeHtml(template.slice(lastIndex, m.index));
            result += '<a href="' + escapeAttr(url) +
                      '" target="_blank" rel="noopener">' +
                      escapeHtml(m[1]) + '</a>';
            lastIndex = re.lastIndex;
        }
        if (hasMatch) {
            result += escapeHtml(template.slice(lastIndex));
            return result;
        }
        // Плейсхолдеров нет - просто экранируем
        return escapeHtml(template);
    }

    // ====================================================================
    // Создание узла чекбокса
    // ====================================================================
    function buildCheckbox(options) {
        var wrapper = document.createElement('div');
        wrapper.className = options.wrapperClass;

        var input = document.createElement('input');
        input.type = 'checkbox';
        var id = generateId();
        input.id = id;
        input.name = options.name;
        if (options.defaultChecked) input.checked = true;

        var label = document.createElement('label');
        label.setAttribute('for', id);
        label.innerHTML = renderTextTemplate(options.text, options.policyUrl);

        wrapper.appendChild(input);
        wrapper.appendChild(label);

        return { wrapper: wrapper, input: input };
    }

    // ====================================================================
    // Привязка логики блокировки к чекбоксу
    // ====================================================================
    function bindCheckboxToForm(form, checkboxInput, options) {
        // Стартовое состояние
        setSubmitState(form, checkboxInput.checked, options);

        // При изменении чекбокса
        checkboxInput.addEventListener('change', function () {
            setSubmitState(form, checkboxInput.checked, options);
            if (typeof options.onChange === 'function') {
                options.onChange(checkboxInput.checked, form);
            }
        });

        // Перехват submit - последняя линия защиты
        // (если кто-то вызвал form.submit() программно или disabled был снят)
        form.addEventListener('submit', function (e) {
            if (!checkboxInput.checked) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (typeof options.onBlock === 'function') {
                    options.onBlock(form);
                }
                // Привлечём внимание к чекбоксу
                try { checkboxInput.focus(); } catch (err) {}
                return false;
            }
        }, true); // capture - чтобы перехватить раньше других обработчиков
    }

    // ====================================================================
    // Режим 1: append - в конец формы
    // ====================================================================
    function applyAppendMode(form, options) {
        var built = buildCheckbox(options);
        form.appendChild(built.wrapper);
        bindCheckboxToForm(form, built.input, options);
    }

    // ====================================================================
    // Режим 2: after-submit - сразу после первой submit-кнопки
    // ====================================================================
    function applyAfterSubmitMode(form, options) {
        var built = buildCheckbox(options);
        var submits = getSubmitButtons(form, options);
        var anchor = submits[0];

        if (anchor && anchor.parentNode) {
            // Если кнопка вне формы (form="..."), то всё равно вставим рядом с ней
            if (anchor.nextSibling) {
                anchor.parentNode.insertBefore(built.wrapper, anchor.nextSibling);
            } else {
                anchor.parentNode.appendChild(built.wrapper);
            }
        } else {
            // Фоллбэк: если кнопки не нашли - в конец формы
            form.appendChild(built.wrapper);
        }

        bindCheckboxToForm(form, built.input, options);
    }

    // ====================================================================
    // Проверка видимости элемента (для tooltip)
    // Учитывает: отсутствие в DOM, display:none, visibility:hidden,
    // нулевые размеры, opacity:0 у самого элемента или предков.
    // ====================================================================
    function isVisible(el) {
        if (!el || !document.contains(el)) return false;

        // offsetParent = null означает display:none у элемента или предка
        // (не работает только для position:fixed - проверим отдельно ниже)
        var rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;

        // Проходим по цепочке предков и проверяем computed styles
        var node = el;
        while (node && node.nodeType === 1) {
            var style = window.getComputedStyle(node);
            if (style.display === 'none') return false;
            if (style.visibility === 'hidden' || style.visibility === 'collapse') return false;
            if (parseFloat(style.opacity) === 0) return false;
            node = node.parentElement;
        }
        return true;
    }

    // ====================================================================
    // Режим 3: tooltip - показывается под кнопкой при заполнении формы
    // ====================================================================
    function applyTooltipMode(form, options) {
        var built = buildCheckbox(options);

        // Tooltip с чекбоксом - размещается в body, позиционируется абсолютно
        var tooltip = document.createElement('div');
        tooltip.className = 'cc-tooltip';
        tooltip.style.display = 'none';
        tooltip.appendChild(built.wrapper);
        document.body.appendChild(tooltip);

        var visible = false;
        var destroyed = false;

        function getAnchor() {
            return getSubmitButtons(form, options)[0] || null;
        }

        function positionTooltip() {
            var anchor = getAnchor();
            if (!anchor) return;
            var rect = anchor.getBoundingClientRect();
            // position:fixed - координаты относительно viewport,
            // pageXOffset/pageYOffset не нужны
            tooltip.style.top = (rect.bottom + 8) + 'px';
            tooltip.style.left = rect.left + 'px';

            // Авто-z-index: на некоторых сайтах модалки уходят выше 2147483647
            // через создание новых stacking-контекстов. Сканируем видимые
            // элементы под точкой якоря и поднимаемся выше самого высокого.
            ensureOnTop();
        }

        // Поднимает z-index tooltip выше любого элемента, перекрывающего якорь.
        // Использует elementsFromPoint - дёшево и точно.
        function ensureOnTop() {
            if (!document.elementsFromPoint) return;
            var anchor = getAnchor();
            if (!anchor) return;
            var rect = anchor.getBoundingClientRect();
            var x = rect.left + rect.width / 2;
            var y = rect.top + rect.height / 2;
            var stack = document.elementsFromPoint(x, y) || [];
            var maxZ = 0;
            for (var i = 0; i < stack.length; i++) {
                var el = stack[i];
                if (el === tooltip || tooltip.contains(el)) continue;
                var z = parseInt(window.getComputedStyle(el).zIndex, 10);
                if (!isNaN(z) && z > maxZ) maxZ = z;
            }
            if (maxZ >= 2147483647) {
                // Кто-то уже на максимуме - переезжаем в конец body, чтобы
                // победить за счёт порядка в DOM (при равном z-index выигрывает
                // последний в дереве).
                if (tooltip.parentNode !== document.body ||
                    tooltip !== document.body.lastElementChild) {
                    document.body.appendChild(tooltip);
                }
            } else if (maxZ > 0) {
                tooltip.style.zIndex = String(Math.min(maxZ + 1, 2147483647));
            }
        }

        function showTooltip() {
            if (destroyed || visible) {
                if (visible) positionTooltip();
                return;
            }
            visible = true;
            tooltip.style.display = 'block';
            positionTooltip();
        }

        function hideTooltip() {
            if (!visible) return;
            visible = false;
            tooltip.style.display = 'none';
        }

        function update() {
            if (destroyed) return;

            // Если форма (или её контейнер - модалка и т.п.) скрыта,
            // tooltip не должен висеть на странице.
            var anchor = getAnchor();
            if (!isVisible(form) || !anchor || !isVisible(anchor)) {
                hideTooltip();
                return;
            }

            if (isFormFilled(form, options)) showTooltip();
            else hideTooltip();
        }

        function destroy() {
            if (destroyed) return;
            destroyed = true;
            hideTooltip();
            if (tooltip.parentNode) tooltip.parentNode.removeChild(tooltip);
            if (mutationObs) mutationObs.disconnect();
            if (intersectionObs) intersectionObs.disconnect();
            if (pollTimer) clearInterval(pollTimer);
            window.removeEventListener('resize', onWindowChange);
            window.removeEventListener('scroll', onWindowChange, true);
            document.removeEventListener('transitionend', update, true);
            document.removeEventListener('animationend', update, true);
        }

        function onWindowChange() {
            if (visible) positionTooltip();
            // На ресайз/скролл могла измениться видимость предков
            update();
        }

        // ---- Слушатели активности пользователя в форме ----
        var events = ['input', 'change', 'focusin', 'focusout', 'keyup'];
        events.forEach(function (ev) {
            form.addEventListener(ev, update);
        });

        // ---- Реакция на ресайз/скролл ----
        window.addEventListener('resize', onWindowChange);
        window.addEventListener('scroll', onWindowChange, true);

        // ---- Реакция на конец CSS-анимаций/переходов ----
        // Модалки часто закрываются через transition/animation - после
        // завершения которых меняется display. Это даёт нам триггер.
        document.addEventListener('transitionend', update, true);
        document.addEventListener('animationend', update, true);

        // ---- IntersectionObserver на якорной кнопке ----
        // Срабатывает, когда кнопка уходит из viewport или становится скрытой.
        // Это самый быстрый способ узнать, что модалка закрылась.
        var intersectionObs = null;
        var anchor = getAnchor();
        if (anchor && typeof IntersectionObserver !== 'undefined') {
            intersectionObs = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (!entry.isIntersecting) hideTooltip();
                    else update();
                });
            }, { threshold: 0 });
            intersectionObs.observe(anchor);
        }

        // ---- MutationObserver: следит за DOM ----
        // 1) Удаление формы со страницы - уничтожаем tooltip насовсем.
        // 2) Изменения атрибутов class/style у предков (показ/скрытие модалки) -
        //    пересчитываем видимость.
        var mutationObs = new MutationObserver(function () {
            if (!document.contains(form)) {
                destroy();
                return;
            }
            update();
        });
        mutationObs.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'style', 'hidden', 'aria-hidden']
        });

        // ---- Страховочный poll ----
        // На случай, если что-то изменило видимость способом, который мы
        // не отловили (например, перерисовка через Web Component shadow DOM).
        // Лёгкая проверка раз в 500мс - только когда tooltip видим.
        var pollTimer = setInterval(function () {
            if (visible) update();
        }, 500);

        bindCheckboxToForm(form, built.input, options);
    }

    // ====================================================================
    // Режим 4: auto - поиск существующего блока согласия в форме
    // ====================================================================

    // Возвращает true, если строка содержит хотя бы одно ключевое слово
    function textMatchesKeywords(text, keywords) {
        var lower = text.toLowerCase();
        for (var i = 0; i < keywords.length; i++) {
            if (lower.indexOf(keywords[i].toLowerCase()) !== -1) return true;
        }
        return false;
    }

    // Ищет в форме самый "узкий" элемент, чей текст содержит ключевое слово.
    // Игнорирует input/label-обёртки самих полей формы и submit-кнопки.
    function findExistingConsentBlock(form, keywords) {
        // Берём все элементы внутри формы и фильтруем по textContent.
        // Затем из подходящих выбираем самый глубокий - тот, у которого нет
        // потомка-элемента, тоже содержащего ключевое слово.
        var all = form.querySelectorAll('*');
        var matches = [];
        for (var i = 0; i < all.length; i++) {
            var el = all[i];
            // Пропускаем технические элементы
            var tag = el.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' ||
                tag === 'BUTTON' || tag === 'OPTION' || tag === 'SCRIPT' ||
                tag === 'STYLE') continue;
            var text = el.textContent || '';
            if (!text.trim()) continue;
            if (textMatchesKeywords(text, keywords)) {
                matches.push(el);
            }
        }
        if (!matches.length) return null;

        // Выбираем самый узкий: элемент, ни один потомок которого
        // (из числа matches) не подходит под ключевые слова.
        for (var j = 0; j < matches.length; j++) {
            var candidate = matches[j];
            var hasMatchingChild = false;
            for (var k = 0; k < matches.length; k++) {
                if (k === j) continue;
                if (candidate.contains(matches[k])) {
                    hasMatchingChild = true;
                    break;
                }
            }
            if (!hasMatchingChild) return candidate;
        }
        // Фоллбэк - первый
        return matches[0];
    }

    // Применяет auto-режим. Возвращает true, если успешно нашли и обработали
    // существующий блок; false - если надо использовать fallback.
    function applyAutoMode(form, options) {
        var block = findExistingConsentBlock(form, options.autoKeywords);
        if (!block) return false;

        var existingCheckbox = block.querySelector('input[type="checkbox"]');

        // Если в блоке уже есть свой чекбокс
        if (existingCheckbox) {
            if (options.autoSkip) {
                // Полностью оставляем форму в покое - на ней уже всё есть
                if (typeof options.onAutoMatch === 'function') {
                    options.onAutoMatch(block, form);
                }
                return true;
            }
            // autoSkip=false: используем существующий чекбокс как наш,
            // привяжем к нему логику блокировки submit
            // (не меняя его текущее состояние и атрибуты)
            updatePolicyLink(block, options);
            bindCheckboxToForm(form, existingCheckbox, options);
            if (typeof options.onAutoMatch === 'function') {
                options.onAutoMatch(block, form);
            }
            return true;
        }

        // Чекбокса нет - это декларативный блок ("Нажимая кнопку, я соглашаюсь...").
        if (options.autoInjectCheckbox !== false) {
            // Полностью заменяем содержимое блока на отрендеренный шаблон
            // options.text + чекбокс. URL берём из существующей ссылки в блоке
            // (если была) - чтобы не сломать ссылку на реальную политику сайта.
            // Если ссылки не было - используем options.policyUrl.
            var existingUrl = findExistingPolicyUrl(block);
            var url = existingUrl || options.policyUrl;

            // Очищаем блок и кладём отрендеренный текст шаблона
            block.innerHTML = renderTextTemplate(options.text, url);

            // Вставляем активный чекбокс в начало
            var injected = injectCheckboxIntoBlock(block, options);
            bindCheckboxToForm(form, injected, options);
        } else {
            // autoInjectCheckbox=false: не трогаем текст, только правим/добавляем ссылку
            var linkUpdated = updatePolicyLink(block, options);
            if (!linkUpdated && options.autoInjectLink) {
                injectPolicyLink(block, options);
            }
        }

        if (typeof options.onAutoMatch === 'function') {
            options.onAutoMatch(block, form);
        }
        return true;
    }

    // Возвращает href первой ссылки в блоке (или сам href, если блок - <a>).
    // Игнорирует пустые/якорные ссылки. null - ссылки не найдено.
    function findExistingPolicyUrl(block) {
        var link = block.tagName === 'A' ? block : block.querySelector('a');
        if (!link) return null;
        var href = link.getAttribute('href');
        if (!href) return null;
        href = href.trim();
        if (!href || href === '#') return null;
        return href;
    }

    // Вставляет настоящий <input type="checkbox"> в начало декларативного
    // блока и делает клик по тексту блока (но не по ссылкам внутри) -
    // переключающим чекбокс.
    function injectCheckboxIntoBlock(block, options) {
        var input = document.createElement('input');
        input.type = 'checkbox';
        input.id = generateId();
        input.name = options.name;
        if (options.defaultChecked) input.checked = true;
        input.className = 'cc-injected-input';

        // Минимальные inline-стили: чтобы не зависеть от
        // injectStyles и не сломать существующий layout блока.
        input.style.marginRight = '8px';
        input.style.cursor = 'pointer';
        input.style.verticalAlign = 'middle';
        input.style.flexShrink = '0';

        block.insertBefore(input, block.firstChild);
        block.classList.add('cc-converted-block');

        // Делаем сам блок кликабельным (как label), но не перехватываем
        // клики по ссылкам/кнопкам/инпутам внутри.
        block.style.cursor = 'pointer';
        block.addEventListener('click', function (e) {
            if (e.target === input) return;
            var t = e.target;
            while (t && t !== block) {
                var tag = t.tagName;
                if (tag === 'A' || tag === 'BUTTON' || tag === 'INPUT' ||
                    tag === 'LABEL' || tag === 'SELECT' || tag === 'TEXTAREA') {
                    return;
                }
                t = t.parentNode;
            }
            input.checked = !input.checked;
            // Совместимый способ диспатча change
            var evt;
            try {
                evt = new Event('change', { bubbles: true });
            } catch (err) {
                evt = document.createEvent('Event');
                evt.initEvent('change', true, true);
            }
            input.dispatchEvent(evt);
        });

        return input;
    }

    // Заменяет href у первой найденной ссылки в блоке (или в самом блоке,
    // если он сам - <a>) на options.policyUrl. Возвращает true, если ссылка
    // была найдена и обновлена.
    function updatePolicyLink(block, options) {
        var link = null;
        if (block.tagName === 'A') {
            link = block;
        } else {
            link = block.querySelector('a');
        }
        if (!link) return false;
        link.setAttribute('href', options.policyUrl);
        // Не трогаем target/rel - оставляем как было на сайте
        return true;
    }

    // Добавляет ссылку на политику к блоку, если её там не было.
    // Стратегия: ищем в тексте блока ключевые слова ("персональн", "политик",
    // "соглаш") и оборачиваем подходящее слово в <a>. Если не нашли - просто
    // добавляем ссылку в конец.
    function injectPolicyLink(block, options) {
        // Ищем подходящее слово для оборачивания в текстовых узлах
        var anchorWords = ['персональных данных', 'персональные данные',
                           'политикой', 'политику', 'политика',
                           'условиями', 'условия'];

        var walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT, null, false);
        var textNode;
        while ((textNode = walker.nextNode())) {
            var nodeText = textNode.nodeValue;
            var lower = nodeText.toLowerCase();
            for (var i = 0; i < anchorWords.length; i++) {
                var idx = lower.indexOf(anchorWords[i]);
                if (idx === -1) continue;
                var matchLen = anchorWords[i].length;
                var before = nodeText.slice(0, idx);
                var matched = nodeText.slice(idx, idx + matchLen);
                var after = nodeText.slice(idx + matchLen);

                var a = document.createElement('a');
                a.href = options.policyUrl;
                a.target = '_blank';
                a.rel = 'noopener';
                a.textContent = matched;

                var parent = textNode.parentNode;
                if (before) parent.insertBefore(document.createTextNode(before), textNode);
                parent.insertBefore(a, textNode);
                if (after) parent.insertBefore(document.createTextNode(after), textNode);
                parent.removeChild(textNode);
                return true;
            }
        }

        // Не нашли подходящего слова - просто допишем ссылку в конец
        var space = document.createTextNode(' ');
        var link = document.createElement('a');
        link.href = options.policyUrl;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'политика конфиденциальности';
        block.appendChild(space);
        block.appendChild(link);
        return true;
    }

    // ====================================================================
    // Применение к одной форме
    // ====================================================================
    function processForm(form, options) {
        // Защита от повторной обработки
        if (form.hasAttribute('data-consent-checkbox-applied')) return;
        form.setAttribute('data-consent-checkbox-applied', 'true');

        var mode = options.mode;

        // auto: сначала пробуем найти существующий блок, иначе - fallback
        if (mode === 'auto') {
            var handled = applyAutoMode(form, options);
            if (handled) return;
            mode = options.autoFallbackMode || 'tooltip';
        }

        switch (mode) {
            case 'after-submit':
                applyAfterSubmitMode(form, options);
                break;
            case 'tooltip':
                applyTooltipMode(form, options);
                break;
            case 'append':
            default:
                applyAppendMode(form, options);
                break;
        }
    }

    // ====================================================================
    // Главный init
    // ====================================================================
    function init(userOptions) {
        var options = extend({}, DEFAULTS, userOptions || {});

        if (options.injectStyles) injectStyles();

        function run() {
            var forms = document.querySelectorAll(options.formSelector);
            var excluded = options.excludeSelector
                ? document.querySelectorAll(options.excludeSelector)
                : [];
            var excludedSet = Array.prototype.slice.call(excluded);

            Array.prototype.forEach.call(forms, function (form) {
                if (excludedSet.indexOf(form) !== -1) return;
                processForm(form, options);
            });

            // Наблюдение за динамически добавляемыми формами
            if (options.observeMutations !== false) {
                var mo = new MutationObserver(function (mutations) {
                    mutations.forEach(function (m) {
                        Array.prototype.forEach.call(m.addedNodes, function (node) {
                            if (node.nodeType !== 1) return;
                            if (node.matches && node.matches(options.formSelector)) {
                                if (excludedSet.indexOf(node) === -1) processForm(node, options);
                            }
                            if (node.querySelectorAll) {
                                var nested = node.querySelectorAll(options.formSelector);
                                Array.prototype.forEach.call(nested, function (f) {
                                    if (excludedSet.indexOf(f) === -1) processForm(f, options);
                                });
                            }
                        });
                    });
                });
                mo.observe(document.body, { childList: true, subtree: true });
            }
        }

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', run);
        } else {
            run();
        }
    }

    // Публичное API
    return {
        init: init,
        // Утилиты (на случай, если кто-то захочет применить вручную к одной форме)
        applyTo: function (form, userOptions) {
            var options = extend({}, DEFAULTS, userOptions || {});
            if (options.injectStyles) injectStyles();
            processForm(form, options);
        },
        version: '1.0.6'
    };
}));
