import re
import logging
import time
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

from modules.google_api import fetch_books
from modules.amazon_api import search_book_by_isbn, extract_data_from_item
from modules.nlp_utils import enhanced_genre_inference, assign_attributes_to_book_and_author
from modules.db_utils import get_books_collection

from config import Config

MAX_TITLE_LENGTH = 45

GENRE_KEYWORDS = Config.GENRE_KEYWORDS

def parse_date(date_str):
    if isinstance(date_str, datetime):
        return date_str
    if isinstance(date_str, str):
        try:
            if len(date_str) == 4:
                return datetime.strptime(date_str, "%Y")
            elif len(date_str) == 7:
                return datetime.strptime(date_str, "%Y-%m")
            elif len(date_str) == 10:
                return datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            return None
    return None

def normalize_name(name):
    return ' '.join(part.capitalize() for part in name.strip().split())

def filter_book_data(book):
    volume_info = book.get('volumeInfo', {})
    if not volume_info:
        logger.info("Rejected: missing volumeInfo")
        return None
    title = volume_info.get('title')
    if not title or len(title) > MAX_TITLE_LENGTH:
        logger.info("Rejected: missing title or title too long")
        return None
    authors = volume_info.get('authors', [])
    if not authors or any(author == "To Be Announced" for author in authors):
        logger.info("Rejected: invalid authors")
        return None
    authors = [normalize_name(author) for author in authors]
    if not volume_info.get('publishedDate'):
        logger.info("Rejected: missing published date")
        return None
    description = volume_info.get('description', '')
    if not volume_info.get('categories') and not description:
        logger.info("Rejected: missing category and description")
        return None
    image_links = volume_info.get('imageLinks', {})
    if not image_links or not image_links.get('thumbnail'):
        logger.info("Rejected: missing image")
        return None
    published_date_str = volume_info.get('publishedDate')
    published_date = parse_date(published_date_str)
    if not published_date:
        logger.info("Rejected: invalid published date")
        return None

    description = re.sub(r'\*\*\*.*?\*\*\*', '', description).strip()
    description = re.sub(r'\*\*.*?\*\*', '', description).strip()
    description = re.sub(r'^[A-Z\s]+(?=\b)', '', description).strip()
    if description and not description[0].isupper():
        description = description[0].upper() + description[1:]
    genres = enhanced_genre_inference(
        description,
        volume_info.get('categories', []),
        title,
        volume_info.get('subtitle'),
        authors
    )
    cover_image_url = image_links.get('thumbnail', '')
    if cover_image_url.startswith('http:'):
        cover_image_url = cover_image_url.replace('http:', 'https:')
    filtered_book = {
        "title": title,
        "subtitle": volume_info.get('subtitle'),
        "authors": authors,
        "publisher": volume_info.get('publisher'),
        "publishedDate": published_date,
        "ISBN": None,
        "pagecount": volume_info.get('pageCount'),
        "genres": genres,
        "mainGenre": genres[0] if genres else "Unknown",
        "description": description,
        "coverImage": cover_image_url
    }
    logger.info(filtered_book)
    assign_attributes_to_book_and_author(filtered_book)
    for identifier in volume_info.get('industryIdentifiers', []):
        if identifier['type'] == 'ISBN_13':
            filtered_book['ISBN'] = identifier['identifier']
            break
    return filtered_book

def fetch_unreleased_books_logic(genre):
    total_books_fetched = 0
    max_attempts = 5
    today = datetime.now().date()
    max_index = 40
    inserted_books = []
    books_coll = get_books_collection()

    keyword_list = GENRE_KEYWORDS.get(genre, [])
    logger.info(f"Processing genre: {genre}")
    for keyword in keyword_list:
        keyword_with_year = f"{keyword} 2025"
        start_index = 0
        attempt = 0
        while start_index < max_index:
            if attempt >= max_attempts:
                break
            result = fetch_books(keyword_with_year, start_index)
            books = result.get('items', []) if result else []
            if not books:
                break
            for book in books:
                volume_info = book.get('volumeInfo', {})
                logger.debug(f"Processing book with volume_info: {volume_info}")
                if volume_info.get('language') != 'en':
                    logger.debug("Skipping non-English book")
                    continue

                published_date_str = volume_info.get('publishedDate')
                pub_date = parse_date(published_date_str)
                if isinstance(pub_date, datetime):
                    pub_date = pub_date.date()
                if pub_date is None or pub_date < today:
                    logger.debug(f"Skipping book with old published date: {published_date_str}")
                    continue

                filtered_book = filter_book_data(book)
                if not filtered_book:
                    logger.debug("Book was rejected during filtering")
                    continue

                isbn = filtered_book.get("ISBN")
                title = filtered_book.get("title")
                logger.info(f"Book accepted for further processing: {title} (ISBN: {isbn})")

                if books_coll.find_one({"title": title, "authors": filtered_book.get("authors", [])}):
                    logger.debug("Book already exists in DB by title and authors")
                    continue
                if books_coll.find_one({"ISBN": isbn}):
                    logger.debug("Book already exists in DB by ISBN")
                    continue

                logger.debug("Calling Amazon API for additional data")
                amazon_item = search_book_by_isbn(isbn)
                if not amazon_item:
                    logger.debug("No data returned from Amazon API")
                    continue

                amazon_data = extract_data_from_item(amazon_item)
                filtered_book.update(amazon_data)
                if not amazon_data.get("amazonAffiliateLink"):
                    logger.debug("Amazon data rejected due to missing affiliate link")
                    continue

                if books_coll.find_one({"ISBN": isbn}):
                    filtered_book["favoriteCount"] = books_coll.find_one({"ISBN": isbn}).get("favoriteCount", 0)
                else:
                    filtered_book["favoriteCount"] = 0

                update_result = books_coll.update_one({"ISBN": isbn}, {"$set": filtered_book}, upsert=True)
                logger.info(
                    f"Inserted/updated book: {title} (matched: {update_result.matched_count}, upserted: {update_result.upserted_id})")
                inserted_books.append({
                    "title": title,
                    "isbn": isbn,
                    "authors": filtered_book.get("authors")
                })
                total_books_fetched += 1
            start_index += 40
            attempt += 1
            time.sleep(3)
    return inserted_books, total_books_fetched

def fetch_custom_books_logic(custom_query):
    total_books_fetched = 0
    max_books = 200
    start_index = 0
    batch_size = 40
    today = datetime.now().date()
    inserted_books = []
    books_coll = get_books_collection()
    while total_books_fetched < max_books:
        result = fetch_books(custom_query, start_index, batch_size)
        if not result or 'items' not in result:
            break
        books = result.get('items', [])
        if not books:
            break
        for book in books:
            volume_info = book.get('volumeInfo', {})
            if not volume_info:
                continue
            title = volume_info.get('title')
            if not title:
                continue
            authors = volume_info.get('authors', [])
            if not authors:
                continue
            published_date_str = volume_info.get('publishedDate')
            if not published_date_str:
                continue
            if volume_info.get('language') != 'en':
                continue
            pub_date = parse_date(published_date_str)
            if isinstance(pub_date, datetime):
                pub_date = pub_date.date()
            if pub_date is None or pub_date < today:
                continue
            if not volume_info.get('imageLinks', {}).get('thumbnail'):
                continue
            filtered_book = filter_book_data(book)
            if not filtered_book:
                continue
            isbn = filtered_book.get("ISBN")
            title = filtered_book.get("title")
            authors_list = filtered_book.get("authors")
            if not isbn:
                continue
            if books_coll.find_one({"title": title, "authors": authors_list}):
                continue
            if books_coll.find_one({"ISBN": isbn}):
                continue
            amazon_item = search_book_by_isbn(isbn)
            if not amazon_item:
                continue
            amazon_data = extract_data_from_item(amazon_item)
            filtered_book.update(amazon_data)
            if not filtered_book.get("amazonAffiliateLink"):
                continue
            if books_coll.find_one({"ISBN": isbn}):
                filtered_book["favoriteCount"] = books_coll.find_one({"ISBN": isbn}).get("favoriteCount", 0)
            else:
                filtered_book["favoriteCount"] = 0
            books_coll.update_one({"ISBN": isbn}, {"$set": filtered_book}, upsert=True)
            inserted_books.append({
                "title": filtered_book["title"],
                "isbn": isbn,
                "authors": filtered_book["authors"]
            })
            total_books_fetched += 1
        start_index += batch_size
        if total_books_fetched >= max_books:
            break
        time.sleep(3)
    return inserted_books, total_books_fetched

def delete_old_books_logic():
    from datetime import timedelta
    one_month_ago = datetime.now() - timedelta(days=30)
    books_coll = get_books_collection()
    deleted_books_count = 0
    for book in books_coll.find({"publishedDate": {"$lt": one_month_ago}}):
        book_id = book["_id"]
        books_coll.delete_one({"_id": book_id})
        deleted_books_count += 1
    return {"deleted_books_count": deleted_books_count}
