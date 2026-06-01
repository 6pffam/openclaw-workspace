#!/bin/bash
# Reliable restart for the Success app on port 3004
# Kills by port (not by process name which changes under Next.js)
PORT=3004
PID=$(lsof -ti :$PORT -sTCP:LISTEN 2>/dev/null)
if [ -n "$PID" ]; then
  echo "Killing PID $PID on port $PORT"
  kill -9 $PID
  sleep 1
fi
cd "$(dirname "$0")"
nohup /Users/6pf/.openclaw/workspace/success/node_modules/.bin/next start -p $PORT >> /tmp/success.log 2>&1 &
echo "Started PID $! on port $PORT"
sleep 3
lsof -i :$PORT -sTCP:LISTEN 2>/dev/null | awk 'NR>1{print "✅ Live on port '$PORT', PID "$2}'
