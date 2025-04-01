import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import { Trade, Product, User } from '../types';
import { useAlert } from '../context/AlertContext';

type ReceivedProposalsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReceivedProposals'>;

interface Props {
  navigation: ReceivedProposalsScreenNavigationProp;
}


const colors = {
  primary: '#2f95dc',
  text: '#FFFF',
  border: '#0',
  background: '#386ea1',
};

const ReceivedProposalsScreen: React.FC<Props> = ({ navigation }) => {
  const [proposals, setProposals] = useState<Trade[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Trade | null>(null);
  const [rating, setRating] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const { showAlert } = useAlert();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const loadProposals = async () => {
      const currentUser = await AsyncStorage.getItem('currentUser');
      if (!currentUser) return;

      const trades = await AsyncStorage.getItem('trades');
      const allTrades: Trade[] = trades ? JSON.parse(trades) : [];
      
      const userProposals = allTrades.filter(trade => 
        trade.toProduct.ownerEmail === JSON.parse(currentUser).email &&
        trade.status === 'pending'
      );

      setProposals(userProposals);
      setLoading(false);
    };

    const loadUserData = async () => {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('Usuário carregado:', userData); // Movido para dentro do useEffect
      }
    };

    loadProposals();
    loadUserData();
  }, []);

  const handleAccept = async (proposal: Trade) => {
    setSelectedProposal(proposal);
    setShowRatingModal(true);
  };

  const confirmAccept = async () => {
    if (!selectedProposal || !rating) return;
    
    try {
      const parsedRating = parseInt(rating);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        showAlert('warning', 'Avaliação inválida', 'Por favor, insira uma nota entre 1 e 5');
        return;
      }
  
      // Atualizar trades
      const allTrades = await AsyncStorage.getItem('trades');
      let updatedTrades: Trade[] = allTrades ? JSON.parse(allTrades) : [];
  
      // Encontrar e atualizar a proposta
      updatedTrades = updatedTrades.map(trade => {
        if (trade.id === selectedProposal.id) {
          return {
            ...trade,
            status: 'accepted',
            updatedAt: new Date().toISOString(),
            fromUserRating: parsedRating
          };
        }
        return trade;
      });
  
      // Atualizar status dos produtos
      const allProducts = await AsyncStorage.getItem('products');
      let updatedProducts: Product[] = allProducts ? JSON.parse(allProducts) : [];
      
      updatedProducts = updatedProducts.map(product => {
        if (product.id === selectedProposal.fromProduct.id || 
            product.id === selectedProposal.toProduct.id) {
          return { ...product, status: 'traded' };
        }
        return product;
      });
  
      // Cancelar outras propostas relacionadas
      updatedTrades = updatedTrades.map(trade => {
        if (trade.id !== selectedProposal.id && 
            trade.status === 'pending' && 
            (trade.fromProduct.id === selectedProposal.fromProduct.id ||
            trade.fromProduct.id === selectedProposal.toProduct.id ||
            trade.toProduct.id === selectedProposal.fromProduct.id ||
            trade.toProduct.id === selectedProposal.toProduct.id)) {
            return { ...trade, status: 'canceled' };
        }
        return trade;
      });
  
      // Atualizar rating do usuário
      const users = await AsyncStorage.getItem('users');
      const allUsers: User[] = users ? JSON.parse(users) : [];
      
      const updatedUsers = allUsers.map(user => {
        if (user.email === selectedProposal.fromProduct.ownerEmail) {
          const ratings = user.ratings || [];
          ratings.push(parsedRating);
          const newRating = Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length);
          return { ...user, rating: newRating, ratings };
        }
        return user;
      });
  
      // Salvar alterações - REMOVIDO O [...updatedTrades, acceptedTrade] e usando apenas updatedTrades
      await AsyncStorage.setItem('trades', JSON.stringify(updatedTrades));
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setProposals(prev => prev.filter(p => p.id !== selectedProposal.id));
      setShowRatingModal(false);
      showAlert('success', 'Sucesso!', 'Troca realizada com sucesso!');
  
    } catch (error) {
      console.error('Erro ao processar troca:', error);
      showAlert('error', 'Erro', 'Não foi possível processar a troca');
    }
  };

  const handleReject = async (proposalId: string) => {
    Alert.alert(
      'Recusar Proposta',
      'Tem certeza que deseja recusar esta proposta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Confirmar',
          onPress: async () => {
            const updatedProposals = proposals.map(p => 
              p.id === proposalId ? { ...p, status: 'rejected' } : p
            );
            
            await AsyncStorage.setItem('trades', JSON.stringify(updatedProposals));
            setProposals(updatedProposals);
          }
        }
      ]
    );
  };

  const renderProposal = ({ item }: { item: Trade }) => (
    <View style={styles.proposalCard}>
      <Text style={styles.status}>Status: {item.status}</Text>
      
      <View style={styles.productSection}>
        <Text style={styles.sectionTitle}>Seu Produto:</Text>
        <ProductItem product={item.toProduct} />
      </View>

      <View style={styles.productSection}>
        <Text style={styles.sectionTitle}>Produto Oferecido:</Text>
        <ProductItem product={item.fromProduct} />
      </View>

      <Text style={styles.message}>Mensagem: {item.message}</Text>

      {item.status === 'pending' && (
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.button, styles.acceptButton]}
            onPress={() => handleAccept(item)}
          >
            <Text style={styles.buttonText}>Aceitar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.rejectButton]}
            onPress={() => handleReject(item.id)}
          >
            <Text style={styles.buttonText}>Recusar</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={{marginTop: 0, marginBottom: 120}} >
          <TouchableOpacity onPress={() => navigation.navigate('Home') }>
            <Image source={ require('../assets/logo.png')} style={styles.logoImage} />
          </TouchableOpacity>
            {/* Exibe os dados do usuário se estiverem carregados */}
            {user && (
              
              <TouchableOpacity
                style={styles.userInfoContainer}
                onPress={() => navigation.navigate('Profile')}
              >
                
                <View style={{ marginLeft: 5 }}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userRating}>{'⭐'.repeat(user.rating? user.rating:0)}</Text>
                </View>
      
                <Image
                  source={
                    user.profilePicture
                      ? { uri: user.profilePicture }
                      : require('../assets/profile.png')
                  }
                  style={styles.userImage}
                />
              </TouchableOpacity>
              
            )}
      </View>
      <FlatList
        data={proposals}
        renderItem={renderProposal}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Nenhuma proposta recebida</Text>
        }
      />

      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Avaliar Usuário</Text>
            <TextInput
              placeholder="Nota (1-5)"
              keyboardType="numeric"
              value={rating}
              onChangeText={setRating}
              style={styles.ratingInput}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmAccept}
              >
                <Text style={styles.buttonText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const ProductItem: React.FC<{ product: Product }> = ({ product }) => (
  <View style={styles.productContainer}>
    {product.images.length > 0 && (
      <Image source={{ uri: product.images[0] }} style={styles.productImage} />
    )}
    <View style={styles.productDetails}>
      <Text style={styles.productName}>{product.name}</Text>
      <Text>Valor: R$ {product.value.toFixed(2)}</Text>
      <Text>Qualidade: {product.quality}</Text>
      <Text>Local: {product.city}/{product.state}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#386ea1',
  },
  userInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  userName: {
    fontSize: 18,
    marginRight: 10,
    fontWeight: '600',
    color: colors.text,
  },
  viewProfile: {
    color: colors.primary,
    fontSize: 14,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  logoImage: {
    width: 40,
    height: 42,
    
    position: 'absolute',
    top: 45,
    left: 20,
  },
  userInfoContainer: {
    backgroundColor: colors.background,
    position: 'absolute',
    top: 40,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 0,
    elevation: 0,
    zIndex: 0,
    marginBottom: 80,

  },
  userRating: {
    fontSize: 12,
    color: 'gray',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  proposalCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  status: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  productSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  productContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  message: {
    color: '#666',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    marginTop: 20,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  ratingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: '#757575',
  },
  confirmButton: {
    backgroundColor: '#2196F3',
  },
  listContent: {
    paddingBottom: 20,
  },
});

export default ReceivedProposalsScreen;