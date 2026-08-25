import sys
import io
import os
from groq import Groq

# Force stdout to be utf-8 to prevent charmap encoding errors on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def translate_text(text):
    if not text:
        return ""
        
    try:
        from dotenv import load_dotenv
        # Try to find .env starting from this file's directory up to the root
        env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')
        if os.path.exists(env_path):
            load_dotenv(env_path)
        else:
            load_dotenv()
            
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            return ""
            
        # Initialize Groq client with the provided API key
        client = Groq(api_key=api_key)
        
        # Call Groq API for translation
        completion = client.chat.completions.create(
            model="openai/gpt-oss-20b", 
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert translator. Translate the following text to English. Output ONLY the English translation, with no conversational filler or quotes."
                },
                {
                    "role": "user",
                    "content": text
                }
            ],
            temperature=0.3,
            max_completion_tokens=1024,
            top_p=1,
            stream=False,
            stop=None
        )
        
        # Print the translated text for ui.py to capture
        print(completion.choices[0].message.content.strip())
        
    except Exception as e:
        print("", file=sys.stderr)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        translate_text(input_text)
