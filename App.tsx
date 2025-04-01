import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import ProductScreen from './screens/ProductScreen';
import ProfileScreen from './screens/ProfileScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import TermosScreen from './screens/termos';
import ReceivedProposalsScreen from './screens/ReceivedProposalsScreen';
import { Trade, Product, User } from './types';


export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  Product: undefined;
  Profile: undefined;
  Termos: undefined;
  ProductDetail: { product: Product };
  ReceivedProposals: { trade: Trade };
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Termos" component={TermosScreen} options={{ headerShown: true, title: 'Termos de Uso' }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ProductDetail" component={ProductDetailScreen} options={{ title: 'Detalhes do Produto' }} />
        <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Novo Produto' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Meu Perfil' }} />
        <Stack.Screen name="ReceivedProposals" component={ReceivedProposalsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;