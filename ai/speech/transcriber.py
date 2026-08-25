import os
import queue
import time
import numpy as np
import sounddevice as sd
import site

# Fix for "cublas64_12.dll not found" on Windows
try:
    for sp in site.getsitepackages() + [site.getusersitepackages()]:
        cublas_path = os.path.join(sp, "nvidia", "cublas", "bin")
        cudnn_path = os.path.join(sp, "nvidia", "cudnn", "bin")
        if os.path.exists(cublas_path):
            os.add_dll_directory(cublas_path)
            os.environ["PATH"] = cublas_path + ";" + os.environ.get("PATH", "")
        if os.path.exists(cudnn_path):
            os.add_dll_directory(cudnn_path)
            os.environ["PATH"] = cudnn_path + ";" + os.environ.get("PATH", "")
except Exception:
    pass

from faster_whisper import WhisperModel

# Use a mirror if needed
os.environ["HF_ENDPOINT"] = "https://hf-mirror.com"

class Transcriber:
    def __init__(self, model_size="medium"):
        """
        Initializes the Transcriber for push-to-talk.
        """
        self.sample_rate = 16000
        self.model_size = model_size

        # Load the model on the 3080ti GPU with float16 precision for blazing fast speed
        self.model = WhisperModel(model_size, device="cuda", compute_type="float16")

        self.audio_data = []
        self.is_recording = False
        self.stream = None

    def _audio_callback(self, indata, frames, time_info, status):
        """This is called (from a separate thread) for each audio block."""
        if self.is_recording:
            # Flatten and append to our master list
            self.audio_data.extend(indata.copy().flatten())

    def start_listening(self):
        """Starts recording audio from the microphone."""
        if self.is_recording:
            return
            
        self.audio_data = []
        self.is_recording = True
        
        self.stream = sd.InputStream(
            samplerate=self.sample_rate,
            channels=1,
            dtype='float32',
            callback=self._audio_callback
        )
        self.stream.start()

    def stop_listening(self):
        """Stops recording, processes all captured audio, and returns (language, text, translated_text)."""
        if not self.is_recording:
            return None, "", ""

        self.is_recording = False
        if self.stream:
            self.stream.stop()
            self.stream.close()
            self.stream = None

        if not self.audio_data:
            return None, "", ""

        # Convert the captured audio list into a numpy array
        audio_array = np.array(self.audio_data, dtype=np.float32)

        try:
            # Transcribe the entire audio clip at once.
            # CRITICAL: We MUST use vad_filter=True so it strips out the silence
            
            # Run 1: Get the native transcription (original language script)
            segments, info = self.model.transcribe(
                audio_array,
                beam_size=5,
                vad_filter=True,
                condition_on_previous_text=False
            )

            full_text = " ".join([segment.text.strip() for segment in segments if segment.text.strip()])

            return info.language, full_text, ""

        except Exception as e:
            return "error", f"Transcription failed: {str(e)}", ""
