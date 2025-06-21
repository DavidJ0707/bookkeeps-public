import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  fetchRecommendedBooks,
  fetchBooksComingThisWeek,
  fetchBooksComingNextMonth,
  fetchTrendingBooks,
  fetchReleasedBooks
} from '../mongoDBService';
import UserContext from './UserContext';

/**
 * BookContext
 * Manages discoverable books in various categories and provides pagination/loading functionality.
 */
const BookContext = createContext();

/**
 * BookProvider
 * @param {object} children - The components within this provider.
 * @param {object} initialData - Preloaded lists for each category to initialize state.
 */
export const BookProvider = ({ children, initialData }) => {
  const { userId } = useContext(UserContext);

  const [recommendedBooks, setRecommendedBooks] = useState(initialData.recommendedBooks || []);
  const [booksThisWeek, setBooksThisWeek] = useState(initialData.booksThisWeek || []);
  const [booksNextMonth, setBooksNextMonth] = useState(initialData.booksNextMonth || []);
  const [trendingBooks, setTrendingBooks] = useState(initialData.trendingBooks || []);
  const [releasedBooks, setReleasedBooks] = useState(initialData.releasedBooks || []);

  const [hasMoreRecommended, setHasMoreRecommended] = useState(true);
  const [hasMoreWeek, setHasMoreWeek] = useState(true);
  const [hasMoreMonth, setHasMoreMonth] = useState(true);
  const [hasMoreTrending, setHasMoreTrending] = useState(true);
  const [hasMoreReleased, setHasMoreReleased] = useState(true);

  const [recommendedOffset, setRecommendedOffset] = useState(20);
  const [weekOffset, setWeekOffset] = useState(20);
  const [monthOffset, setMonthOffset] = useState(20);
  const [trendingOffset, setTrendingOffset] = useState(20);
  const [releasedOffset, setReleasedOffset] = useState(20);

  const [fetchedBookIds, setFetchedBookIds] = useState(new Set());

  /**
   * Filters out books that are already stored globally across categories.
   * @param {Array} newBooks - Newly fetched books.
   * @returns {Array} Unique books not seen before.
   */
  const filterOutDuplicateBooksGlobally = (newBooks) => {
    const uniqueBooks = newBooks.filter((book) => !fetchedBookIds.has(book._id));
    setFetchedBookIds((prevIds) => {
      const updatedIds = new Set(prevIds);
      uniqueBooks.forEach((book) => updatedIds.add(book._id));
      return updatedIds;
    });

    return uniqueBooks;
  };

  /**
   * Fetches a fresh batch of recommended books and resets offset.
   */
  const refreshRecommendedBooks = async () => {
    try {
      const newBooks = await fetchRecommendedBooks(userId, 20, 0);
      const uniqueBooks = filterOutDuplicateBooksGlobally(newBooks);
      setRecommendedBooks(uniqueBooks);
      setRecommendedOffset(20);
      setHasMoreRecommended(uniqueBooks.length === 20);
    } catch (error) {
      console.error('Error refreshing recommended books:', error);
    }
  };

  /**
   * Fetches additional recommended books.
   */
  const loadMoreRecommendedBooks = async () => {
  if (!hasMoreRecommended) return;
  try {
    const newBooks = await fetchRecommendedBooks(userId, 20, recommendedOffset);
    const uniqueBooks = newBooks.filter(
      (newBook) => !recommendedBooks.some((book) => book._id === newBook._id)
    );
    if (newBooks.length < 20) {
      setHasMoreRecommended(false);
      console.log("No more books available.");
    }
    setRecommendedBooks((prevBooks) => [...prevBooks, ...uniqueBooks]);
    setRecommendedOffset((prevOffset) => prevOffset + 20);
  } catch (error) {
    console.error('Error loading more recommended books:', error);
  }
};

  /**
   * Fetches additional books releasing this week.
   */
const loadMoreBooksThisWeek = async () => {
  if (!hasMoreWeek) return;
  try {
    const newBooks = await fetchBooksComingThisWeek(20, weekOffset);
    const uniqueBooks = newBooks.filter(
      (newBook) => !booksThisWeek.some((book) => book._id === newBook._id)
    );
    if (newBooks.length < 20) {
      setHasMoreWeek(false);
      console.log("No more books available.");
    }
    setBooksThisWeek((prevBooks) => [...prevBooks, ...uniqueBooks]);
    setHasMoreWeek(uniqueBooks.length === 20);
  } catch (error) {
    console.error('Error loading more books for this week:', error);
  }
};

  /**
   * Fetches additional books releasing next month.
   */
const loadMoreBooksNextMonth = async () => {
  if (!hasMoreMonth) return;
  try {
    const newBooks = await fetchBooksComingNextMonth(20, monthOffset, userId);
    const uniqueBooks = newBooks.filter(
      (newBook) => !booksNextMonth.some((book) => book._id === newBook._id)
    );
    if (newBooks.length < 20) {
      setHasMoreMonth(false);
      console.log("No more books available.");
    }
    setBooksNextMonth((prevBooks) => [...prevBooks, ...uniqueBooks]);
    setMonthOffset((prevOffset) => prevOffset + 20);
  } catch (error) {
    console.error('Error loading more books next month:', error);
  }
};

  /**
   * Fetches additional trending books.
   */
const loadMoreTrendingBooks = async () => {
  if (!hasMoreTrending) return;
  try {
    const newBooks = await fetchTrendingBooks(20, trendingOffset);
    const uniqueBooks = newBooks.filter(
      (newBook) => !trendingBooks.some((book) => book._id === newBook._id)
    );
    if (newBooks.length < 20) {
      setHasMoreTrending(false);
      console.log("No more books available.");
    }
    setTrendingBooks((prevBooks) => [...prevBooks, ...uniqueBooks]);
    setTrendingOffset((prevOffset) => prevOffset + 20);
  } catch (error) {
    console.error('Error loading more trending books:', error);
  }
};

  /**
   * Fetches additional books that have already been released.
   */
const loadMoreReleasedBooks = async () => {
  if (!hasMoreReleased) return;
  try {
    const newBooks = await fetchReleasedBooks(20, releasedOffset, userId);
    const uniqueBooks = newBooks.filter(
      (newBook) => !releasedBooks.some((book) => book._id === newBook._id)
    );
    if (newBooks.length < 20) {
      setHasMoreReleased(false);
      console.log("No more books available.");
    }
    setReleasedBooks((prevBooks) => [...prevBooks, ...uniqueBooks]);
    setReleasedOffset((prevOffset) => prevOffset + 20);
  } catch (error) {
    console.error('Error loading more released books:', error);
  }
};

  return (
    <BookContext.Provider
      value={{
        recommendedBooks,
        booksThisWeek,
        booksNextMonth,
        releasedBooks,
        trendingBooks,
        refreshRecommendedBooks,
        loadMoreRecommendedBooks,
        loadMoreBooksThisWeek,
        loadMoreBooksNextMonth,
        loadMoreReleasedBooks,
        loadMoreTrendingBooks,
        hasMoreRecommended,
        hasMoreWeek,
        hasMoreMonth,
        hasMoreReleased,
        hasMoreTrending,
      }}
    >
      {children}
    </BookContext.Provider>
  );
};

export default BookContext;