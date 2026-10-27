#!/usr/bin/env python3
"""Rewrite every absolute URL in the site to point at a new domain.

Usage:
    python scripts/set-domain.py toolbench.pages.dev
    python scripts/set-domain.py https://toolbench.com

The current domain is read from sitemap.xml, so running this twice in a row
works — each run swaps whatever is there now for the new value.
"""

import re
import sys
import pathlib

TARGETS = ['*.html', 'tools/*.html', 'sitemap.xml', 'robots.txt']


def main():
    if len(sys.argv) != 2:
        print(__doc__)
        return 1

    new_host = re.sub(r'^https?://', '', sys.argv[1].strip()).rstrip('/')
    if '/' in new_host:
        print('Error: pass a bare hostname, e.g. toolbench.pages.dev')
        return 1

    root = pathlib.Path(__file__).resolve().parent.parent
    sitemap = root / 'sitemap.xml'
    match = re.search(r'<loc>https?://([^/]+)/', sitemap.read_text(encoding='utf-8'))
    if not match:
        print('Error: could not read the current domain from sitemap.xml')
        return 1

    old_host = match.group(1)
    if old_host == new_host:
        print(f'Already set to {new_host} — nothing to do.')
        return 0

    changed = []
    for pattern in TARGETS:
        for path in root.glob(pattern):
            text = path.read_text(encoding='utf-8')
            if old_host not in text:
                continue
            hits = text.count(old_host)
            path.write_text(text.replace(old_host, new_host), encoding='utf-8')
            changed.append(f'  {path.relative_to(root)}  ({hits} occurrence{"s" if hits > 1 else ""})')

    if not changed:
        print('No files contained the old domain.')
        return 1

    print(f'{old_host}  ->  {new_host}\n')
    print('\n'.join(changed))
    print('\nDone. Remember to also update the contact email in contact.html if the')
    print('domain change implies a new mailbox.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
