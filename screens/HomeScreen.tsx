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
import { Picker } from '@react-native-picker/picker';
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
}

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



const colors = {
  primary: '#2f95dc',
  text: '#FFFF',
  border: '#0',
  background: '#386ea1',
};


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
  {
    text: 'Debug',
    icon: require('../assets/menu.png'),
    name: 'bt_debug',
    position: 5,
  },
];

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState<string>('');
  const [filter, setFilter] = useState<Filter>({ state: '', city: '' });
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
    const matchesSearch = search.toLowerCase().split(' ').every(word => 
      prod.name.toLowerCase().includes(word)
    );
    const matchesState = !filter.state || prod.state === filter.state;
    const matchesCity = !filter.city || prod.city === filter.city;
    
    return matchesSearch && matchesState && matchesCity;
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

  

  const renderItem = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image 
        source={{ uri: item.images[0] }} 
        style={styles.itemImage} 
        resizeMode="cover"
      />
      <View style={styles.textOverlay}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemPrice}>R$ {item.value.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );
  const renderItem2 = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.itemContainer_horizontal}
      onPress={() => navigation.navigate('ProductDetail', { product: item })}
    >
      <Image 
        source={{ uri: item.images[0] }} 
        style={styles.itemImage} 
        resizeMode="cover"
      />
      <View style={styles.textOverlay}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemPrice}>R$ {item.value.toFixed(2)}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}><Text>{'\n'}{'\n'}</Text>
      <View style={{marginTop: 30}} ></View>
      <Image source={ require('../assets/logo.png')} style={styles.logoImage} />
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
      <Text style={{color: 'white', fontWeight: 'bold', fontSize: 16, padding: 16 }}>Selecione sua região:</Text>
      <View style={styles.searchContainer}>
        <View style={[styles.pickerContainer, { flex: 1, marginRight: 8 } ]}>
          <Picker
            selectedValue={filter.state}
            onValueChange={(state) => setFilter({ state, city: '' })}
            style={styles.picker}
          >
            {Object.keys(statesAndCities).map((st) => (
              <Picker.Item key={st} label={st} value={st} />
            ))}
          </Picker>
        </View>

        <View style={[styles.pickerContainer, { flex: 1, marginLeft: 8 }]}>
          <Picker
            selectedValue={filter.city}
            onValueChange={(city) => setFilter(prev => ({ ...prev, city }))}
            style={styles.picker}
          >
            {statesAndCities[filter.state]?.map((ct) => (
              <Picker.Item key={ct} label={ct} value={ct} />
            ))}
          </Picker>
        </View>

      </View>
      <Text style={styles.text} >Conheça os itens que estão disponíveis para troca na sua região!</Text>
      <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredProducts} // Usa os produtos filtrados
          keyExtractor={(item, index) => `horizontal-${index}`}
          renderItem={renderItem}
          contentContainerStyle={styles.horizontalList}
          ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
        />

        <Text style={styles.text}>Veja mais itens para troca no Brasil!</Text>
        <FlatList
          data={products}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem2}
          contentContainerStyle={{paddingHorizontal: 10, paddingBottom: 80 }}
        />
      <FloatingAction
        actions={actions}
        floatingIcon={require('../assets/logo.png')}
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
          if (name === 'bt_debug') {
            navigation.navigate('Debug');
          }

        }}
        
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
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
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: {
    backgroundColor: colors.background,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 12,
  },
  regionContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  regionButton: {
    backgroundColor: colors.background,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  regionText: {
    color: colors.text,
    fontWeight: '500',
  },
  item: {
    marginTop: 16,
    backgroundColor: 'white',
    padding: 16,
    borderWidth: .1,
    borderRadius: 12,
    borderColor: colors.border,

  },
  itemDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  itemImage: {
    flex: 1,
    width: '100%',
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 16,
    marginHorizontal: 16,
    textAlign: 'center',
    
  },
  textOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
    padding: 16,
  },
  itemTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    color: 'white',
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: '#666',
  },
  viewButton: {
    alignSelf: 'flex-end',
    marginTop: 8,
  },
  viewButtonText: {
    color: colors.primary,
    fontWeight: '500',
  },
  horizontalList: {
    paddingLeft: 16,
    paddingBottom: 280,
  },
  verticalList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  itemContainer: {
    width: 180, // Largura fixa para o layout vertical
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  itemContainer_horizontal: {
    width: 380, // Largura fixa para o layout vertical
    height: 280,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',

  },
  searchContainer: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerContainer: {
    borderWidth: 0.2,
    borderRadius: 12,
    backgroundColor: '#5e88af',
    height: 50,
    justifyContent: 'center',
  },
  picker: {
    fontSize: 15,
    height: 50,
    color: 'white',
    fontFamily: 'bold',
  },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listContent: {
    paddingHorizontal: 16,
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
  
  userRating: {
    fontSize: 12,
    color: 'gray',
  },
  itemDescription: { color: 'black', marginBottom: 5 },
  filtersContainer: {
    backgroundColor: colors.background,
    overflow: 'hidden',
    borderRadius: 5,
    padding: 8,
    marginTop: 5,
  },
  filterInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    marginBottom: 5,
    padding: 6,
    color: 'black',
  },
});

export default HomeScreen;
