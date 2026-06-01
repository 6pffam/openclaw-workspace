#!/bin/bash
# wiki-search.sh — Search across all wiki pages
# Usage: ./wiki-search.sh <query> [--files-only]
#
# Examples:
#   ./wiki-search.sh nexus
#   ./wiki-search.sh "approval flow"
#   ./wiki-search.sh sim-racing --files-only

WIKI_DIR="$(dirname "$0")/wiki"
QUERY="$1"
MODE="$2"

if [ -z "$QUERY" ]; then
  echo "Usage: ./wiki-search.sh <query> [--files-only]"
  echo ""
  echo "Options:"
  echo "  --files-only   List matching filenames only"
  echo ""
  echo "Examples:"
  echo "  ./wiki-search.sh nexus"
  echo "  ./wiki-search.sh 'approval flow'"
  exit 1
fi

if [ "$MODE" = "--files-only" ]; then
  grep -rl --include="*.md" -i "$QUERY" "$WIKI_DIR"
else
  echo "🔍 Searching wiki for: \"$QUERY\""
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  RESULTS=$(grep -rn --include="*.md" -i "$QUERY" "$WIKI_DIR")
  if [ -z "$RESULTS" ]; then
    echo "No results found for \"$QUERY\""
  else
    # Pretty print: group by file
    echo "$RESULTS" | awk -F: '
    {
      file=$1; line=$2; rest=substr($0, index($0,$3))
      if (file != prev_file) {
        print ""
        print "📄 " file
        prev_file = file
      }
      printf "  L%-4s %s\n", line":", rest
    }'
    echo ""
    MATCH_COUNT=$(echo "$RESULTS" | wc -l | tr -d ' ')
    FILE_COUNT=$(echo "$RESULTS" | cut -d: -f1 | sort -u | wc -l | tr -d ' ')
    echo "  → $MATCH_COUNT match(es) in $FILE_COUNT file(s)"
  fi
fi
