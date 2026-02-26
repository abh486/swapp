// import React, { useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   Modal,
//   TouchableOpacity,
//   Image,
//   FlatList,
//   Alert,
//   Linking,
//   ScrollView,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// import { useDispatch } from 'react-redux';
// import { 
//   removeFromCart, 
//   updateCartItem,
//   createCheckout 
// } from '../../redux/actions/cartActions';

// const Cart = ({ isVisible, onClose, cartItems, updateCartItems }) => {
//   const dispatch = useDispatch();
//   const [checkoutProcessing, setCheckoutProcessing] = useState(false);

//   const handleUpdateCartItem = async (cartItemId, newQuantity) => {
//     try {
//       console.log('[CART] Updating cart item:', { cartItemId, newQuantity });
      
//       if (newQuantity < 1) {
//         console.log('[CART] Quantity less than 1, removing item');
//         await dispatch(removeFromCart(cartItemId));
//         updateCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
//       } else {
//         console.log('[CART] Updating item quantity');
//         const updatedItem = await dispatch(updateCartItem(cartItemId, newQuantity));
//         console.log('[CART] Updated item response:', updatedItem);
//         updateCartItems(prevItems => 
//           prevItems.map(item => item.id === cartItemId ? updatedItem : item)
//         );
//       }
//     } catch (apiError) {
//       console.error("[CART] Error in handleUpdateCartItem:", apiError);
//       console.error("[CART] Error response:", apiError.response);
//       const errorMessage = apiError.response?.data?.message || 'Please try again later.';
//       Alert.alert('Error', `Could not update item. ${errorMessage}`);
//     }
//   };

//   const handleRemoveFromCart = async (cartItemId) => {
//     try {
//       console.log('[CART] Removing from cart:', cartItemId);
//       await dispatch(removeFromCart(cartItemId));
//       updateCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
//     } catch (apiError) {
//       console.error("[CART] Error in handleRemoveFromCart:", apiError);
//       console.error("[CART] Error response:", apiError.response);
//       const errorMessage = apiError.response?.data?.message || 'Please try again later.';
//       Alert.alert('Error', `Could not remove item. ${errorMessage}`);
//     }
//   };

//   const getCartTotal = () => {
//     const total = cartItems
//       .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
//     console.log('[CART] Calculated cart total:', total);
//     return total.toLocaleString();
//   };

//   const getSubtotal = () => {
//     const subtotal = cartItems
//       .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
//     return subtotal.toLocaleString();
//   };

//   const getTax = () => {
//     const subtotal = cartItems
//       .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
//     const tax = subtotal * 0.09; // 9% tax rate
//     return tax.toLocaleString();
//   };

//   const handleCheckout = async () => {
//     try {
//       console.log('[CART] Initiating checkout...');
//       setCheckoutProcessing(true);
      
//       // Show processing alert
//       Alert.alert('Processing', 'Creating your secure checkout page...', [
//         { text: 'OK', style: 'default' }
//       ]);

//       // Call your backend endpoint
//       const checkoutUrl = await dispatch(createCheckout());

//       if (checkoutUrl) {
//         console.log('[CART] Opening checkout URL:', checkoutUrl);
        
//         // Close cart modal before opening browser
//         onClose();
        
//         // Use React Native's Linking API to open URL in device's browser
//         const supported = await Linking.canOpenURL(checkoutUrl);
//         if (supported) {
//           await Linking.openURL(checkoutUrl);
          
//           // Show success message
//           Alert.alert(
//             'Checkout Opened', 
//             'You have been redirected to our secure payment page. Complete your purchase there and you will be redirected back to the app.',
//             [{ text: 'OK', style: 'default' }]
//           );
//         } else {
//           Alert.alert('Error', `Unable to open this URL: ${checkoutUrl}`);
//         }
//       } else {
//         throw new Error('Checkout URL not received from server.');
//       }
//     } catch (error) {
//       console.error('[CART] Checkout failed:', error);
      
//       // Handle specific error messages
//       let errorMessage = 'Could not initiate checkout. Please try again later.';
      
//       if (error.message && error.message.includes('One-time checkout is not enabled')) {
//         errorMessage = 'One-time checkout is not enabled. Please contact support or try again later.';
//       }
      
//       Alert.alert(
//         'Checkout Failed', 
//         errorMessage,
//         [{ text: 'OK', style: 'default' }]
//       );
//     } finally {
//       setCheckoutProcessing(false);
//     }
//   };

//   const renderCartItem = ({ item }) => (
//     <View style={styles.cartItem}>
//       <Image source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/160' }} style={styles.cartItemImage} />
//       <View style={styles.cartItemDetails}>
//         <Text style={styles.cartItemName} numberOfLines={1}>{item.product?.name}</Text>
//         <Text style={styles.cartItemPrice}>${item.product?.price?.toLocaleString()}</Text>
//         <View style={styles.quantityContainer}>
//           <TouchableOpacity 
//             style={styles.quantityButton}
//             onPress={() => handleUpdateCartItem(item.id, item.quantity - 1)}
//           >
//             <Icon name="remove" size={16} color="#452829" />
//           </TouchableOpacity>
//           <Text style={styles.quantityText}>{item.quantity}</Text>
//           <TouchableOpacity 
//             style={styles.quantityButton}
//             onPress={() => handleUpdateCartItem(item.id, item.quantity + 1)}
//           >
//             <Icon name="add" size={16} color="#452829" />
//           </TouchableOpacity>
//         </View>
//       </View>
//       <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFromCart(item.id)}>
//         <Text style={styles.removeButtonText}>Remove</Text>
//       </TouchableOpacity>
//     </View>
//   );

//   return (
//     <Modal
//       visible={isVisible}
//       animationType="slide"
//       transparent={true}
//       onRequestClose={onClose}
//     >
//       <View style={styles.modalOverlay}>
//         <View style={styles.cartModalContainer}>
//           <View style={styles.modalHeader}>
//             <View style={styles.modalHeaderLeft}></View>
//             <Text style={styles.modalTitle}>My Cart</Text>
//             <TouchableOpacity onPress={onClose}>
//               <Icon name="close" size={24} color="#000000" />
//             </TouchableOpacity>
//           </View>
          
//           {cartItems.length === 0 ? (
//             <View style={styles.emptyCartContainer}>
//                 <Icon name="cart-outline" size={60} color="#57595B" />
//                 <Text style={styles.emptyCartText}>Your cart is empty</Text>
//             </View>
//           ) : (
//             <>
//               <ScrollView style={styles.cartItemsContainer}>
//                 <FlatList
//                   data={cartItems}
//                   keyExtractor={(item) => item.id.toString()}
//                   renderItem={renderCartItem}
//                   showsVerticalScrollIndicator={false}
//                 />
//               </ScrollView>

//               <View style={styles.cartFooter}>
//                 <View style={styles.priceDetails}>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Subtotal</Text>
//                     <Text style={styles.priceValue}>${getSubtotal()}</Text>
//                   </View>
//                   <View style={styles.priceRow}>
//                     <Text style={styles.priceLabel}>Tax</Text>
//                     <Text style={styles.priceValue}>${getTax()}</Text>
//                   </View>
//                   <View style={[styles.priceRow, styles.totalRow]}>
//                     <Text style={styles.totalLabel}>Total</Text>
//                     <Text style={styles.totalValue}>${getCartTotal()}</Text>
//                   </View>
//                 </View>
//                 <TouchableOpacity 
//                   style={[styles.checkoutButton, checkoutProcessing && styles.disabledButton]} 
//                   onPress={handleCheckout}
//                   disabled={checkoutProcessing}
//                 >
//                   <Text style={styles.checkoutButtonText}>
//                     {checkoutProcessing ? 'Processing...' : 'Checkout'}
//                   </Text>
//                 </TouchableOpacity>
//               </View>
//             </>
//           )}
//         </View>
//       </View>
//     </Modal>
//   );
// };

// const styles = StyleSheet.create({
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0, 0, 0, 0.4)',
//     justifyContent: 'flex-end',
//   },
//   cartModalContainer: {
//     backgroundColor: '#ffffff',
//     borderTopLeftRadius: 16,
//     borderTopRightRadius: 16,
//     height: '90%',
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   modalHeaderLeft: {
//     width: 24,
//   },
//   modalTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   emptyCartContainer: {
//       flex: 1,
//       justifyContent: 'center',
//       alignItems: 'center',
//   },
//   emptyCartText: {
//       fontSize: 16,
//       color: '#57595B',
//       marginTop: 16,
//       fontWeight: '500',
//   },
//   cartItemsContainer: {
//     flex: 1,
//     paddingHorizontal: 16,
//   },
//   cartItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 16,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e5e7eb',
//   },
//   cartItemImage: {
//     width: 80,
//     height: 80,
//     borderRadius: 8,
//     marginRight: 16,
//   },
//   cartItemDetails: {
//     flex: 1,
//   },
//   cartItemName: {
//     fontSize: 16,
//     color: '#000000',
//     fontWeight: '500',
//     marginBottom: 4,
//   },
//   cartItemPrice: {
//     fontSize: 14,
//     color: '#452829',
//     marginBottom: 8,
//   },
//   quantityContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f7f6f6',
//     borderRadius: 20,
//     borderWidth: 1,
//     borderColor: '#e5e7eb',
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     marginRight: 12,
//   },
//   quantityButton: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   quantityText: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#000000',
//     marginHorizontal: 8,
//     minWidth: 20,
//     textAlign: 'center',
//   },
//   removeButton: {
//     padding: 4,
//   },
//   removeButtonText: {
//     fontSize: 14,
//     color: '#57595B',
//   },
//   cartFooter: {
//       paddingHorizontal: 16,
//       paddingVertical: 16,
//       borderTopWidth: 1,
//       borderTopColor: '#e5e7eb',
//   },
//   priceDetails: {
//     marginBottom: 16,
//   },
//   priceRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 8,
//   },
//   totalRow: {
//     paddingTop: 8,
//     borderTopWidth: 1,
//     borderTopColor: '#e5e7eb',
//   },
//   priceLabel: {
//     fontSize: 16,
//     color: '#000000',
//   },
//   priceValue: {
//     fontSize: 16,
//     fontWeight: '500',
//     color: '#000000',
//   },
//   totalLabel: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   totalValue: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#000000',
//   },
//   checkoutButton: {
//       borderRadius: 12,
//       overflow: 'hidden',
//       backgroundColor: '#452829',
//       paddingVertical: 12,
//       alignItems: 'center',
//       justifyContent: 'center',
//   },
//   disabledButton: {
//     backgroundColor: '#9ca3af',
//     opacity: 0.7,
//   },
//   checkoutButtonText: {
//     color: '#ffffff',
//     fontSize: 16,
//     fontWeight: '600',
//     textAlign: 'center',
//   },
// });

// export default Cart;

// src/screens/shop/Cart.jsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
  Linking,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { 
  removeFromCart, 
  updateCartItem,
  createCheckout 
} from '../../redux/actions/cartActions';
import { Strings } from '../../config/config'; // Import Config

const Cart = ({ isVisible, onClose, cartItems, updateCartItems }) => {
  const dispatch = useDispatch();
  const [checkoutProcessing, setCheckoutProcessing] = useState(false);
  const strings = Strings.Cart;

  const handleUpdateCartItem = async (cartItemId, newQuantity) => {
    try {
      console.log('[CART] Updating cart item:', { cartItemId, newQuantity });
      
      if (newQuantity < 1) {
        console.log('[CART] Quantity less than 1, removing item');
        await dispatch(removeFromCart(cartItemId));
        updateCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
      } else {
        console.log('[CART] Updating item quantity');
        const updatedItem = await dispatch(updateCartItem(cartItemId, newQuantity));
        console.log('[CART] Updated item response:', updatedItem);
        updateCartItems(prevItems => 
          prevItems.map(item => item.id === cartItemId ? updatedItem : item)
        );
      }
    } catch (apiError) {
      console.error("[CART] Error in handleUpdateCartItem:", apiError);
      console.error("[CART] Error response:", apiError.response);
      const errorMessage = apiError.response?.data?.message || Strings.Shop.Alerts.addErrorUnknown;
      Alert.alert(strings.Actions.updateErrorTitle, `${strings.Actions.updateErrorMessage(errorMessage)}`);
    }
  };

  const handleRemoveFromCart = async (cartItemId) => {
    try {
      console.log('[CART] Removing from cart:', cartItemId);
      await dispatch(removeFromCart(cartItemId));
      updateCartItems(prevItems => prevItems.filter(item => item.id !== cartItemId));
    } catch (apiError) {
      console.error("[CART] Error in handleRemoveFromCart:", apiError);
      console.error("[CART] Error response:", apiError.response);
      const errorMessage = apiError.response?.data?.message || Strings.Shop.Alerts.addErrorUnknown;
      Alert.alert(strings.Actions.removeErrorTitle, `${strings.Actions.removeErrorMessage(errorMessage)}`);
    }
  };

  const getCartTotal = () => {
    const total = cartItems
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    console.log('[CART] Calculated cart total:', total);
    return total.toLocaleString();
  };

  const getSubtotal = () => {
    const subtotal = cartItems
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    return subtotal.toLocaleString();
  };

  const getTax = () => {
    const subtotal = cartItems
      .reduce((sum, item) => sum + (item.product?.price || 0) * item.quantity, 0);
    const tax = subtotal * 0.09; // 9% tax rate
    return tax.toLocaleString();
  };

  const handleCheckout = async () => {
    try {
      console.log('[CART] Initiating checkout...');
      setCheckoutProcessing(true);
      
      Alert.alert(strings.Checkout.alerts.processingTitle, strings.Checkout.alerts.processingMessage, [
        { text: strings.Checkout.alerts.ok, style: 'default' }
      ]);

      const checkoutUrl = await dispatch(createCheckout());

      if (checkoutUrl) {
        console.log('[CART] Opening checkout URL:', checkoutUrl);
        
        onClose();
        
        const supported = await Linking.canOpenURL(checkoutUrl);
        if (supported) {
          await Linking.openURL(checkoutUrl);
          
          Alert.alert(
            strings.Checkout.alerts.urlSuccessTitle, 
            strings.Checkout.alerts.urlSuccessMessage,
            [{ text: strings.Checkout.alerts.ok, style: 'default' }]
          );
        } else {
          Alert.alert(strings.Checkout.alerts.linkErrorTitle, strings.Checkout.alerts.linkErrorMessage(checkoutUrl));
        }
      } else {
        throw new Error('Checkout URL not received from server.');
      }
    } catch (error) {
      console.error('[CART] Checkout failed:', error);
      
      let errorMessage = strings.Checkout.alerts.genericErrorMessage;
      
      if (error.message && error.message.includes('One-time checkout is not enabled')) {
        errorMessage = strings.Checkout.alerts.oneTimeErrorMessage;
      }
      
      Alert.alert(
        strings.Checkout.alerts.genericErrorTitle, 
        errorMessage,
        [{ text: strings.Checkout.alerts.ok, style: 'default' }]
      );
    } finally {
      setCheckoutProcessing(false);
    }
  };

  const renderCartItem = ({ item }) => (
    <View style={styles.cartItem}>
      <Image source={{ uri: item.product?.images?.[0] || 'https://via.placeholder.com/160' }} style={styles.cartItemImage} />
      <View style={styles.cartItemDetails}>
        <Text style={styles.cartItemName} numberOfLines={1}>{item.product?.name}</Text>
        <Text style={styles.cartItemPrice}>${item.product?.price?.toLocaleString()}</Text>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateCartItem(item.id, item.quantity - 1)}
          >
            <Icon name="remove" size={16} color="#452829" />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.quantityButton}
            onPress={() => handleUpdateCartItem(item.id, item.quantity + 1)}
          >
            <Icon name="add" size={16} color="#452829" />
          </TouchableOpacity>
        </View>
      </View>
      <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveFromCart(item.id)}>
        <Text style={styles.removeButtonText}>{strings.Item.remove}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.cartModalContainer}>
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderLeft}></View>
            <Text style={styles.modalTitle}>{strings.Modal.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#000000" />
            </TouchableOpacity>
          </View>          
          {cartItems.length === 0 ? (
            <View style={styles.emptyCartContainer}>
                <Icon name={strings.Empty.icon} size={60} color="#57595B" />
                <Text style={styles.emptyCartText}>{strings.Empty.title}</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.cartItemsContainer}>
                <FlatList
                  data={cartItems}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={renderCartItem}
                  showsVerticalScrollIndicator={false}
                />
              </ScrollView>

              <View style={styles.cartFooter}>
                <View style={styles.priceDetails}>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>{strings.Footer.subtotal}</Text>
                      <Text style={styles.priceValue}>${getSubtotal()}</Text>
                    </View>
                    <View style={styles.priceRow}>
                      <Text style={styles.priceLabel}>{strings.Footer.tax}</Text>
                      <Text style={styles.priceValue}>${getTax()}</Text>
                    </View>
                    <View style={[styles.priceRow, styles.totalRow]}>
                      <Text style={styles.totalLabel}>{strings.Footer.total}</Text>
                      <Text style={styles.totalValue}>${getCartTotal()}</Text>
                    </View>
                </View>
                <TouchableOpacity 
                  style={[styles.checkoutButton, checkoutProcessing && styles.disabledButton]} 
                  onPress={handleCheckout}
                  disabled={checkoutProcessing}
                >
                  <Text style={styles.checkoutButtonText}>
                    {checkoutProcessing ? strings.Checkout.processing : strings.Checkout.button}
                  </Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  cartModalContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalHeaderLeft: {
    width: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  emptyCartContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCartText: {
    fontSize: 16,
    color: '#57595B',
    marginTop: 16,
    fontWeight: '500',
  },
  cartItemsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  cartItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  cartItemDetails: {
    flex: 1,
  },
  cartItemName: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  cartItemPrice: {
    fontSize: 14,
    color: '#452829',
    marginBottom: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f6f6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginHorizontal: 8,
    minWidth: 20,
    textAlign: 'center',
  },
  removeButton: {
    padding: 4,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#57595B',
  },
  cartFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceDetails: {
    marginBottom: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  totalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  priceLabel: {
    fontSize: 16,
    color: '#000000',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000000',
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#452829',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#9ca3af',
    opacity: 0.7,
  },
  checkoutButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default Cart;