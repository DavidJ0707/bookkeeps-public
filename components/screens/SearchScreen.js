import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SafeAreaView, TextInput, StyleSheet, FlatList, View, ActivityIndicator, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Text } from '@ui-kitten/components';
import { BookListing } from '../bookListing';
import { searchBooks } from '../mongoDBService';
import Icon from 'react-native-vector-icons/MaterialIcons';
import debounce from 'lodash.debounce';

/**
 * SearchScreen
 * Allows users to search for books by general query, genre, writing style, or theme.
 */
export const SearchScreen = ({ navigation, route }) => {
  const [searchQuery, setSearchQuery] = useState(route?.params?.preloadedQuery || '');
  const [searchType, setSearchType] = useState(route?.params?.searchType || 'general');
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(true);
  const [showSubcategories, setShowSubcategories] = useState(null);
  const searchInputRef = useRef(null);

  const categories = {
    genre: [
      "Art",
      "Biography & Memoir",
      "Business & Economics",
      "Comics & Graphic Novels",
      "Cookbooks & Food",
      "Crime",
      "Personal Development",
      "Sports",
      "Technology & Science",
      "Fantasy",
      "Historical Fiction",
      "Fiction",
      "Young Adult",
      "Mystery & Thriller",
      "Romance",
      "History",
      "Horror",
      "Science Fiction",
      "Non-Fiction",
      "Comedy",
    ],

    writingStyle: [
      "Analytical",
      "Atmospheric",
      "Biographical",
      "Character-Driven",
      "Descriptive",
      "Dialog-Driven",
      "Emotional",
      "Expository",
      "Fast-Paced",
      "Imaginative",
      "Informative",
      "Instructional",
      "Light",
      "Narrative",
      "Persuasive",
      "Personal",
      "Plot-Driven",
      "Poetic",
      "Practical",
      "Psychological",
      "Reflective",
      "Satirical",
      "Speculative",
      "Suspenseful",
      "Technical",
      "Visual",
      "World-Building",
      "Inspirational",
    ],

    theme: [
      "Achievement",
      "Adventure",
      "Betrayal",
      "Coming of Age",
      "Competition",
      "Corporate Culture",
      "Crime",
      "Crime Investigation",
      "Creativity",
      "Cultural Conflicts",
      "Culture",
      "Discovery",
      "Dystopia",
      "Epic Quests",
      "Evil",
      "Expression",
      "Family",
      "Fantasy Worlds",
      "Fear",
      "Friendship",
      "Future",
      "Good vs Evil",
      "Growth",
      "Heroism",
      "Human Experience",
      "Humor",
      "Identity",
      "Innovation",
      "Justice",
      "Leadership",
      "Legal System",
      "Life Journey",
      "Love",
      "Magic",
      "Mindfulness",
      "Monsters",
      "Moral Dilemmas",
      "Motivation",
      "Murder",
      "Mythical Creatures",
      "Perception",
      "Personal Growth",
      "Politics",
      "Psychological Conflicts",
      "Reality",
      "Redemption",
      "Relationships",
      "Revenge",
      "Romantic Tension",
      "Satire",
      "Science",
      "Scientific Inquiry",
      "Self-Discovery",
      "Self-Improvement",
      "Social Issues",
      "Society",
      "Space Travel",
      "Sportsmanship",
      "Struggles",
      "Success",
      "Supernatural",
      "Survival",
      "Technology",
      "Teamwork",
      "Tradition",
      "Truth",
    ],
  };

  useEffect(() => {
      navigation.setParams({ searchResultsLength: searchResults.length });
    }, [searchResults]);

  /**
   * Filters out duplicate books by _id.
   */
  const filterDuplicates = (newResults, existingResults) => {
    const existingIds = new Set(existingResults.map((book) => book._id));
    return newResults.filter((book) => !existingIds.has(book._id));
  };

  /**
   * Shows the bottom sheet for subcategories (genre, writingStyle, theme).
   */
  const handleSuggestionPress = (type) => {
    setShowSubcategories(type);
  };

  /**
   * Sets a subcategory as the search query and closes the modal.
   */
  const selectSubcategory = (subcategory) => {
    setSearchType(showSubcategories);
    setSearchQuery(subcategory);
    setShowSubcategories(null);
  };

  /**
   * Debounced function to perform a book search.
   */
  const performSearch = useCallback(
    debounce(async (query) => {
      if (query.trim().length < 3) {
        setSearchResults([]);
        setHasMoreResults(false);
        return;
      }

      setIsLoading(true);

      try {
        const results = await searchBooks(query, 20, 0, searchType);
        const uniqueResults = filterDuplicates(results, []);
        setSearchResults(uniqueResults);
        setHasMoreResults(uniqueResults.length === 20);
        setPage(1);
      } catch (error) {
        console.error('Error searching books:', error);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [searchType]
  );

  /**
   * Loads more results if available.
   */
  const loadMoreResults = async () => {
    if (!hasMoreResults || isLoadingMore) return;

    setIsLoadingMore(true);
    try {
      const results = await searchBooks(searchQuery, 20, page * 20, searchType);
      const uniqueResults = filterDuplicates(results, searchResults); // Remove duplicates from new results
      setSearchResults((prevResults) => [...prevResults, ...uniqueResults]);
      setHasMoreResults(uniqueResults.length === 20); // Check if more results exist
      setPage((prevPage) => prevPage + 1);
    } catch (error) {
      console.error('Error loading more books:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Focuses the search input after a brief delay when the screen loads.
   */
  useEffect(() => {
    const focusTimeout = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 300);

    return () => clearTimeout(focusTimeout);
  }, []);

  /**
   * Executes search when searchQuery changes.
   */
  useEffect(() => {
    if (searchQuery.trim().length >= 3) {
      performSearch(searchQuery);
    } else {
      // Clear results if query is less than 3 characters
      setSearchResults([]);
      setHasMoreResults(false);
    }
  }, [searchQuery, performSearch]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Search input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={24} color="#888" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Search for New Books..."
          placeholderTextColor="#888"
          value={searchQuery}
          onChangeText={(query) => {
            setSearchQuery(query);
            setSearchType('general');
          }}
        />
      </View>

     {/* Horizontal filters if query < 3 chars */}
      {searchQuery.trim().length < 3 && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Try searching by:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => handleSuggestionPress('genre')}
            >
              <Icon name="menu-book" size={18} color="#555" style={styles.filterIcon} />
              <Text style={styles.filterText}>Genre</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => handleSuggestionPress('writingStyle')}
            >
              <Icon name="edit" size={18} color="#555" style={styles.filterIcon} />
              <Text style={styles.filterText}>Writing Style</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => handleSuggestionPress('theme')}
            >
              <Icon name="palette" size={18} color="#555" style={styles.filterIcon} />
              <Text style={styles.filterText}>Theme</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* Bottom Sheet Modal */}
      <Modal
        visible={!!showSubcategories}
        transparent
        animationType="slide"
        onRequestClose={() => setShowSubcategories(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSubcategories(null)}
        />
        <View style={styles.bottomSheet}>
          <View style={styles.handleBar} />
          <Text style={styles.bottomSheetTitle}>
            {showSubcategories &&
              showSubcategories.charAt(0).toUpperCase() + showSubcategories.slice(1)}
          </Text>

          <ScrollView style={styles.subcategoryScroll}>
            {showSubcategories &&
              categories[showSubcategories]?.map((item, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.bottomSheetItem}
                  onPress={() => selectSubcategory(item)}
                >
                  <Text style={styles.bottomSheetItemText}>{item}</Text>
                </TouchableOpacity>
              ))}
          </ScrollView>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowSubcategories(null)}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
      {isLoading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={searchResults}
          numColumns={2}
          keyExtractor={(item, index) => item._id || index.toString()}
          renderItem={({ item }) => (
            <View style={styles.bookItem}>
              <BookListing
                title={item.title}
                author={item.authors && item.authors.length > 0 ? item.authors[0] : 'Unknown'}
                genre={item.mainGenre || 'Unknown'}
                imageUrl={item.coverImage || ''}
                onPress={() => navigation.navigate('BookDetails', { book: item })}
              />
            </View>
          )}
          ListEmptyComponent={() => <Text style={styles.noResultsText}>No books found</Text>}
          onEndReached={loadMoreResults}
          onEndReachedThreshold={0.5}
          ListFooterComponent={isLoadingMore && <ActivityIndicator size="small" color="#0000ff" />}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 8,
    backgroundColor: '#F7F7F7',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 16,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    fontFamily: 'Lora_600Regular',
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    alignItems: "center",
  },
  filterTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  filterIcon: {
    marginRight: 6,
  },
  filterText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 14,
    color: '#333',
  },
  bookItem: {
    flex: 1 / 2,
    margin: 8,
    alignItems: 'center',
  },
  noResultsText: {
    fontFamily: 'Lora_600Regular',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 18,
    color: '#000',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    maxHeight: '50%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
  },
  handleBar: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#ccc',
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 18,
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  bottomSheetItem: {
    paddingVertical: 8,
    borderBottomColor: '#EEE',
    borderBottomWidth: 1,
  },
  bottomSheetItemText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 16,
    color: '#333',
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: '#E0F2F1',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#333',
  },
});

export default SearchScreen;
