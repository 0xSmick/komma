#!/bin/bash

# Chat Watcher for Helm
# Watches for chat messages and runs Claude with document context for conversational replies

CHAT_FILE="/tmp/helm-chat.json"
RESPONSE_FILE="/tmp/helm-chat-response.json"
STREAM_FILE="/tmp/helm-chat-stream.log"

echo "💬 Helm Chat Watcher"
echo "   Watching: $CHAT_FILE"
echo "   Streaming to: $STREAM_FILE"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Track the last processed request
LAST_ID=""

while true; do
  if [ -f "$CHAT_FILE" ]; then
    STATUS=$(jq -r '.status // empty' "$CHAT_FILE" 2>/dev/null)
    REQUEST_ID=$(jq -r '.id // empty' "$CHAT_FILE" 2>/dev/null)

    if [ "$STATUS" = "pending" ] && [ "$REQUEST_ID" != "$LAST_ID" ]; then
      LAST_ID="$REQUEST_ID"

      MESSAGE=$(jq -r '.message // empty' "$CHAT_FILE")
      DOC_PATH=$(jq -r '.document_path // empty' "$CHAT_FILE")
      CONTEXT=$(jq -r '.context_selection // empty' "$CHAT_FILE")
      SESSION_ID=$(jq -r '.session_id // empty' "$CHAT_FILE")

      # Build conversation history
      HISTORY=$(jq -r '.history[]? | "\(.role): \(.content)"' "$CHAT_FILE" 2>/dev/null)

      if [ -n "$MESSAGE" ]; then
        echo "💬 Processing chat $REQUEST_ID"
        echo "   Document: $DOC_PATH"
        echo ""

        # Clear stream file
        > "$STREAM_FILE"

        # Build the prompt
        PROMPT="You are a helpful assistant discussing a document with the user. "
        PROMPT+="The document is at: $DOC_PATH\n\n"

        # Read document content if available
        if [ -n "$DOC_PATH" ] && [ -f "$DOC_PATH" ]; then
          DOC_CONTENT=$(cat "$DOC_PATH")
          PROMPT+="Document content:\n\`\`\`\n$DOC_CONTENT\n\`\`\`\n\n"
        fi

        # Add context selection if present
        if [ -n "$CONTEXT" ] && [ "$CONTEXT" != "null" ]; then
          PROMPT+="The user has selected this text for context:\n\"\"\"\n$CONTEXT\n\"\"\"\n\n"
        fi

        # Add conversation history
        if [ -n "$HISTORY" ]; then
          PROMPT+="Previous conversation:\n$HISTORY\n\n"
        fi

        PROMPT+="User message: $MESSAGE\n\n"
        PROMPT+="Respond helpfully about the document. Be concise. Do NOT modify the file unless explicitly asked."

        # Header in stream
        cat >> "$STREAM_FILE" << EOF
╔══════════════════════════════════════════════════════════════╗
║  Chat Response                                                ║
╠══════════════════════════════════════════════════════════════╣
║  Document: $(basename "$DOC_PATH")
╚══════════════════════════════════════════════════════════════╝

EOF

        # Run claude
        if command -v unbuffer &> /dev/null; then
          unbuffer claude --dangerously-skip-permissions --print "$PROMPT" 2>&1 | while IFS= read -r line; do
            echo "$line" | tee -a "$STREAM_FILE"
          done
          EXIT_CODE=${PIPESTATUS[0]}
        elif command -v script &> /dev/null; then
          script -q "$STREAM_FILE.tmp" claude --dangerously-skip-permissions --print "$PROMPT" 2>&1
          EXIT_CODE=$?
          cat "$STREAM_FILE.tmp" | sed 's/\x1b\[[0-9;]*m//g' >> "$STREAM_FILE"
          rm -f "$STREAM_FILE.tmp"
        else
          claude --dangerously-skip-permissions --print "$PROMPT" 2>&1 | tee -a "$STREAM_FILE"
          EXIT_CODE=${PIPESTATUS[0]}
        fi

        # Extract just the response content (last meaningful output)
        RESPONSE_CONTENT=$(cat "$STREAM_FILE" | tail -n +7)

        if [ $EXIT_CODE -eq 0 ]; then
          echo "" >> "$STREAM_FILE"
          echo "✓ Response complete" >> "$STREAM_FILE"

          jq -n \
            --arg id "$REQUEST_ID" \
            --arg sid "$SESSION_ID" \
            --arg content "$RESPONSE_CONTENT" \
            '{id: $id, session_id: ($sid | tonumber), status: "complete", content: $content}' > "$RESPONSE_FILE"

          echo "✓ Chat $REQUEST_ID completed"
        else
          echo "" >> "$STREAM_FILE"
          echo "✗ Error (exit code: $EXIT_CODE)" >> "$STREAM_FILE"

          jq -n \
            --arg id "$REQUEST_ID" \
            --arg sid "$SESSION_ID" \
            --arg msg "Claude exited with error code $EXIT_CODE" \
            '{id: $id, session_id: ($sid | tonumber), status: "error", content: $msg}' > "$RESPONSE_FILE"

          echo "✗ Chat $REQUEST_ID failed"
        fi

        echo ""
      fi
    fi
  fi

  sleep 0.5
done
