"""
Whisper.cpp Flask API for Japanese transcription
LearnJoy Japanese Listening Platform
"""

import json
import os
import subprocess
import tempfile
import uuid
import requests
import ssl
import urllib.request
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Configuration
WHISPER_PATH = "/app/whisper.cpp"
WHISPER_BIN = f"{WHISPER_PATH}/build/bin/whisper-cli"
MODEL_PATH = f"{WHISPER_PATH}/models/ggml-medium.bin"
UPLOAD_DIR = "/uploads"
WHISPER_LANGUAGE = os.environ.get("WHISPER_LANGUAGE", "ja")

def download_file(url: str, dest_path: str) -> bool:
    """Download file from URL to destination path"""
    try:
        print(f"Downloading from URL: {url}")
        print(f"Destination: {dest_path}")
        
        # Use requests library for better handling
        response = requests.get(url, stream=True, timeout=120, verify=True)
        response.raise_for_status()
        
        with open(dest_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
        
        file_size = os.path.getsize(dest_path)
        print(f"Downloaded successfully: {file_size} bytes")
        return True
    except requests.exceptions.SSLError as e:
        print(f"SSL Error downloading file: {e}")
        # Try without SSL verification as fallback
        try:
            print("Retrying without SSL verification...")
            response = requests.get(url, stream=True, timeout=120, verify=False)
            response.raise_for_status()
            with open(dest_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            file_size = os.path.getsize(dest_path)
            print(f"Downloaded successfully (no SSL): {file_size} bytes")
            return True
        except Exception as e2:
            print(f"Fallback download also failed: {e2}")
            return False
    except Exception as e:
        print(f"Error downloading file: {type(e).__name__}: {e}")
        return False

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
        print(f"Starting transcription for: {audio_path}")
        
        # Create temp WAV file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp_wav:
            wav_path = tmp_wav.name

        # Convert to WAV
        print(f"Converting to WAV: {wav_path}")
        if not convert_to_wav(audio_path, wav_path):
            return {"error": "Failed to convert audio to WAV format"}

        # Check file size
        wav_size = os.path.getsize(wav_path)
        print(f"WAV file size: {wav_size} bytes")

        # Create temp output file for JSON
        output_prefix = tempfile.mktemp()
        output_json = f"{output_prefix}.json"

        # Run whisper.cpp
        print(f"Running whisper-cli...")
        cmd = [
            WHISPER_BIN,
            "-m", MODEL_PATH,
            "-l", WHISPER_LANGUAGE,
            "-f", wav_path,
            "-oj",  # Output JSON
            "-of", output_prefix,  # Output file prefix (without extension)
        ]
        
        print(f"Command: {' '.join(cmd)}")

        result = subprocess.run(cmd, capture_output=True, timeout=600)
        
        # Decode output safely
        stdout_text = result.stdout.decode('utf-8', errors='replace') if result.stdout else ''
        stderr_text = result.stderr.decode('utf-8', errors='replace') if result.stderr else ''
        
        print(f"Whisper return code: {result.returncode}")
        if stderr_text:
            print(f"Whisper stderr: {stderr_text[:500]}")

        if result.returncode != 0:
            # Clean up temp file on error
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            return {"error": f"Whisper transcription failed: {stderr_text}"}

        # Read JSON output
        print(f"Looking for output JSON: {output_json}")
        if os.path.exists(output_json):
            print(f"Found JSON output, reading...")
            with open(output_json, 'r', encoding='utf-8', errors='replace') as f:
                whisper_output = json.load(f)
            
            # Extract transcript text
            transcript = whisper_output.get("transcription", [])
            full_text = " ".join([seg.get("text", "").strip() for seg in transcript])
            
            print(f"Transcript length: {len(full_text)} chars")
            
            # Clean up temp files
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            if os.path.exists(output_json):
                os.unlink(output_json)
            
            return {
                "transcript": full_text,
                "segments": transcript,
                "language": WHISPER_LANGUAGE
            }
        else:
            # Fallback: read from stdout
            print(f"No JSON output found, using stdout")
            if os.path.exists(wav_path):
                os.unlink(wav_path)
            return {
                "transcript": stdout_text.strip(),
                "segments": [],
                "language": WHISPER_LANGUAGE
            }

    except subprocess.TimeoutExpired:
        return {"error": "Transcription timed out (max 10 minutes)"}
    except Exception as e:
        print(f"Transcription error: {type(e).__name__}: {e}")
        import traceback
        traceback.print_exc()
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
            
            # Check if it's a URL (http/https)
            if file_path.startswith("http://") or file_path.startswith("https://"):
                # Download file from URL first
                file_ext = os.path.splitext(file_path.split("?")[0])[1] or ".mp3"
                temp_path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}{file_ext}")
                
                if not download_file(file_path, temp_path):
                    return jsonify({"error": f"Failed to download file from URL: {file_path}"}), 500
                
                # Transcribe downloaded file
                result = transcribe_audio(temp_path)
                
                # Clean up downloaded file
                if os.path.exists(temp_path):
                    os.unlink(temp_path)
                
                if "error" in result:
                    return jsonify(result), 500
                return jsonify(result), 200
            
            # Handle local file paths
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
