// screens/LoginScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Trade, Product, User } from '../types';

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
}


const LoginScreen: React.FC<LoginScreenProps> = ({ navigation }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');

  const handleLogin = async () => {
    try {
      const storedUsers = await AsyncStorage.getItem('users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const user = users.find(u => u.email === email && u.password === password);
  
      if (!user) {
        Alert.alert('Erro', 'E-mail ou senha incorretos');
        return;
      }
  
      await AsyncStorage.setItem('currentUser', JSON.stringify({
        name: user.name,
        email: user.email,
        rating: user.rating || 0,
        image: user.profilePicture || ''
      }));
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Home' }],
      });
      
    } catch (error) {
      Alert.alert('Erro', 'Ocorreu um erro ao fazer login');
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Registrar" onPress={() => navigation.navigate('Register')} />
      <Text style={styles.title}>Login</Text>
      <TextInput 
        placeholder="Email" 
        placeholderTextColor="black"
        autoCapitalize='none'
        value={email} 
        onChangeText={setEmail} 
        style={styles.input} 
      />
      <TextInput 
        placeholder="Senha" 
        placeholderTextColor="black"
        autoCapitalize='none'
        value={password} 
        onChangeText={setPassword} 
        style={styles.input} 
        secureTextEntry 
      />
      
      <Text>{"\n"}</Text>
      <Button title="Entrar" onPress={handleLogin} />
      <Text> {"\n"}{"\n"}</Text>
      <Button title="Termos de Uso" onPress={() => navigation.navigate('Termos')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 30, marginTop: 150, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  input: { borderWidth: 1, marginBottom: 10, padding: 8 },
  termos: { fontSize: 20, marginTop: 150, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
});

export default LoginScreen;
