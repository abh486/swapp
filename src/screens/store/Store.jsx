// import { GlobalLoader } from '../../components/GlobalLoader';
// import React, { useState, useEffect } from 'react';
// import { // View, // Text, // StyleSheet, // ScrollView, // TouchableOpacity, // Image, // TextInput, // Modal, // StatusBar, // FlatList, // Dimensions, // , // Alert, // } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';
// import Icon from 'react-native-vector-icons/Ionicons';
// import Cart from './Cart';
// import { useDispatch } from 'react-redux';
// import { fetchProducts } from '../../redux/actions/shopActions';
// import { 
//   fetchCart, 
//   addToCart 
// } from '../../redux/actions/cartActions';

// const { width: SCREEN_WIDTH } = Dimensions.get('window');
// const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// const tabs = [
//   { id: 'shop', title: 'Shop', icon: 'bag-handle' },
// ];

// const categories = [
//   { id: 'all', name: 'Supplements', icon: 'medical' },
//   { id: 'equipment', name: 'Apparel', icon: 'shirt' },
//   { id: 'electronics', name: 'Equipment', icon: 'barbell' },
//   { id: 'clothing', name: 'Accessories', icon: 'phone-portrait' },
// ];

// const Store = () => {
//   const dispatch = useDispatch();
//   const [activeTab, setActiveTab] = useState('shop');
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showFilters, setShowFilters] = useState(false);
//   const [selectedSort, setSelectedSort] = useState('popular');
//   const [likedItems, setLikedItems] = useState(new Set());
//   const [products, setProducts] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [cartItems, setCartItems] = useState([]);
//   const [isCartVisible, setIsCartVisible] = useState(false);

//   useEffect(() => {
//     const loadInitialData = async () => {
//       try {
//         console.log('[STORE] Loading initial data...');
//         setLoading(true);
//         setError(null);

//         const [productsResult, cartResult] = await Promise.allSettled([
//           dispatch(fetchProducts()),
//           dispatch(fetchCart()),
//         ]);
        
//         if (productsResult.status === 'fulfilled') {
//           const rawData = productsResult.value;
//           let productArray = [];
//           if (Array.isArray(rawData)) {
//             productArray = rawData;
//           } else if (rawData && Array.isArray(rawData.data)) {
//             productArray = rawData.data;
//           }
//           console.log("[STORE] Successfully processed products:", productArray);
//           setProducts(productArray);
//         } else {
//           console.error("[STORE] Error fetching products:", productsResult.reason);
//           setError("Failed to load products. Please check your connection.");
//         }

//         if (cartResult.status === 'fulfilled') {
//           console.log("[STORE] Successfully fetched cart:", cartResult.value);
//           setCartItems(cartResult.value || []);
//         } else {
//           console.warn("[STORE] Could not fetch cart:", cartResult.reason);
//           setCartItems([]);
//         }

//       } catch (err) {
//         console.error("[STORE] Critical error in loadInitialData:", err);
//         setError("An unexpected error occurred. Please restart the app.");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadInitialData();
//   }, []);

//   const handleAddToCart = async (product) => {
//     try {
//       console.log('[STORE] Adding to cart:', product);
//       console.log('[STORE] Product ID:', product.id);
      
//       const updatedItem = await dispatch(addToCart(product.id, 1));
//       console.log('[STORE] API response for addToCart:', updatedItem);
  
//       setCartItems(prevItems => {
//         console.log('[STORE] Previous cart items:', prevItems);
//         const existingItemIndex = prevItems.findIndex(item => item.id === updatedItem.id);
  
//         if (existingItemIndex > -1) {
//           console.log('[STORE] Updating existing cart item');
//           const newItems = [...prevItems];
//           newItems[existingItemIndex] = updatedItem;
//           return newItems;
//         } else {
//           console.log('[STORE] Adding new item to cart');
//           return [...prevItems, updatedItem];
//         }
//       });
  
//       Alert.alert('Success', `${product.name} has been added to your cart.`);
  
//     } catch (apiError) {
//       console.error("[STORE] Error in handleAddToCart:", apiError);
//       console.error("[STORE] Error response:", apiError.response);
      
//       let errorMessage = 'Please try again later.';
//       if (apiError.response) {
//         errorMessage = apiError.response.data?.message || apiError.response.data?.error || errorMessage;
//       } else if (apiError.request) {
//         errorMessage = 'No response from server. Please check your connection.';
//       } else {
//         errorMessage = apiError.message;
//       }
      
//       Alert.alert('Error', `Could not add item to cart. ${errorMessage}`);
//     }
//   };

//   const toggleLike = (productId) => {
//     setLikedItems(prev => {
//       const newSet = new Set(prev);
//       if (newSet.has(productId)) newSet.delete(productId);
//       else newSet.add(productId);
//       return newSet;
//     });
//   };

//   const renderProductCard = ({ item: product }) => (
//     <View style={[styles.productCard, { width: CARD_WIDTH }]}>
//       <View style={styles.productImageContainer}>
//         <Image
//           source={{ uri: product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/160' }}
//           style={styles.productImage}
//           resizeMode="cover"
//         />
//         <LinearGradient
//           colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
//           style={styles.imageOverlay}
//         />
//         <TouchableOpacity
//           style={styles.likeButton}
//           onPress={() => toggleLike(product.id)}
//         >
//           <Icon
//             name={likedItems.has(product.id) ? 'heart' : 'heart-outline'}
//             size={20}
//             color={likedItems.has(product.id) ? '#452829' : '#aaa'}
//           />
//         </TouchableOpacity>
//       </View>

//       <View style={styles.productInfo}>
//         <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
//         <View style={styles.ratingContainer}>
//           <Icon name="star" size={14} color="#452829" />
//           <Text style={styles.ratingText}>4.7</Text>
//           <Text style={styles.reviewsText}>({Math.floor(Math.random() * 2000)})</Text>
//         </View>
//         <View style={styles.priceContainer}>
//           <Text style={styles.currentPrice}>${product.price.toLocaleString()}</Text>
//         </View>

//         <TouchableOpacity
//           style={[
//             styles.addToCartButton,
//             product.stock <= 0 && styles.outOfStockButton
//           ]}
//           disabled={product.stock <= 0}
//           onPress={() => handleAddToCart(product)}
//         >
//           <View
//             style={[
//               styles.buttonSolidPrimary,
//               product.stock <= 0 && styles.outOfStockButton
//             ]}
//           >
//             <Text style={[
//               styles.addToCartText,
//               product.stock <= 0 && styles.outOfStockText
//             ]}>
//               {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
//             </Text>
//           </View>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );

//   const renderProductList = () => {
//     if (loading) {
//       return <GlobalLoader size={50} style={{ marginTop: 50 }} />;
//     }
//     if (error) {
//       return <Text style={styles.errorText}>{error}</Text>;
//     }
//     if (!products || products.length === 0) {
//       return <Text style={styles.errorText}>No products found.</Text>;
//     }
//     return (
//       <FlatList
//         data={products}
//         renderItem={renderProductCard}
//         keyExtractor={(item) => item.id.toString()}
//         numColumns={2}
//         columnWrapperStyle={styles.productRow}
//         scrollEnabled={false}
//         showsVerticalScrollIndicator={false}
//       />
//     );
//   };

//   const renderShopTab = () => (
//     <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Icon name="search" size={20} color="#57595B" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search supplements, gear..."
//             value={searchQuery}
//             onChangeText={setSearchQuery}
//             placeholderTextColor="#57595B"
//           />
//         </View>
//         <TouchableOpacity
//           style={styles.filterButton}
//           onPress={() => setShowFilters(true)}
//         >
//           <View style={styles.buttonOutline}>
//             <Icon name="options" size={20} color="#57595B" />
//           </View>
//         </TouchableOpacity>
//       </View>

//       <View style={styles.categoriesSection}>
//         <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
//           {categories.map((category) => (
//             <TouchableOpacity
//               key={category.id}
//               onPress={() => setSelectedCategory(category.id)}
//               style={styles.categoryButton}
//             >
//               <View
//                 style={[
//                   styles.categoryBackground,
//                   selectedCategory === category.id && styles.categorySelectedBackground,
//                 ]}
//               >
//                 <Icon
//                   name={category.icon}
//                   size={24}
//                   color={selectedCategory === category.id ? '#ffffff' : '#452829'}
//                 />
//                 <Text
//                   style={[
//                     styles.categoryName,
//                     { color: selectedCategory === category.id ? '#ffffff' : '#452829' }
//                   ]}
//                 >
//                   {category.name}
//                 </Text>
//               </View>
//             </TouchableOpacity>
//           ))}
//         </ScrollView>
//       </View>

//       <View style={styles.productsSection}>
//         {renderProductList()}
//       </View>
//     </ScrollView>
//   );

//   const updateCartItems = (newCartItems) => {
//     setCartItems(newCartItems);
//   };

//   return (
//     <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
//       <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
//       <View style={styles.header}>
//         <View style={styles.headerLeft}>
//           <Icon name="menu" size={24} color="#000000" />
//         </View>
//         <Text style={styles.headerTitle}>Shop</Text>
//         <TouchableOpacity style={styles.cartButton} onPress={() => setIsCartVisible(true)}>
//           <Icon name="cart" size={24} color="#000000" />
//           {cartItems.length > 0 && (
//             <View style={styles.cartBadge}>
//               <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
//             </View>
//           )}
//         </TouchableOpacity>
//       </View>

//       {renderShopTab()}

//       <Modal
//         visible={showFilters}
//         animationType="slide"
//         transparent={true}
//         onRequestClose={() => setShowFilters(false)}
//       >
//         <View style={styles.modalOverlay}>
//           <View style={styles.filterModal}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Filters & Sort</Text>
//               <TouchableOpacity onPress={() => setShowFilters(false)}>
//                 <Icon name="close" size={24} color="#452829" />
//               </TouchableOpacity>
//             </View>
//             <ScrollView showsVerticalScrollIndicator={false}>
//               <View style={styles.filterSection}>
//                 <Text style={styles.filterSectionTitle}>Sort By</Text>
//                 {['Popular', 'Price: Low to High', 'Price: High to Low', 'Rating', 'Newest'].map(
//                   (option, index) => (
//                     <TouchableOpacity
//                       key={index}
//                       style={[
//                         styles.sortOption,
//                         selectedSort === option.toLowerCase().replace(/[:\s]/g, '-') &&
//                           styles.selectedSortOption,
//                       ]}
//                       onPress={() =>
//                         setSelectedSort(option.toLowerCase().replace(/[:\s]/g, '-'))
//                       }
//                     >
//                       <Text
//                         style={[
//                           styles.sortOptionText,
//                           selectedSort === option.toLowerCase().replace(/[:\s]/g, '-') &&
//                             styles.selectedSortOptionText,
//                         ]}
//                       >
//                         {option}
//                       </Text>
//                     </TouchableOpacity>
//                   )
//                 )}
//               </View>
//               <TouchableOpacity
//                 style={styles.applyButton}
//                 onPress={() => setShowFilters(false)}
//               >
//                 <View style={styles.buttonSolidPrimary}>
//                   <Text style={styles.applyButtonText}>Apply Filters</Text>
//                 </View>
//               </TouchableOpacity>
//             </ScrollView>
//           </View>
//         </View>
//       </Modal>

//       <Cart
//         isVisible={isCartVisible}
//         onClose={() => setIsCartVisible(false)}
//         cartItems={cartItems}
//         updateCartItems={updateCartItems}
//       />
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 20,
//     paddingTop: 40,
//     paddingBottom: 20,
//     backgroundColor: '#ffffff',
//   },
//   headerLeft: {
//     width: 48,
//     height: 48,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//     flex: 1,
//     textAlign: 'center',
//   },
//   cartButton: {
//     position: 'relative',
//     width: 48,
//     height: 48,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cartBadge: {
//     position: 'absolute',
//     right: -2,
//     top: -2,
//     backgroundColor: '#452829',
//     borderRadius: 10,
//     width: 20,
//     height: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   cartBadgeText: {
//     color: '#ffffff',
//     fontSize: 10,
//     fontWeight: 'bold',
//   },
//   tabContent: {
//     flex: 1,
//     paddingHorizontal: 20,
//     backgroundColor: '#ffffff',
//   },
//   searchContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 16,
//     gap: 12,
//   },
//   searchBar: {
//     flex: 1,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f7f6f6',
//     borderRadius: 12,
//     paddingHorizontal: 16,
//     paddingVertical: 16,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   searchInput: {
//     flex: 1,
//     marginLeft: 12,
//     fontSize: 16,
//     color: '#000000',
//   },
//   filterButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     width: 48,
//     height: 48,
//   },
//   buttonOutline: {
//     backgroundColor: 'transparent',
//     paddingVertical: 12,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     width: '100%',
//   },
//   categoriesSection: {
//     marginBottom: 24,
//   },
//   categoriesScroll: {
//     marginHorizontal: -20,
//     paddingHorizontal: 20,
//   },
//   categoryButton: {
//     marginRight: 12,
//     borderRadius: 20,
//     overflow: 'hidden',
//   },
//   categoryBackground: {
//     paddingHorizontal: 20,
//     paddingVertical: 10,
//     alignItems: 'center',
//     minWidth: 100,
//     borderRadius: 20,
//     backgroundColor: '#f7f6f6',
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//   },
//   categorySelectedBackground: {
//     backgroundColor: '#452829',
//     borderColor: '#452829',
//   },
//   categoryName: {
//     fontSize: 14,
//     fontWeight: '500',
//     marginTop: 4,
//     textAlign: 'center',
//   },
//   productsSection: {
//     marginBottom: 24,
//   },
//   productRow: {
//     justifyContent: 'space-between',
//     marginBottom: 16,
//   },
//   productCard: {
//     backgroundColor: '#f7f6f6',
//     borderRadius: 12,
//     overflow: 'hidden',
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     marginBottom: 16,
//   },
//   productImageContainer: {
//     position: 'relative',
//     height: 160,
//   },
//   productImage: {
//     width: '100%',
//     height: '100%',
//   },
//   imageOverlay: {
//     position: 'absolute',
//     bottom: 0,
//     left: 0,
//     right: 0,
//     height: 40,
//   },
//   likeButton: {
//     position: 'absolute',
//     top: 12,
//     right: 12,
//     backgroundColor: 'rgba(255, 255, 255, 0.8)',
//     width: 36,
//     height: 36,
//     borderRadius: 18,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   productInfo: {
//     padding: 12,
//   },
//   productName: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#000000',
//     marginBottom: 8,
//     lineHeight: 20,
//     height: 40,
//   },
//   ratingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   ratingText: {
//     fontSize: 12,
//     fontWeight: '600',
//     color: '#452829',
//     marginLeft: 4,
//     marginRight: 4,
//   },
//   reviewsText: {
//     fontSize: 10,
//     color: '#57595B',
//   },
//   priceContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   currentPrice: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#452829',
//     marginRight: 8,
//   },
//   addToCartButton: {
//     borderRadius: 8,
//     overflow: 'hidden',
//     width: '100%',
//     marginTop: 8,
//   },
//   addToCartText: {
//     color: '#ffffff',
//     fontSize: 14,
//     fontWeight: '600',
//     textAlign: 'center',
//     width: '100%',
//   },
//   outOfStockButton: {
//     backgroundColor: '#e5e7eb',
//     opacity: 0.7,
//   },
//   outOfStockText: {
//     color: '#9ca3af',
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//     justifyContent: 'flex-end',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   filterModal: {
//     backgroundColor: '#ffffff',
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     padding: 24,
//     maxHeight: '80%',
//   },
//   filterSection: {
//     marginBottom: 24,
//   },
//   filterSectionTitle: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#452829',
//     marginBottom: 16,
//   },
//   sortOption: {
//     paddingVertical: 16,
//     paddingHorizontal: 16,
//     borderRadius: 8,
//     backgroundColor: '#f7f6f6',
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: 'transparent',
//   },
//   selectedSortOption: {
//     backgroundColor: '#f0f0f0',
//     borderColor: '#452829',
//   },
//   sortOptionText: {
//     fontSize: 16,
//     color: '#000000',
//   },
//   selectedSortOptionText: {
//     color: '#452829',
//     fontWeight: '600',
//   },
//   applyButton: {
//     borderRadius: 12,
//     overflow: 'hidden',
//     marginTop: 16,
//   },
//   buttonSolidPrimary: {
//     backgroundColor: '#452829',
//     paddingVertical: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 12,
//     width: '100%',
//   },
//   applyButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
//   errorText: {
//     color: '#ef4444',
//     textAlign: 'center',
//     fontSize: 16,
//     marginTop: 50,
//     paddingHorizontal: 20,
//   },
// });

// export default Store;


import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, TextInput, Modal, StatusBar, FlatList, Dimensions, Alert} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import Cart from './Cart';
import { useDispatch } from 'react-redux';
import { fetchProducts } from '../../redux/actions/shopActions';
import { 
  fetchCart, 
  addToCart 
} from '../../redux/actions/cartActions';
import { Strings } from '../../config/config'; // Import Strings
import { GlobalLoader } from '../../components/GlobalLoader';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 60) / 2;

// Using config for tabs
const tabs = Strings.Store.tabs;

const Store = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('shop');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSort, setSelectedSort] = useState('popular');
  const [likedItems, setLikedItems] = useState(new Set());
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [isCartVisible, setIsCartVisible] = useState(false);

  // Using config for Categories, keeping Icons locally
  const categories = [
    { id: 'all', name: Strings.Store.categories.all, icon: 'medical' },
    { id: 'equipment', name: Strings.Store.categories.equipment, icon: 'shirt' },
    { id: 'electronics', name: Strings.Store.categories.electronics, icon: 'barbell' },
    { id: 'clothing', name: Strings.Store.categories.clothing, icon: 'phone-portrait' },
  ];

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        console.log('[STORE] Loading initial data...');
        setLoading(true);
        setError(null);

        const [productsResult, cartResult] = await Promise.allSettled([
          dispatch(fetchProducts()),
          dispatch(fetchCart()),
        ]);
        
        if (productsResult.status === 'fulfilled') {
          const rawData = productsResult.value;
          let productArray = [];
          if (Array.isArray(rawData)) {
            productArray = rawData;
          } else if (rawData && Array.isArray(rawData.data)) {
            productArray = rawData.data;
          }
          console.log("[STORE] Successfully processed products:", productArray);
          setProducts(productArray);
        } else {
          console.error("[STORE] Error fetching products:", productsResult.reason);
          setError(Strings.Store.product.states.loadError);
        }

        if (cartResult.status === 'fulfilled') {
          console.log("[STORE] Successfully fetched cart:", cartResult.value);
          setCartItems(cartResult.value || []);
        } else {
          console.warn("[STORE] Could not fetch cart:", cartResult.reason);
          setCartItems([]);
        }

      } catch (err) {
        console.error("[STORE] Critical error in loadInitialData:", err);
        setError(Strings.Store.product.states.criticalError);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      console.log('[STORE] Adding to cart:', product);
      console.log('[STORE] Product ID:', product.id);
      
      const updatedItem = await dispatch(addToCart(product.id, 1));
      console.log('[STORE] API response for addToCart:', updatedItem);
  
      setCartItems(prevItems => {
        console.log('[STORE] Previous cart items:', prevItems);
        const existingItemIndex = prevItems.findIndex(item => item.id === updatedItem.id);
  
        if (existingItemIndex > -1) {
          console.log('[STORE] Updating existing cart item');
          const newItems = [...prevItems];
          newItems[existingItemIndex] = updatedItem;
          return newItems;
        } else {
          console.log('[STORE] Adding new item to cart');
          return [...prevItems, updatedItem];
        }
      });
  
      Alert.alert(
        Strings.Store.alerts.addToCart.successTitle, 
        Strings.Store.alerts.addToCart.successMessage(product.name)
      );
  
    } catch (apiError) {
      console.error("[STORE] Error in handleAddToCart:", apiError);
      console.error("[STORE] Error response:", apiError.response);
      
      let errorMessage = Strings.Store.alerts.addToCart.genericMessage;
      if (apiError.response) {
        errorMessage = apiError.response.data?.message || apiError.response.data?.error || errorMessage;
      } else if (apiError.request) {
        errorMessage = Strings.Store.alerts.addToCart.noResponseMessage;
      } else {
        errorMessage = apiError.message;
      }
      
      Alert.alert(
        Strings.Store.alerts.addToCart.errorTitle,
        `${Strings.Store.alerts.addToCart.errorPrefix} ${errorMessage}`
      );
    }
  };

  const toggleLike = (productId) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) newSet.delete(productId);
      else newSet.add(productId);
      return newSet;
    });
  };

  const renderProductCard = ({ item: product }) => (
    <View style={[styles.productCard, { width: CARD_WIDTH }]}>
      <View style={styles.productImageContainer}>
        <Image
          source={{ uri: product.images && product.images[0] ? product.images[0] : 'https://via.placeholder.com/160' }}
          style={styles.productImage}
          resizeMode="cover"
        />
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.3)']}
          style={styles.imageOverlay}
        />
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(product.id)}
        >
          <Icon
            name={likedItems.has(product.id) ? 'heart' : 'heart-outline'}
            size={20}
            color={likedItems.has(product.id) ? '#452829' : '#aaa'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
        <View style={styles.ratingContainer}>
          <Icon name="star" size={14} color="#452829" />
          <Text style={styles.ratingText}>4.7</Text>
          <Text style={styles.reviewsText}>({Math.floor(Math.random() * 2000)})</Text>
        </View>
        <View style={styles.priceContainer}>
          <Text style={styles.currentPrice}>${product.price.toLocaleString()}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addToCartButton,
            product.stock <= 0 && styles.outOfStockButton
          ]}
          disabled={product.stock <= 0}
          onPress={() => handleAddToCart(product)}
        >
          <View
            style={[
              styles.buttonSolidPrimary,
              product.stock <= 0 && styles.outOfStockButton
            ]}
          >
            <Text style={[
              styles.addToCartText,
              product.stock <= 0 && styles.outOfStockText
            ]}>
              {product.stock > 0 ? Strings.Store.product.actions.addToCart : Strings.Store.product.actions.outOfStock}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderProductList = () => {
    if (loading) {
      return <GlobalLoader size={50} style={{ marginTop: 50 }} />;
    }
    if (error) {
      return <Text style={styles.errorText}>{error}</Text>;
    }
    if (!products || products.length === 0) {
      return <Text style={styles.errorText}>{Strings.Store.product.states.empty}</Text>;
    }
    return (
      <FlatList
        data={products}
        renderItem={renderProductCard}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        columnWrapperStyle={styles.productRow}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  const renderShopTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={20} color="#57595B" />
          <TextInput
            style={styles.searchInput}
            placeholder={Strings.Store.search.placeholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#57595B"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <View style={styles.buttonOutline}>
            <Icon name="options" size={20} color="#57595B" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => setSelectedCategory(category.id)}
              style={styles.categoryButton}
            >
              <View
                style={[
                  styles.categoryBackground,
                  selectedCategory === category.id && styles.categorySelectedBackground,
                ]}
              >
                <Icon
                  name={category.icon}
                  size={24}
                  color={selectedCategory === category.id ? '#ffffff' : '#452829'}
                />
                <Text
                  style={[
                    styles.categoryName,
                    { color: selectedCategory === category.id ? '#ffffff' : '#452829' }
                  ]}
                >
                  {category.name}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.productsSection}>
        {renderProductList()}
      </View>
    </ScrollView>
  );

  const updateCartItems = (newCartItems) => {
    setCartItems(newCartItems);
  };

  return (
    <View style={[styles.container, { backgroundColor: '#ffffff' }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Icon name="menu" size={24} color="#000000" />
        </View>
        <Text style={styles.headerTitle}>{Strings.Store.header.title}</Text>
        <TouchableOpacity style={styles.cartButton} onPress={() => setIsCartVisible(true)}>
          <Icon name="cart" size={24} color="#000000" />
          {cartItems.length > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartItems.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {renderShopTab()}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.filterModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{Strings.Store.filter.title}</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Icon name="close" size={24} color="#452829" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{Strings.Store.filter.sortByTitle}</Text>
                {Object.values(Strings.Store.filter.options).map(
                  (option, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.sortOption,
                        selectedSort === option.toLowerCase().replace(/[:\s]/g, '-') &&
                          styles.selectedSortOption,
                      ]}
                      onPress={() =>
                        setSelectedSort(option.toLowerCase().replace(/[:\s]/g, '-'))
                      }
                    >
                      <Text
                        style={[
                          styles.sortOptionText,
                          selectedSort === option.toLowerCase().replace(/[:\s]/g, '-') &&
                            styles.selectedSortOptionText,
                        ]}
                      >
                        {option}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <View style={styles.buttonSolidPrimary}>
                  <Text style={styles.applyButtonText}>{Strings.Store.filter.applyButton}</Text>
                </View>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Cart
        isVisible={isCartVisible}
        onClose={() => setIsCartVisible(false)}
        cartItems={cartItems}
        updateCartItems={updateCartItems}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#ffffff',
  },
  headerLeft: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  cartButton: {
    position: 'relative',
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    right: -2,
    top: -2,
    backgroundColor: '#452829',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#ffffff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f6f6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#000000',
  },
  filterButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 48,
    height: 48,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    width: '100%',
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  categoryButton: {
    marginRight: 12,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryBackground: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 100,
    borderRadius: 20,
    backgroundColor: '#f7f6f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  categorySelectedBackground: {
    backgroundColor: '#452829',
    borderColor: '#452829',
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  productsSection: {
    marginBottom: 24,
  },
  productRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  productCard: {
    backgroundColor: '#f7f6f6',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 16,
  },
  productImageContainer: {
    position: 'relative',
    height: 160,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  likeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    lineHeight: 20,
    height: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#452829',
    marginLeft: 4,
    marginRight: 4,
  },
  reviewsText: {
    fontSize: 10,
    color: '#57595B',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#452829',
    marginRight: 8,
  },
  addToCartButton: {
    borderRadius: 8,
    overflow: 'hidden',
    width: '100%',
    marginTop: 8,
  },
  addToCartText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
  },
  outOfStockButton: {
    backgroundColor: '#e5e7eb',
    opacity: 0.7,
  },
  outOfStockText: {
    color: '#9ca3af',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  filterModal: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
    maxHeight: '80%',
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#452829',
    marginBottom: 16,
  },
  sortOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f7f6f6',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedSortOption: {
    backgroundColor: '#f0f0f0',
    borderColor: '#452829',
  },
  sortOptionText: {
    fontSize: 16,
    color: '#000000',
  },
  selectedSortOptionText: {
    color: '#452829',
    fontWeight: '600',
  },
  applyButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 16,
  },
  buttonSolidPrimary: {
    backgroundColor: '#452829',
    paddingVertical: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    width: '100%',
  },
  applyButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
    paddingHorizontal: 20,
  },
});

export default Store;