import json
import os
import time
import warnings

# Mute the annoying DuckDuckGo rename warnings so the terminal stays clean
warnings.filterwarnings("ignore", category=RuntimeWarning)

from duckduckgo_search import DDGS
from groq import Groq
from enricher import get_verified_footprint

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")

def get_company_news(company_name: str) -> list:
    news_results = []
    try:
        time.sleep(2) # Buffer to stop DuckDuckGo 403 errors
        results = list(DDGS().news(company_name, max_results=3))
        for res in results:
            title = res.get("title", "")
            body = res.get("body", "")
            if company_name.lower() in title.lower() or company_name.lower() in body.lower():
                news_results.append({
                    "title": title,
                    "url": res.get("url", ""),
                    "source": res.get("source", "")
                })
    except Exception:
        # Silently skip news if DuckDuckGo blocks us so it doesn't clutter the screen
        pass
    return news_results

def generate_summary(client: Groq, company_name: str, facts: dict, footprint: dict, news: list) -> str:
    prompt = f"""
    Company: {company_name}
    Registry Facts: {json.dumps(facts)}
    Verified Links: {json.dumps(footprint)}
    Recent News: {json.dumps(news)}
    
    1. Write a concise, one-paragraph executive summary about this company in plain words.
    2. Add a new line at the bottom that says "Risk & Credibility Score: [X]/100" based on the sentiment of the news and verified links. Give a one-sentence reason for the score.
    """
    try:
        chat_completion = client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="openai/gpt-oss-20b", # The currently active 2026 Groq model
            temperature=0.3,
            max_tokens=1024 # Increased token limit for the newer generation models
        )
        return chat_completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"  [-] Groq API error for {company_name}: {e}")
        return "Summary unavailable."

def main():
    if not GROQ_API_KEY:
        print("WAIT! GROQ_API_KEY environment variable is not set!")
        return

    client = Groq(api_key=GROQ_API_KEY)
    input_file = "smoke-companies.jsonl"
    output_file = "v3-submission.jsonl"
    
    print(f"Starting Signalpost V3 Enterprise run...")
    
    with open(input_file, "r", encoding="utf-8") as infile, \
         open(output_file, "w", encoding="utf-8") as outfile:
         
        for line in infile:
            if not line.strip(): continue
            record = json.loads(line)
            company_name = record.get("name") or record.get("company_name")
            if not company_name: continue
            
            print(f"\nProcessing: {company_name}")
            
            print("  -> Verifying web footprint...")
            footprint = get_verified_footprint(company_name, record.get("company_number"))
            record["verified_footprint"] = footprint
            
            print("  -> Fetching relevant news...")
            news = get_company_news(company_name)
            record["recent_news"] = news
            
            print("  -> Generating summary & Risk Score...")
            summary = generate_summary(client, company_name, record, footprint, news)
            record["executive_summary"] = summary
            
            outfile.write(json.dumps(record, ensure_ascii=False) + "\n")
            time.sleep(2) # Buffer between companies
            
    print(f"\nSuccess! Output saved to {output_file}")

if __name__ == "__main__":
    main()