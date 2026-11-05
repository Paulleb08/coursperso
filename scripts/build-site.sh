#!/bin/sh
# Builds the standalone website (_site/) from index.html, which is written as a claude.ai artifact body.
set -e
mkdir -p _site
{
  printf '<!doctype html><html lang="fr"><head><meta charset="utf-8">'
  printf '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
  printf '<link rel="manifest" href="manifest.webmanifest"><meta name="theme-color" content="#2b44a8">'
  printf '<meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-title" content="Prof Perso">'
  printf '<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%%}[hidden]{display:none!important}</style>'
  printf '</head><body>\n'
  cat index.html
  printf '\n</body></html>\n'
} > _site/index.html
cat > _site/manifest.webmanifest <<'JSON'
{ "name": "Prof Perso", "short_name": "Prof Perso", "lang": "fr", "start_url": ".", "display": "standalone",
  "background_color": "#fbfbf6", "theme_color": "#2b44a8" }
JSON
echo "built _site/"
