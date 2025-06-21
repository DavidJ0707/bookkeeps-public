# blueprints/events_blueprint.py
from flask import Blueprint, jsonify
from modules.eventbrite_utils import fetch_eventbrite_events

events_bp = Blueprint('events_bp', __name__)

@events_bp.route('/import_eventbrite_events', methods=['POST'])
def import_eventbrite_events():
    try:
        imported_events = fetch_eventbrite_events()
        return jsonify({
            "message": "Successfully imported events from Eventbrite.",
            "count": len(imported_events)
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
