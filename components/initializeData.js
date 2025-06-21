import { fetchUserData, getFavoritedBooks, getBooksByIds, fetchRecommendedBooks, fetchBooksComingThisWeek, fetchBooksComingNextMonth, fetchTrendingBooks, fetchReleasedBooks, getGenres, getAuthorsByIds } from './mongoDBService';

export const initializeData = async (userId) => {
  try {
    // Fetch user data
    const userData = await fetchUserData(userId);

    const favoriteAuthorIds = userData.favoriteAuthors;
    const favoriteAuthors = favoriteAuthorIds.length > 0 ? await getAuthorsByIds(favoriteAuthorIds) : [];

    const genres = await getGenres();

    // Fetch favorite book IDs
    const response = await getFavoritedBooks(userId);
    const favoritedBooksIds = response.map(fav => fav.bookId);
    const books = favoritedBooksIds.length > 0 ? await getBooksByIds(favoritedBooksIds) : [];
    const favoritedBooks = books.map(book => {
      const fav = response.find(fav => fav.bookId === book._id);
      return { ...book, favoritedId: fav._id };
    });

    // Fetch initial recommended books data for the user
    const recommendedBooks = await fetchRecommendedBooks(userId, 20, 0);

    // Fetch initial book data for this week, next month, and trending
    const releasedBooks = await fetchReleasedBooks(20, 0, userId);
    const booksThisWeek = await fetchBooksComingThisWeek(20, 0);
    const booksNextMonth = await fetchBooksComingNextMonth(20, 0, userId);
    const trendingBooks = await fetchTrendingBooks(20, 0);

    return {
      userData,
      favoritedBooks,
      recommendedBooks,
      booksThisWeek,
      booksNextMonth,
      trendingBooks,
      releasedBooks,
      genres,
      favoriteAuthors,
    };
  } catch (error) {
    console.error('Error initializing data:', error);
    throw error;
  }
};