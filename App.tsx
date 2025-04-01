import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import { Easing } from 'react-native';
import { Trade, Product } from './types';
import { CardStyleInterpolators, StackCardInterpolationProps } from '@react-navigation/stack';
import { AlertProvider } from './context/AlertContext';

//Telas
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import TermosScreen from './screens/termos';
import ReceivedProposalsScreen from './screens/ReceivedProposalsScreen';
import DebugScreen from './screens/debug';


export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Product: undefined;
  Profile: undefined;
  Termos: undefined;
  ProductDetail: { product: Product };
  ReceivedProposals: { trade: Trade };
  Debug: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const verticalAnimationInterpolator = ({ current, next, layouts }: StackCardInterpolationProps) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height, 0],
    extrapolate: 'clamp',
  });

  const opacity = current.progress.interpolate({
    inputRange: [1, 1],
    outputRange: [1, 1],
    extrapolate: 'clamp',
  });

  const nextTranslateY = next?.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -layouts.screen.height * 1],
    extrapolate: 'clamp',
  });

  return {
    cardStyle: {
      transform: [
        { translateY },
        ...(next ? [{ translateY: nextTranslateY }] : []),
      ],
      opacity,
    },
    containerStyle: {
      overflow: 'none',
    },
  };
};


const customTransition = {
  gestureEnabled: false,
  gestureDirection: 'vertical' as const,
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: {
        duration: 800,
        easing: Easing.out(Easing.ease),
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 800,
        easing: Easing.out(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: verticalAnimationInterpolator,
};


const verticalAnimationInterpolatorv2 = ({ current, next, layouts }: StackCardInterpolationProps) => {
  const translateY = current.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [layouts.screen.height, 0],
    extrapolate: 'clamp',
  });

  const opacity = current.progress.interpolate({
    inputRange: [1, 1],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextTranslateY = next?.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -layouts.screen.height * .2],
    extrapolate: 'clamp',
  });

  return {
    cardStyle: {
      transform: [
        { translateY },
        ...(next ? [{ translateY: nextTranslateY }] : []),
      ],
      opacity,
    },
    containerStyle: {
      overflow: 'none',
    },
  };
};


const AddProductTransition = {
  gestureEnabled: false,
  gestureDirection: 'vertical' as const,
  transitionSpec: {
    open: {
      animation: 'timing' as const,
      config: {
        duration: 500,
        easing: Easing.out(Easing.ease),
      },
    },
    close: {
      animation: 'timing' as const,
      config: {
        duration: 500,
        easing: Easing.out(Easing.ease),
      },
    },
  },
  cardStyleInterpolator: verticalAnimationInterpolatorv2,
};


const App: React.FC = () => {
  return (
    <AlertProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Login"
        >
          {/* Telas com animação personalizada */}
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{
              ...customTransition,
              headerShown: false,
            }}
          />
          <Stack.Screen 
            name="Register" 
            component={RegisterScreen}
            options={{
              ...customTransition,
              headerShown: false,
            }}
          />

          {/* Demais telas com comportamento padrão */}
          <Stack.Screen 
            name="Termos" 
            component={TermosScreen} 
            options={{ 
              headerShown: true, 
              title: 'Termos de Uso',
              // Resetar configurações de transição para padrão
              cardStyleInterpolator: CardStyleInterpolators.forFadeFromBottomAndroid
            }} 
          />
          <Stack.Screen name="Home" component={HomeScreen} options={{headerShown: false}} />
          <Stack.Screen 
            name="ProductDetail" 
            component={ProductDetailScreen} 
            options={{ title: 'Detalhes do Produto', headerShown: false}} 
          />
          <Stack.Screen 
            name="Product" 
            component={ProductScreen} 
            options={{
              ...AddProductTransition,
              headerShown: false, }} 
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen} 
            options={{ title: 'Meu Perfil', headerShown: false, }} 
          />
          <Stack.Screen 
            name="ReceivedProposals" 
            component={ReceivedProposalsScreen} 
            options={{
              headerShown: false,}}
          />
          <Stack.Screen 
            name="Debug" 
            component={DebugScreen} 
            options={{
              headerShown: true,}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </AlertProvider>
  );
};

export default App;