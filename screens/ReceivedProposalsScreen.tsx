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

type ReceivedProposalsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ReceivedProposals'>;

interface Props {
  navigation: ReceivedProposalsScreenNavigationProp;
}

const ReceivedProposalsScreen: React.FC<Props> = ({ navigation }) => {
  const [proposals, setProposals] = useState<Trade[]>([]);
  const [selectedProposal, setSelectedProposal] = useState<Trade | null>(null);
  const [rating, setRating] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showRatingModal, setShowRatingModal] = useState(false);

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

    loadProposals();
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
        Alert.alert('Avaliação inválida', 'Por favor, insira uma nota entre 1 e 5');
        return;
      }

      // Atualizar trades
      const allTrades = await AsyncStorage.getItem('trades');
      let updatedTrades: Trade[] = allTrades ? JSON.parse(allTrades) : [];

      const proposalIndex = updatedTrades.findIndex(t => t.id === selectedProposal.id);
      
      // Atualizar proposta aceita
      const acceptedTrade: Trade = {
        ...selectedProposal,
        status: 'accepted',
        updatedAt: new Date().toISOString(),
        fromUserRating: parsedRating
      };

      updatedTrades[proposalIndex] = acceptedTrade;



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

      // Salvar alterações
      await AsyncStorage.setItem('trades', JSON.stringify([...updatedTrades, acceptedTrade]));
      await AsyncStorage.setItem('products', JSON.stringify(updatedProducts));
      await AsyncStorage.setItem('users', JSON.stringify(updatedUsers));
      
      setProposals(prev => prev.filter(p => p.id !== selectedProposal.id));
      setShowRatingModal(false);
      Alert.alert('Sucesso!', 'Troca realizada com sucesso!');

    } catch (error) {
      Alert.alert('Erro', 'Não foi possível processar a troca');
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
    backgroundColor: '#f5f5f5',
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
    color: '#666',
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