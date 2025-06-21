import logging
import re
from modules.google_api import get_popular_books_from_google_books
from modules.kg_api import fetch_author_data_from_kg
from modules.db_utils import get_authors_collection
from modules.nlp_utils import extract_attributes

logger = logging.getLogger(__name__)

def extract_authors_from_books(books):
    """Extract a set of unique authors from a list of book entries."""
    authors = set()
    for book in books:
        volume_info = book.get('volumeInfo', {})
        for author in volume_info.get('authors', []):
            authors.add(author.strip().title())
    return list(authors)

def infer_genres_from_biography(biography, genre_keywords):
    """Infer genres based on keywords found in the biography."""
    inferred = []
    for genre, keywords in genre_keywords.items():
        for keyword in keywords:
            if re.search(rf'\b{keyword}\b', biography, re.IGNORECASE):
                inferred.append(genre)
                break
    return list(set(inferred))

def assign_attributes_to_author(author_data, genre_keywords):
    """Add NLP-derived attributes to the author record."""
    biography = author_data.get("biography", "")
    if not biography:
        logger.warning(f"No biography for {author_data.get('name')}")
        return author_data
    extracted_themes, extracted_styles, extracted_tones = extract_attributes(biography)
    inferred_genres = infer_genres_from_biography(biography, genre_keywords)
    author_data["themes"] = extracted_themes
    author_data["writingStyle"] = extracted_styles
    author_data["tone"] = extracted_tones
    author_data["genresWritten"] = inferred_genres
    return author_data

def update_author_in_database(author_data):
    authors_coll = get_authors_collection()
    author_name = author_data.get("name")
    if not author_name:
        logger.error("Author name is missing.")
        return
    existing = authors_coll.find_one({"name": author_name})
    if existing:
        update_fields = {
            "biography": author_data.get("biography", existing.get("biography")),
            "imageURL": author_data.get("image", existing.get("imageURL")),
            "genresWritten": list(set(existing.get("genresWritten", []) + author_data.get("genresWritten", []))),
            "themes": list(set(existing.get("themes", []) + author_data.get("themes", []))),
            "writingStyle": list(set(existing.get("writingStyle", []) + author_data.get("writingStyle", []))),
            "tone": list(set(existing.get("tone", []) + author_data.get("tone", []))),
        }
        authors_coll.update_one({"_id": existing["_id"]}, {"$set": update_fields})
    else:
        authors_coll.insert_one(author_data)

def add_popular_authors_logic():
    """Fetch popular books, extract authors, and update the authors collection."""
    from config import GENRE_KEYWORDS
    books = get_popular_books_from_google_books(max_results=500)
    if not books:
        logger.warning("No books fetched.")
        return
    author_names = extract_authors_from_books(books)
    author_names = list(set(author_names))
    for author_name in author_names:
        author_data = fetch_author_data_from_kg(author_name)
        if not author_data:
            logger.warning(f"Could not fetch data for {author_name}")
            continue
        author_data = assign_attributes_to_author(author_data, GENRE_KEYWORDS)
        update_author_in_database(author_data)
