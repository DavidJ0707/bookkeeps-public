import requests
import logging
from config import Config

logger = logging.getLogger(__name__)

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"
GOOGLE_BOOKS_API_KEY = Config.GOOGLE_BOOKS_API_KEY

def fetch_books(query, start_index=0, max_results=40):
    """Fetch books from the Google Books API given a query."""
    params = {
        'q': query,
        'printType': 'books',
        'orderBy': 'newest',
        'maxResults': max_results,
        'startIndex': start_index,
        'key': GOOGLE_BOOKS_API_KEY,
    }
    try:
        response = requests.get(GOOGLE_BOOKS_API_URL, params=params)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error: {http_err}")
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Request error: {req_err}")
    return None

def get_popular_books_from_google_books(max_results=500):
    """Retrieve popular books (e.g. bestsellers) from the Google Books API."""
    books = []
    total_fetched = 0
    max_allowed = 500  # Or any other limit you wish to enforce
    while total_fetched < max_results and total_fetched < max_allowed:
        params = {
            'q': 'bestseller',
            'orderBy': 'newest',
            'printType': 'books',
            'startIndex': total_fetched,
            'maxResults': min(40, max_results - total_fetched),
            'key': GOOGLE_BOOKS_API_KEY
        }
        response = requests.get(GOOGLE_BOOKS_API_URL, params=params)
        if response.status_code != 200:
            logger.error(f"Failed to fetch books: {response.status_code}")
            break
        data = response.json()
        items = data.get('items', [])
        if not items:
            break
        books.extend(items)
        total_fetched += len(items)
    return books
