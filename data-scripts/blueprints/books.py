from flask import Blueprint, request, jsonify
from bson.objectid import ObjectId
from datetime import datetime, timedelta
import time
import logging

from modules.db_utils import (
    get_books_collection,
    delete_book_by_id,
    update_book,
)
from modules.book_operations import (
    fetch_unreleased_books_logic,
    fetch_custom_books_logic,
    filter_book_data,
    delete_old_books_logic,
    assign_attributes_to_book_and_author,
)
from modules.amazon_api import search_book_by_isbn, extract_data_from_item

books_bp = Blueprint('books_bp', __name__)
logger = logging.getLogger(__name__)


@books_bp.route('/add_book_by_isbn', methods=['POST'])
def add_book_by_isbn():
    """
    Accepts a JSON payload with the following required and optional fields:
      - Required:
          * isbn
          * description
      - Optional (manual overrides):
          * title
          * authors (array)
          * genres (array)
          * mainGenre (string)
          * amazonAffiliateLink
          * pagecount
          * publishedDate
          * publisher
          * subtitle
          * coverImage

    This endpoint builds a book record from the provided JSON payload,
    uses NLP to assign themes, writing styles, and tone, and upserts the record
    into the database (using ISBN as the unique key).
    """
    try:
        data = request.get_json(force=True)
        isbn = data.get('isbn')
        description = data.get('description')

        if not isbn:
            return jsonify({"error": "ISBN is required."}), 400

        if not description:
            return jsonify({"error": "Description is required."}), 400

        # Construct the book record directly from the provided JSON payload.
        book_data = {
            "ISBN": isbn,
            "title": data.get("title"),
            "description": description,
            "authors": data.get("authors", []),
            "publisher": data.get("publisher"),
            "publishedDate": data.get("publishedDate"),
            "pagecount": data.get("pagecount"),
            "coverImage": data.get("coverImage"),
            "amazonAffiliateLink": data.get("amazonAffiliateLink"),
            "subtitle": data.get("subtitle"),
            "genres": data.get("genres", []),
            "mainGenre": data.get("mainGenre"),
            "favoriteCount": data.get("favoriteCount", 0)
        }

        # Use the provided description (and other fields) to automatically
        # determine themes, tone, and writing styles.
        assign_attributes_to_book_and_author(book_data)

        # Upsert the book record using ISBN as the unique identifier.
        books_coll = get_books_collection()
        result = books_coll.update_one(
            {"ISBN": isbn},
            {"$set": book_data},
            upsert=True
        )

        return jsonify({
            "message": "Book added/updated successfully.",
            "ISBN": isbn,
            "matched": result.matched_count,
            "upserted_id": str(result.upserted_id) if result.upserted_id else None
        }), 200

    except Exception as e:
        logger.error(f"Error in add_book_by_isbn: {e}")
        return jsonify({"error": str(e)}), 500


# GET /fetch_unreleased_books
@books_bp.route('/fetch_unreleased_books', methods=['GET'])
def fetch_unreleased_books():
    try:
        # Extract query parameters as needed (e.g., genre)
        genre = request.args.get('genre')
        if not genre:
            return jsonify({"error": "Missing genre parameter."}), 400

        # Call your helper logic function (which contains most of your original code)
        result, count = fetch_unreleased_books_logic(genre)
        return jsonify({"message": "Books processed", "count": count, "result": result}), 200
    except Exception as e:
        logger.error(f"Error in fetch_unreleased_books: {e}")
        return jsonify({"error": str(e)}), 500

# GET /fetch_custom_books
@books_bp.route('/fetch_custom_books', methods=['GET'])
def fetch_custom_books():
    try:
        custom_query = request.args.get('query', '')
        if not custom_query:
            return jsonify({"error": "Missing query parameter."}), 400

        result, count = fetch_custom_books_logic(custom_query)
        return jsonify({"message": f"Processed custom query: {custom_query}", "count": count, "result": result}), 200
    except Exception as e:
        logger.error(f"Error in fetch_custom_books: {e}")
        return jsonify({"error": str(e)}), 500

# GET /books
@books_bp.route('/books', methods=['GET'])
def get_books():
    try:
        books_coll = get_books_collection()
        books = list(books_coll.find())
        for book in books:
            book["_id"] = str(book["_id"])
        return jsonify(books), 200
    except Exception as e:
        logger.error(f"Error in get_books: {e}")
        return jsonify({"error": str(e)}), 500

# GET /books/<book_id>
@books_bp.route('/books/<book_id>', methods=['GET'])
def get_book(book_id):
    try:
        books_coll = get_books_collection()
        book = books_coll.find_one({"_id": ObjectId(book_id)})
        if book:
            book["_id"] = str(book["_id"])
            return jsonify(book), 200
        else:
            return jsonify({"message": "Book not found"}), 404
    except Exception as e:
        logger.error(f"Error in get_book: {e}")
        return jsonify({"error": str(e)}), 500

# DELETE /books/<book_id>
@books_bp.route('/books/<book_id>', methods=['DELETE'])
def delete_book(book_id):
    try:
        result = delete_book_by_id(book_id)
        if result:
            return jsonify({"message": "Book deleted successfully!"}), 200
        else:
            return jsonify({"message": "Book not found"}), 404
    except Exception as e:
        logger.error(f"Error in delete_book: {e}")
        return jsonify({"error": str(e)}), 500

# DELETE /delete_old_books
@books_bp.route('/delete_old_books', methods=['DELETE'])
def delete_old_books():
    try:
        result = delete_old_books_logic()
        return jsonify(result), 200
    except Exception as e:
        logger.error(f"Error in delete_old_books: {e}")
        return jsonify({"error": str(e)}), 500