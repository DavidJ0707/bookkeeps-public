import React, { createContext, useState } from 'react';
import { getBooksByIds, saveFavoritedBook, removeFavoritedBook } from '../mongoDBService'; // Importing functions to interact with the MongoDB database

/**
 * FavoriteBooksContext
 * Holds and manages a user's favorited books.
 */
export const FavoriteBooksContext = createContext();

/**
 * FavoriteBooksProvider
 * @param {object} children - Child components to receive context.
 * @param {object} initialData - Initial favoritedBooks array.
 */
export const FavoriteBooksProvider = ({ children, initialData }) => {
  const [favoritedBooks, setFavoritedBooks] = useState(initialData.favoritedBooks || []);

  /**
   * Adds a book to the user's favorites.
   * @param {string} userId - The current user's ID.
   * @param {string} bookId - The ID of the book to be favorited.
   */
  const addFavoritedBook = async (userId, bookId) => {
    try {
      const favoritedId = await saveFavoritedBook(userId, bookId);
      const bookDetails = await getBooksByIds([bookId]);
      if (bookDetails.length > 0) {
        const newFavorite = { ...bookDetails[0], favoritedId: favoritedId };
        setFavoritedBooks(prevBooks => [...prevBooks, newFavorite]);
      }
    } catch (error) {
      console.error('Error adding favorited book:', error); // Error handling for failed favoriting
    }
  };

  /**
   * Removes a book from the user's favorites.
   * @param {string} favoriteId - The unique favorite record ID (DB reference).
   */
  const removeFavoritedBookFromState = async (favoriteId) => {
    try {
      await removeFavoritedBook(favoriteId);
      setFavoritedBooks(prevBooks => prevBooks.filter(book => book.favoritedId !== favoriteId));
    } catch (error) {
      console.error('Error removing favorited book:', error);
    }
  };

  return (
    <FavoriteBooksContext.Provider value={{ favoritedBooks, addFavoritedBook, removeFavoritedBookFromState }}>
      {children}
    </FavoriteBooksContext.Provider>
  );
};

export default FavoriteBooksContext;
