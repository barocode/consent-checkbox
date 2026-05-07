# Changelog

Все значимые изменения в проекте документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект следует [Semantic Versioning](https://semver.org/lang/ru/).

## [1.0.0] — 2026-05-07

### Добавлено
- Первый публичный релиз.
- Четыре режима вставки: `auto`, `append`, `after-submit`, `tooltip`.
- Auto-режим с поиском существующего блока согласия по ключевым словам.
- Подмена `href` у политики конфиденциальности в найденном блоке.
- Автоматическая блокировка submit-кнопок (включая `form="id"`-привязки).
- Перехват `submit` в capture-фазе (защита от программного `form.submit()`).
- `MutationObserver` для динамически добавленных форм.
- Tooltip-режим с отслеживанием видимости через `IntersectionObserver`.
- UMD-обёртка (AMD / CommonJS / global).
