#!/usr/bin/env python3
"""Добавляет к локальным css/js в html метку версии: index.html -> app-core.js?v=abc1234.

Pages отдаёт файлы с кэшированием, а имена у нас постоянные — без метки браузер
показывает вчерашнюю сборку. Запускается по готовому каталогу сайта, исходники
в репозитории остаются чистыми.

  python3 .github/cache-bust.py _site <версия>
"""
import pathlib
import re
import sys

SKIP = ('http://', 'https://', '//', 'data:', '#', 'mailto:')
REF = re.compile(r'((?:src|href)=")([^"]+\.(?:css|js))(")')


def bust(root: pathlib.Path, version: str) -> int:
    """Возвращает число найденных страниц. Уже проштампованные ссылки пропускает,
    поэтому повторный запуск ничего не портит."""
    pages = 0
    for page in sorted(root.rglob('*.html')):
        pages += 1
        text = page.read_text(encoding='utf-8')

        def stamp(m):
            head, url, tail = m.groups()
            if url.startswith(SKIP) or '?' in url:
                return m.group(0)
            return head + url + '?v=' + version + tail

        new = REF.sub(stamp, text)
        if new != text:
            page.write_text(new, encoding='utf-8')
            print('stamped', page.relative_to(root))
        else:
            print('already stamped', page.relative_to(root))
    return pages


if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    site, ver = pathlib.Path(sys.argv[1]), re.sub(r'[^A-Za-z0-9._-]', '', sys.argv[2])[:16]
    if not ver:
        sys.exit('empty version')
    if not bust(site, ver):
        sys.exit('no html pages under ' + str(site))
