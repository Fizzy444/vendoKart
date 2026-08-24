from flask import Flask, render_template, jsonify
from transcriber import Transcriber

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
        print("Initializing Transcriber model...")
        transcriber = Transcriber(model_size="medium")
    
    if not transcriber.is_recording:
        transcriber.start_listening()
    return {"status": "started"}

@app.route("/stop", methods=["POST"])
def stop_mic():
    global transcriber
    if transcriber and transcriber.is_recording:
        # stop_listening() blocks until transcription is complete
        language, text = transcriber.stop_listening()
        return jsonify({"language": language, "text": text})
        
    return jsonify({"language": None, "text": ""})

if __name__ == "__main__":
    print("Web UI running at http://127.0.0.1:5000")
    # Run the Flask server
    app.run(host="127.0.0.1", port=5000, threaded=True, debug=True)
