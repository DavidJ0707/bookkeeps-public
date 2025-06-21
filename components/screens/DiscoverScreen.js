import React, { useContext, useCallback, useMemo, useState, useEffect } from 'react';
import { SafeAreaView, StyleSheet, View, FlatList, RefreshControl } from 'react-native';
import { Text } from '@ui-kitten/components';
import { BookListing } from '../bookListing';
import BookContext from '../contexts/BookContext';
import { useNavigation } from '@react-navigation/native';
import UserContext from '../contexts/UserContext';
import MaterialCommunityIcons from 'react-native';
import { useFonts, Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';

/**
 * DiscoverScreen
 * Displays various categories of books (recommended, trending, etc.) in horizontal lists.
 */
export const DiscoverScreen = () => {
  const navigation = useNavigation();
  const {
    recommendedBooks,
    booksThisWeek,
    booksNextMonth,
    trendingBooks,
    releasedBooks,
    loadMoreRecommendedBooks,
    loadMoreBooksThisWeek,
    loadMoreBooksNextMonth,
    loadMoreTrendingBooks,
    loadMoreReleasedBooks,
    hasMoreRecommended,
    hasMoreWeek,
    hasMoreMonth,
    hasMoreTrending,
    hasMoreReleased,
    refreshRecommendedBooks,
  } = useContext(BookContext);

  const { userId } = useContext(UserContext);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /**
   * Refreshes the recommended books list.
   */
  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRecommendedBooks(userId);
    } catch (error) {
      console.error('Error refreshing recommended books:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Loads more books for a given section if available.
   * @param {object} section - Section object with books, loadMore function, and hasMore flag.
   */
  const loadMoreBooks = (section) => {
    const { books, loadMore, hasMore } = section;

    if (books.length >= 20 && hasMore) {
      loadMore();
    }
  };

  /**
   * Renders a single book item in the horizontal list.
   */
  const renderBookListing = useCallback(
    ({ item: book }) => (
      <View style={styles.bookItem}>
        <BookListing
          title={book.title}
          imageUrl={book.coverImage || ''}
          onPress={() => navigation.navigate('BookDetails', { book: book, title: book.title, author: book.authors?.[0] })}
        />
      </View>
    ),
    [navigation]
  );

  /**
   * Prepares each category (section) to be rendered in the main list.
   */
  const sections = useMemo(() => [
    {
      title: 'Recommended For You',
      books: recommendedBooks,
      loadMore: loadMoreRecommendedBooks,
      hasMore: hasMoreRecommended,
    },
    {
      title: 'Releasing This Week',
      books: booksThisWeek,
      loadMore: loadMoreBooksThisWeek,
      hasMore: hasMoreWeek,
    },
    {
      title: 'Releasing Next Month',
      books: booksNextMonth,
      loadMore: loadMoreBooksNextMonth,
      hasMore: hasMoreMonth,
    },
    {
      title: 'Trending Books',
      books: trendingBooks,
      loadMore: loadMoreTrendingBooks,
      hasMore: hasMoreTrending,
    },
    {
      title: 'Just Released',
      books: releasedBooks,
      loadMore: loadMoreReleasedBooks,
      hasMore: hasMoreReleased,
    },
  ], [recommendedBooks, booksThisWeek, booksNextMonth, trendingBooks, releasedBooks]);

  /**
   * Renders each category section with a title and horizontal list.
   */
  const renderSection = ({ item: section }) => (
    <View style={styles.sectionContainer}>
      <View style={styles.softBackground}>
        <Text style={styles.categoryTitle}>{section.title}</Text>
        <FlatList
          data={section.books}
          horizontal
          renderItem={renderBookListing}
          keyExtractor={(item) => item._id}
          onEndReached={() => loadMoreBooks(section)}
          onEndReachedThreshold={0.1}
          ListEmptyComponent={<Text style={styles.noBooksText}>No books available</Text>}
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.booksScroll}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: -1,
          }}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item, index) => `section-${index}`}
        renderItem={renderSection}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#ff6f61']}
            tintColor="#ff6f61"
          />
        }
        initialNumToRender={3}
        windowSize={3}
        maxToRenderPerBatch={3}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  sectionContainer: {
    marginVertical: 20,
  },
  softBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
    position: 'relative',
  },
  categoryTitle: {
    fontFamily: 'Lora_400Regular',
    fontSize: 24,
    textAlign: 'right',
    fontWeight: '700',
    color: '#1F1F1F',
    marginBottom: 4,
    paddingRight: 15,
  },
  booksScroll: {
    paddingHorizontal: 4,
  },
  bookItem: {
    width: 140,
    marginRight: 4,
  },
  noBooksText: {
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
    color: '#999',
  },
});

export default DiscoverScreen;
