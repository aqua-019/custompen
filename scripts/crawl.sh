#!/usr/bin/env bash
# Re-crawl penumbrafoundation.org (Squarespace ?format=json) and rebuild public/data.
# Usage: bash scripts/crawl.sh   (needs curl, python3, beautifulsoup4, lxml)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WORK="${CRAWL_DIR:-/tmp/custompen-crawl}"
mkdir -p "$WORK/json"
curl -sS "https://www.penumbrafoundation.org/sitemap.xml" | grep -o '<loc>[^<]*</loc>' | sed 's/<[^>]*>//g' > "$WORK/urls.txt"
( echo "https://www.penumbrafoundation.org/"; cat "$WORK/urls.txt" ) | sort -u | while read -r u; do
  slug=$(echo "$u" | sed 's#https://www.penumbrafoundation.org/##; s#/#__#g'); [ -z "$slug" ] && slug=home
  echo "curl -sS -m 40 -A 'Mozilla/5.0' '$u?format=json' -o '$WORK/json/$slug.json'"
done | xargs -P 8 -I{} sh -c '{}'
SRC_DIR="$WORK/json" python3 "$ROOT/scripts/extract.py" "$ROOT/public/data"
