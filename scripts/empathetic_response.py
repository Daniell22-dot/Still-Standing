import sys
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables from backend/.env
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

def generate_response(user_text):
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return {"error": "GEMINI_API_KEY not found in .env"}

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        You are an empathetic, supportive, and non-clinical peer supporter for the 'STILL STANDING' mental health platform.
        The user has shared the following text. Provide a short (2-3 sentences), warm, and encouraging response. 
        Acknowledge their feelings, offer hope, and remind them they are not alone. 
        DO NOT give medical advice.
        
        User Text: {user_text}
        """
        
        response = model.generate_content(prompt)
        return {"response": response.text.strip()}
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text = sys.argv[1]
        result = generate_response(text)
        print(json.dumps(result))
    else:
        print(json.dumps({"error": "No text provided"}))
