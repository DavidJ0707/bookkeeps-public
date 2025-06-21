from flask import Blueprint, request, jsonify
import logging
from modules.author_operations import add_popular_authors_logic

authors_bp = Blueprint('authors_bp', __name__)
logger = logging.getLogger(__name__)

# POST /add-popular-authors
@authors_bp.route('/add-popular-authors', methods=['POST'])
def add_popular_authors_route():
    try:
        # Call your helper function that fetches popular books,
        # extracts authors, gets additional data from the Knowledge Graph,
        # and upserts them into the database.
        add_popular_authors_logic()
        return jsonify({"status": "success", "message": "Popular authors added successfully."}), 200
    except Exception as e:
        logger.error(f"Error in add_popular_authors_route: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500
