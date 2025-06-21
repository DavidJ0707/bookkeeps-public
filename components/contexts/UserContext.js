import React, { createContext, useState, useEffect, useCallback, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage'; // For persistent storage on device
import { fetchUserData, updateFavoritesInDB, getAuthorsByIds } from '../mongoDBService'; // Service functions for interacting with MongoDB

/**
 * UserContext
 * Stores user data (ID, favorite genres, authors) and provides functions to update these in DB and local state.
 */
export const UserContext = createContext();

/**
 * UserProvider
 * @param {object} children - Child components that consume user context.
 * @param {object} initialData - Initial user data (ID, genres, authors, etc.).
 */
export const UserProvider = ({ children, initialData }) => {
  const [userId, setUserId] = useState(initialData ? initialData.userData._id : null);
  const [favoriteGenres, setFavoriteGenres] = useState(initialData ? initialData.favoriteGenres : []);
  const [favoriteAuthors, setFavoriteAuthors] = useState(initialData ? initialData.favoriteAuthors : []);
  const [genres, setGenres] = useState(initialData.genreNames || []);

  /**
   * Updates the user's favorite genres in the database and local state.
   * @param {Array<string>} genresList - The new list of favorite genres.
   */
  const updateFavoriteGenres = useCallback(async (genres) => {
      try {
        await updateFavoritesInDB(userId, genres, favoriteAuthors.map(a => a._id));
        setFavoriteGenres(genres);
      } catch (error) {
        console.error('Failed to update favorite genres:', error);
      }
    }, [userId, favoriteAuthors]);

  /**
   * Updates the user's favorite authors in the database and local state.
   * @param {Array<string>} authorIds - The new list of favorite author IDs.
   */
  const updateFavoriteAuthors = useCallback(async (authorIds) => {
      try {
        await updateFavoritesInDB(userId, favoriteGenres, authorIds);
        if (authorIds.length > 0) {
          const updatedAuthors = await getAuthorsByIds(authorIds);
          setFavoriteAuthors(updatedAuthors);
        } else {
          setFavoriteAuthors([]);
        }
      } catch (error) {
        console.error('Failed to update favorite authors:', error);
      }
    }, [userId, favoriteGenres]);

  return (
    <UserContext.Provider value={{
      userId,
      favoriteGenres,
      favoriteAuthors,
      updateFavoriteGenres,
      updateFavoriteAuthors,
      genres,
      setFavoriteAuthors
    }}>
      {children}
    </UserContext.Provider>
  );
};

export default UserContext;
