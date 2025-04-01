import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FloatingAction } from 'react-native-floating-action';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../App';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Float } from 'react-native/Libraries/Types/CodegenTypes';
import { Trade, Product, User } from '../types';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

interface Filter {
  state: string;
  city: string;
  tags: string;
  minValue: string;
  maxValue: string;
  quality: string;
}

const actions = [
  {
    text: 'Adicionar Produto',
    icon: require('../assets/plus.png'),
    name: 'bt_add',
    position: 1,
  },
  {
    text: 'Trocas Pendentes',
    icon: require('../assets/logo.png'),
    name: 'bt_trades',
    position: 2,
  },
  {
    text: 'Meu perfil',
    icon: require('../assets/profile.png'),
    name: 'bt_profile',
    position: 3,
  },
  {
    text: 'Deslogar',
    icon: require('../assets/logout.png'),
    name: 'bt_logoff',
    position: 4,
  },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({
    state: '',
    city: '',
    tags: '',
    minValue: '',
    maxValue: '',
    quality: '',
  });
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  // Valor animado para exibir os filtros extras
  const filtersAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loadProducts = async () => {
      const storedProducts = await AsyncStorage.getItem('products');
      const prods: Product[] = storedProducts ? JSON.parse(storedProducts) : [];
      const availableProducts = prods.filter(p => p.status !== 'traded');
      setProducts(availableProducts);
    };

    const loadUserData = async () => {
      const storedUser = await AsyncStorage.getItem('currentUser');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        console.log('Usuário carregado:', userData); // Movido para dentro do useEffect
      }
    };

    const unsubscribe = navigation.addListener('focus', () => {
      loadProducts();
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  // Filtra os produtos pela busca e demais filtros se ativos
  const filteredProducts = products.filter((prod) => {
    if (search && !prod.name.toLowerCase().includes(search.toLowerCase()))
      return false;
    if (showFilters) {
      if (filter.state && prod.state !== filter.state) return false;
      if (filter.city && prod.city !== filter.city) return false;
      if (filter.quality && prod.quality !== filter.quality) return false;
      if (filter.minValue && prod.value < parseFloat(filter.minValue))
        return false;
      if (filter.maxValue && prod.value > parseFloat(filter.maxValue))
        return false;
    }
    return true;
  });

  // Ao focar o campo de busca, expande os filtros
  const handleFocusSearch = () => {
    setShowFilters(true);
    Animated.timing(filtersAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  // Removido o onBlur do campo de busca para evitar o fechamento dos filtros
  // Se desejar fechar os filtros, adicione um botão de "fechar" na interface

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Text style={styles.itemTitle}>{item.name}</Text>
      <Text style={styles.itemDescription}>Descrição: {item.description}</Text>
      <Text style={styles.text}>Valor: R$ {item.value}</Text>
      <Text style={styles.text}>
        {item.city} - {item.state}
      </Text>
      <Text style={styles.text}>Qualidade: {item.quality}</Text>
      <Text style={styles.text}>Tags: {item.tags}</Text>
      <Text style={styles.text}>
        Rating do anunciante:{' '}
        {item.ownerRating && item.ownerRating > 0
        ? '⭐'.repeat(item.ownerRating)
        : 'Sem avaliação'}
      </Text>
    </TouchableOpacity>
  );

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}><Text>{'\n'}{'\n'}</Text>
      {/* Exibe os dados do usuário se estiverem carregados */}
      {user && (
        console.log('Usuário carregado:', user),
        <TouchableOpacity
          style={styles.userInfoContainer}
          onPress={() => navigation.navigate('Profile')}
        >
          <Image
            source={
              user.profilePicture
                ? { uri: user.profilePicture }
                : require('../assets/profile.png')
            }
            style={styles.userImage}
          />
          <View style={{ marginLeft: 5 }}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userRating}>{'⭐'.repeat(user.rating? user.rating:0)}</Text>
          </View>
        </TouchableOpacity>
      )}
      
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Buscar por nome..."
          placeholderTextColor="gray"
          value={search}
          onFocus={handleFocusSearch}
          onChangeText={setSearch}
          style={styles.searchInput}
        />
        {showFilters && (
          <Animated.View
            style={[
              styles.filtersContainer,
              {
                opacity: filtersAnim,
                height: filtersAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 200],
                }),
              },
            ]}
          >
            <TextInput
              placeholder="Estado"
              placeholderTextColor="gray"
              value={filter.state}
              onChangeText={(text) => setFilter({ ...filter, state: text })}
              style={styles.filterInput}
            />
            <TextInput
              placeholder="Cidade"
              placeholderTextColor="gray"
              value={filter.city}
              onChangeText={(text) => setFilter({ ...filter, city: text })}
              style={styles.filterInput}
            />
            <TextInput
              placeholder="Qualidade"
              placeholderTextColor="gray"
              value={filter.quality}
              onChangeText={(text) => setFilter({ ...filter, quality: text })}
              style={styles.filterInput}
            />
            <TextInput
              placeholder="Valor Min"
              placeholderTextColor="gray"
              value={filter.minValue}
              onChangeText={(text) => setFilter({ ...filter, minValue: text })}
              style={styles.filterInput}
              keyboardType="numeric"
            />
            <TextInput
              placeholder="Valor Max"
              placeholderTextColor="gray"
              value={filter.maxValue}
              onChangeText={(text) => setFilter({ ...filter, maxValue: text })}
              style={styles.filterInput}
              keyboardType="numeric"
            />
          </Animated.View>
        )}
      </View>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item, index) => index.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 80 }}
      />
      <FloatingAction
        actions={actions}
        floatingIcon={<Icon name="menu" size={24} color="white" />}
        onPressItem={async (name) => {
          if (name === 'bt_add') {
            navigation.navigate('Product');
          }
          if (name === 'bt_trades') {
            navigation.navigate('ReceivedProposals');
          }
          if (name === 'bt_profile') {
            navigation.navigate('Profile');
          }
          if (name === 'bt_logoff') {
            await AsyncStorage.removeItem('currentUser');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          }

        }}
        
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  userInfoContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  userImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  userRating: {
    fontSize: 12,
    color: 'gray',
  },
  item: {
    padding: 10,
    borderBottomWidth: 1,
    borderColor: 'black',
    marginBottom: 5,
  },
  itemTitle: { fontSize: 18, fontWeight: 'bold', color: 'black' },
  itemDescription: { color: 'black', marginBottom: 5 },
  text: { color: 'black' },
  searchContainer: { padding: 10 },
  searchInput: {
    borderWidth: 1,
    marginBottom: 5,
    padding: 8,
    color: 'black',
  },
  filtersContainer: {
    overflow: 'hidden',
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    padding: 8,
    marginTop: 5,
  },
  filterInput: {
    borderWidth: 1,
    marginBottom: 5,
    padding: 6,
    color: 'black',
  },
});

export default HomeScreen;
