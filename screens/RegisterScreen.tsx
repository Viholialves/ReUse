// screens/RegisterScreen.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Image, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { User } from '../types';

type RegisterScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
}


const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [profilePicture, setProfilePicture] = useState<string | null>(null);

  const selectImage = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 1 }, response => {
      if (response.assets && response.assets.length > 0) {
        setProfilePicture(response.assets[0].uri || null);
      }
    });
  };

  const takePhoto = () => {
    launchCamera({ mediaType: 'photo', quality: 1 }, response => {
      if (response.assets && response.assets.length > 0) {
        setProfilePicture(response.assets[0].uri || null);
      }
    });
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !profilePicture) {
      Alert.alert('Erro', 'Todos os campos, incluindo a foto de perfil, são obrigatórios.');
      return;
    }
    const newUser: User = { name, email, password, profilePicture, rating: 0, ratings: [] };
    const storedUsers = await AsyncStorage.getItem('users');
    const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
    users.push(newUser);
    await AsyncStorage.setItem('users', JSON.stringify(users));
    Alert.alert('Usuário registrado com sucesso!');
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registro</Text>
      <TextInput placeholder="Nome" value={name} onChangeText={setName} style={styles.input} />
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} style={styles.input} autoCapitalize='none' />
      <TextInput placeholder="Senha" value={password} onChangeText={setPassword} style={styles.input} secureTextEntry />
      <TouchableOpacity onPress={selectImage} style={styles.imagePicker}>
        <Text>Selecionar Foto</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={takePhoto} style={styles.imagePicker}>
        <Text>Tirar Foto</Text>
      </TouchableOpacity>
      {profilePicture && <Image source={{ uri: profilePicture }} style={styles.profileImage} />}
      <Button title="Registrar" onPress={handleRegister} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20, textAlign: 'center', color: 'black' },
  input: { borderWidth: 1, marginBottom: 10, padding: 8, color: 'black' },
  placeholder: { color: 'black' },
  imagePicker: { backgroundColor: '#DDD', padding: 10, marginBottom: 10, alignItems: 'center' },
  profileImage: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', marginTop: 10 },
});

export default RegisterScreen;
