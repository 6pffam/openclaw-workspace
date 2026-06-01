#!/bin/bash
# Install the Universe interlock digest as a launchd job at 08:00 Zurich (Europe/Zurich)
# Runs daily at 08:00 local time (launchd uses local time, so this works for Zurich).

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLIST_PATH="$HOME/Library/LaunchAgents/com.universe.interlock-digest.plist"
LOG_DIR="$HOME/.openclaw/workspace/universe/logs"

mkdir -p "$LOG_DIR"
chmod +x "$SCRIPT_DIR/send-digest.sh"

cat > "$PLIST_PATH" << PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>com.universe.interlock-digest</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>${SCRIPT_DIR}/send-digest.sh</string>
  </array>
  <key>StartCalendarInterval</key>
  <dict>
    <key>Hour</key>
    <integer>8</integer>
    <key>Minute</key>
    <integer>0</integer>
  </dict>
  <key>StandardOutPath</key>
  <string>${LOG_DIR}/digest-stdout.log</string>
  <key>StandardErrorPath</key>
  <string>${LOG_DIR}/digest-stderr.log</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>PATH</key>
    <string>/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin</string>
    <key>TZ</key>
    <string>Europe/Zurich</string>
  </dict>
  <key>RunAtLoad</key>
  <false/>
</dict>
</plist>
PLIST

echo "Installing launchd job at $PLIST_PATH"
launchctl unload "$PLIST_PATH" 2>/dev/null || true
launchctl load "$PLIST_PATH"
echo "✅ Digest cron installed — will run daily at 08:00 Zurich."
echo "   To uninstall: launchctl unload $PLIST_PATH && rm $PLIST_PATH"
echo "   To test now:  bash $SCRIPT_DIR/send-digest.sh"
