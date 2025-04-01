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
import { useAlert } from '../context/AlertContext';

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
  const { showAlert } = useAlert();
  

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
      showAlert('warning', 'Atenção', 'Limite de 4 imagens atingido');
      return;
    }
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        //showAlert('error','' ,'Seleção cancelada');
      } else if (response.errorMessage) {
        showAlert('error', 'Error', response.errorMessage);
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
      showAlert('warning', 'Atenão', 'Limite de 4 imagens atingido');
      return;
    }
    launchCamera({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        //Alert.alert('Captura cancelada');
      } else if (response.errorMessage) {
        showAlert('error', 'Erro', response.errorMessage);
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
        showAlert('error', 'Erro', 'O nome do produto é obrigatório');
        return;
      }

      if (description === null || description.trim() === '') {
        showAlert('error', 'Erro', 'A descrição do produto é obrigatória');
        return;
      }
    
      if (value === null || value < 0) {
        showAlert('error', 'Erro', 'Insira um valor válido para o produto');
        return;
      }
    
      if (images.length === 0) {
        showAlert('error', 'Erro', 'Adicione pelo menos uma foto do produto');
        return;
      }
    
      if (!stateField || !city) {
        showAlert('error', 'Erro', 'Selecione estado e cidade');
        return;
      }
    

    const currentUserStr = await AsyncStorage.getItem('currentUser');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
    if (!currentUser) {
      showAlert('error', 'Erro', 'Usuário não autenticado');
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
    showAlert('success', 'Sucesso', 'Produto adicionado');
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>

      <TouchableOpacity onPress={() => navigation.navigate('Home')} >
        <Text style={{textAlign: 'left', color: 'red', marginTop: 30, marginBottom: 50, fontWeight: 'bold'}}>Cancelar</Text>
      </TouchableOpacity>

      <Text style={{textAlign: 'center', color: 'white', fontWeight: 'bold', fontSize: 15, marginBottom: 10
      }}>Carregue até 4 fotos do produto</Text>

      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 10 }}>
        <TouchableOpacity onPress={selectImage} style={styles.imagePicker}>
          <Text style={{color: 'white', fontWeight: 'bold', fontSize: 15}}>Selecionar Foto</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={takePhoto} style={styles.imageTaker}>
          <Text style={{color: 'white', fontWeight: 'bold', fontSize: 15}}>Tirar Foto</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal style={styles.imageContainer}>
        {images.map((uri, index) => (
          <Image key={index} source={{ uri }} style={styles.image} />
        ))}
      </ScrollView>

      <Text style={styles.title}>Informações do Produto</Text>
      <Text style={styles.label}>Nome do Produto <Text style={styles.required}>*</Text></Text>
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
        style={styles.inputD}
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

      <Text style={styles.label}>Aceito trocar por: </Text>
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

      
      
      <TouchableOpacity onPress={handleSave}>
        <Text style={styles.save}>Salvar Produto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#386ea1' },
  title: {
    fontSize: 22,
    marginBottom: 30,
    textAlign: 'center',
    color: '#FFF',
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
  input: {
    borderWidth: 0,
    marginBottom: 10,
    height: 50,
    padding: 8,
    color: 'black',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  inputD: {
    borderWidth: 0,
    marginBottom: 10,
    height: 150,
    padding: 8,
    color: 'black',
    backgroundColor: 'white',
    borderRadius: 12,
  },
  
  placeholder: {color: '#FFFF'},

  label: { marginBottom: 5, fontWeight: 'bold', color: '#FFF' },
  
  pickerContainer: {
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    height: 50,
    borderRadius: 12,
    color: 'black',
    fontFamily: 'Poppins',
    fontSize: 16,
    backgroundColor: 'white',
  },
  save: {
    marginTop: 30,
    marginBottom: 80,
    color: '#386ea1',
    backgroundColor: 'white',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
    borderRadius: 21,
    height: 80,
    padding: 8,
  },
  
  picker: { fontSize: 15, height: 50, width: '100%', color: 'black' },
  
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  
  tag: { backgroundColor: '#ddd', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, flexDirection: 'row', alignItems: 'center', marginRight: 5, marginBottom: 5 },
  tagText: { marginRight: 4, color: 'black' },
  removeTag: { color: 'red', fontWeight: 'bold' },
  buttonContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  imageContainer: { marginVertical: 10 },
  image: { width: 100, height: 100, marginRight: 10 },
  imagePicker: {
    backgroundColor: '#337ca8',
    color: 'white',
    fontFamily: 'Popins',
    fontWeight: 'bold',
    height: 80,
    padding: 10,
    width: 150,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopLeftRadius: 21,
    borderBottomLeftRadius: 21,
    borderColor: 'white',
    borderLeftWidth: 1

  },
  imageTaker: {
    backgroundColor: '#337ca8',
    color: 'white',
    fontFamily: 'Popins',
    fontWeight: 'bold',
    height: 80,
    width: 150,
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 21,
    borderBottomRightRadius: 21,
    borderColor: 'white',
    borderLeftWidth: 1,
  },
});

export default ProductScreen;
