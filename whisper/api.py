"""
Whisper.cpp Flask API for Japanese transcription
LearnJoy Japanese Listening Platform
"""

import json
import os
import subprocess
import tempfile
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
WHISPER_PATH = "/app/whisper.cpp"
MODEL_PATH = f"{WHISPER_PATH}/models/ggml-medium.bin"
UPLOAD_DIR = "/uploads"
WHISPER_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "ja")

def convert_to_wav(input_path: str, output_path: str) -> bool:
    """Convert audio file to WAV format (16kHz, mono) required by whisper.cpp"""
    try:
        cmd = [
            "ffmpeg", "-y",
            "-i", input_path,
            "-ar", "16000",
            "-ac", "1",
            "-c:a", "pcm_s16le",
            output_path
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
        return result.returncode == 0
    except Exception as e:
        print(f"Error converting audio: {e}")
        return False

def transcribe_audio(audio_path: str) -> dict:
    """Transcribe audio file using whisper.cpp"""
    try:
        # Create temp WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
            wav_path = tmp_wav.name

        # Convert to WAV
        if not convert_to_wav(audio_path, wav_path):
            return {"error": "Failed to convert audio to WAV format"}

        # Create temp output file for JSON
        output_json = tempfile.mktemp(suffix=".json")

        # Run whisper.cpp
        cmd = [
            f"{WHISPER_PATH}/main",
            "-m", MODEL_PATH,
            "-l", WHISPER_LANGUAGE,
            "-f", wav_path,
            "-oj",  # Output JSON
            "-of", output_json.replace(".json", ""),  # Output file prefix
            "--print-colors", "false",
            "-pp",  # Print progress
        ]

        result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)

        if result.returncode != 0:
            # Clean up temp file on error
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            return {"error": f"Whisper transcription failed: {result.stderr}"}

        # Read JSON output
        if os.path.exists(output_json):
            with open(output_json, 'r', encoding='utf-8') as f:
                whisper_output = json.load(f)
            
            # Extract transcript text
            transcript = whisper_output.get("transcription", [])
            full_text = " ".join([seg.get("text", "").strip() for seg in transcript])
            
            # Clean up temp files
            os.unlink(wav_path)
            os.unlink(output_json)
            
            return {
                "transcript": full_text,
                "segments": transcript,
                "language": WHISPER_LANGUAGE
            }
        else:
            # Fallback: read from stdout
            os.unlink(wav_path)
            return {
                "transcript": result.stdout.strip(),
                "segments": [],
                "language": WHISPER_LANGUAGE
            }

    except subprocess.TimeoutExpired:
        return {"error": "Transcription timed out (max 10 minutes)"}
    except Exception as e:
        return {"error": str(e)}

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    model_exists = os.path.exists(MODEL_PATH)
    return jsonify({
        "status": "healthy" if model_exists else "unhealthy",
        "model_loaded": model_exists,
        "language": WHISPER_LANGUAGE
    }), 200 if model_exists else 503

@app.route("/transcribe", methods=["POST"])
def transcribe():
    """
    Transcribe audio file
    
    Accepts:
    - multipart/form-data with 'audio' file
    - JSON with 'file_path' pointing to existing file in /uploads
    """
    try:
        # Check if file uploaded
        if 'audio' in request.files:
            audio_file = request.files['audio']
            if audio_file.filename == '':
                return jsonify({"error": "No file selected"}), 400
            
            # Save uploaded file
            file_ext = os.path.splitext(audio_file.filename)[1]
            temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{file_ext}")
            audio_file.save(temp_path)
            
            # Transcribe
            result = transcribe_audio(temp_path)
            
            # Clean up uploaded file
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            
            if "error" in result:
                return jsonify(result), 500
            return jsonify(result), 200
        
        # Check if file path provided
        elif request.is_json:
            data = request.get_json()
            file_path = data.get("file_path")
            
            if not file_path:
                return jsonify({"error": "No file_path provided"}), 400
            
            # Handle relative paths from /uploads
            if not file_path.startswith("/"):
                file_path = os.path.join(UPLOAD_DIR, file_path)
            
            if not os.path.exists(file_path):
                return jsonify({"error": f"File not found: {file_path}"}), 404
            
            result = transcribe_audio(file_path)
            
            if "error" in result:
                return jsonify(result), 500
            return jsonify(result), 200
        
        else:
            return jsonify({"error": "No audio file or file_path provided"}), 400
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/info", methods=["GET"])
def info():
    """Get service information"""
    return jsonify({
        "service": "LearnJoy Whisper Transcription",
        "version": "1.0.0",
        "model": "ggml-medium",
        "language": WHISPER_LANGUAGE,
        "supported_formats": ["mp3", "wav", "m4a", "ogg", "flac", "webm"]
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Whisper API starting on port {port}")
    print(f"Model path: {MODEL_PATH}")
    print(f"Language: {WHISPER_LANGUAGE}")
    app.run(host="0.0.0.0", port=port, debug=False)
