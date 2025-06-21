import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { SafeAreaView, StyleSheet, Text, Alert, ScrollView, Modal, View, TouchableOpacity, TextInput, ActivityIndicator, Image, KeyboardAvoidingView, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { UserContext } from '../contexts/UserContext';
import GradientBackground from '../GradientBackground';
import { MONGODB_API_KEY } from '@env';
import { searchAuthorsByName } from '../mongoDBService';

const predefinedAvatars = [
  { id: 1, src: require('../../assets/avatar1.png') },
  { id: 2, src: require('../../assets/avatar2.png') },
  { id: 3, src: require('../../assets/avatar3.png') },
  { id: 4, src: require('../../assets/avatar4.png') },
  { id: 5, src: require('../../assets/avatar5.png') },
  { id: 6, src: require('../../assets/avatar6.png') },
  { id: 7, src: require('../../assets/avatar7.png') },
  { id: 8, src: require('../../assets/avatar8.png') },
  { id: 9, src: require('../../assets/avatar9.png') },
];

/**
 * ProfileScreen
 * Allows the user to manage profile avatar, favorite genres, and favorite authors.
 */
const ProfileScreen = ({ route, navigation }) => {
  const { userId, favoriteGenres, favoriteAuthors, updateFavoriteAuthors, updateFavoriteGenres, genres } = useContext(UserContext);
  const [authors, setAuthors] = useState([]);
  const [genreModalVisible, setGenreModalVisible] = useState(false);
  const [localGenres, setLocalGenres] = useState([...favoriteGenres]);
  const [authorSearch, setAuthorSearch] = useState('');
  const [filteredAuthors, setFilteredAuthors] = useState([]);
  const [visibleAuthorsCount, setVisibleAuthorsCount] = useState(5);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [hasScrolledToAuthors, setHasScrolledToAuthors] = useState(false);

  const scrollViewRef = useRef(null);
  const authorListRef = useRef(null);

  /**
   * Loads stored avatar from AsyncStorage on mount.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedAvatar = await AsyncStorage.getItem('userAvatar');
        if (storedAvatar) {
          setSelectedAvatar(JSON.parse(storedAvatar));
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load avatar');
      }
    };
    fetchData();
  }, []);

  /**
   * Opens the genre selection modal, copying current favorites into local state.
   */
  const openGenreModal = () => {
    setLocalGenres([...favoriteGenres]);
    setGenreModalVisible(true);
  };

  /**
   * Closes the genre selection modal and updates the database.
   */
  const closeGenreModal = () => {
    updateFavoriteGenres(localGenres);
    setGenreModalVisible(false);
  };

  /**
   * Selects or deselects a genre from local state.
   */
  const handleGenreSelect = (genre) => {
    const newFavorites = localGenres.includes(genre)
      ? localGenres.filter(g => g !== genre)
      : [...localGenres, genre];
    setLocalGenres(newFavorites); // Update local state
  };

  /**
   * Searches authors by name in the DB.
   */
  const handleAuthorSearch = useCallback(async (text) => {
    setAuthorSearch(text);
    if (text) {
      try {
        const authors = await searchAuthorsByName(text);
        setFilteredAuthors(authors);
        if (!hasScrolledToAuthors && authorListRef.current && scrollViewRef.current) {
          authorListRef.current.measure((x, y, width, height, pageX, pageY) => {
            scrollViewRef.current.scrollTo({ y, animated: true });
          });
          setHasScrolledToAuthors(true);
        }
      } catch (error) {
        console.error('Error search authors:', error);
      }
    } else {
      setFilteredAuthors([]);
    }
    setVisibleAuthorsCount(5);
  }, [hasScrolledToAuthors]);

  /**
   * When focusing on the search input, scroll the view to the author list.
   */
  const handleFocus = () => {
    setHasScrolledToAuthors(false);
    if (scrollViewRef.current) {
      scrollViewRef.current.measure((x, y, width, height, pageX, pageY) => {
      });
    } else {
      console.log("scrollViewRef is null.");
    }

    if (scrollViewRef.current && authorListRef.current) {
      authorListRef.current.measure((x, y, width, height, pageX, pageY) => {
        scrollViewRef.current.scrollTo({ y, animated: true });
      });
    } else {
      console.log("Either scrollViewRef or authorListRef is null.");
    }
  };

  /**
   * Toggles an author's favorite status and updates the DB.
   */
  const handleAuthorSelect = useCallback(async (author) => {
    const isFavorited = favoriteAuthors.some(a => a._id === author._id);

    const newAuthorIds = isFavorited
      ? favoriteAuthors.filter(a => a._id !== author._id).map(a => a._id)
      : [...favoriteAuthors.map(a => a._id), author._id];

    await updateFavoriteAuthors(newAuthorIds);

    setAuthorSearch('');
    setFilteredAuthors([]);
    setVisibleAuthorsCount(5);

  }, [favoriteAuthors, favoriteGenres, updateFavoriteAuthors]);

  const showMoreAuthors = () => {
    setVisibleAuthorsCount(prevCount => prevCount + 5);
  };

  const showLessAuthors = () => {
    setVisibleAuthorsCount(5);
  };

  /**
   * Selects an avatar and stores it in AsyncStorage.
   */
  const handleAvatarSelect = (avatar) => {
    setSelectedAvatar(avatar);
    AsyncStorage.setItem('userAvatar', JSON.stringify(avatar));
    setAvatarModalVisible(false);
  };

  const renderedGenres = Array.isArray(genres) ? genres : [];

  return (
      <GradientBackground>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView style={styles.container}>
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={styles.scrollContainer}
            >
              <View style={styles.header}>
                <TouchableOpacity style={styles.avatarContainer} onPress={() => setAvatarModalVisible(true)}>
                  {selectedAvatar ? (
                    <Image source={selectedAvatar.src} style={styles.avatar} />
                  ) : (
                    <Ionicons name="person-circle-outline" size={100} color="#fff" />
                  )}
                  <MaterialIcons name="edit" size={20} color="#fff" style={styles.editIcon} />
                </TouchableOpacity>
                <Text style={styles.headerText}>Profile</Text>
              </View>

              <View style={styles.section}>
                <TouchableOpacity style={styles.button} onPress={() => setGenreModalVisible(true)}>
                  <Text style={styles.buttonText}>Select Favorite Genres</Text>
                </TouchableOpacity>
              </View>

              {/* Avatar Selection Modal */}
              <Modal
                animationType="slide"
                transparent={true}
                visible={avatarModalVisible}
                onRequestClose={() => setAvatarModalVisible(false)}
              >
                <View style={styles.modalContainer}>
                  <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Select Your Avatar</Text>
                    <View style={styles.avatarSelectionContainer}>
                      {predefinedAvatars.map((avatar) => (
                        <TouchableOpacity
                          key={avatar.id}
                          style={styles.avatarOption}
                          onPress={() => handleAvatarSelect(avatar)}
                        >
                          <Image source={avatar.src} style={styles.avatarThumbnail} />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setAvatarModalVisible(false)}
                    >
                      <Text style={styles.buttonText}>Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Modal>

              {/* Genre Selection Modal */}
                <Modal
                  animationType="slide"
                  transparent={true}
                  visible={genreModalVisible}
                  onRequestClose={closeGenreModal}
                >
                  <View style={styles.modalContainer}>
                    <View style={styles.genreModalContent}>
                      <Text style={styles.modalTitle}>Select Favorite Genres</Text>
                      <ScrollView contentContainerStyle={styles.genreScrollView}>
                        {genres.length > 0 ? (
                          genres
                            .slice()
                            .sort((a, b) => a.localeCompare(b))
                            .map((genre) => (
                              <TouchableOpacity
                                key={genre}
                                style={[
                                  styles.genreTag,
                                  localGenres.includes(genre) && styles.selectedTag
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
                      <TouchableOpacity
                        style={styles.closeButton}
                        onPress={closeGenreModal}
                      >
                        <Text style={styles.buttonText}>Close</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </Modal>

              {/* Author Search and Display */}
                <View style={styles.authorSection}>
                  <Text style={styles.sectionTitle}>Search for Favorite Authors</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Search for Favorite Authors"
                    value={authorSearch}
                    onChangeText={handleAuthorSearch}
                    onFocus={handleFocus}
                  />

                  {/* Conditionally render tags based on authorSearch */}
                  {authorSearch.trim() !== '' && (
                    <View style={styles.tagsContainer}>
                      {filteredAuthors.slice(0, visibleAuthorsCount).map((author) => (
                        <TouchableOpacity
                          key={author._id}
                          style={[styles.tag, favoriteAuthors.some(a => a._id === author._id) && styles.selectedTag]}
                          onPress={() => handleAuthorSelect(author)}
                        >
                          <Text style={styles.tagText}>{author.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Show "Show more" or "Show less" buttons if needed */}
                  {authorSearch.trim() !== '' && filteredAuthors.length > visibleAuthorsCount && (
                    <TouchableOpacity onPress={showMoreAuthors}>
                      <Text style={styles.showMoreText}>Show more</Text>
                    </TouchableOpacity>
                  )}

                  {authorSearch.trim() !== '' && visibleAuthorsCount > 5 && (
                    <TouchableOpacity onPress={showLessAuthors}>
                      <Text style={styles.showMoreText}>Show less</Text>
                    </TouchableOpacity>
                  )}
                </View>

              {/* Favorite Authors Display */}
              <View ref={authorListRef} style={styles.authorSection}>
                  <ScrollView style={styles.authorList}>
                    {favoriteAuthors.map((author) => (
                      <TouchableOpacity key={author._id} onPress={() => navigation.navigate('AuthorDetail', { author })}>
                        <View style={styles.authorItem}>
                          <Text style={styles.authorText}>{author.name}</Text>
                          <Ionicons name="chevron-forward" size={24} color="black" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>


            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </GradientBackground>
    );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    padding: 26,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 32,
    color: '#333',
    marginTop: 8,
  },
  avatarContainer: {
    position: 'relative',
    borderWidth: 2,
    borderColor: '#fff',
    borderRadius: 50,
    padding: 2,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  editIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4DB6AC',
    borderRadius: 10,
    padding: 3,
  },
  section: {
    marginBottom: 24,
  },
  authorSection: {
    backgroundColor: '#FFF',
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  sectionTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 22,
    color: '#333',
    marginBottom: 12,
  },
  input: {
    fontFamily: 'Lora_400Regular',
    height: 50,
    borderColor: '#E2E8F0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 15,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#1F2937',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 5,
    backgroundColor: 'transparent',
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
    fontFamily: 'Lora_400Regular',
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#80CBC4',
    padding: 15,
    borderRadius: 25,
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    borderColor: 'black',
    borderWidth: 0.3,
  },
  buttonText: {
    fontFamily: 'Lora_600Regular',
    color: '#fff',
    fontSize: 18,
    letterSpacing: 0.5,
  },
  showMoreText: {
    fontFamily: 'Lora_700Bold',
    fontSize: 16,
    color: '#80CBC4',
    marginTop: 8,
    textAlign: 'center',
  },
  authorList: {
    maxHeight: 225,
    borderRadius: 5,
    padding: 10,
  },
  authorItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  authorText: {
    fontFamily: 'Lora_600Regular',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderColor: 'black',
    borderWidth: 0.3,
  },
  genreModalContent: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  genreScrollView: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingBottom: 20,
  },
  genreTag: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    margin: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    borderColor: '#000',
    borderWidth: 1,
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
  },
  modalTitle: {
    fontFamily: 'Lora_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 20,
  },
  avatarSelectionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginVertical: 20,
  },
  avatarOption: {
    padding: 10,
  },
  avatarThumbnail: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  closeButton: {
    backgroundColor: '#80CBC4',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },
});

export default ProfileScreen;

