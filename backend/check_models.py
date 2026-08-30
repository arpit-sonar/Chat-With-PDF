import google.generativeai as genai
import os

api_key = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=api_key)

print("Models available for generateContent:\n" + "-"*40)

for m in genai.list_models():
    if 'generateContent' in m.supported_generation_methods:
        print(m.name)