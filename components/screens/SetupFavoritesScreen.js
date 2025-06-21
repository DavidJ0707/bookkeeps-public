import React, { useState, useEffect, useCallback } from 'react';
import { SafeAreaView, StyleSheet, Text, ScrollView, View, TouchableOpacity, TextInput, Alert } from 'react-native';
import { searchAuthorsByName, updateFavoritesInDB, getGenres } from '../mongoDBService';

/**
 * SetupFavoritesScreen
 * Guides a user through picking favorite genres and authors during initial setup.
 *
 * @param {string} userId - The ID of the current user.
 * @param {function} onComplete - Callback to finalize setup and navigate away.
 */
const SetupFavoritesScreen = ({ userId, onComplete }) => {
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [selectedAuthors, setSelectedAuthors] = useState([]);
  const [authorSearch, setAuthorSearch] = useState('');
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [genres, setGenres] = useState([]);

  /**
   * Fetches genre list on mount.
   */
  useEffect(() => {
    const loadGenres = async () => {
      try {
        const fetchedGenres = await getGenres();
        setGenres(fetchedGenres);
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    loadGenres();
  }, []);

  /**
   * Toggles genre selection.
   */
  const handleGenreSelect = (genre) => {
    const updatedGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter(g => g !== genre)
      : [...selectedGenres, genre];
    setSelectedGenres(updatedGenres);
  };

  /**
   * Toggles author selection.
   */
  const handleAuthorSelect = (author) => {
    const isAlreadySelected = selectedAuthors.some(a => a._id === author._id);

    const updatedAuthors = isAlreadySelected
      ? selectedAuthors.filter(a => a._id !== author._id)
      : [...selectedAuthors, { _id: author._id, name: author.name }];

    setSelectedAuthors(updatedAuthors);
    setAuthorSearch('');
    setFilteredAuthors([]);
  };

  /**
   * Searches authors by name and updates local filtered list.
   */
  const handleAuthorSearch = useCallback(async (text) => {
    setAuthorSearch(text);
    if (text) {
      try {
        const authors = await searchAuthorsByName(text);
        setFilteredAuthors(authors);
      } catch (error) {
        console.error('Error searching authors:', error);
      }
    } else {
      setFilteredAuthors([]);
    }
  }, []);

  /**
   * Submits selected genres and authors to the DB, then completes setup.
   */
  const handleCompleteSetup = async () => {
    try {
      const authorIds = selectedAuthors.map(author => author._id);
      await updateFavoritesInDB(userId, selectedGenres, authorIds);
      onComplete();
    } catch (error) {
      console.error('Failed to update favorites:', error);
      Alert.alert('Error', 'Failed to update favorites');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.headerText}>Set Your Preferences</Text>

        {/* Author Search Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Search for Favorite Authors</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for authors..."
            value={authorSearch}
            onChangeText={handleAuthorSearch}
          />
          <View style={styles.tagsContainer}>
            {(Array.isArray(filteredAuthors) ? filteredAuthors : []).map(author => (
              <TouchableOpacity
                key={author._id}
                style={[styles.tag, selectedAuthors.includes(author.name) && styles.selectedTag]}
                onPress={() => handleAuthorSelect(author)}
              >
                <Text style={styles.tagText}>{author.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Display Selected Authors */}
        <View style={styles.section}>

          <View style={styles.selectedContainer}>
            {selectedAuthors.length > 0 ? (
              selectedAuthors.map((author, index) => (
                <View key={index} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{author.name}</Text>
                  <TouchableOpacity onPress={() => handleAuthorSelect(author)}>
                    <Text style={styles.removeIcon}>✖</Text>
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={styles.noSelectedText}>No authors selected</Text>
            )}
          </View>

        </View>

        {/* Genres */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Favorite Genres</Text>
          <ScrollView contentContainerStyle={styles.genreScrollView}>
            {Array.isArray(genres) && genres.length > 0 ? (
              genres
                .slice()
                .sort((a, b) => a.localeCompare(b))
                .map((genre) => (
                  <TouchableOpacity
                    key={genre}
                    style={[
                      styles.genreTag,
                      selectedGenres.includes(genre) && styles.selectedTag
                    ]}
                    onPress={() => handleGenreSelect(genre)}
                  >
                    <Text style={styles.tagText}>{genre}</Text>
                  </TouchableOpacity>
                ))
            ) : (
              <Text>No genres available</Text>
            )}
          </ScrollView>
        </View>
      </ScrollView>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleCompleteSetup}>
          <Text style={styles.buttonText}>Complete Setup</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.skipButton} onPress={handleCompleteSetup}>
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f0f0',
  },
  scrollContainer: {
    padding: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#d76d77',
  },
  section: {
    marginVertical: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#d76d77',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
  },
  tag: {
    padding: 10,
    margin: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
  },
  selectedTag: {
    backgroundColor: '#b0e57c',
  },
  tagText: {
    fontSize: 16,
    color: '#333',
  },
  genreTag: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    borderColor: '#d76d77',
    borderWidth: 1,
  },
  genreScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    marginVertical: 10,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    padding: 20,
    backgroundColor: '#f0f0f0',
  },
  button: {
    backgroundColor: '#d76d77',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 16,
    color: '#d76d77',
    textDecorationLine: 'underline',
  },
  selectedContainer: {
    flexDirection: 'column',
  },
  selectedItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 5,
    alignItems: 'center',
  },
  selectedItemText: {
    fontSize: 16,
    color: '#333',
  },
  removeIcon: {
    fontSize: 20,
    color: 'red',
    marginLeft: 10,
  },
  noSelectedText: {
    fontSize: 16,
    color: '#999',
  },
});

export default SetupFavoritesScreen;