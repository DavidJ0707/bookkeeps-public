from flask import Flask
import logging

# Import your blueprint instances from their respective files.
from blueprints.books import books_bp
from blueprints.authors import authors_bp
from blueprints.events import events_bp


def create_app():
    app = Flask(__name__)

    # Load configuration from config.py
    app.config.from_object('config.Config')

    # Optionally configure logging
    logging.basicConfig(level=logging.DEBUG)

    # Register blueprints
    app.register_blueprint(books_bp)  # Book-related routes
    app.register_blueprint(authors_bp)  # Author-related routes
    app.register_blueprint(events_bp) #Event-related routes

    return app