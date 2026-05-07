/**
 * Простой build-скрипт: копирует src/ в dist/ и минифицирует через terser.
 *
 * Использование:
 *   npm install
 *   npm run build
 *
 * На выходе:
 *   dist/consent-checkbox.js       — копия исходника (для отладки на CDN)
 *   dist/consent-checkbox.min.js   — минифицированная версия (production)
 */
const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const SRC = path.join(__dirname, 'src', 'consent-checkbox.js');
const DIST = path.join(__dirname, 'dist');
const OUT_FULL = path.join(DIST, 'consent-checkbox.js');
const OUT_MIN = path.join(DIST, 'consent-checkbox.min.js');

(async () => {
    if (!fs.existsSync(DIST)) fs.mkdirSync(DIST, { recursive: true });

    const code = fs.readFileSync(SRC, 'utf8');
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    const banner = `/*! ConsentCheckbox.js v${pkg.version} | MIT License | https://github.com/USERNAME/consent-checkbox.js */\n`;

    // Полная версия — просто копируем (без баннера, он уже внутри файла)
    fs.writeFileSync(OUT_FULL, code, 'utf8');
    console.log('✔ ' + path.relative(__dirname, OUT_FULL));

    // Минификация
    const result = await minify(code, {
        compress: {
            drop_console: false,
            passes: 2
        },
        mangle: true,
        format: {
            preamble: banner,
            comments: false
        }
    });

    if (result.error) throw result.error;
    fs.writeFileSync(OUT_MIN, result.code, 'utf8');
    console.log('✔ ' + path.relative(__dirname, OUT_MIN) +
        ' (' + result.code.length + ' bytes)');
})().catch(err => {
    console.error(err);
    process.exit(1);
});
