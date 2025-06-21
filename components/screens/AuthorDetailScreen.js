import React, { useState, useContext, useEffect } from 'react';
import { Image, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Button } from 'react-native-paper';
import GradientBackground from '../GradientBackground';
import { UserContext } from '../contexts/UserContext';
import { getBooksByIds } from '../mongoDBService';

/**
 * AuthorDetailScreen
 * Displays detailed info about a specific author, including biography, genres, styles, and upcoming books.
 * Provides a "remove from favorites" feature.
 *
 * @param {object} route - Navigation route containing author data in route.params
 * @param {object} navigation - React Navigation object for screen transitions
 */
const AuthorDetailScreen = ({ route, navigation }) => {
  const { author } = route.params;
  const { favoriteAuthors, updateFavoriteAuthors, favoriteGenres, userId } = useContext(UserContext);
  const [showFullBiography, setShowFullBiography] = useState(false);
  const [upcomingBooks, setUpcomingBooks] = useState([]);

  const maxBiographyLength = 200;
  const placeholderImage = 'https://via.placeholder.com/150?text=No+Image+Available';

  /**
   * Chooses whether to display a truncated or full biography text.
   */
  const biographyToShow = author.biography
    ? showFullBiography || author.biography.length <= maxBiographyLength
      ? author.biography
      : `${author.biography.slice(0, maxBiographyLength)}...`
    : 'Biography not available';

  const shouldShowMore = author.biography && author.biography.length > maxBiographyLength;

  /**
   * Navigates to the Search screen with a preloaded search term and type.
   * @param {string} tag - The text to search for (genre/writing style)
   * @param {string} type - The type of search (e.g., 'genre', 'writingStyle')
   */
  const handleTagPress = (tag, type) => {
    navigation.navigate('Search', { preloadedQuery: tag, searchType: type });
  };

  /**
   * Removes the author from favorites by updating the user's favorite author list in DB and local state.
   */
  const handleRemoveAuthor = async () => {
    const updatedAuthors = favoriteAuthors.filter(a => a._id !== author._id);
    await updateFavoriteAuthors(updatedAuthors.map(a => a._id));
    navigation.goBack();
  };

  if (!author) {
    return (
      <GradientBackground>
        <Text>Author not found.</Text>
      </GradientBackground>
    );
  }
   /**
   * Fetches upcoming books based on the author's `booksWritten` field.
   */
  useEffect(() => {
  const fetchUpcomingBooks = async () => {
    try {
      const bookIds = Array.isArray(author.booksWritten)
        ? author.booksWritten
        : (author.booksWritten ? [author.booksWritten] : []);

      if (bookIds.length > 0) {
        const books = await getBooksByIds(bookIds);
        setUpcomingBooks(books);
      }
    } catch (error) {
      console.error('Error fetching upcoming books:', error);
    }
  };

  fetchUpcomingBooks();
}, [author.booksWritten]);

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <Image
          source={{ uri: author.imageURL || placeholderImage }}
          style={styles.authorImage}
        />

        {/* Clickable Genres */}
        <Text style={styles.sectionTitle}>Genres:</Text>
        <View style={styles.tagContainer}>
          {author.genresWritten && author.genresWritten.map((genre, index) => (
            <TouchableOpacity key={index} style={styles.tag} onPress={() => handleTagPress(genre, 'genre')}>
              <Text style={styles.tagText}>{genre}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Clickable Writing Styles */}
        <Text style={styles.sectionTitle}>Writing Styles:</Text>
        <View style={styles.tagContainer}>
          {author.writingStyle && author.writingStyle.map((style, index) => (
            <TouchableOpacity key={index} style={styles.tag} onPress={() => handleTagPress(style, 'writingStyle')}>
              <Text style={styles.tagText}>{style}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Biography */}
        <Text style={styles.sectionTitle}>Biography:</Text>
        <View style={styles.biographyContainer}>
          <Text style={styles.biographyText}>{biographyToShow}</Text>
          {shouldShowMore && !showFullBiography && (
            <TouchableOpacity onPress={() => setShowFullBiography(true)}>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          )}
          {shouldShowMore && showFullBiography && (
            <TouchableOpacity onPress={() => setShowFullBiography(false)}>
              <Text style={styles.showMoreText}>Show less</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Upcoming Books */}
        <Text style={styles.sectionTitle}>Upcoming Books:</Text>
        {upcomingBooks.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {upcomingBooks.map((book, index) => (
              <TouchableOpacity
                key={index}
                style={styles.bookContainer}
                onPress={() => navigation.navigate('BookDetails', { book })}
              >
                <Image source={{ uri: book.coverImage || placeholderImage }} style={styles.bookCover} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noBooksText}>No upcoming books available.</Text>
        )}

        {/* Remove Author Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            icon="account-remove-outline"
            color="#ff5c5c"
            labelStyle={styles.buttonLabel}
            style={styles.removeButton}
            onPress={handleRemoveAuthor}
          >
            Remove from Favorites
          </Button>
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    alignItems: 'center',
  },
  authorImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 20,
  },
  sectionTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    marginTop: 20,
    marginBottom: 10,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tag: {
    backgroundColor: '#4DB6AC',
    borderRadius: 15,
    paddingHorizontal: 12,
    paddingVertical: 6,
    margin: 4,
  },
  tagText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  biographyContainer: {
    fontFamily: 'Lora_400Regular',
    alignItems: 'center',
    marginBottom: 20,
  },
  biographyText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 10,
  },
  showMoreText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#4DB6AC',
  },
  bookContainer: {
    margin: 10,
  },
  bookCover: {
    width: 100,
    height: 150,
    borderRadius: 10,
  },
  noBooksText: {
    fontSize: 16,
    color: '#999',
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 20,
    width: '100%',
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  removeButton: {
    width: '100%',
    borderRadius: 30,
    paddingVertical: 8,
    backgroundColor: '#ff5c5c',
  },
  buttonLabel: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#ffffff',
  },
});

export default AuthorDetailScreen;
