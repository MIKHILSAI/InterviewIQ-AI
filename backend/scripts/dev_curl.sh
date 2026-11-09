#!/usr/bin/env bash
# Quick curl pipeline testing InterviewIQ AI backend with AUTH_DISABLED=true

BASE_URL="${API_URL:-http://localhost:8000}"
echo "=================================================="
echo " InterviewIQ AI — Local API Development Flow"
echo " Target API: $BASE_URL"
echo "=================================================="

# Check ffmpeg and create a dummy WAV file if none exists
SAMPLE_AUDIO="/tmp/sample_interview_answer.wav"
if [ ! -f "$SAMPLE_AUDIO" ]; then
  echo "Generating 3-second test WAV audio..."
  ffmpeg -f lavfi -i "sine=frequency=1000:duration=3" -ar 16000 -ac 1 "$SAMPLE_AUDIO" -y > /dev/null 2>&1
fi

echo ""
echo "1. Health Check:"
curl -s "$BASE_URL/api/health" | jq .

echo ""
echo "2. Starting Mock Interview Session (Technical, 5 min, en):"
START_RESP=$(curl -s -X POST "$BASE_URL/api/sessions" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "technical",
    "domain": "React & Web Architecture",
    "difficulty": "intermediate",
    "durationMin": 5,
    "language": "en"
  }')

echo "$START_RESP" | jq .

SESSION_ID=$(echo "$START_RESP" | jq -r '.sessionId')
QUESTION_ID=$(echo "$START_RESP" | jq -r '.firstQuestion.id')
echo "Session ID: $SESSION_ID"
echo "Question ID: $QUESTION_ID"

if [ "$SESSION_ID" == "null" ] || [ -z "$SESSION_ID" ]; then
  echo "Failed to start session."
  exit 1
fi

echo ""
echo "3. Submitting Answer to Question $QUESTION_ID:"
ANSWER_RESP=$(curl -s -X POST "$BASE_URL/api/sessions/$SESSION_ID/answer" \
  -F "questionId=$QUESTION_ID" \
  -F "audio=@$SAMPLE_AUDIO;type=audio/wav")

echo "$ANSWER_RESP" | jq .

echo ""
echo "4. Ending Interview Session:"
curl -s -X POST "$BASE_URL/api/sessions/$SESSION_ID/end" | jq .

echo ""
echo "5. Fetching Final Performance Report:"
curl -s "$BASE_URL/api/sessions/$SESSION_ID/report" | jq .

echo ""
echo "6. Checking Dashboard Stats:"
curl -s "$BASE_URL/api/stats" | jq .

echo ""
echo "Done!"
