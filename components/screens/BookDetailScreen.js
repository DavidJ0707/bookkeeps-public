import React, { useContext, useState, useEffect } from 'react';
import { View, Image, StyleSheet, ScrollView, TouchableOpacity, Button, Linking, Platform, Alert } from 'react-native';
import { Text } from '@ui-kitten/components';
import { IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { FavoriteBooksContext } from '../contexts/FavoriteBooksContext';
import { UserContext } from '../contexts/UserContext';
import GradientBackground from '../GradientBackground';

/**
 * BookDetailScreen
 * Shows comprehensive details about a single book, including authors, genres, and an option to favorite/unfavorite.
 *
 * @param {object} route - Navigation route with a book object in route.params
 * @param {object} navigation - React Navigation object for screen transitions
 */
const BookDetailScreen = ({ route, navigation }) => {
  const { book } = route.params;
  const { addFavoritedBook, removeFavoritedBookFromState, favoritedBooks } = useContext(FavoriteBooksContext);
  const [isFavorited, setIsFavorited] = useState(false);
  const [debouncing, setDebouncing] = useState(false);
  const { userId } = useContext(UserContext);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  /**
   * Sets the navigation title to the book's title.
   */
  useEffect(() => {
    navigation.setOptions({
      title: book.title,
    });
    console.log(book._id);
  }, [navigation, book.title]);

  /**
   * Checks if this book is already favorited in context state.
   */
  useEffect(() => {
    if (favoritedBooks && Array.isArray(favoritedBooks)) {
      const isFav = favoritedBooks.some(fav => fav._id === book._id);
      setIsFavorited(isFav);
    } else {
      setIsFavorited(false);
    }
  }, [favoritedBooks, book._id]);

  /**
   * Toggles the favorite status of the book.
   */
  const handleFavoriteToggle = async () => {
    if (debouncing) return;
    setDebouncing(true);
    const originalState = isFavorited;
    setIsFavorited(!isFavorited);

    try {
      if (originalState) {
        const favoriteBook = favoritedBooks.find(fav => fav._id === book._id);
        if (favoriteBook) {
          await removeFavoritedBookFromState(favoriteBook.favoritedId);
        }
      } else {
        await addFavoritedBook(userId, book._id);
      }
    } catch (error) {
      console.error('Error toggling favorite status:', error);
      setIsFavorited(originalState); // Revert state if error occurs
    } finally {
      setDebouncing(false);
    }
  };

  /**
   * Formats a date string (YYYY-MM-DD) into a more human-readable format.
   * @param {string} dateString - The raw date string from the book object.
   */
  const formatDate = (dateString) => {
    if (!dateString) return "Invalid Date";
    const [year, month, day] = dateString.split('T')[0].split('-');
    return `${monthNames[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  };

  /**
   * Navigates to the Search screen with a preloaded search query/type.
   */
  const handleTagPress = (tag, type) => {
    navigation.replace('Search', { preloadedQuery: tag, searchType: type });
  };

  /**
   * Opens the book’s Amazon link, trying the Amazon app first, then falling back to a browser.
   */
  const handleBuyOnAmazon = () => {
  if (book.amazonAffiliateLink) {
    const asinMatch = book.amazonAffiliateLink.match(/dp\/([A-Z0-9]{10})/);
    const asin = asinMatch ? asinMatch[1] : null;

    if (!asin) {
      Linking.openURL(book.amazonAffiliateLink).catch((err) => {
        console.error('Error opening Amazon link:', err);
        Alert.alert('Error', 'Unable to open the link');
      });
      return;
    }

    const iosDeepLink = `amzn://dp/${asin}`;
    const androidDeepLink = `com.amazon.mobile.shopping://www.amazon.com/dp/${asin}`;

    const amazonAppLink = Platform.select({
      ios: iosDeepLink,
      android: androidDeepLink,
    });

    Linking.canOpenURL(amazonAppLink)
      .then((supported) => {
        if (supported) {
          Linking.openURL(amazonAppLink).catch((err) => {
            console.error('Error opening Amazon app link:', err);
            Linking.openURL(book.amazonAffiliateLink).catch((err) => {
              console.error('Fallback to browser also failed:', err);
              Alert.alert('Error', 'Unable to open the link');
            });
          });
        } else {
          Linking.openURL(book.amazonAffiliateLink).catch((err) => {
            console.error('Error opening Amazon link in browser:', err);
            Alert.alert('Error', 'Unable to open the link');
          });
        }
      })
      .catch((err) => {
        console.error('Error checking canOpenURL:', err);
        Linking.openURL(book.amazonAffiliateLink).catch((err) => {
          console.error('Error opening Amazon link in browser:', err);
          Alert.alert('Error', 'Unable to open the link');
        });
      });
  } else {
    Alert.alert('No Amazon link available for this book');
  }
};

  const maxDescriptionLength = 200;
  const descriptionToShow = showFullDescription
    ? book.description
    : `${book.description.slice(0, maxDescriptionLength)}...`;

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.imageBackground}>
            {/* Book Cover */}
            {book.coverImage && (
              <Image source={{ uri: book.coverImage }} style={styles.image} />
            )}
            {/* Heart Icon outside the book cover but within the soft background */}
            <IconButton
              icon={isFavorited ? "heart" : "heart-outline"}
              size={30}
              color="red"
              style={styles.heartIcon}
              onPress={handleFavoriteToggle}
            />
          </View>
        </View>
        {book.subtitle && <Text style={styles.subtitle}>{book.subtitle}</Text>}
        <View style={styles.authorContainer}>
          <Text style={styles.authorLabel}>Author: </Text>
          <Text style={styles.author}>
            {book.authors &&
              (book.authors.length > 2
                ? `${book.authors.slice(0, 2).join(', ')}...`
                : book.authors.join(', ')
              )
            }
          </Text>
        </View>


        {/* Displaying Main Genre and Subgenres */}
        <View style={styles.tagContainer}>
          <TouchableOpacity
            style={styles.genreTag}
            onPress={() => handleTagPress(book.mainGenre, 'genre')}
          >
            <Text style={styles.tagText}>{book.mainGenre}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.tagContainer}>
          {book.genres && book.genres.filter(subgenre => subgenre !== book.mainGenre).map((subgenre, index) => (
            <TouchableOpacity
              key={index}
              style={styles.tag}
              onPress={() => handleTagPress(subgenre, 'genre')}
            >
              <Text style={styles.tagText}>{subgenre}</Text>
            </TouchableOpacity>
          ))}
        </View>


        <Text style={styles.releaseDate}>Releasing on {formatDate(book.publishedDate)}</Text>

        {/* Themes and Tones as Tag Bubbles */}
        <View style={styles.tagContainer}>
          {book.themes && book.themes.map((theme, index) => (
            <TouchableOpacity key={index} style={styles.tag} onPress={() => handleTagPress(theme, 'theme')}>
              <Text style={styles.tagText}>{theme}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.descriptionContainer}>
          <Text style={styles.descriptionText}>{descriptionToShow}</Text>
          {!showFullDescription && (
            <TouchableOpacity onPress={() => setShowFullDescription(true)}>
              <Text style={styles.showMoreText}>Show more</Text>
            </TouchableOpacity>
          )}
          {showFullDescription && (
            <TouchableOpacity onPress={() => setShowFullDescription(false)}>
              <Text style={styles.showMoreText}>Show less</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.buyContainer}>
          {book.amazonAffiliateLink && (
            <TouchableOpacity style={styles.amazonButton} onPress={handleBuyOnAmazon}>
              <Icon name="cart-outline" size={24} color="#FFFFFF" style={styles.icon} />
              <Text style={styles.amazonButtonText}>View on Amazon</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  buyContainer: {
    marginBottom: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imageBackground: {
    backgroundColor: 'rgba(240, 240, 240, 0.8)',
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    alignItems: 'center',
  },
  image: {
    width: 128,
    height: 192,
    borderRadius: 10,
  },
  heartIcon: {
    position: 'absolute',
    top: -15,
    right: -20,
    backgroundColor: 'white',
    borderRadius: 50,
    padding: 5,
    borderWidth: 2,
    borderColor: '#4DB6AC',
  },
  icon: {
    marginRight: 8,
  },
  subtitle: {
    fontSize: 18,
    fontStyle: 'italic',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  amazonButton: {
    backgroundColor: '#FF9900',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  amazonButtonText: {
    fontFamily: 'Lora_700Bold',
    color: '#FFFFFF',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  authorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  authorLabel: {
    fontFamily: 'Lora_600Regular',
    fontSize: 18,
    color: '#4a90e2',
  },
  author: {
    fontFamily: 'Lora_600Regular',
    fontSize: 18,
    color: '#4a90e2',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 5,
  },
  tag: {
    backgroundColor: '#4DB6AC',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 8,
    margin: 7,
  },
  genreTag: {
    backgroundColor: '#4DB6AC',
    borderRadius: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 4,
  },
  tagText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 14,
    color: '#ffffff',
  },
  releaseDate: {
    fontFamily: 'Lora_700Bold',
    fontSize: 18,
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  descriptionContainer: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  descriptionText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 16,
    color: '#000000',
    textAlign: 'center',
  },
  showMoreText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#80CBC4',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default BookDetailScreen;
