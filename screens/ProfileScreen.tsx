import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity,
  Alert,
  Dimensions
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trade, Product, User } from '../types';
import { RouteProp, useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const ProfileScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'trades' | 'available' | 'traded'>('trades');
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const navigation = useNavigation();

  // Carregar dados do usuário
  useEffect(() => {
    const loadData = async () => {
      const currentUserStr = await AsyncStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      setUser(currentUser);

      const tradesData = await AsyncStorage.getItem('trades');
      const allTrades: Trade[] = tradesData ? JSON.parse(tradesData) : [];
      
      // Mostrar trades onde o usuário é o remetente OU o destinatário
      setTrades(allTrades.filter(t => 
        t.fromProduct.ownerEmail === currentUser?.email || 
        t.toProduct.ownerEmail === currentUser?.email
      ));

      const productsData = await AsyncStorage.getItem('products');
      const allProducts: Product[] = productsData ? JSON.parse(productsData) : [];
      setProducts(allProducts.filter(p => p.ownerEmail === currentUser?.email));
    };

    loadData();
  }, []);

  // Filtros para os diferentes tipos de produtos
  const availableProducts = products.filter(p => p.status === 'available');
  const tradedProducts = products.filter(p => p.status === 'traded');

  // Renderizar abas
  const renderTabButton = (title: string, tabName: 'trades' | 'available' | 'traded') => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tabName && styles.activeTab]}
      onPress={() => setActiveTab(tabName)}
    >
      <Text style={[styles.tabText, activeTab === tabName && styles.activeTabText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  // Renderizar item de produto trocado com par
  const renderTradedItem = ({ item }: { item: Trade }) => (
    <View style={styles.tradedPairContainer}>
      <ProductCard product={item.fromProduct} />
      <Image source={require('../assets/trocado.png')} style={styles.swapIcon} />
      <ProductCard product={item.toProduct} />
    </View>
  );

  // Componente de card de produto reutilizável
  const ProductCard = ({ product }: { product: Product }) => (
    <View style={styles.productCard}>
      {product.images.length > 0 && (
        <Image source={{ uri: product.images[0] }} style={styles.productImage} />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text>R$ {product.value.toFixed(2)}</Text>
        <Text>Qualidade: {product.quality}</Text>
      </View>
    </View>
  );

  const handleCancelTrade = async (trade: Trade) => {
    Alert.alert(
      'Cancelar Proposta',
      'Tem certeza que deseja cancelar esta proposta?',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Sim',
          onPress: async () => {
            const tradesData = await AsyncStorage.getItem('trades');
            const allTrades: Trade[] = tradesData ? JSON.parse(tradesData) : [];
            
            const updatedTrades = allTrades.map(t => 
              t.id === trade.id ? { ...t, status: 'canceled' } : t
            );
            
            await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
            setTrades(updatedTrades.filter(t => 
              t.fromProduct.ownerEmail === user?.email || 
              t.toProduct.ownerEmail === user?.email
            ));
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('Home') }>
          <Image source={require('../assets/logo.png')} style={styles.logoImage} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Image source={require('../assets/arrow-left.png')} style={styles.backIcon} />
        </TouchableOpacity>
      </View>

      {user && (
        <>
          {/* Header do perfil */}
          <View style={styles.profileHeader}>
            <Image
              source={user.profilePicture ? { uri: user.profilePicture } : require('../assets/profile.png')}
              style={styles.profileImage}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user.name}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
              <Text style={styles.rating}>
                Avaliação: {user.rating ? '⭐'.repeat(user.rating) : 'Sem avaliação'}
              </Text>
            </View>
          </View>

          {/* Abas de navegação */}
          <View style={styles.tabContainer}>
            {renderTabButton('Propostas', 'trades')}
            {renderTabButton('Disponíveis', 'available')}
            {renderTabButton('Trocados', 'traded')}
          </View>

          {/* Conteúdo das abas */}
          {activeTab === 'trades' && (
            <FlatList
              data={trades}
              renderItem={({ item }) => (
                <View style={styles.tradeItem}>
                  <Text style={styles.tradeStatus}>
                    {item.status === 'pending' ? '⏳ Pendente' : 
                     item.status === 'accepted' ? '✅ Aceita' : 
                     item.status === 'rejected' ? '❌ Recusada' : '🚫 Cancelada'}
                  </Text>
                  <View style={styles.tradeDirection}>
                    {item.fromProduct.ownerEmail === user?.email ? (
                      <>
                        <Text style={styles.tradeLabel}>Você ofereceu:</Text>
                        <ProductCard product={item.fromProduct} />
                        <Text style={styles.tradeLabel}>Por:</Text>
                        <ProductCard product={item.toProduct} />
                      </>
                    ) : (
                      <>
                        <Text style={styles.tradeLabel}>Você recebeu:</Text>
                        <ProductCard product={item.toProduct} />
                        <Text style={styles.tradeLabel}>Por:</Text>
                        <ProductCard product={item.fromProduct} />
                      </>
                    )}
                  </View>
                  {item.status === 'pending' && (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={() => handleCancelTrade(item)}
                    >
                      <Image source={ require('../assets/cancel.png')} style={{ height: 20, width: 20 }} />
                      {/*<Icon name="cancel" size={20} color="red" />*/}
                    </TouchableOpacity>
                  )}
                </View>
              )}
              keyExtractor={(item) => item.id}
            />
          )}

          {activeTab === 'available' && (
            <FlatList
              data={availableProducts}
              numColumns={2}
              renderItem={({ item }) => <ProductCard product={item} />}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={styles.gridContent}
            />
          )}

          {activeTab === 'traded' && (
            <FlatList
              data={trades.filter(t => t.status === 'accepted')}
              renderItem={renderTradedItem}
              keyExtractor={(item) => item.id}
            />
          )}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#386ea1',
    paddingTop: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backIcon: {
    width: 30,
    height: 30,
    tintColor: 'white',
  },
  logoImage: {
    width: 40,
    height: 42,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  rating: {
    fontSize: 14,
    color: '#f39c12',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    marginBottom: 20,
  },
  tabButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#386EA1',
  },
  tabText: {
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#386EA1',
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    margin: 4,
    width: (width / 2) - 24,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: 120,
    borderRadius: 4,
    resizeMode: 'cover',
  },
  productInfo: {
    paddingTop: 8,
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  tradeItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
  },
  tradeStatus: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#386EA1',
    textAlign: 'center',
  },
  tradeDirection: {
    marginTop: 10,
  },
  tradeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
    fontStyle: 'italic',
  },
  tradedPairContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    
    backgroundColor: '#1c3750',
    borderRadius: 10,
    padding: 10,
    marginHorizontal: 20,
    marginBottom: 15,
    elevation: 3,
  },
  swapIcon: {
    width: 30,
    height: 30,
    marginHorizontal: 5,
  },
  cancelButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    padding: 5,
  },
  gridContent: {
    paddingHorizontal: 16,
  },
});

export default ProfileScreen;