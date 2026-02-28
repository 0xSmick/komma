#!/bin/bash

# Claude Watcher for Komma
# This script watches for edit requests and streams Claude's thinking/output to the UI

COMMENTS_FILE="/tmp/komma-comments.json"
STATUS_FILE="/tmp/komma-status.json"
STREAM_FILE="/tmp/komma-stream.log"

echo "🔍 Komma Claude Watcher"
echo "   Watching: $COMMENTS_FILE"
echo "   Streaming to: $STREAM_FILE"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Track the last processed request
LAST_ID=""

while true; do
  # Check if comments file exists and has pending content
  if [ -f "$COMMENTS_FILE" ]; then
    STATUS=$(jq -r '.status // empty' "$COMMENTS_FILE" 2>/dev/null)
    REQUEST_ID=$(jq -r '.id // empty' "$COMMENTS_FILE" 2>/dev/null)

    if [ "$STATUS" = "pending" ] && [ "$REQUEST_ID" != "$LAST_ID" ]; then
      LAST_ID="$REQUEST_ID"

      # Extract the prompt
      PROMPT=$(jq -r '.prompt // empty' "$COMMENTS_FILE")
      FILE_PATH=$(jq -r '.filePath // empty' "$COMMENTS_FILE")

      if [ -n "$PROMPT" ]; then
        echo "📝 Processing request $REQUEST_ID"
        echo "   File: $FILE_PATH"
        echo ""

        # Clear stream file
        > "$STREAM_FILE"

        # Header
        cat >> "$STREAM_FILE" << EOF
╔══════════════════════════════════════════════════════════════╗
║  Claude Processing Request                                    ║
╠══════════════════════════════════════════════════════════════╣
║  ID: $REQUEST_ID
║  File: $(basename "$FILE_PATH")
╚══════════════════════════════════════════════════════════════╝

EOF

        # Run claude and capture FULL output including thinking
        # Using unbuffer if available, otherwise script command
        if command -v unbuffer &> /dev/null; then
          # unbuffer preserves terminal output formatting
          unbuffer claude --dangerously-skip-permissions --print "$PROMPT" 2>&1 | while IFS= read -r line; do
            echo "$line" | tee -a "$STREAM_FILE"
          done
          EXIT_CODE=${PIPESTATUS[0]}
        elif command -v script &> /dev/null; then
          # Use script to capture terminal output (macOS syntax)
          script -q "$STREAM_FILE.tmp" claude --dangerously-skip-permissions --print "$PROMPT" 2>&1
          EXIT_CODE=$?
          # Clean up control characters and append
          cat "$STREAM_FILE.tmp" | sed 's/\x1b\[[0-9;]*m//g' >> "$STREAM_FILE"
          rm -f "$STREAM_FILE.tmp"
        else
          # Fallback: direct output (may lose some formatting)
          claude --dangerously-skip-permissions --print "$PROMPT" 2>&1 | tee -a "$STREAM_FILE"
          EXIT_CODE=${PIPESTATUS[0]}
        fi

        # Footer
        cat >> "$STREAM_FILE" << EOF

╔══════════════════════════════════════════════════════════════╗
EOF

        if [ $EXIT_CODE -eq 0 ]; then
          echo "║  ✓ Completed Successfully                                    ║" >> "$STREAM_FILE"
          echo "╚══════════════════════════════════════════════════════════════╝" >> "$STREAM_FILE"

          # Update status file
          jq -n --arg id "$REQUEST_ID" --arg msg "Changes applied successfully" \
            '{id: $id, status: "complete", message: $msg}' > "$STATUS_FILE"
          echo "✓ Request $REQUEST_ID completed"
        else
          echo "║  ✗ Error (exit code: $EXIT_CODE)                              ║" >> "$STREAM_FILE"
          echo "╚══════════════════════════════════════════════════════════════╝" >> "$STREAM_FILE"

          jq -n --arg id "$REQUEST_ID" --arg msg "Claude exited with error code $EXIT_CODE" \
            '{id: $id, status: "error", message: $msg}' > "$STATUS_FILE"
          echo "✗ Request $REQUEST_ID failed"
        fi

        echo ""
      fi
    fi
  fi

  # Check every 500ms
  sleep 0.5
done
