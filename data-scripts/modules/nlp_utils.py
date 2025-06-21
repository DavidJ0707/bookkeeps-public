import spacy
from spacy.matcher import PhraseMatcher
import re
from collections import defaultdict
import logging
from transformers import pipeline
import nltk
from nltk.corpus import stopwords
from config import Config

logger = logging.getLogger(__name__)

nlp = spacy.load("en_core_web_sm")
sentiment_analysis = pipeline("sentiment-analysis")
nltk.download('stopwords')
stop_words = set(stopwords.words('english'))

GENRE_KEYWORDS = Config.GENRE_KEYWORDS
GENRE_ATTRIBUTES = Config.GENRE_ATTRIBUTES
writing_style_keywords = Config.writing_style_keywords
theme_keywords = Config.theme_keywords


def extract_attributes(text):
    """Extract themes, writing styles, and tone from a block of text."""
    extracted_themes = []
    extracted_writing_styles = []
    extracted_tones = []
    doc = nlp(text.lower())

    theme_matcher = PhraseMatcher(nlp.vocab, attr='LOWER')
    writing_style_matcher = PhraseMatcher(nlp.vocab, attr='LOWER')

    for theme, keywords in theme_keywords.items():
        patterns = [nlp.make_doc(kw.lower()) for kw in keywords]
        theme_matcher.add(theme, patterns)

    for style, keywords in writing_style_keywords.items():
        patterns = [nlp.make_doc(kw.lower()) for kw in keywords]
        writing_style_matcher.add(style, patterns)

    for match_id, start, end in theme_matcher(doc):
        theme = nlp.vocab.strings[match_id]
        extracted_themes.append(theme)

    for match_id, start, end in writing_style_matcher(doc):
        style = nlp.vocab.strings[match_id]
        extracted_writing_styles.append(style)

    extracted_themes = list(set(extracted_themes))
    extracted_writing_styles = list(set(extracted_writing_styles))

    truncated_text = text[:512]
    sentiment_result = sentiment_analysis(truncated_text)
    tone = "Neutral"
    if sentiment_result:
        label = sentiment_result[0]['label']
        tone = "Positive" if label == "POSITIVE" else "Negative" if label == "NEGATIVE" else "Neutral"
    extracted_tones.append(tone)

    return extracted_themes, extracted_writing_styles, extracted_tones


def extract_keywords_with_tfidf(texts, n_keywords=10):
    from sklearn.feature_extraction.text import TfidfVectorizer
    try:
        vectorizer = TfidfVectorizer(max_features=n_keywords, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(texts)
        if not vectorizer.vocabulary_:
            logger.warning("Empty vocabulary.")
            return []
        keywords = vectorizer.get_feature_names_out()
        return keywords
    except Exception as e:
        logger.error(f"TF-IDF extraction error: {e}")
        return []


def enhanced_genre_inference(description, categories, title, subtitle, authors):
    """Infer genres from multiple fields using NLP techniques."""
    genre_frequency = defaultdict(int)
    doc_description = nlp(description)

    for entity in doc_description.ents:
        entity_text = entity.text.lower()
        for genre, keywords in GENRE_KEYWORDS.items():
            if entity_text in keywords:
                genre_frequency[genre] += 1

    keywords = extract_keywords_with_tfidf([description])
    for keyword in keywords:
        for genre, genre_keywords in GENRE_KEYWORDS.items():
            if keyword.lower() in map(str.lower, genre_keywords):
                genre_frequency[genre] += 1

    for genre, keywords in GENRE_KEYWORDS.items():
        for keyword in keywords:
            if re.search(rf'\b{keyword}\b', description, re.IGNORECASE):
                genre_frequency[genre] += 1
            if subtitle and re.search(rf'\b{keyword}\b', subtitle, re.IGNORECASE):
                genre_frequency[genre] += 1

    if not genre_frequency and title:
        for genre, keywords in GENRE_KEYWORDS.items():
            for keyword in keywords:
                if re.search(rf'\b{keyword}\b', title, re.IGNORECASE):
                    genre_frequency[genre] += 1

    # (Optionally) Use authors’ known genres if available from the DB.
    sorted_genres = sorted(genre_frequency, key=genre_frequency.get, reverse=True)
    if "Sports" in sorted_genres and len(sorted_genres) > 1:
        sorted_genres.remove("Sports")
    return sorted_genres if sorted_genres else ["Unknown"]


def assign_attributes_to_book_and_author(book):
    """Assign themes, writing styles, and tone to a book (and update the author as needed)."""
    genre = book.get("mainGenre")
    if not genre:
        logger.warning("No genre found for book.")
        return None
    description = book.get("description", "")
    extracted_themes, extracted_writing_styles, extracted_tones = extract_attributes(description)
    book["themes"] = list(set(extracted_themes + GENRE_ATTRIBUTES.get(genre, {}).get("themes", [])))
    book["writingStyle"] = list(
        set(extracted_writing_styles + GENRE_ATTRIBUTES.get(genre, {}).get("writing_styles", [])))
    book["tone"] = list(set(extracted_tones + GENRE_ATTRIBUTES.get(genre, {}).get("tones", [])))
    return book
