// screens/ProductScreen.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Trade, Product, User } from '../types';
import { Picker } from '@react-native-picker/picker';
import CurrencyInput from 'react-native-currency-input';
import { Float } from 'react-native/Libraries/Types/CodegenTypes';

type ProductScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Product'>;

interface ProductScreenProps {
  navigation: ProductScreenNavigationProp;
}

// Opções de qualidade disponíveis
const qualityOptions = ['Novo', 'Perfeito estado', 'Bom estado', 'Com marcas de uso'];

// Estados e cidades (exemplo)
const statesAndCities: { [key: string]: string[] } = {
  AC: ['Acrelândia', 'Assis Brasil', 'Brasiléia'],
  AL: ['Água Branca', 'Anadia', 'Arapiraca'],
  AM: ['Alvarães', 'Amaturá', 'Anamã'],
  AP: ['Amapá', 'Calçoene', 'Cutias'],
  BA: ['Abaíra', 'Abaré', 'Acajutiba'],
  CE: ['Abaiara', 'Acarape', 'Acaraú'],
  DF: ['Brasília'],
  ES: ['Afonso Cláudio', 'Água Doce do Norte'],
  GO: ['Abadia de Goiás', 'Abadiânia'],
  MA: ['Açailândia', 'Afonso Cunha'],
  MG: ['Abadia dos Dourados', 'Abaeté'],
  MS: ['Água Clara', 'Alcinópolis'],
  MT: ['Acorizal', 'Água Boa'],
  PA: ['Abaetetuba', 'Abel Figueiredo'],
  PB: ['Água Branca', 'Aguiar'],
  PE: ['Abreu e Lima', 'Afogados da Ingazeira'],
  PI: ['Acauã', 'Agricolândia'],
  PR: ['Abatiá', 'Adrianópolis'],
  RJ: ['Angra dos Reis', 'Aperibé'],
  RN: ['Acari', 'Açu'],
  RO: ['Alta Floresta d\'Oeste', 'Alto Alegre dos Parecis'],
  RR: ['Alto Alegre', 'Amajari'],
  RS: ['Aceguá', 'Água Santa'],
  SC: ['Abdon Batista', 'Abelardo Luz'],
  SE: ['Amparo de São Francisco', 'Aquidabã'],
  SP: ['Adamantina', 'Adolfo'],
  TO: ['Abreulândia', 'Araguaina', 'Palmas', 'Colinas do Tocantins'],
};

const ProductScreen: React.FC<ProductScreenProps> = ({ navigation }) => {
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [quality, setQuality] = useState<string>(qualityOptions[0]);
  const [tagInput, setTagInput] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [value, setValue] = useState<number | null>(0);
  const [city, setCity] = useState<string>('');
  const [stateField, setStateField] = useState<string>('SP');
  

  // Atualiza a cidade quando o estado mudar
  useEffect(() => {
    const cities = statesAndCities[stateField];
    if (cities && cities.length > 0) {
      setCity(cities[0]);
    } else {
      setCity('');
    }
  }, [stateField]);

  const selectImage = () => {
    if (images.length >= 4) {
      Alert.alert('Limite de 4 imagens atingido');
      return;
    }
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        Alert.alert('Seleção cancelada');
      } else if (response.errorMessage) {
        Alert.alert(response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        if (uri) {
          setImages([...images, uri]);
        }
      }
    });
  };

  const takePhoto = () => {
    if (images.length >= 4) {
      Alert.alert('Limite de 4 imagens atingido');
      return;
    }
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        Alert.alert('Captura cancelada');
      } else if (response.errorMessage) {
        Alert.alert(response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const uri = response.assets[0].uri;
        if (uri) {
          setImages([...images, uri]);
        }
      }
    });
  };

  // Função para adicionar uma tag quando o usuário digitar espaço
  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag.length > 0 && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
    }
    setTagInput('');
  };

  // Remove uma tag clicada
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async () => {

    if (!name.trim()) {
        Alert.alert('Erro', 'O nome do produto é obrigatório');
        return;
      }

      if (description === null || description.trim() === '') {
        Alert.alert('Erro', 'A descrição do produto é obrigatória');
        return;
      }
    
      if (value === null || value < 0) {
        Alert.alert('Erro', 'Insira um valor válido para o produto');
        return;
      }
    
      if (images.length === 0) {
        Alert.alert('Erro', 'Adicione pelo menos uma foto do produto');
        return;
      }
    
      if (!stateField || !city) {
        Alert.alert('Erro', 'Selecione estado e cidade');
        return;
      }
    

    const currentUserStr = await AsyncStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (!currentUser) {
      Alert.alert('Usuário não autenticado');
      return;
    }
    const formattedTags = tags.join(', ');

    const newProduct: Product = { 
      id: Math.random(),
      name, 
      description,
      quality, 
      tags: formattedTags.split(', '), 
      value: (value ?? 0), 
      city, 
      state: stateField, 
      images, 
      ownerEmail: currentUser.email,
      status: 'available', 
    };
    const storedProducts = await AsyncStorage.getItem('products');
    const products: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
    products.push(newProduct);
    await AsyncStorage.setItem('products', JSON.stringify(products));
    Alert.alert('Produto adicionado');
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <View style={styles.buttonContainer}>
        <Button title="Selecionar Imagem" onPress={selectImage} />
        <Button title="Tirar Foto" onPress={takePhoto} />
      </View>
      <ScrollView horizontal style={styles.imageContainer}>
        {images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>

      <Text style={styles.title}>Adicionar Produto <Text style={styles.required}>*</Text></Text>
      <TextInput 
        placeholder="Nome do Produto"
        placeholderTextColor="gray"
        value={name} 
        onChangeText={setName} 
        style={styles.input} 
      />

      <Text style={styles.label}>Descrição <Text style={styles.required}>*</Text></Text>
      
      <TextInput 
        placeholder="Descrição do Produto"
        placeholderTextColor="gray"
        value={description} 
        onChangeText={setDescription} 
        style={styles.input}
      />

      <Text style={styles.label}>Qualidade <Text style={styles.required}>*</Text></Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={quality}
          onValueChange={(itemValue) => setQuality(itemValue)}
          style={styles.picker}
        >
          {qualityOptions.map((option) => (
            <Picker.Item key={option} label={option} value={option} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Tags</Text>
      <View style={styles.tagsContainer}>
        {tags.map((tag, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{tag}</Text>
            <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
              <Text style={styles.removeTag}>×</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TextInput
        placeholder="Adicionar tag (aperte espaço para confirmar)"
        value={tagInput}
        onChangeText={(text) => {
          if (text.endsWith(' ')) {
            handleAddTag();
          } else {
            setTagInput(text);
          }
        }}
        style={styles.input}
      />

      <Text style={styles.label}>Valor do Produto<Text style={styles.required}>*</Text></Text>
      <CurrencyInput
        value={value}
        onChangeValue={setValue}
        prefix="R$ "
        delimiter="."
        separator=","
        precision={2}
        style={styles.input}
        keyboardType="numeric"
      />

      <Text style={styles.label}>Estado<Text style={styles.required}>*</Text></Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={stateField}
          onValueChange={(itemValue) => setStateField(itemValue)}
          style={styles.picker}
        >
          {Object.keys(statesAndCities).map((st) => (
            <Picker.Item key={st} label={st} value={st} />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Cidade<Text style={styles.required}>*</Text></Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={city}
          onValueChange={(itemValue) => setCity(itemValue)}
          style={styles.picker}
        >
          {(statesAndCities[stateField] || []).map((ct) => (
            <Picker.Item key={ct} label={ct} value={ct} />
          ))}
        </Picker>
      </View>

      
      <Button title="Salvar Produto" onPress={handleSave} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: {
    fontSize: 22,
    marginBottom: 10,
    textAlign: 'center',
    color: 'black',
    fontWeight: 'bold',
  },
  required: {
    color: 'red',
    fontSize: 16,
  },
  error: {
    color: 'red',
    marginBottom: 10,
  },
  imageWarning: {
    color: 'red',
    marginTop: 5,
    fontSize: 12,
  },
  input: { borderWidth: 1, marginBottom: 10, padding: 8, color: 'black' },
  
  placeholder: {color: 'black'},

  label: { marginBottom: 5, fontWeight: 'bold', color: 'black' },
  
  pickerContainer: { borderWidth: 1, marginBottom: 10, color: 'black' },
  
  picker: { height: 50, width: '100%', color: 'black' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  
  tag: { backgroundColor: '#ddd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginRight: 5, marginBottom: 5 },
  tagText: { marginRight: 4, color: 'black' },
  removeTag: { color: 'red', fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  imageContainer: { marginVertical: 10 },
  image: { width: 100, height: 100, marginRight: 10 },
});

export default ProductScreen;
