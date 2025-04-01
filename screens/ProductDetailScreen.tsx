import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  ActivityIndicator
} from 'react-native';
import { RouteProp, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList} from '../App';
import { Trade, Product, User } from '../types';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/MaterialIcons';



type ProductDetailScreenRouteProp = RouteProp<RootStackParamList, 'ProductDetail'>;

interface ProductDetailScreenProps {
  route: ProductDetailScreenRouteProp;
}

const { width } = Dimensions.get('window');


const ProductDetailScreen: React.FC<ProductDetailScreenProps> = ({ route }) => {

  const [showTradeModal, setShowTradeModal] = useState(false);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const navigation = useNavigation();
  const { product } = route.params;
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    };

    loadUserData();
  }, []);

  const loadUserProducts = async () => {
    setLoading(true);
    try {
      const storedUser = await AsyncStorage.getItem('currentUser');
      const storedProducts = await AsyncStorage.getItem('products');
      
      if (storedUser && storedProducts) {
        const userData = JSON.parse(storedUser);
        const allProducts: Product[] = JSON.parse(storedProducts);
        
        const filteredProducts = allProducts.filter(
          p => p.ownerEmail === userData.email && p.id !== product.id && p.status === 'available'
        );
        
        setUserProducts(filteredProducts);
        
        if (filteredProducts.length === 0) {
          Alert.alert('Aviso', 'Cadastre produtos antes de trocar!');
          setShowTradeModal(false);
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Falha ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTrade = async () => {
    if (!selectedProduct) {
      Alert.alert('Selecione um item para troca');
      return;
    }

    if (product.status === 'traded') {
      Alert.alert('Este produto já foi trocado');
      return;
    }
  
    const newTrade = {
      id: Date.now().toString(),
      fromProduct: selectedProduct,
      toProduct: product,
      message,
      status: 'pending',
      date: new Date().toISOString(),
    };
  
    try {
      const existingTrades = await AsyncStorage.getItem('trades');
      const trades = existingTrades ? JSON.parse(existingTrades) : [];
      await AsyncStorage.setItem('trades', JSON.stringify([...trades, newTrade]));
      
      Alert.alert('Sucesso', 'Proposta enviada!');
      setShowTradeModal(false);
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar proposta');
    }
  };

  const handleTrade = () => {
      console.log('Current User:', currentUser);
      console.log('Product Owner:', product.ownerEmail);
      
      if (!currentUser) {
        Alert.alert('Erro', 'Usuário não autenticado');
        return;
      }
      
      if (currentUser.email === product.ownerEmail) {
        Alert.alert('Aviso', 'Você é o dono deste produto');
        return;
      }
      
      setShowTradeModal(true);
      loadUserProducts();
  };

  return (
    
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <ScrollView horizontal pagingEnabled style={styles.imageScroll}>
          {product.images.map((uri: string, index: number) => (
            <Image key={index} source={{ uri }} style={styles.image} />
          ))}
        </ScrollView>
        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{product.name}</Text>
          <Text style={styles.descricao}>Descrição: {product.description}</Text>
          <Text style={styles.text}>Qualidade: {product.quality}</Text>
          <Text style={styles.text}>Valor: R$ {product.value}</Text>
          <Text style={styles.text}>
            Local: {product.city} - {product.state}
          </Text>
          <Text style={styles.text}>Tags: {product.tags}</Text>
          <Text style={styles.text}>
            Rating do anunciante:{' '}
            {product.ownerRating ? '⭐'.repeat(product.ownerRating) : 'Sem avaliação'}
          </Text>
          <Text style={styles.text}>
            Status: {product.status === 'available' ? 'Disponível para troca' : 'Trocado'}
          </Text>
        </View>
      </ScrollView>
      {/* Só exibe o botão se o usuário logado não for o dono do anúncio */}
      {currentUser && currentUser.email !== product.ownerEmail && (
        <TouchableOpacity style={styles.tradeButton} onPress={handleTrade}>
          <Text style={styles.tradeButtonText}>Trocar</Text>
        </TouchableOpacity>
      )}
      <Modal
        isVisible={showTradeModal}
        onBackdropPress={() => setShowTradeModal(false)}
        style={styles.modal}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowTradeModal(false)}
          >
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>Selecione seu item para troca</Text>
          
          {loading ? (
            <ActivityIndicator size="large" color="#007bff" />
          ) : (
            <FlatList
              data={userProducts}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.productItem,
                    selectedProduct?.id === item.id && styles.selectedItem
                  ]}
                  onPress={() => setSelectedProduct(item)}
                >
                  <Image
                    source={{ uri: item.images[0] }}
                    style={styles.productImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productName}>{item.name}</Text>
                    <Text>R$ {item.value}</Text>
                  </View>
                </TouchableOpacity>
              )}
            />
          )}

          <TextInput
            placeholder="Mensagem para o vendedor..."
            placeholderTextColor="#666"
            style={styles.messageInput}
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmitTrade}
          >
            <Text style={styles.buttonText}>Enviar Proposta</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    justifyContent: 'flex-end',
    margin: 0,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 22,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    minHeight: '50%',
  },
  closeButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  selectedItem: {
    backgroundColor: '#e3f2fd',
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 10,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
  },
  messageInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
    minHeight: 100,
    marginVertical: 15,
  },
  submitButton: {
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  container: { flex: 1, backgroundColor: 'white' },
  scrollContainer: { paddingBottom: 80 },
  imageScroll: { height: 250 },
  image: { width, height: 250, resizeMode: 'cover' },
  detailsContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: 'black', marginBottom: 10 },
  descricao: { fontSize: 18, color: 'black', marginBottom: 10 },
  text: { fontSize: 16, color: 'black', marginBottom: 5 },
  tradeButton: {
    position: 'absolute',
    bottom: 20,
    left: (width - 200) / 2,
    width: 200,
    backgroundColor: '#007bff',
    padding: 15,
    borderRadius: 30,
    alignItems: 'center',
    elevation: 5,
  },
  tradeButtonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default ProductDetailScreen;
