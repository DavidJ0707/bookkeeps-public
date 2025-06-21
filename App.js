import React, { useState, useEffect } from 'react';
import * as eva from '@eva-design/eva';
import { ApplicationProvider, IconRegistry } from '@ui-kitten/components';
import { default as theme } from './theme.json';
import { SafeAreaView, View, StyleSheet, ActivityIndicator, StatusBar, Platform } from 'react-native';
import { BookProvider } from './components/contexts/BookContext';
import { UserProvider } from './components/contexts/UserContext';
import { FavoriteBooksProvider } from './components/contexts/FavoriteBooksContext';
import { AppNavigator } from './components/navigation';
import { loginWithDeviceId, fetchUserData } from './components/mongoDBService';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeData } from './components/initializeData';
import * as SplashScreen from 'expo-splash-screen';
import * as Device from 'expo-device';
import uuid from 'react-native-uuid';
import SetupFavoritesScreen from './components/screens/SetupFavoritesScreen';
import { NavigationContainer } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { useFonts, Lora_400Regular, Lora_700Bold } from '@expo-google-fonts/lora';


export default function App() {
  const [userId, setUserId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);
  const [userData, setUserData] = useState(null);
  const [data, setData] = useState({
    userData: null,
    favoritedBooks: [],
    genreBooks: [],
    authorBooks: [],
    booksThisWeek: [],
    booksNextMonth: [],
    genres: [],
  });

  // Load fonts
  const [fontsLoaded] = useFonts({
    Lora_400Regular,
    Lora_700Bold,
  });

  useEffect(() => {
    SplashScreen.preventAutoHideAsync();
    const initializeApp = async () => {
      await checkDeviceLogin();
    };
    initializeApp();
  }, []);

  const checkDeviceLogin = async () => {
  try {
    let userDeviceId;
    let userId;
    let isFirstTimeUser = false;

    userDeviceId = await AsyncStorage.getItem('userDeviceId');
    userId = await AsyncStorage.getItem('userId');

    if (!userDeviceId) {
      userDeviceId = uuid.v4();
      await AsyncStorage.setItem('userDeviceId', userDeviceId);
      console.log('Generated new device ID:', userDeviceId);
      isFirstTimeUser = true;
    } else {
      console.log('Retrieved existing device ID:', userDeviceId);
    }

    const expoPushToken = await registerForPushNotificationsAsync();

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const { user, isNewUser } = await loginWithDeviceId(userDeviceId, expoPushToken, timeZone);

    if (user) {
      await AsyncStorage.setItem('userId', user._id);
      setUserId(user._id);

      if (isNewUser || isFirstTimeUser) {
        setNeedsSetup(true);
        setIsAuthenticated(false);
        setUserData(user);
      } else {
        setUserData(user);
        setIsAuthenticated(true);
        await fetchData(user._id);
      }
    } else {
      console.warn('No user found');
      setIsAuthenticated(false);
    }

    setLoading(false);
    SplashScreen.hideAsync();
  } catch (error) {
    console.error('Error during device login:', error);
    setLoading(false);
    SplashScreen.hideAsync();
  }
};

async function registerForPushNotificationsAsync() {
  let token;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  if (Device.isDevice) {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      alert('Failed to get push token for push notification!');
      return;
    }
    try {
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        throw new Error('Project ID not found');
      }
      token = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log(token);
    } catch (e) {
      token = `${e}`;
    }
  } else {
    alert('Must use physical device for Push Notifications');
  }

  return token;
}

  const fetchData = async (userId) => {
    try {
      setLoading(true);
      const initializedData = await initializeData(userId);
      setData(initializedData);
    } catch (error) {
      console.error('Error initializing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteSetup = async () => {
    try {
      setLoading(true);
      await fetchData(userData._id);
      setNeedsSetup(false);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  const AppContent = () => (
    <UserProvider initialData={{
      userData: data.userData || {},
      favoriteGenres: data.userData?.favoriteGenres || [],
      favoriteAuthors: data.favoriteAuthors || [],
      genreNames: data.genres || []
    }}>
      <BookProvider initialData={data}>
        <FavoriteBooksProvider initialData={{ favoritedBooks: data.favoritedBooks }}>
          <SafeAreaView style={styles.safeArea}>
          </SafeAreaView>
          <AppNavigator />
        </FavoriteBooksProvider>
      </BookProvider>
    </UserProvider>
  );

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFDDE1" />
      <ApplicationProvider {...eva} theme={{ ...eva.light, ...theme }}>
        {needsSetup ? (
          <SetupFavoritesScreen
            userId={userId}
            onComplete={handleCompleteSetup}
            genres={data.genres}
          />
        ) : (
          <AppContent />
        )}
      </ApplicationProvider>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#F2F2F2',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
  },
});
