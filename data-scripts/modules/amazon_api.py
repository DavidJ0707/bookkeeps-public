import logging
from paapi5_python_sdk.api.default_api import DefaultApi
from paapi5_python_sdk.models import SearchItemsRequest
from paapi5_python_sdk.rest import ApiException
from paapi5_python_sdk import ApiClient
from datetime import datetime
from config import Config

logger = logging.getLogger(__name__)

AMAZON_ACCESS_KEY = Config.AMAZON_ACCESS_KEY
AMAZON_SECRET_KEY = Config.AMAZON_SECRET_KEY
AMAZON_PARTNER_TAG = Config.AMAZON_PARTNER_TAG
AMAZON_HOST = Config.AMAZON_HOST
AMAZON_REGION = Config.AMAZON_REGION

def search_book_by_isbn(isbn):
    """Use Amazon’s PA-API to search for a book by ISBN."""
    api_client = ApiClient(
        AMAZON_ACCESS_KEY,
        AMAZON_SECRET_KEY,
        AMAZON_HOST,
        AMAZON_REGION
    )
    api_instance = DefaultApi(api_client=api_client)
    request = SearchItemsRequest(
        partner_tag=AMAZON_PARTNER_TAG,
        partner_type="Associates",
        keywords=isbn,
        search_index="Books",
        resources=[
            "ItemInfo.Title",
            "ItemInfo.ByLineInfo",
            "ItemInfo.ContentInfo",
            "ItemInfo.ProductInfo",
            "Images.Primary.Large",
            "BrowseNodeInfo.BrowseNodes",
            "Offers.Listings.Price",
        ],
        marketplace="www.amazon.com",
        item_page=1
    )
    try:
        response = api_instance.search_items(request)
        if response.search_result and response.search_result.items:
            item_dict = response.search_result.items[0].to_dict()
            return item_dict
        else:
            logger.info("No items found for ISBN: %s", isbn)
            return None
    except ApiException as e:
        logger.error("PA-API Error: %s", str(e))
        return None

def extract_data_from_item(item):
    """Extract relevant data (affiliate link, keywords, cover image, etc.) from an Amazon item."""
    updated_data = {}

    detail_page_url = item.get('detail_page_url')
    if detail_page_url:
        updated_data['amazonAffiliateLink'] = detail_page_url

    browse_nodes = item.get('browse_node_info', {}).get('browse_nodes', [])
    raw_keywords = []
    for node in browse_nodes:
        for key in ['display_name', 'context_free_name']:
            if node.get(key):
                raw_keywords.append(node.get(key).lower())

    def is_valid_keyword(kw):
        if "genre fiction" in kw:
            return False
        if "_" in kw and any(char.isdigit() for char in kw):
            return False
        return True

    filtered_keywords = list(set(filter(is_valid_keyword, raw_keywords)))
    if filtered_keywords:
        updated_data['keywords'] = filtered_keywords

    images = item.get('images', {})
    primary_image = images.get('primary', {})
    large_image = primary_image.get('large', {})
    if 'url' in large_image:
        updated_data['coverImage'] = large_image['url']

    item_info = item.get('item_info', {})
    content_info = item_info.get('content_info', {})
    pages_count_info = content_info.get('pages_count')
    if pages_count_info:
        pages_count = pages_count_info.get('display_value')
        if pages_count:
            updated_data['pagecount'] = pages_count

    publication_date_info = content_info.get('publication_date')
    publication_date_str = None
    if publication_date_info and 'display_value' in publication_date_info:
        publication_date_str = publication_date_info['display_value']

    if publication_date_str:
        try:
            pub_date = datetime.fromisoformat(publication_date_str.replace('Z', '+00:00'))
            updated_data['publishedDate'] = pub_date
        except ValueError:
            updated_data['publishedDate'] = publication_date_str

    by_line_info = item_info.get('by_line_info', {})
    manufacturer_info = by_line_info.get('manufacturer')
    if manufacturer_info and 'display_value' in manufacturer_info:
        updated_data['publisher'] = manufacturer_info['display_value']
    return updated_data
