#!/bin/bash
# Whisper transcription script
# Usage: ./transcribe.sh <input_audio> <output_prefix>

INPUT_FILE=$1
OUTPUT_PREFIX=$2
WHISPER_PATH="/app/whisper.cpp"
MODEL="${WHISPER_MODEL:-medium}"
LANGUAGE="${WHISPER_LANGUAGE:-ja}"

if [ -z "$INPUT_FILE" ] || [ -z "$OUTPUT_PREFIX" ]; then
    echo "Usage: ./transcribe.sh <input_audio> <output_prefix>"
    exit 1
fi

# Convert to WAV if needed
TEMP_WAV=$(mktemp --suffix=.wav)
ffmpeg -y -i "$INPUT_FILE" -ar 16000 -ac 1 -c:a pcm_s16le "$TEMP_WAV"

# Run whisper
"$WHISPER_PATH/main" \
    -m "$WHISPER_PATH/models/ggml-${MODEL}.bin" \
    -l "$LANGUAGE" \
    -f "$TEMP_WAV" \
    -oj \
    -of "$OUTPUT_PREFIX"

# Cleanup
rm -f "$TEMP_WAV"

echo "Transcription complete: ${OUTPUT_PREFIX}.json"
