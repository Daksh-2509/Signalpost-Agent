import re
import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse
from duckduckgo_search import DDGS

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

def verify_page_content(url: str, company_name: str, company_number: str = None) -> bool:
    """Visits the URL and checks if the company name or number is actually on the page."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=8)
        if resp.status_code != 200:
            return False
        
        soup = BeautifulSoup(resp.text, "html.parser")
        text = soup.get_text().lower()
        
        # Clean the name to check for a match (ignoring things like Ltd, LLC)
        clean_name = re.sub(r"[^\w\s]", "", company_name).lower()
        tokens = [t for t in clean_name.split() if t not in ("ltd", "limited", "inc", "corp", "llc", "plc")]
        
        name_match = all(token in text for token in tokens) if tokens else clean_name in text
        number_match = bool(company_number and company_number.lower() in text)
        
        return name_match or number_match
    except Exception:
        return False

def get_verified_footprint(company_name: str, company_number: str = None) -> dict:
    """Searches for the company and returns verified social/web links."""
    footprint = {"website": None, "linkedin": None, "twitter_x": None}
    query = f'"{company_name}" official website OR linkedin'
    
    try:
        results = list(DDGS().text(query, max_results=7))
    except Exception as e:
        print(f"Search error for {company_name}: {e}")
        return footprint

    for res in results:
        url = res.get("href", "")
        domain = urlparse(url).netloc.lower()
        
        # 1. Grab LinkedIn
        if "linkedin.com/company" in url and not footprint["linkedin"]:
            if verify_page_content(url, company_name, company_number):
                footprint["linkedin"] = url
            continue
            
        # 2. Grab Twitter / X
        if ("twitter.com" in domain or "x.com" in domain) and not footprint["twitter_x"]:
            if verify_page_content(url, company_name, company_number):
                footprint["twitter_x"] = url
            continue
            
        # 3. Grab Official Website (Avoid aggregators)
        blacklisted = ["companieshouse.gov.uk", "bloomberg.com", "wikipedia.org", "crunchbase.com", "zoominfo.com"]
        if not footprint["website"] and not any(b in domain for b in blacklisted):
            if verify_page_content(url, company_name, company_number):
                footprint["website"] = url

    return footprint