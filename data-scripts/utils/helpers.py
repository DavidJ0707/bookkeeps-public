from datetime import datetime

def normalize_name(name: str) -> str:
    """Capitalize each part of a name and remove extra spaces."""
    return ' '.join(part.capitalize() for part in name.strip().split())


def parse_date(date_str: str):
    """Parse a date string into a datetime object.

    Supports 'YYYY', 'YYYY-MM', and 'YYYY-MM-DD' formats.
    Returns None if parsing fails.
    """
    try:
        if len(date_str) == 4:
            return datetime.strptime(date_str, "%Y")
        elif len(date_str) == 7:
            return datetime.strptime(date_str, "%Y-%m")
        elif len(date_str) == 10:
            return datetime.strptime(date_str, "%Y-%m-%d")
    except (ValueError, TypeError):
        return None
