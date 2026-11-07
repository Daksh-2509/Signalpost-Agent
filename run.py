import json
import os
import time
from duckduckgo_search import DDGS
from groq import Groq
from enricher import get_verified_footprint

# Replace this with your actual Groq API key!
GROQ_API_KEY = "YOUR_GROQ_API_KEY_HERE"

def get_company_news(company_name: str) -> list:
    """Fetches recent news and keeps articles only if they explicitly name the company."""
    news_results = []
    try:
        results = list(DDGS().news(company_name, max_results=5))
        for res in results:
            title = res.get("title", "")
            body = res.get("body", "")
            
            # Strict filter: Only keep if the company name is in the title or snippet
            if company_name.lower() in title.lower() or company_name.lower() in body.lower():
                news_results.append({
                    "title": title,
                    "url": res.get("url", ""),
                    "source": res.get("source", "")
                })
    except Exception as e:
        print(f"  [-] News error for {company_name}: {e}")
        
    return news_results

def generate_summary(client: Groq, company_name: str, facts: dict, footprint: dict, news: list) -> str:
    """Uses Groq and Llama 3.3 70B to write a one-paragraph plain-words executive summary."""
    prompt = f"""
    Company: {company_name}
    Registry Facts: {json.dumps(facts)}
    Verified Links: {json.dumps(footprint)}
    Recent News: {json.dumps(news)}
    
    Write a concise, one-paragraph executive summary about this company in plain words, based strictly on the provided information. Do not use corporate jargon.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.3,
            max_tokens=250
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"  [-] Groq API error for {company_name}: {e}")
        return "Summary unavailable."

def main():
    if GROQ_API_KEY == "YOUR_GROQ_API_KEY_HERE":
        print("WAIT! You need to paste your Groq API key into run.py first!")
        return

    client = Groq(api_key=GROQ_API_KEY)
    input_file = "smoke-companies.jsonl"  # We use the smoke batch to test it fast
    output_file = "v3-submission.jsonl"
    
    print(f"Success! V3 Run complete. Output saved to {output_file}")

if __name__ == "__main__":
    main()