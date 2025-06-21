import axios from 'axios';
import { MONGODB_API_KEY, MONGODB_API_ENDPOINT, DATA_SOURCE, DATABASE_NAME, NODE_SERVER_API_ENDPOINT } from '@env';

const getAxiosConfig = async () => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'api-key': MONGODB_API_KEY,
    },
    timeout: 30000
  };
};

export const loginWithDeviceId = async (deviceId, expoPushToken, timeZone) => {
  try {
    const requestBody = { deviceId, expoPushToken, timeZone };
    const response = await axios.post(
      `${NODE_SERVER_API_ENDPOINT}/api/device_login`,
      requestBody,
      {
        headers: {
          'api-key': MONGODB_API_KEY, 
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Device login failed', error);
    throw error;
  }
};

export const searchBooks = async (query, limit = 20, offset = 0, searchType = 'general') => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/search`, {
      params: { query, limit, offset, searchType },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching books:', error);
    throw error;
  }
};


// Fetch trending books with pagination
export const fetchTrendingBooks = async (limit = 10, offset = 0) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/trending-books`, {
      params: { limit, offset },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching trending books:', error);
    throw error;
  }
};

// Fetch recommended books with pagination
export const fetchRecommendedBooks = async (userId, limit = 10, offset = 0) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/recommended-for-you`, {
      params: { userId, limit, offset },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching recommended books:', error);
    throw error;
  }
};


// Fetch books coming this week with pagination
export const fetchBooksComingThisWeek = async (limit = 10, offset = 0) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/books-coming-this-week`, {
      params: { limit, offset },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching books coming this week:', error);
    throw error;
  }
};

// Fetch books coming this month with pagination
export const fetchBooksComingNextMonth = async (limit = 10, offset = 0, userId) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/books-coming-next-month`, {
      params: { limit, offset, userId },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching books coming next month:', error);
    throw error;
  }
};

// Fetch books already released with pagination
export const fetchReleasedBooks = async (limit = 10, offset = 0, userId) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/books-already-released`, {
      params: { limit, offset, userId },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching books coming this month:', error);
    throw error;
  }
};

export const fetchUserData = async (userId) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/users/${userId}`, {
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
};

export const updateFavoritesInDB = async (userId, favoriteGenres, favoriteAuthors) => {
  try {
    await axios.patch(`${NODE_SERVER_API_ENDPOINT}/api/users/${userId}`, {
      favoriteGenres,
      favoriteAuthors
    }, {
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Failed to update profile:', error);
    throw error;
  }
};

export const getBooksByIds = async (bookIds) => {
  try {
    if (!Array.isArray(bookIds) || bookIds.length === 0) {
      throw new Error('bookIds is either not an array or empty');
    }

    const response = await axios.post(`${NODE_SERVER_API_ENDPOINT}/api/books/by-ids`,
      { bookIds },
      {
        headers: {
          'api-key': MONGODB_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching books by IDs:', error.message);
    return [];
  }
};


// Favorited books for a user from MongoDB collection
export const getFavoritedBooks = async (userId) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/favorites/${userId}`, {
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data || [];
  } catch (error) {
    console.error('Error fetching favorited books:', error);
    return [];
  }
};


// Save favorited book to the server
export const saveFavoritedBook = async (userId, bookId) => {
  try {
    const response = await axios.post(`${NODE_SERVER_API_ENDPOINT}/api/favorites`,
      { userId, bookId },
      {
        headers: {
          'api-key': MONGODB_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error saving favorited book:', error);
    throw error;
  }
};


// Remove a favorited book from the server
export const removeFavoritedBook = async (id) => {
  try {
    const response = await axios.delete(`${NODE_SERVER_API_ENDPOINT}/api/favorites/${id}`, {
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error removing favorited book:', error);
    throw error;
  }
};


// Get genres from the MongoDB collection
export const getGenres = async () => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/genres`, {
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching genres:', error);
    throw error;
  }
};


// Search Author names using Atlas Search
export const searchAuthorsByName = async (query, limit = 10) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/authors/search`, {
      params: { query, limit },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error searching authors:', error);
    throw error;
  }
};

export const getAuthorsByIds = async (authorIds) => {
  try {
    const response = await axios.get(`${NODE_SERVER_API_ENDPOINT}/api/authors/by-ids`, {
      params: { authorIds: authorIds.join(',') },
      headers: {
        'api-key': MONGODB_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching authors by IDs:', error);
    return [];
  }
};



export const sendFeedbackToMongoDB = async (userId, feedback) => {
  try {
    const response = await axios.post(`${NODE_SERVER_API_ENDPOINT}/feedback`,
      { userId, feedback },
      {
        headers: {
          'api-key': MONGODB_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    throw error;
  }
};
