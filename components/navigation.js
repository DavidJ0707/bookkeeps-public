import React, { useContext, useState } from 'react';
import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon, TopNavigation, TopNavigationAction, Layout, Divider, Text, Avatar, Button, TextInput, View } from '@ui-kitten/components';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NavigationContainer, useNavigation, useRoute } from '@react-navigation/native';
import { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import CalendarScreen from './screens/CalendarScreen';
import DiscoverScreen from './screens/DiscoverScreen';
import ProfileScreen from './screens/ProfileScreen';
import BookDetailScreen from './screens/BookDetailScreen';
import AuthorDetailScreen from './screens/AuthorDetailScreen';
import SearchScreen from './screens/SearchScreen';
import FeedbackModal from './screens/FeedbackModal';
import SetupFavoritesScreen from './screens/SetupFavoritesScreen';

import { UserContext } from './contexts/UserContext';
import GradientBackground from './GradientBackground';
import GradientIcon from './GradientIcon';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const FeedbackIcon = () => <GradientIcon name="message-text" size={35} colors={['#80CBC4', '#4DB6AC']} />;

const BackIcon = (props) => (
  <GradientIcon name="keyboard-backspace" size={35} colors={['#80CBC4', '#4DB6AC']} />
);

const SearchIcon = (props) => (
  <GradientIcon name="magnify" size={35} colors={['#80CBC4', '#4DB6AC']} />
);

const LeftAccessory = ({ currentRoute, openFeedbackModal }) => {
  const isFeedbackScreen = ['Home'].includes(currentRoute.name);
  if (isFeedbackScreen) {
    return (
      <TouchableOpacity onPress={openFeedbackModal} style={styles.iconWrapper}>
        <FeedbackIcon />
      </TouchableOpacity>
    );
  } else {
    return <BackAction />;
  }
};

const BackAction = ({ userId }) => {
  const navigation = useNavigation();
  const route = useRoute();

  const handleBack = () => {
    if (route.name === 'Search') {

      const resultsCount = route.params?.searchResultsLength || 0;

      if (resultsCount > 0) {
        navigation.replace('Search', { preloadedQuery: '', searchType: 'general' });
      } else {
        navigation.navigate('Home');
      }
    } else {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Home', { userId });
      }
    }
  };

  return (
    <TouchableOpacity onPress={handleBack}>
      <BackIcon />
    </TouchableOpacity>
  );
};


const SearchAction = () => {
  const navigation = useNavigation();

  const handleSearch = () => {
    navigation.navigate('Search');
  };

  return (
    <TouchableOpacity onPress={handleSearch}>
      <SearchIcon />
    </TouchableOpacity>
  );
};

const TopNavigator = ({ options }) => {
  const currentRoute = useRoute();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);

  const openFeedbackModal = () => setFeedbackModalVisible(true);
  const closeFeedbackModal = () => setFeedbackModalVisible(false);

  const isBookDetailsScreen = currentRoute.name === 'BookDetails';
  const isAuthorDetailScreen = currentRoute.name === 'AuthorDetail';


  const truncateTitle = (title) => {
    if (title.length > 35) {
      return title.slice(0, 35) + '...';
    }
    return title;
  };

  const renderTitle = () => {
    if (isBookDetailsScreen) {
      return (
        <Text style={styles.bookTitle}>{truncateTitle(options.title)}</Text>
      );
    }
    if (isAuthorDetailScreen) {
      return (
        <Text style={styles.authorTitle}>{truncateTitle(options.authorName)}</Text>
      );
    }
    if (Platform.OS === "ios") {
      return (
        <Avatar
          style={styles.logo}
          source={require('../assets/icon.png')}
        />
      );
    }
    return null;
  };

  return (
    <>
      <TopNavigation
        accessoryLeft={() => <LeftAccessory currentRoute={currentRoute} openFeedbackModal={openFeedbackModal} />}
        accessoryRight={() => <SearchAction />}
        alignment="center"
        title={renderTitle}
        style={styles.topNavigation}
      />
      <FeedbackModal visible={feedbackModalVisible} onClose={closeFeedbackModal} />
    </>
  );
};



const AnimatedTabBarIcon = ({ focused, children }) => {
  const shadowOpacity = useSharedValue(focused ? 0.3 : 0.1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(focused ? 1.2 : 1, { duration: 250 }) }],
    shadowOpacity: withTiming(shadowOpacity.value, { duration: 250 }),
  }));

  return <Animated.View style={[animatedStyle, { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 }]}>{children}</Animated.View>;
};


const TabNavigator = () => (
  <Tab.Navigator initialRouteName="Calendar"
    screenOptions={{
      tabBarStyle: styles.tabBar,
      tabBarActiveTintColor: '#4DB6AC',
      tabBarInactiveTintColor: '#333',
      tabBarLabelStyle: {
        fontFamily: 'Lora_600Regular',
        padding: 5,
        fontSize: 14,
      },
    }}
  >
    <Tab.Screen
      name="Profile"
      component={ProfileScreen}
      options={{
        tabBarLabel: "Profile",
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <GradientIcon name="account" size={32} colors={['#80CBC4', '#4DB6AC']} />
        ),
      }}
    />
    <Tab.Screen
      name="Calendar"
      component={CalendarScreen}
      options={{
        tabBarLabel: "Calendar",
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <GradientIcon name="calendar" size={32} colors={['#80CBC4', '#4DB6AC']} />
        ),
      }}
    />
    <Tab.Screen
      name="Discover"
      component={DiscoverScreen}
      options={{
        tabBarLabel: "Discover",
        headerShown: false,
        tabBarIcon: ({ color }) => (
          <GradientIcon name="compass" size={32} colors={['#80CBC4', '#4DB6AC']} />
        ),
      }}
    />
  </Tab.Navigator>
);


export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={({ route, navigation }) => ({
        header: (props) => (
          <TopNavigator
            {...props}
            options={
              route.name === 'BookDetails'
                ? { title: route.params?.book?.title || 'Book Title' }
                : route.name === 'AuthorDetail'
                ? { authorName: route.params?.author?.name || 'Author Name' }
                : {}
            }
          />
        ),
      })}
    >
      <Stack.Screen name="Home" component={TabNavigator} />
      <Stack.Screen
        name="BookDetails"
        component={BookDetailScreen}
        options={({ route }) => ({
          title: route.params?.book?.title || 'Book Title',
        })}
      />
      <Stack.Screen
        name="AuthorDetail"
        component={AuthorDetailScreen}
        options={({ route }) => ({
          authorName: route.params?.author?.name || 'Author Name',
        })}
      />
      <Stack.Screen name="Search" component={SearchScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

const styles = StyleSheet.create({
  topNavigation: {
    backgroundColor: '#F2F2F2',
    paddingVertical: 20,
    paddingHorizontal: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    height: 90,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    borderTopColor: 'black',
    borderTopWidth: 0.2,
    elevation: 10,
  },
  logo: {
    marginHorizontal: 16,
    borderRadius: 0,
  },
  iconWrapper: {
    paddingLeft: 10,
  },
  bookTitleContainer: {
    alignItems: 'center',
    maxWidth: '80%',
  },
  bookTitle: {
    fontFamily: 'Lora_600Regular',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginVertical: 5,
  },
  authorTitle: {
    fontFamily: 'Lora_600Regular',
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
    marginVertical: 5,
  },
});

