import sys
import json
import os
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv(os.path.join(os.path.dirname(__file__), '../backend/.env'))

def analyze_text_with_gemini(text):
    api_key = os.getenv("GEMINI_API_KEY")
    
    # Fallback/Local keyword check (Always run for safety)
    crisis_keywords = ['kill myself', 'suicide', 'end it all', 'worthless', 'die', 'hurt myself']
    local_crisis = any(keyword in text.lower() for keyword in crisis_keywords)
    
    if not api_key:
        return {
            "polarity": 0,
            "emotions": ["unknown"],
            "is_crisis": local_crisis,
            "risk_score": 100 if local_crisis else 0,
            "note": "API key missing, using basic keyword check"
        }

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        prompt = f"""
        Analyze the following text for a mental health platform. 
        Provide a JSON response with:
        1. "polarity": float between -1.0 (negative) and 1.0 (positive)
        2. "emotions": list of detected emotions (e.g., ["sadness", "anxiety", "hope"])
        3. "is_crisis": boolean (true if there is immediate risk of self-harm)
        4. "risk_score": integer from 0 to 100 based on distress levels
        
        Text: {text}
        """
        
        response = model.generate_content(prompt)
        # Clean the response to ensure valid JSON
        json_str = response.text.strip().replace('```json', '').replace('```', '')
        result = json.loads(json_str)
        
        # Override if local check caught something the AI missed
        if local_crisis:
            result["is_crisis"] = True
            result["risk_score"] = max(result.get("risk_score", 0), 95)
            
        return result
    except Exception as e:
        return {"error": str(e), "is_crisis": local_crisis, "risk_score": 100 if local_crisis else 0}

if __name__ == "__main__":
    if len(sys.argv) > 1:
        input_text = sys.argv[1]
        analysis = analyze_text_with_gemini(input_text)
        print(json.dumps(analysis))
    else:
        print(json.dumps({"error": "No text provided"}))
