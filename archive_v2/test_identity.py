from src.norway_company_agent.identity import assess_website_identity

mock_profile = {
    "name": "Tiny Subsidiary AS",
    "evidence": {
        "website": {
            "value": {
                "final_url": "https://megacorp.com/",
                "title": "MegaCorp Global Home",
                "main_text_excerpt": "Welcome to MegaCorp. We do everything."
            }
        }
    }
}

result = assess_website_identity(mock_profile)
print(f"Status: {result['status']}")
print(f"Score: {result['score']}")
print(f"Reason: {result['reasons'][0]}")