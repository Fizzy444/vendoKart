from flask import Flask, render_template, jsonify
from transcriber import Transcriber
import subprocess
import os
import sys
app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True

# Global transcriber instance
transcriber = None

@app.route("/")
def index():
    return render_template("app.html")

@app.route("/start", methods=["POST"])
def start_mic():
    global transcriber
    if not transcriber:
        print("Initializing Transcriber model (medium)...")
        transcriber = Transcriber(model_size="medium")
    
    if not transcriber.is_recording:
        transcriber.start_listening()
    return {"status": "started"}

@app.route("/stop", methods=["POST"])
def stop_mic():
    global transcriber
    if transcriber and transcriber.is_recording:
        # Stop recording and get the result
        result = transcriber.stop_listening()

        try:
            language, text, translated_text = result
        except ValueError:
            language, text = result
            translated_text = ""

        if language and language != 'en' and text and not translated_text:
            try:
                helper_path = os.path.join(os.path.dirname(__file__), 'translator_helper.py')
                proc = subprocess.run([sys.executable, helper_path, text], capture_output=True, text=True, encoding='utf-8')
                translated_text = proc.stdout.strip()
            except Exception as e:
                print(f"Translation error: {e}")
                translated_text = ""

        return jsonify({
            'language': language,
            'text': text,
            'translated_text': translated_text
        })

    return jsonify({"language": None, "text": "", "translated_text": ""})

if __name__ == "__main__":
    print("Web UI running at http://127.0.0.1:5000")
    # Run the Flask server
    app.run(host="127.0.0.1", port=5000, threaded=True, debug=True)
