import React, { useEffect, useState, useContext } from 'react';
import { SafeAreaView, StyleSheet, View, FlatList, ScrollView } from 'react-native';
import { Calendar, Text, Layout, Button } from '@ui-kitten/components';
import { FavoriteBooksContext } from '../contexts/FavoriteBooksContext';
import { BookListing } from '../bookListing';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';
import GradientBackground from '../GradientBackground';

/**
 * Removes duplicate items based on a specified key field.
 * @param {Array} arr - The array of objects to deduplicate.
 * @param {string} key - The key to use for uniqueness (e.g. "_id").
 * @returns {Array} A new array without duplicate items.
 */
const removeDuplicates = (arr, key) => {
  return [...new Map(arr.map(item => [item[key], item])).values()];
};

/**
 * CalendarScreen
 * Displays a calendar highlighting favorite book release dates and shows books releasing on the selected day.
 */
export const CalendarScreen = () => {
  const navigation = useNavigation();
  const { favoritedBooks } = useContext(FavoriteBooksContext);
  const [date, setDate] = useState(new Date());
  const [filteredBooks, setFilteredBooks] = useState([]);
  const [releaseDates, setReleaseDates] = useState([]);
  const [calendarKey, setCalendarKey] = useState(Date.now());

  const maxDate = new Date(2026, 11, 31);

  /**
   * Formats a date into a friendly string (Month Day, Year).
   * @param {Date} date - The date to format.
   */
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  /**
   * Fetches and deduplicates favorite books, then sets release dates.
   */
  useEffect(() => {
    const fetchFullBookDetails = async () => {
      try {
        const uniqueFullBooks = removeDuplicates(favoritedBooks, '_id');
        const releaseDatesSet = new Set(
          uniqueFullBooks
            .filter(book => book.publishedDate)
            .map(book => new Date(book.publishedDate).toISOString().split('T')[0])
        );
        setReleaseDates([...releaseDatesSet]);
        filterBooksByDate(date, uniqueFullBooks);
        setCalendarKey(Date.now());
      } catch (error) {
        console.error("Error fetching full book details:", error);
      }
    };

    fetchFullBookDetails();
  }, [date, favoritedBooks]);

  /**
   * Filters favorited books to those releasing on the selected date.
   * @param {Date} selectedDate - The currently selected date.
   * @param {Array} books - Array of favorited books to check.
   */
  const filterBooksByDate = (selectedDate, books) => {
    const selectedDateString = selectedDate.toISOString().split('T')[0];

    const filtered = books.filter(book => {
      try {
        if (!book.publishedDate) return false;
        const bookReleaseDate = new Date(book.publishedDate).toISOString().split('T')[0];
        return bookReleaseDate === selectedDateString;
      } catch (e) {
        console.error(`Error processing date for book: ${JSON.stringify(book)}`, e);
        return false;
      }
    });

    setFilteredBooks(filtered);
  };

  /**
   * Opens a search screen with the selected date if no books are found.
   */
  const handleSearchByDate = () => {
    const selectedDateString = date.toISOString().split('T')[0];
    navigation.navigate('Search', { preloadedQuery: selectedDateString, searchType: 'date' });
  };

  /**
   * Renders each day of the calendar. If there's a release on that day, show a book icon.
   */
  const renderDay = ({ date, view }) => {
    const dateString = date.toISOString().split('T')[0];
    const isReleaseDate = releaseDates.includes(dateString);

    return (
      <Layout style={styles.dayContainer}>
        <Text style={[styles.dateText, isReleaseDate && styles.invisibleText]}>
          {date.getDate()}
        </Text>
        {isReleaseDate && (
          <FontAwesome name="book" size={30} color="#4DB6AC" style={styles.bookIcon} />
        )}
      </Layout>
    );
  };

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.calendarContainer}>
            <Calendar
              key={calendarKey}
              date={date}
              max={maxDate}
              boundingMonth={false}
              onSelect={nextDate => setDate(nextDate)}
              renderDay={renderDay}
            />
          </View>
          <Text style={styles.titleContainer}>
            <Text style={styles.title} category='h4'>
              Releasing on {formatDate(date)}:
            </Text>
          </Text>
          {filteredBooks.length > 0 ? (
            <FlatList
              data={filteredBooks}
              horizontal
              renderItem={({ item }) => (
                <View style={styles.bookItem}>
                  <BookListing
                    title={item.title}
                    author={item.authors && item.authors.length > 0 ? item.authors[0] : 'Unknown'}
                    genre={item.genre && item.genre.length > 0 ? item.genre[0] : 'Unknown'}
                    imageUrl={item.coverImage}
                    onPress={() => navigation.navigate('BookDetails', { book: item })}
                  />
                </View>
              )}
              keyExtractor={(item, index) => index.toString()}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <>
              <Text style={styles.noBooksText}>No favorited books are releasing today.</Text>
              <Button
                style={styles.discoverButton}
                onPress={handleSearchByDate}>
                <Text style={styles.title}>
                    Search Books Releasing {formatDate(date)}
                </Text>
              </Button>
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  calendarContainer: {
    padding: 8,
    marginVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  titleContainer: {
    marginVertical: 10,
    paddingVertical: 10,
    paddingHorizontal: 2,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: '#4DB6AC',
    borderColor: 'black',
    borderWidth: 0.5,
  },
  bookItem: {
    width: 140,
    marginRight: 16,
  },
  noBooksText: {
    fontFamily: 'Lora_400Regular',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 10,
    fontSize: 18,
    color: '#333',
  },
  discoverButton: {
    backgroundColor: '#4DB6AC',
    borderColor: '#000',
    borderWidth: 0.3,
    padding: 15,
    borderRadius: 20,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  buttonText: {
    fontFamily: 'Lora_600Regular',
  },
  dayContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: 30,
    height: 45,
  },
  invisibleText: {
    color: 'transparent',
  },
  dateText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 20,
    color: '#333',
  },
  bookIcon: {
    position: 'absolute',
    top: 9,
  },
});

export default CalendarScreen;
