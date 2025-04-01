import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  Button, 
  StyleSheet, 
  ScrollView, 
  Alert,
  TouchableOpacity,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { User, Trade, Product } from "../types";

const DebugScreen: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [editData, setEditData] = useState<string>('');
  const [editType, setEditType] = useState<'users' | 'products' | 'trades'>('users');
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [showRawData, setShowRawData] = useState({
    users: false,
    products: false,
    trades: false
  });

  const loadData = async () => {
    try {
      const [usersData, productsData, tradesData] = await Promise.all([
        AsyncStorage.getItem('users'),
        AsyncStorage.getItem('products'),
        AsyncStorage.getItem('trades')
      ]);

      setUsers(usersData ? JSON.parse(usersData) : []);
      setProducts(productsData ? JSON.parse(productsData) : []);
      setTrades(tradesData ? JSON.parse(tradesData) : []);
      setSelectedItem('');
      setEditData('');
    } catch (error) {
      Alert.alert('Erro ao carregar dados', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getItems = (): (User | Product | Trade)[] => {
    switch(editType) {
      case 'users': return users;
      case 'products': return products;
      case 'trades': return trades;
      default: return [];
    }
  };

  const handleUpdate = async () => {
    try {
      if (!selectedItem) return Alert.alert('Selecione um item primeiro');
      
      const key = editType;
      const currentData = await AsyncStorage.getItem(key);
      const parsedData = currentData ? JSON.parse(currentData) : [];
      
      const updatedData = parsedData.map((item: User | Product | Trade) => 
        item.id === selectedItem ? JSON.parse(editData) : item
      );

      await AsyncStorage.setItem(key, JSON.stringify(updatedData));
      loadData();
      Alert.alert('Sucesso', 'Registro atualizado!');
    } catch (error) {
      Alert.alert('Erro ao atualizar', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDelete = async () => {
    try {
      if (!selectedItem) return Alert.alert('Selecione um item primeiro');
      
      const key = editType;
      const currentData = await AsyncStorage.getItem(key);
      const filteredData = currentData ? 
        JSON.parse(currentData).filter((item: User | Product | Trade) => item.id !== selectedItem) : [];

      await AsyncStorage.setItem(key, JSON.stringify(filteredData));
      loadData();
      Alert.alert('Sucesso', 'Registro deletado!');
    } catch (error) {
      Alert.alert('Erro ao deletar', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const nuclearReset = async () => {
    Alert.alert(
      'Resetar tudo?',
      'Isso apagará TODOS os dados!',
      [
        {text: 'Cancelar', style: 'cancel'},
        {
          text: 'Confirmar',
          onPress: async () => {
            await AsyncStorage.clear();
            loadData();
            Alert.alert('Sistema resetado!');
          }
        }
      ]
    );
  };

  const renderRawData = (data: any[], type: 'users' | 'products' | 'trades') => (
    <View style={styles.section}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => setShowRawData(prev => ({
          ...prev, 
          [type]: !prev[type]
        }))}
      >
        <Text style={styles.sectionTitle}>
          {type.toUpperCase()} ({data.length})
        </Text>
      </TouchableOpacity>
      
      {showRawData[type] && (
        <Text style={styles.json}>
          {JSON.stringify(data, null, 2)}
        </Text>
      )}
    </View>
  );

  const renderComboBox = () => (
    <View style={styles.combobox}>
      <Picker
        selectedValue={selectedItem}
        onValueChange={(itemValue) => {
          setSelectedItem(itemValue);
          const selected = getItems().find(item => item.id === itemValue);
          setEditData(selected ? JSON.stringify(selected, null, 2) : '');
        }}
        mode="dropdown"
        style={styles.picker}
      >
        <Picker.Item label="Selecione um item..." value="" />
        {getItems().map(item => (
          <Picker.Item 
            key={item.id} 
            label={`${item.id} - ${getItemLabel(item)}`} 
            value={item.id} 
          />
        ))}
      </Picker>
    </View>
  );

  const getItemLabel = (item: User | Product | Trade) => {
    switch(editType) {
      case 'users': return (item as User).email;
      case 'products': return (item as Product).name;
      case 'trades': return `Trade: ${(item as Trade).status}`;
      default: return '';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>DEBUG SCREEN</Text>

      {/* Controles principais */}
      <View style={styles.controls}>
        <Button title="Recarregar dados" onPress={loadData} />
        <Button title="Reset Nuclear" onPress={nuclearReset} color="red" />
      </View>

      {/* Editor de registros */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>EDITOR DE REGISTROS</Text>
        
        {/* Seletor de tipo */}
        <View style={styles.selector}>
          {['users', 'products', 'trades'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeButton,
                editType === type && styles.selectedType
              ]}
              onPress={() => {
                setEditType(type as any);
                setSelectedItem('');
                setEditData('');
              }}
            >
              <Text style={styles.typeText}>{type.toUpperCase()}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Combobox */}
        {renderComboBox()}

        {/* Editor de JSON */}
        <TextInput
          style={[styles.input, styles.jsonEditor]}
          placeholder={`Edite os dados do ${editType}...`}
          value={editData}
          onChangeText={setEditData}
          multiline
          editable={!!selectedItem}
        />

        {/* Controles */}
        <View style={styles.buttonRow}>
          <Button 
            title="Atualizar" 
            onPress={handleUpdate} 
            disabled={!selectedItem} 
          />
          <Button 
            title="Deletar" 
            onPress={handleDelete} 
            color="red" 
            disabled={!selectedItem}
          />
        </View>
      </View>

      {/* Dados brutos */}
      {renderRawData(users, 'users')}
      {renderRawData(products, 'products')}
      {renderRawData(trades, 'trades')}

      {/* Status do storage */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>STATUS DO STORAGE</Text>
        <Text>Usuários: {users.length}</Text>
        <Text>Produtos: {products.length}</Text>
        <Text>Trocas: {trades.length}</Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#f0f0f0'
  },
  title: { 
    fontSize: 24, 
    marginBottom: 20, 
    textAlign: 'center', 
    fontWeight: 'bold',
    color: '#333'
  },
  section: { 
    marginVertical: 10,
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#386EA1'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 10,
    padding: 8,
    borderRadius: 4,
    fontSize: 14
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    gap: 10
  },
  json: {
    backgroundColor: '#f8f8f8',
    padding: 10,
    borderRadius: 4,
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#333'
  },
  selector: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    gap: 5
  },
  typeButton: {
    padding: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    flex: 1,
    alignItems: 'center'
  },
  selectedType: {
    backgroundColor: '#386EA1',
  },
  typeText: {
    color: '#333',
    fontWeight: '500'
  },
  header: {
    padding: 5,
    borderRadius: 4
  },
  combobox: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    backgroundColor: Platform.OS === 'ios' ? '#f5f5f5' : 'white',
  },
  jsonEditor: {
    height: 200,
    textAlignVertical: 'top',
    fontFamily: 'monospace',
    fontSize: 12,
    backgroundColor: '#fff',
  },
});

export default DebugScreen;