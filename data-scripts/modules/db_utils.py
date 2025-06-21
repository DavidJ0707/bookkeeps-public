from pymongo import MongoClient
from pymongo.server_api import ServerApi
import logging
from config import Config

logger = logging.getLogger(__name__)

MONGO_URI = Config.MONGO_URI
DATABASE_NAME = Config.DATABASE_NAME

client = MongoClient(MONGO_URI, server_api=ServerApi('1'))
db = client[DATABASE_NAME]

def get_books_collection():
    return db["Books"]

def get_authors_collection():
    return db["authors"]

def delete_book_by_id(book_id):
    books_coll = get_books_collection()
    result = books_coll.delete_one({"_id": book_id})
    return result.deleted_count > 0

def update_book(book_data, query):
    books_coll = get_books_collection()
    result = books_coll.update_one(query, {"$set": book_data}, upsert=True)
    return result

def get_events_collection():
    return db["events"]