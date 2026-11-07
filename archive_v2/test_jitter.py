import time
import io
from unittest.mock import patch
from urllib.error import HTTPError
from src.norway_company_agent.http import fetch_json

# Create a fake 429 "Too Many Requests" response
fake_429 = HTTPError(
    url="http://fake-server.com", 
    code=429, 
    msg="Too Many Requests", 
    hdrs={}, 
    fp=io.BytesIO(b"Rate limited by server")
)

print("Simulating a server throwing 429 errors...")
start = time.time()

# Force your scraper to hit our fake 429 error every time it tries to connect
with patch("urllib.request.urlopen", side_effect=fake_429):
    result = fetch_json("http://fake-server.com", attempts=3)

end = time.time()
print(f"Final Error: {result.error}")
print(f"Total wait time: {end - start:.2f} seconds")