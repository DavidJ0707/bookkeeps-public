import requests
import logging
from config import Config

logger = logging.getLogger(__name__)

ENTERPRISE_KNOWLEDGE_GRAPH_API_ENDPOINT = "https://kgsearch.googleapis.com/v1/entities:search"
ENTERPRISE_KNOWLEDGE_GRAPH_API_KEY = Config.ENTERPRISE_KNOWLEDGE_GRAPH_API_KEY

# Simple in-memory cache
author_data_cache = {}

def fetch_author_data_from_kg(author_name):
    """Fetch additional author data from the Knowledge Graph API."""
    if author_name in author_data_cache:
        logger.info(f"Using cached data for {author_name}")
        return author_data_cache[author_name]

    try:
        query = author_name.replace(" ", "+")
        params = {
            'query': query,
            'key': ENTERPRISE_KNOWLEDGE_GRAPH_API_KEY,
            'limit': 1,
            'indent': True,
            'types': 'Person'
        }
        response = requests.get(ENTERPRISE_KNOWLEDGE_GRAPH_API_ENDPOINT, params=params)
        response.raise_for_status()
        data = response.json()
        if data and "itemListElement" in data and data["itemListElement"]:
            result = data["itemListElement"][0].get("result")
            if result:
                name = result.get("name", author_name)
                description = result.get("description", "")
                detailed_description = result.get("detailedDescription", {}).get("articleBody", "")
                biography = detailed_description or description
                image_url = result.get("image", {}).get("contentUrl", "")
                if image_url.startswith('http:'):
                    image_url = image_url.replace('http:', 'https:')
                author_data = {
                    "name": name,
                    "biography": biography,
                    "image": image_url
                }
                author_data_cache[author_name] = author_data
                return author_data
            else:
                logger.warning(f"No valid result for {author_name}")
        else:
            logger.warning(f"No data found for {author_name}")
    except requests.exceptions.HTTPError as http_err:
        logger.error(f"HTTP error: {http_err}")
    except requests.exceptions.RequestException as req_err:
        logger.error(f"Request error: {req_err}")
    return None
