from flask import Flask, request, jsonify, send_from_directory, send_file
from deep_translator import GoogleTranslator
from gtts import gTTS
import speech_recognition as sr
import tempfile, os, time, traceback, subprocess

app = Flask(__name__, static_folder='static')

LANGUAGES = {
    "Arabic": "ar",
    "Bengali": "bn",
    "Chinese (Simplified)": "zh-CN",
    "Dutch": "nl",
    "English": "en",
    "French": "fr",
    "German": "de",
    "Hindi": "hi",
    "Indonesian": "id",
    "Italian": "it",
    "Japanese": "ja",
    "Korean": "ko",
    "Nepali": "ne",
    "Portuguese": "pt",
    "Punjabi": "pa",
    "Russian": "ru",
    "Sinhala": "si",
    "Spanish": "es",
    "Swahili": "sw",
    "Tamil": "ta",
    "Turkish": "tr",
    "Urdu": "ur",
}
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/languages')
def get_languages():
    return jsonify({"languages": sorted(LANGUAGES.keys())})

@app.route('/speak', methods=['POST'])
def speak():
    try:
        data        = request.get_json()
        text        = data.get('text', '').strip()
        source_lang = data.get('source_lang', 'English')
        target_lang = data.get('target_lang', 'Urdu')
        src         = LANGUAGES.get(source_lang, 'en')
        tgt         = LANGUAGES.get(target_lang, 'ur')

        if not text:
            return jsonify({"error": "No text provided"}), 400

        translated = GoogleTranslator(source=src, target=tgt).translate(text)
        print("Translated:", translated)

        ts         = int(time.time() * 1000)
        audio_path = os.path.join(tempfile.gettempdir(), f"voice_{ts}.mp3")
        gTTS(text=translated, lang=tgt).save(audio_path)

        safe = translated.replace('\n', '|').replace('\r', '')
        response = send_file(audio_path, mimetype='audio/mpeg')
        response.headers['X-Translated-Text'] = safe.encode('utf-8').decode('latin-1')
        return response

    except Exception as e:
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/transcribe', methods=['POST'])
def transcribe():
    print("=== /transcribe called ===")
    if 'audio' not in request.files:
        print("No audio file in request")
        return jsonify({"error": "No audio file"}), 400

    audio_file = request.files['audio']
    print(f"Received file: {audio_file.filename}, content_type: {audio_file.content_type}")

    tmp_input  = None
    tmp_wav    = None

    try:
        # Save uploaded file
        suffix     = '.webm' if 'webm' in (audio_file.content_type or '') else '.wav'
        tmp_input  = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        audio_file.save(tmp_input.name)
        tmp_input.close()
        print(f"Saved to: {tmp_input.name}")

        # Convert to WAV using ffmpeg if webm
        if suffix == '.webm':
            tmp_wav = tempfile.NamedTemporaryFile(delete=False, suffix='.wav')
            tmp_wav.close()
            print("Converting webm to wav with ffmpeg...")
            result = subprocess.run(
                ['ffmpeg', '-y', '-i', tmp_input.name, '-ar', '16000', '-ac', '1', tmp_wav.name],
                capture_output=True, text=True
            )
            print("ffmpeg stdout:", result.stdout)
            print("ffmpeg stderr:", result.stderr)
            wav_path = tmp_wav.name
        else:
            wav_path = tmp_input.name

        print(f"WAV path: {wav_path}")

        recognizer = sr.Recognizer()
        with sr.AudioFile(wav_path) as source:
            recognizer.adjust_for_ambient_noise(source, duration=0.3)
            audio_data = recognizer.record(source)
            text       = recognizer.recognize_google(audio_data)

        print(f"Recognized: {text}")
        return jsonify({"text": text})

    except sr.UnknownValueError:
        print("Could not understand audio")
        return jsonify({"text": "", "error": "Could not understand. Please speak clearly."})
    except FileNotFoundError:
        print("ffmpeg not found")
        return jsonify({"text": "", "error": "ffmpeg not installed. Install it from https://ffmpeg.org"}), 500
    except Exception as e:
        traceback.print_exc()
        return jsonify({"text": "", "error": str(e)})
    finally:
        if tmp_input and os.path.exists(tmp_input.name):
            os.unlink(tmp_input.name)
        if tmp_wav and os.path.exists(tmp_wav.name):
            os.unlink(tmp_wav.name)

if __name__ == '__main__':
    print("=" * 40)
    print("  Server starting...")
    print("  Open browser: http://localhost:5000")
    print("=" * 40)
    app.run(debug=True, port=5000)