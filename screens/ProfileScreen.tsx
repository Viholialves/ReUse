import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Trade, Product, User } from '../types';

  
const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState<User | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const currentUserStr = await AsyncStorage.getItem('currentUser');
      const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
      setUser(currentUser);

      // Carregar trades
      const tradesData = await AsyncStorage.getItem('trades');
      const allTrades: Trade[] = tradesData ? JSON.parse(tradesData) : [];
      const userTrades = allTrades.filter(t => 
        t.fromProduct.ownerEmail === currentUser?.email &&
        t.status !== 'canceled' // Adicione este filtro
      );
      setTrades(userTrades);

      // Carregar produtos
      const productsData = await AsyncStorage.getItem('products');
      const allProducts: Product[] = productsData ? JSON.parse(productsData) : [];
      const userProducts = allProducts.filter(p => 
        p.ownerEmail === currentUser?.email
      );
      setProducts(userProducts);
    };

    loadData();
  }, []);

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
            
            // Atualizar apenas a trade específica
            const updatedTrades = allTrades.map(t => 
              t.id === trade.id ? { ...t, status: 'canceled' } : t
            );
            
            await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
            setTrades(updatedTrades.filter(t => 
              t.fromProduct.ownerEmail === user?.email &&
              t.status !== 'canceled'
            ));
          }
        }
      ]
    );
  };

  const renderTradeItem = ({ item }: { item: Trade }) => (
    <View style={styles.tradeItem}>
      <View style={styles.tradeInfo}>
        <Text style={styles.tradeStatus}>
          Status: {item.status === 'pending' ? '⏳ Pendente' : 
                  item.status === 'accepted' ? '✅ Aceita' : 
                  item.status === 'rejected' ? '❌ Recusada' : '🚫 Cancelada'}
        </Text>
        <Text>Oferecido: {item.fromProduct.name}</Text>
        <Text>Desejado: {item.toProduct.name}</Text>
        <Text>Mensagem: {item.message}</Text>
        <Text>Data: {new Date(item.createdAt).toLocaleDateString()}</Text>
      </View>
      
      {item.status === 'pending' && (
        <TouchableOpacity 
          style={styles.cancelButton}
          onPress={() => handleCancelTrade(item)}
        >
          <Icon name="cancel" size={20} color="red" />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productItem}>
      {item.images.length > 0 && (
        <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      )}
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text>Valor: R$ {item.value.toFixed(2)}</Text>
        <Text>Qualidade: {item.quality}</Text>
        <Text>Status: {item.status === 'available' ? 'Disponível' : 'Trocado'}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {user && (
        <>
          <View style={styles.profileHeader}>
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.profileImage} />
            ) : (
              <Image source={require('../assets/profile.png')} style={styles.profileImage} />
            )}
            <View style={styles.profileInfo}>
              <Text style={styles.title}>{user.name}</Text>
              <Text style={styles.email}>{user.email}</Text>
              <Text style={styles.rating}>
                Avaliação: {user.rating ? '⭐'.repeat(user.rating) : 'Sem avaliação'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => { navigation.navigate('ReceivedProposals') }}>
              <Text>Propostas{"\n"}Recebidas </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Suas Propostas de Troca</Text>
          
          <FlatList
            data={trades}
            renderItem={renderTradeItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />

          <Text style={styles.sectionTitle}>Seus Produtos</Text>
          <FlatList
            data={products}
            renderItem={renderProductItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={styles.listContent}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  rating: {
    fontSize: 16,
    color: '#f39c12',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 16,
    color: '#2c3e50',
  },
  tradeItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  tradeInfo: {
    flex: 1,
  },
  tradeStatus: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  cancelButton: {
    padding: 8,
    alignSelf: 'flex-start',
  },
  productItem: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  productImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default ProfileScreen;