// import React, { useState, useRef, useEffect, useContext } from 'react';
// import { 
//   View, 
//   Text, 
//   TextInput, 
//   ScrollView, 
//   StyleSheet, 
//   TouchableOpacity, 
//   KeyboardAvoidingView,
//   Platform,
//   Alert,
//   Image,
//   ActivityIndicator,
//   Modal,
//   Pressable,
//   Animated,
//   Dimensions,
//   PermissionsAndroid
// } from 'react-native';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { generateText } from '../../../api/ollama';
// import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
// import Icon from 'react-native-vector-icons/Ionicons';
// import LinearGradient from 'react-native-linear-gradient';
// import { useImageSelection } from '../../../context/AuthContext';
// import { useAuth } from '../../../context/AuthContext';

// const { width, height } = Dimensions.get('window');

// // Storage keys
// const CHAT_HISTORY_KEY = '@chat_history';
// const ACTIVE_CHAT_KEY = '@active_chat';

// export default function TestOllamaScreen() {
//   const [messages, setMessages] = useState([]);
//   const [inputText, setInputText] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [imageModalVisible, setImageModalVisible] = useState(false);
//   const [sidebarVisible, setSidebarVisible] = useState(false);
//   const [chatHistory, setChatHistory] = useState([]);
//   const [activeChatId, setActiveChatId] = useState(null);
//   const [isInitialized, setIsInitialized] = useState(false);
//   const [deletingChatId, setDeletingChatId] = useState(null);
//   const [isSwitchingChat, setIsSwitchingChat] = useState(false);
//   const scrollViewRef = useRef(null);
//   const fadeAnim = useRef(new Animated.Value(0)).current;
  
//   const { isImageSelectionInProgress, setIsImageSelectionInProgress } = useImageSelection();
//   const { userProfile, isAuthenticated } = useAuth();

//   // Initialize app data on component mount
//   useEffect(() => {
//     initializeApp();
//   }, []);

//   // Save messages whenever they change
//   useEffect(() => {
//     if (activeChatId && messages.length > 0 && isInitialized) {
//       saveChatMessages(activeChatId, messages);
//       updateChatHistory();
//     }
//   }, [messages, activeChatId, isInitialized]);

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     if (scrollViewRef.current) {
//       scrollViewRef.current.scrollToEnd({ animated: true });
//     }
//   }, [messages]);

//   // Animate elements on mount
//   useEffect(() => {
//     Animated.timing(fadeAnim, {
//       toValue: 1,
//       duration: 1000,
//       useNativeDriver: true,
//     }).start();
//   }, []);

//   const initializeApp = async () => {
//     try {
//       // Load chat history first
//       const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
//       let parsedHistory = [];
      
//       if (history) {
//         try {
//           const historyData = JSON.parse(history);
//           // Validate and filter out invalid chat objects
//           parsedHistory = Array.isArray(historyData) 
//             ? historyData.filter(chat => chat && typeof chat === 'object' && chat.id)
//             : [];
//         } catch (parseError) {
//           console.error('Failed to parse chat history:', parseError);
//           parsedHistory = [];
//         }
//       }
      
//       setChatHistory(parsedHistory);
//       console.log('Initialized with chat history:', parsedHistory.length, 'chats');

//       // Then load active chat
//       const activeChat = await AsyncStorage.getItem(ACTIVE_CHAT_KEY);
//       if (activeChat) {
//         try {
//           const chatId = JSON.parse(activeChat);
          
//           // Verify chat exists in history
//           const chatExists = parsedHistory.some(chat => chat && chat.id === chatId);
          
//           if (chatExists) {
//             setActiveChatId(chatId);
//             await loadChatMessages(chatId);
//           } else {
//             // Active chat doesn't exist in history, clear it and select first available
//             console.log('Active chat not found in history, selecting first available');
//             await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
            
//             if (parsedHistory.length > 0) {
//               const firstChat = parsedHistory[0];
//               if (firstChat && firstChat.id) {
//                 setActiveChatId(firstChat.id);
//                 await loadChatMessages(firstChat.id);
//                 await AsyncStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(firstChat.id));
//               }
//             } else {
//               // No chats exist, create new one
//               await createNewChat(false);
//             }
//           }
//         } catch (parseError) {
//           console.error('Failed to parse active chat:', parseError);
//           await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
//           if (parsedHistory.length > 0) {
//             const firstChat = parsedHistory[0];
//             if (firstChat && firstChat.id) {
//               setActiveChatId(firstChat.id);
//               await loadChatMessages(firstChat.id);
//             }
//           } else {
//             await createNewChat(false);
//           }
//         }
//       } else {
//         // Create a new chat if no active chat exists
//         await createNewChat(false);
//       }

//       setIsInitialized(true);
//     } catch (error) {
//       console.error('Failed to initialize app:', error);
//       // Create a new chat if initialization fails
//       await createNewChat(false);
//       setIsInitialized(true);
//     }
//   };

//   const loadChatMessages = async (chatId) => {
//     try {
//       if (!chatId) {
//         console.log('No chatId provided to loadChatMessages');
//         setMessages([]);
//         return;
//       }

//       const messages = await AsyncStorage.getItem(`@chat_${chatId}`);
//       if (messages) {
//         try {
//           const parsedMessages = JSON.parse(messages);
//           setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
//           console.log(`Loaded ${Array.isArray(parsedMessages) ? parsedMessages.length : 0} messages for chat ${chatId}`);
//         } catch (parseError) {
//           console.error('Failed to parse messages:', parseError);
//           setMessages([]);
//         }
//       } else {
//         console.log(`No messages found for chat ${chatId}`);
//         setMessages([]);
//       }
//     } catch (error) {
//       console.error('Failed to load chat messages:', error);
//       setMessages([]);
//     }
//   };

//   const saveChatMessages = async (chatId, messages) => {
//     try {
//       if (!chatId) {
//         console.error('No chatId provided to saveChatMessages');
//         return;
//       }
//       await AsyncStorage.setItem(`@chat_${chatId}`, JSON.stringify(messages));
//       console.log(`Saved ${messages.length} messages for chat ${chatId}`);
//     } catch (error) {
//       console.error('Failed to save chat messages:', error);
//     }
//   };

//   const saveActiveChat = async (chatId) => {
//     try {
//       if (!chatId) {
//         console.error('No chatId provided to saveActiveChat');
//         return;
//       }
//       await AsyncStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(chatId));
//     } catch (error) {
//       console.error('Failed to save active chat:', error);
//     }
//   };

//   const updateChatHistory = async () => {
//     try {
//       // Update the chat history with the latest message
//       if (messages.length > 0 && activeChatId) {
//         const lastMessage = messages[messages.length - 1];
//         const title = lastMessage.isUser 
//           ? (lastMessage.text || '').substring(0, 30) + ((lastMessage.text || '').length > 30 ? '...' : '')
//           : (lastMessage.text || '').substring(0, 30) + ((lastMessage.text || '').length > 30 ? '...' : '');
        
//         // Update only the specific chat that was updated, don't replace the entire history
//         const updatedHistory = chatHistory.map(chat => {
//           if (chat && chat.id === activeChatId) {
//             return { ...chat, title, timestamp: lastMessage.timestamp || new Date().toLocaleTimeString() };
//           }
//           return chat;
//         }).filter(chat => chat && chat.id); // Filter out any invalid chats
        
//         console.log('Updating chat history, total chats:', updatedHistory.length);
//         await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
//         setChatHistory(updatedHistory);
//       }
//     } catch (error) {
//       console.error('Failed to update chat history:', error);
//     }
//   };

//   const createNewChat = async (closeSidebar = true) => {
//     try {
//       // Save current chat messages before creating a new one
//       if (activeChatId && messages.length > 0) {
//         await saveChatMessages(activeChatId, messages);
//         await updateChatHistory();
//       }

//       const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
//       const newChat = {
//         id: newChatId,
//         title: 'New Chat',
//         timestamp: new Date().toLocaleTimeString(),
//       };
      
//       // Add new chat to the beginning of the existing history
//       const updatedHistory = [newChat, ...chatHistory.filter(chat => chat && chat.id)];
//       console.log('Creating new chat, total chats will be:', updatedHistory.length);
      
//       setChatHistory(updatedHistory);
//       await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
//       setActiveChatId(newChatId);
//       await saveActiveChat(newChatId);
//       setMessages([]);
//       setSelectedImage(null);
      
//       if (closeSidebar) {
//         setSidebarVisible(false);
//       }
//     } catch (error) {
//       console.error('Failed to create new chat:', error);
//       Alert.alert('Error', 'Failed to create new chat');
//     }
//   };

//   const selectChat = async (chatId) => {
//     try {
//       if (!chatId) {
//         console.error('No chatId provided to selectChat');
//         return;
//       }

//       // Prevent multiple simultaneous selections
//       if (isSwitchingChat) {
//         console.log('Chat switch already in progress');
//         return;
//       }

//       setIsSwitchingChat(true);

//       // Save current chat messages before switching
//       if (activeChatId && messages.length > 0) {
//         await saveChatMessages(activeChatId, messages);
//         await updateChatHistory();
//       }

//       // Verify chat exists in history
//       const chatExists = chatHistory.some(chat => chat && chat.id === chatId);
//       if (!chatExists) {
//         console.log('Selected chat does not exist in history');
//         Alert.alert('Error', 'Chat not found');
//         setIsSwitchingChat(false);
//         return;
//       }

//       console.log(`Switching to chat ${chatId}`);
//       setActiveChatId(chatId);
//       await saveActiveChat(chatId);
      
//       // Clear messages first to show loading state
//       setMessages([]);
      
//       // Load messages for selected chat
//       await loadChatMessages(chatId);
      
//       setSidebarVisible(false);
//       setIsSwitchingChat(false);
//     } catch (error) {
//       console.error('Failed to select chat:', error);
//       Alert.alert('Error', 'Failed to select chat');
//       setIsSwitchingChat(false);
//     }
//   };

//   const deleteChat = async (chatId) => {
//     // Prevent multiple simultaneous deletions
//     if (deletingChatId === chatId) {
//       console.log('Delete already in progress for chat:', chatId);
//       return;
//     }

//     // Prevent deletion if this chat is already being deleted
//     if (deletingChatId) {
//       console.log('Another deletion in progress, ignoring delete request');
//       return;
//     }

//     if (!chatId) {
//       console.error('No chatId provided to deleteChat');
//       return;
//     }

//     console.log('Attempting to delete chat:', chatId);
    
//     Alert.alert(
//       "Delete Chat",
//       "Are you sure you want to delete this chat?",
//       [
//         { text: "Cancel", style: "cancel" },
//         { 
//           text: "Delete", 
//           style: "destructive",
//           onPress: async () => {
//             // Set deleting state to prevent multiple deletions
//             setDeletingChatId(chatId);
//             console.log('Delete confirmed for chat:', chatId);
            
//             try {
//               // Remove from chat history
//               const updatedHistory = chatHistory.filter(chat => chat && chat.id !== chatId);
//               console.log('Updated history before save:', updatedHistory);
              
//               setChatHistory(updatedHistory);
//               await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
              
//               // Remove messages
//               await AsyncStorage.removeItem(`@chat_${chatId}`);
//               console.log('Removed messages for chat:', chatId);
              
//               // If deleted chat was active, handle active chat selection
//               if (chatId === activeChatId) {
//                 console.log('Deleted chat was active, selecting new chat');
                
//                 if (updatedHistory.length > 0) {
//                   // Select the first available chat
//                   const firstAvailableChat = updatedHistory.find(chat => chat && chat.id);
//                   if (firstAvailableChat && firstAvailableChat.id) {
//                     const newActiveChatId = firstAvailableChat.id;
//                     setActiveChatId(newActiveChatId);
//                     await saveActiveChat(newActiveChatId);
//                     await loadChatMessages(newActiveChatId);
//                   } else {
//                     // No valid chats left, create a new one
//                     await createNewChat(false);
//                   }
//                 } else {
//                   // No chats left, create a new one
//                   await createNewChat(false);
//                 }
//               }
              
//               console.log('Chat deletion completed');
//               Alert.alert('Success', 'Chat deleted successfully');
//             } catch (error) {
//               console.error('Failed to delete chat:', error);
//               Alert.alert('Error', 'Failed to delete chat');
//             } finally {
//               // Reset deleting state
//               setDeletingChatId(null);
//             }
//           }
//         }
//       ]
//     );
//   };

//   const handleSend = async () => {
//     if (!inputText.trim() && !selectedImage) return;

//     // Ensure we have an active chat
//     if (!activeChatId) {
//       await createNewChat(false);
//     }

//     const userMessage = {
//       id: Date.now(),
//       text: inputText.trim(),
//       isUser: true,
//       timestamp: new Date().toLocaleTimeString(),
//       image: selectedImage,
//     };

//     setMessages(prev => [...prev, userMessage]);
//     setInputText('');
//     const imageToSend = selectedImage;
//     setSelectedImage(null);
//     setIsLoading(true);

//     try {
//       const response = await generateText(
//         inputText.trim() || "What do you see in this image?", 
//         imageToSend
//       );
      
//       const botMessage = {
//         id: Date.now() + 1,
//         text: response,
//         isUser: false,
//         timestamp: new Date().toLocaleTimeString(),
//       };

//       setMessages(prev => [...prev, botMessage]);
//     } catch (error) {
//       console.error('Error generating response:', error);
      
//       const errorMessage = {
//         id: Date.now() + 1,
//         text: `⚠️ Error: ${error.message || 'Unknown error occurred'}`,
//         isUser: false,
//         timestamp: new Date().toLocaleTimeString(),
//       };

//       setMessages(prev => [...prev, errorMessage]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const clearChat = () => {
//     Alert.alert(
//       "Clear Chat",
//       "Are you sure you want to clear this chat?",
//       [
//         { text: "Cancel", style: "cancel" },
//         { 
//           text: "Clear", 
//           onPress: () => {
//             setMessages([]);
//             setSelectedImage(null);
//           }
//         }
//       ]
//     );
//   };

//   const pickImage = () => {
//     Alert.alert(
//       "Select Image",
//       "Choose an option",
//       [
//         { text: "📷 Take Photo", onPress: () => openCamera() },
//         { text: "🖼️ Choose from Gallery", onPress: () => openGallery() },
//         { text: "❌ Cancel", style: "cancel" }
//       ]
//     );
//   };

//   const openCamera = async () => {
//     try {
//       setIsImageSelectionInProgress(true);
      
//       const granted = await PermissionsAndroid.request(
//         PermissionsAndroid.PERMISSIONS.CAMERA
//       );
      
//       if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
//         Alert.alert("Permission to access camera is required!");
//         setIsImageSelectionInProgress(false);
//         return;
//       }

//       const result = await launchCamera({
//         mediaType: 'photo',
//         quality: 0.7,
//         includeBase64: true,
//       });

//       if (!result.didCancel && result.assets) {
//         setSelectedImage(result.assets[0]);
//       }
      
//       setIsImageSelectionInProgress(false);
//     } catch (error) {
//       console.error('Camera error:', error);
//       Alert.alert('Error', 'Failed to open camera');
//       setIsImageSelectionInProgress(false);
//     }
//   };

//   const openGallery = async () => {
//     try {
//       setIsImageSelectionInProgress(true);
      
//       const result = await launchImageLibrary({
//         mediaType: 'photo',
//         quality: 0.7,
//         includeBase64: true,
//       });

//       if (!result.didCancel && result.assets) {
//         setSelectedImage(result.assets[0]);
//       }
      
//       setIsImageSelectionInProgress(false);
//     } catch (error) {
//       console.error('Gallery error:', error);
//       Alert.alert('Error', 'Failed to open gallery');
//       setIsImageSelectionInProgress(false);
//     }
//   };

//   const removeImage = () => {
//     setSelectedImage(null);
//   };

//   const renderMessage = (message) => (
//     <Animated.View 
//       key={message.id} 
//       style={[
//         styles.messageContainer,
//         message.isUser ? styles.userMessage : styles.botMessage,
//         { opacity: fadeAnim }
//       ]}
//     >
//       <View style={[
//         styles.messageBubble,
//         message.isUser ? styles.userBubble : styles.botBubble
//       ]}>
//         {message.image && (
//           <Image 
//             source={{ uri: message.image.uri }} 
//             style={styles.messageImage}
//             resizeMode="cover"
//           />
//         )}
//         <Text style={[
//           styles.messageText,
//           message.isUser ? styles.userText : styles.botText
//         ]}>
//           {message.text || ''}
//         </Text>
//       </View>
//       <Text style={styles.timestamp}>
//         {message.timestamp || ''}
//       </Text>
//     </Animated.View>
//   );

//   const renderSidebar = () => (
//     <Modal
//       animationType="slide"
//       transparent={false}
//       visible={sidebarVisible}
//       onRequestClose={() => setSidebarVisible(false)}
//     >
//       <View style={styles.sidebarContainer}>
//         <View style={styles.sidebarHeader}>
//           <Text style={styles.sidebarTitle}>Chat History</Text>
//           <TouchableOpacity onPress={() => setSidebarVisible(false)}>
//             <Icon name="close" size={24} color="#667eea" />
//           </TouchableOpacity>
//         </View>
        
//         <TouchableOpacity style={styles.newChatButton} onPress={() => createNewChat(true)}>
//           <Icon name="add-circle" size={20} color="#667eea" />
//           <Text style={styles.newChatText}>New Chat</Text>
//         </TouchableOpacity>
        
//         <ScrollView style={styles.chatList}>
//           {chatHistory.filter(chat => chat && chat.id).map(chat => (
//             <View key={chat.id} style={styles.chatItemWrapper}>
//               <TouchableOpacity
//                 style={[
//                   styles.chatItem,
//                   chat.id === activeChatId && styles.activeChatItem
//                 ]}
//                 onPress={() => selectChat(chat.id)}
//                 activeOpacity={0.7}
//                 disabled={isSwitchingChat}
//               >
//                 <View style={styles.chatItemContent}>
//                   <Text style={styles.chatItemTitle}>{chat.title || 'Untitled Chat'}</Text>
//                   <Text style={styles.chatItemTime}>{chat.timestamp || ''}</Text>
//                 </View>
//                 {chat.id === activeChatId && (
//                   <View style={styles.activeChatIndicator}>
//                     <Icon name="checkmark" size={16} color="#667eea" />
//                   </View>
//                 )}
//               </TouchableOpacity>
//               <TouchableOpacity 
//                 style={[
//                   styles.deleteButton,
//                   deletingChatId === chat.id && styles.deleteButtonDisabled
//                 ]}
//                 onPress={() => deleteChat(chat.id)}
//                 activeOpacity={0.7}
//                 disabled={deletingChatId === chat.id}
//               >
//                 {deletingChatId === chat.id ? (
//                   <ActivityIndicator size={16} color="#ff4757" />
//                 ) : (
//                   <Icon name="trash-outline" size={18} color="#ff4757" />
//                 )}
//               </TouchableOpacity>
//             </View>
//           ))}
//         </ScrollView>
//       </View>
//     </Modal>
//   );

//   // Show loading indicator while initializing
//   if (!isInitialized) {
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#667eea" />
//         <Text style={styles.loadingText}>Loading chat...</Text>
//       </View>
//     );
//   }

//   return (
//     <KeyboardAvoidingView 
//       style={styles.container}
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//     >
//       {/* White Header */}
//       <View style={styles.header}>
//         <View style={styles.headerContent}>
//           <TouchableOpacity onPress={() => setSidebarVisible(true)}>
//             <Icon name="menu" size={24} color="#667eea" />
//           </TouchableOpacity>
//           <Text style={styles.headerTitle}>🤖 llava:7b Chat</Text>
//           <View style={styles.headerButtons}>
//             <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
//               <Icon name="trash-outline" size={20} color="#667eea" />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>

//       {/* Messages */}
//       <ScrollView
//         ref={scrollViewRef}
//         style={styles.messagesContainer}
//         contentContainerStyle={styles.messagesContent}
//       >
//         {messages.length === 0 ? (
//           <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
//             <View style={styles.welcomeIcon}>
//               <Icon name="chatbubble-ellipses-outline" size={60} color="#667eea" />
//             </View>
//             <Text style={styles.welcomeText}>
//               👋 Welcome to AI Chat
//             </Text>
//             <Text style={styles.welcomeSubtext}>
//               I'm llava:7b! I can see images and help with anything.
//             </Text>
//             <Text style={styles.welcomeSubtext}>
//               📷 Send photos with questions for visual analysis
//             </Text>
//             {isImageSelectionInProgress && (
//               <Text style={styles.statusText}>
//                 📷 Image selection in progress...
//               </Text>
//             )}
//           </Animated.View>
//         ) : (
//           messages.map(renderMessage)
//         )}
        
//         {isLoading && (
//           <Animated.View style={[styles.messageContainer, styles.botMessage, { opacity: fadeAnim }]}>
//             <View style={[styles.messageBubble, styles.botBubble]}>
//               <View style={styles.typingContainer}>
//                 <ActivityIndicator size="small" color="#667eea" />
//                 <Text style={styles.typingIndicator}>
//                   AI is thinking...
//                 </Text>
//               </View>
//             </View>
//           </Animated.View>
//         )}
//       </ScrollView>

//       {/* Image Preview Modal */}
//       <Modal
//         animationType="fade"
//         transparent={true}
//         visible={imageModalVisible}
//         onRequestClose={() => setImageModalVisible(false)}
//       >
//         <TouchableOpacity 
//           style={styles.modalOverlay}
//           activeOpacity={1}
//           onPress={() => setImageModalVisible(false)}
//         >
//           <View style={styles.modalContent}>
//             <Image 
//               source={{ uri: selectedImage?.uri }} 
//               style={styles.modalImage}
//               resizeMode="contain"
//             />
//             <TouchableOpacity 
//               style={styles.modalClose}
//               onPress={() => setImageModalVisible(false)}
//             >
//               <Icon name="close" size={30} color="#fff" />
//             </TouchableOpacity>
//           </View>
//         </TouchableOpacity>
//       </Modal>

//       {/* Input Area */}
//       <View style={styles.inputContainer}>
//         {/* Selected Image Preview */}
//         {selectedImage && (
//           <View style={styles.selectedImageContainer}>
//             <Image 
//               source={{ uri: selectedImage.uri }} 
//               style={styles.selectedImage}
//               resizeMode="cover"
//             />
//             <TouchableOpacity 
//               style={styles.removeImageButton}
//               onPress={removeImage}
//             >
//               <Icon name="close-circle" size={20} color="#ff4757" />
//             </TouchableOpacity>
//           </View>
//         )}

//         <View style={styles.inputRow}>
//           <TouchableOpacity 
//             style={styles.attachButton}
//             onPress={pickImage}
//             disabled={isImageSelectionInProgress}
//           >
//             <Icon name="camera-outline" size={24} color={isImageSelectionInProgress ? "#ccc" : "#667eea"} />
//           </TouchableOpacity>
          
//           <TextInput
//             style={styles.textInput}
//             value={inputText}
//             onChangeText={setInputText}
//             placeholder="Type your message or add an image..."
//             placeholderTextColor="#999"
//             multiline
//             maxLength={1000}
//             editable={!isLoading && !isImageSelectionInProgress}
//           />
          
//           <TouchableOpacity
//             style={[
//               styles.sendButton,
//               (!inputText.trim() && !selectedImage) || isLoading ? styles.sendButtonDisabled : null
//             ]}
//             onPress={handleSend}
//             disabled={(!inputText.trim() && !selectedImage) || isLoading || isImageSelectionInProgress}
//           >
//             {isLoading ? (
//               <ActivityIndicator size="small" color="#fff" />
//             ) : (
//               <Icon name="send" size={20} color="#fff" />
//             )}
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Sidebar */}
//       {renderSidebar()}
//     </KeyboardAvoidingView>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#ffffff',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#667eea',
//   },
//   header: {
//     paddingTop: Platform.OS === 'ios' ? 50 : 30,
//     paddingBottom: 20,
//     paddingHorizontal: 20,
//     borderBottomLeftRadius: 30,
//     borderBottomRightRadius: 30,
//     backgroundColor: '#ffffff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   headerContent: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//   },
//   headerTitle: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     color: '#667eea',
//   },
//   headerButtons: {
//     flexDirection: 'row',
//   },
//   clearButton: {
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     borderRadius: 20,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//   },
//   messagesContainer: {
//     flex: 1,
//     backgroundColor: '#ffffff',
//   },
//   messagesContent: {
//     padding: 20,
//   },
//   welcomeContainer: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     marginTop: 50,
//   },
//   welcomeIcon: {
//     marginBottom: 20,
//   },
//   welcomeText: {
//     fontSize: 24,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//     textAlign: 'center',
//     marginBottom: 10,
//   },
//   welcomeSubtext: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     textAlign: 'center',
//     marginBottom: 8,
//     lineHeight: 22,
//   },
//   statusText: {
//     fontSize: 14,
//     color: '#f39c12',
//     textAlign: 'center',
//     marginTop: 10,
//     fontStyle: 'italic',
//   },
//   messageContainer: {
//     marginVertical: 8,
//     maxWidth: '80%',
//   },
//   userMessage: {
//     alignSelf: 'flex-end',
//     marginLeft: '20%',
//   },
//   botMessage: {
//     alignSelf: 'flex-start',
//     marginRight: '20%',
//   },
//   messageBubble: {
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     borderRadius: 20,
//     marginVertical: 2,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   userBubble: {
//     backgroundColor: '#667eea',
//   },
//   botBubble: {
//     backgroundColor: '#f1f3f5',
//     borderWidth: 0,
//   },
//   messageImage: {
//     width: 200,
//     height: 150,
//     borderRadius: 15,
//     marginBottom: 8,
//   },
//   userText: {
//     color: '#ffffff',
//   },
//   botText: {
//     color: '#2c3e50',
//   },
//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//   },
//   timestamp: {
//     fontSize: 11,
//     color: '#95a5a6',
//     marginHorizontal: 18,
//     marginTop: 4,
//   },
//   typingContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//   },
//   typingIndicator: {
//     fontSize: 16,
//     color: '#7f8c8d',
//     fontStyle: 'italic',
//     marginLeft: 8,
//   },
//   modalOverlay: {
//     flex: 1,
//     backgroundColor: 'rgba(0,0,0,0.8)',
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderRadius: 20,
//     padding: 20,
//     alignItems: 'center',
//   },
//   modalImage: {
//     width: width * 0.8,
//     height: height * 0.6,
//     borderRadius: 15,
//   },
//   modalClose: {
//     position: 'absolute',
//     top: 10,
//     right: 10,
//     backgroundColor: 'rgba(0,0,0,0.5)',
//     borderRadius: 20,
//     width: 40,
//     height: 40,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   inputContainer: {
//     paddingHorizontal: 20,
//     paddingVertical: 15,
//     borderTopWidth: 1,
//     borderTopColor: '#e1e8ed',
//     backgroundColor: '#ffffff',
//   },
//   selectedImageContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 10,
//     backgroundColor: '#fff',
//     borderRadius: 15,
//     padding: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   selectedImage: {
//     width: 60,
//     height: 60,
//     borderRadius: 10,
//   },
//   removeImageButton: {
//     marginLeft: 10,
//     backgroundColor: '#ffe8e8',
//     borderRadius: 15,
//     padding: 5,
//   },
//   inputRow: {
//     flexDirection: 'row',
//     alignItems: 'flex-end',
//   },
//   attachButton: {
//     backgroundColor: '#fff',
//     borderRadius: 25,
//     width: 50,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginRight: 10,
//     borderWidth: 2,
//     borderColor: '#667eea',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   textInput: {
//     flex: 1,
//     borderWidth: 1,
//     borderColor: '#e1e8ed',
//     borderRadius: 25,
//     paddingHorizontal: 20,
//     paddingVertical: 12,
//     marginRight: 10,
//     fontSize: 16,
//     maxHeight: 100,
//     backgroundColor: '#fff',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   sendButton: {
//     backgroundColor: '#667eea',
//     borderRadius: 25,
//     width: 50,
//     height: 50,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#667eea',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.3,
//     shadowRadius: 4,
//     elevation: 4,
//   },
//   sendButtonDisabled: {
//     backgroundColor: '#bdc3c7',
//     shadowOpacity: 0,
//     elevation: 0,
//   },
//   // Sidebar styles
//   sidebarContainer: {
//     flex: 1,
//     backgroundColor: '#f8f9fa',
//   },
//   sidebarHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     padding: 20,
//     borderBottomWidth: 1,
//     borderBottomColor: '#e1e8ed',
//   },
//   sidebarTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#2c3e50',
//   },
//   newChatButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     padding: 15,
//     marginHorizontal: 20,
//     marginVertical: 10,
//     backgroundColor: '#fff',
//     borderRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.1,
//     shadowRadius: 2,
//     elevation: 2,
//   },
//   newChatText: {
//     marginLeft: 10,
//     fontSize: 16,
//     color: '#667eea',
//     fontWeight: '500',
//   },
//   chatList: {
//     flex: 1,
//     paddingHorizontal: 20,
//   },
//   chatItemWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginVertical: 5,
//   },
//   chatItem: {
//     flex: 1,
//     padding: 15,
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 10,
//     borderBottomLeftRadius: 10,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   activeChatItem: {
//     backgroundColor: 'rgba(102, 126, 234, 0.1)',
//     borderLeftWidth: 3,
//     borderLeftColor: '#667eea',
//   },
//   chatItemContent: {
//     flex: 1,
//   },
//   chatItemTitle: {
//     fontSize: 16,
//     color: '#2c3e50',
//     fontWeight: '500',
//   },
//   chatItemTime: {
//     fontSize: 12,
//     color: '#95a5a6',
//     marginTop: 5,
//   },
//   activeChatIndicator: {
//     marginLeft: 10,
//   },
//   deleteButton: {
//     width: 40,
//     height: 40,
//     backgroundColor: '#fff',
//     borderTopRightRadius: 10,
//     borderBottomRightRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 1 },
//     shadowOpacity: 0.05,
//     shadowRadius: 2,
//     elevation: 1,
//   },
//   deleteButtonDisabled: {
//     opacity: 0.5,
//   },
// });


import React, { useState, useRef, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  PermissionsAndroid
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { generateText } from '../../../api/ollama';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useImageSelection } from '../../../context/AuthContext';
import { useAuth } from '../../../context/AuthContext';
import { Strings } from '../../../config/config'; // Import Config

const { width, height } = Dimensions.get('window');

const CHAT_HISTORY_KEY = '@chat_history';
const ACTIVE_CHAT_KEY = '@active_chat';

export default function TestOllamaScreen() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [deletingChatId, setDeletingChatId] = useState(null);
  const [isSwitchingChat, setIsSwitchingChat] = useState(false);
  const scrollViewRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const { isImageSelectionInProgress, setIsImageSelectionInProgress } = useImageSelection();
  const { userProfile, isAuthenticated } = useAuth();

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (activeChatId && messages.length > 0 && isInitialized) {
      saveChatMessages(activeChatId, messages);
      updateChatHistory();
    }
  }, [messages, activeChatId, isInitialized]);

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const initializeApp = async () => {
    try {
      const history = await AsyncStorage.getItem(CHAT_HISTORY_KEY);
      let parsedHistory = [];
      
      if (history) {
        try {
          const historyData = JSON.parse(history);
          parsedHistory = Array.isArray(historyData) 
            ? historyData.filter(chat => chat && typeof chat === 'object' && chat.id)
            : [];
        } catch (parseError) {
          console.error('Failed to parse chat history:', parseError);
          parsedHistory = [];
        }
      }
      
      setChatHistory(parsedHistory);
      console.log('Initialized with chat history:', parsedHistory.length, 'chats');

      const activeChat = await AsyncStorage.getItem(ACTIVE_CHAT_KEY);
      if (activeChat) {
        try {
          const chatId = JSON.parse(activeChat);
          
          const chatExists = parsedHistory.some(chat => chat && chat.id === chatId);
          
          if (chatExists) {
            setActiveChatId(chatId);
            await loadChatMessages(chatId);
          } else {
            console.log('Active chat not found in history, selecting first available');
            await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
            
            if (parsedHistory.length > 0) {
              const firstChat = parsedHistory[0];
              if (firstChat && firstChat.id) {
                setActiveChatId(firstChat.id);
                await loadChatMessages(firstChat.id);
                await AsyncStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(firstChat.id));
              }
            } else {
              await createNewChat(false);
            }
          }
        } catch (parseError) {
          console.error('Failed to parse active chat:', parseError);
          await AsyncStorage.removeItem(ACTIVE_CHAT_KEY);
          if (parsedHistory.length > 0) {
            const firstChat = parsedHistory[0];
            if (firstChat && firstChat.id) {
              setActiveChatId(firstChat.id);
              await loadChatMessages(firstChat.id);
            }
          } else {
            await createNewChat(false);
          }
        }
      } else {
        await createNewChat(false);
      }

      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize app:', error);
      await createNewChat(false);
      setIsInitialized(true);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      if (!chatId) {
        console.log('No chatId provided to loadChatMessages');
        setMessages([]);
        return;
      }

      const messages = await AsyncStorage.getItem(`@chat_${chatId}`);
      if (messages) {
        try {
          const parsedMessages = JSON.parse(messages);
          setMessages(Array.isArray(parsedMessages) ? parsedMessages : []);
          console.log(`Loaded ${Array.isArray(parsedMessages) ? parsedMessages.length : 0} messages for chat ${chatId}`);
        } catch (parseError) {
          console.error('Failed to parse messages:', parseError);
          setMessages([]);
        }
      } else {
        console.log(`No messages found for chat ${chatId}`);
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
      setMessages([]);
    }
  };

  const saveChatMessages = async (chatId, messages) => {
    try {
      if (!chatId) {
        console.error('No chatId provided to saveChatMessages');
        return;
      }
      await AsyncStorage.setItem(`@chat_${chatId}`, JSON.stringify(messages));
      console.log(`Saved ${messages.length} messages for chat ${chatId}`);
    } catch (error) {
      console.error('Failed to save chat messages:', error);
    }
  };

  const saveActiveChat = async (chatId) => {
    try {
      if (!chatId) {
        console.error('No chatId provided to saveActiveChat');
        return;
      }
      await AsyncStorage.setItem(ACTIVE_CHAT_KEY, JSON.stringify(chatId));
    } catch (error) {
      console.error('Failed to save active chat:', error);
    }
  };

  const updateChatHistory = async () => {
    try {
      if (messages.length > 0 && activeChatId) {
        const lastMessage = messages[messages.length - 1];
        const title = lastMessage.isUser 
          ? (lastMessage.text || '').substring(0, 30) + ((lastMessage.text || '').length > 30 ? '...' : '')
          : (lastMessage.text || '').substring(0, 30) + ((lastMessage.text || '').length > 30 ? '...' : '');
        
        const updatedHistory = chatHistory.map(chat => {
          if (chat && chat.id === activeChatId) {
            return { ...chat, title, timestamp: lastMessage.timestamp || new Date().toLocaleTimeString() };
          }
          return chat;
        }).filter(chat => chat && chat.id); 
        
        console.log('Updating chat history, total chats:', updatedHistory.length);
        await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
        setChatHistory(updatedHistory);
      }
    } catch (error) {
      console.error('Failed to update chat history:', error);
    }
  };

  const createNewChat = async (closeSidebar = true) => {
    try {
      if (activeChatId && messages.length > 0) {
        await saveChatMessages(activeChatId, messages);
        await updateChatHistory();
      }

      const newChatId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newChat = {
        id: newChatId,
        title: Strings.Ollama.sidebar.newChatBtn, // Using New Chat as initial title
        timestamp: new Date().toLocaleTimeString(),
      };
      
      const updatedHistory = [newChat, ...chatHistory.filter(chat => chat && chat.id)];
      console.log('Creating new chat, total chats will be:', updatedHistory.length);
      
      setChatHistory(updatedHistory);
      await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
      
      setActiveChatId(newChatId);
      await saveActiveChat(newChatId);
      setMessages([]);
      setSelectedImage(null);
      
      if (closeSidebar) {
        setSidebarVisible(false);
      }
    } catch (error) {
      console.error('Failed to create new chat:', error);
      Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.errorCreateChat);
    }
  };

  const selectChat = async (chatId) => {
    try {
      if (!chatId) {
        console.error('No chatId provided to selectChat');
        return;
      }

      if (isSwitchingChat) {
        console.log('Chat switch already in progress');
        return;
      }

      setIsSwitchingChat(true);

      if (activeChatId && messages.length > 0) {
        await saveChatMessages(activeChatId, messages);
        await updateChatHistory();
      }

      const chatExists = chatHistory.some(chat => chat && chat.id === chatId);
      if (!chatExists) {
        console.log('Selected chat does not exist in history');
        Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.chatNotFound);
        setIsSwitchingChat(false);
        return;
      }

      console.log(`Switching to chat ${chatId}`);
      setActiveChatId(chatId);
      await saveActiveChat(chatId);
      
      setMessages([]);
      
      await loadChatMessages(chatId);
      
      setSidebarVisible(false);
      setIsSwitchingChat(false);
    } catch (error) {
      console.error('Failed to select chat:', error);
      Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.errorSelectChat);
      setIsSwitchingChat(false);
    }
  };

  const deleteChat = async (chatId) => {
    if (deletingChatId === chatId) {
      console.log('Delete already in progress for chat:', chatId);
      return;
    }

    if (deletingChatId) {
      console.log('Another deletion in progress, ignoring delete request');
      return;
    }

    if (!chatId) {
      console.error('No chatId provided to deleteChat');
      return;
    }

    console.log('Attempting to delete chat:', chatId);
    
    Alert.alert(
      Strings.Ollama.alerts.deleteChatTitle,
      Strings.Ollama.alerts.deleteChatMsg,
      [
        { text: Strings.Ollama.common.cancel, style: "cancel" },
        { 
          text: Strings.Ollama.common.delete, 
          style: "destructive",
          onPress: async () => {
            setDeletingChatId(chatId);
            console.log('Delete confirmed for chat:', chatId);
            
            try {
              const updatedHistory = chatHistory.filter(chat => chat && chat.id !== chatId);
              console.log('Updated history before save:', updatedHistory);
              
              setChatHistory(updatedHistory);
              await AsyncStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(updatedHistory));
              
              await AsyncStorage.removeItem(`@chat_${chatId}`);
              console.log('Removed messages for chat:', chatId);
              
              if (chatId === activeChatId) {
                console.log('Deleted chat was active, selecting new chat');
                
                if (updatedHistory.length > 0) {
                  const firstAvailableChat = updatedHistory.find(chat => chat && chat.id);
                  if (firstAvailableChat && firstAvailableChat.id) {
                    const newActiveChatId = firstAvailableChat.id;
                    setActiveChatId(newActiveChatId);
                    await saveActiveChat(newActiveChatId);
                    await loadChatMessages(newActiveChatId);
                  } else {
                    await createNewChat(false);
                  }
                } else {
                  await createNewChat(false);
                }
              }
              
              console.log('Chat deletion completed');
              Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.deleteSuccess);
            } catch (error) {
              console.error('Failed to delete chat:', error);
              Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.errorDeleteChat);
            } finally {
              setDeletingChatId(null);
            }
          }
        }
      ]
    );
  };

  const handleSend = async () => {
    if (!inputText.trim() && !selectedImage) return;

    if (!activeChatId) {
      await createNewChat(false);
    }

    const userMessage = {
      id: Date.now(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date().toLocaleTimeString(),
      image: selectedImage,
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    const imageToSend = selectedImage;
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const response = await generateText(
        inputText.trim() || "What do you see in this image?", 
        imageToSend
      );
      
      const botMessage = {
        id: Date.now() + 1,
        text: response,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: `⚠️ Error: ${error.message || 'Unknown error occurred'}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    Alert.alert(
      Strings.Ollama.alerts.clearChatTitle,
      Strings.Ollama.alerts.clearChatMsg,
      [
        { text: Strings.Ollama.common.cancel, style: "cancel" },
        { 
          text: Strings.Ollama.alerts.clearBtn, 
          onPress: () => {
            setMessages([]);
            setSelectedImage(null);
          }
        }
      ]
    );
  };

  const pickImage = () => {
    Alert.alert(
      Strings.Ollama.alerts.imageSelectionTitle,
      Strings.Ollama.alerts.imageSelectionMsg,
      [
        { text: Strings.Ollama.alerts.cameraOption, onPress: () => openCamera() },
        { text: Strings.Ollama.alerts.galleryOption, onPress: () => openGallery() },
        { text: "❌ Cancel", style: "cancel" } // Keeping cancel emoji for variation or use config
      ]
    );
  };

  const openCamera = async () => {
    try {
      setIsImageSelectionInProgress(true);
      
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.cameraPermission);
        setIsImageSelectionInProgress(false);
        return;
      }

      const result = await launchCamera({
        mediaType: 'photo',
        quality: 0.7,
        includeBase64: true,
      });

      if (!result.didCancel && result.assets) {
        setSelectedImage(result.assets[0]);
      }
      
      setIsImageSelectionInProgress(false);
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.cameraError);
      setIsImageSelectionInProgress(false);
    }
  };

  const openGallery = async () => {
    try {
      setIsImageSelectionInProgress(true);
      
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.7,
        includeBase64: true,
      });

      if (!result.didCancel && result.assets) {
        setSelectedImage(result.assets[0]);
      }
      
      setIsImageSelectionInProgress(false);
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert(Strings.Ollama.alerts.genericError, Strings.Ollama.alerts.galleryError);
      setIsImageSelectionInProgress(false);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
  };

  const renderMessage = (message) => (
    <Animated.View 
      key={message.id} 
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.botMessage,
        { opacity: fadeAnim }
      ]}
    >
      <View style={[
        styles.messageBubble,
        message.isUser ? styles.userBubble : styles.botBubble
      ]}>
        {message.image && (
          <Image 
            source={{ uri: message.image.uri }} 
            style={styles.messageImage}
            resizeMode="cover"
          />
        )}
        <Text style={[
          styles.messageText,
          message.isUser ? styles.userText : styles.botText
        ]}>
          {message.text || ''}
        </Text>
      </View>
      <Text style={styles.timestamp}>
        {message.timestamp || ''}
      </Text>
    </Animated.View>
  );

  const renderSidebar = () => (
    <Modal
      animationType="slide"
      transparent={false}
      visible={sidebarVisible}
      onRequestClose={() => setSidebarVisible(false)}
    >
      <View style={styles.sidebarContainer}>
        <View style={styles.sidebarHeader}>
          <Text style={styles.sidebarTitle}>{Strings.Ollama.sidebar.title}</Text>
          <TouchableOpacity onPress={() => setSidebarVisible(false)}>
            <Icon name="close" size={24} color="#667eea" />
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.newChatButton} onPress={() => createNewChat(true)}>
          <Icon name="add-circle" size={20} color="#667eea" />
          <Text style={styles.newChatText}>{Strings.Ollama.sidebar.newChatBtn}</Text>
        </TouchableOpacity>
        
        <ScrollView style={styles.chatList}>
          {chatHistory.filter(chat => chat && chat.id).map(chat => (
            <View key={chat.id} style={styles.chatItemWrapper}>
              <TouchableOpacity
                style={[
                  styles.chatItem,
                  chat.id === activeChatId && styles.activeChatItem
                ]}
                onPress={() => selectChat(chat.id)}
                activeOpacity={0.7}
                disabled={isSwitchingChat}
              >
                <View style={styles.chatItemContent}>
                  <Text style={styles.chatItemTitle}>{chat.title || Strings.Ollama.sidebar.untitled}</Text>
                  <Text style={styles.chatItemTime}>{chat.timestamp || ''}</Text>
                </View>
                {chat.id === activeChatId && (
                  <View style={styles.activeChatIndicator}>
                    <Icon name="checkmark" size={16} color="#667eea" />
                  </View>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.deleteButton,
                  deletingChatId === chat.id && styles.deleteButtonDisabled
                ]}
                onPress={() => deleteChat(chat.id)}
                activeOpacity={0.7}
                disabled={deletingChatId === chat.id}
              >
                {deletingChatId === chat.id ? (
                  <ActivityIndicator size={16} color="#ff4757" />
                ) : (
                  <Icon name="trash-outline" size={18} color="#ff4757" />
                )}
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#667eea" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => setSidebarVisible(true)}>
            <Icon name="menu" size={24} color="#667eea" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{Strings.Ollama.header.title}</Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
              <Icon name="trash-outline" size={20} color="#667eea" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
      >
        {messages.length === 0 ? (
          <Animated.View style={[styles.welcomeContainer, { opacity: fadeAnim }]}>
            <View style={styles.welcomeIcon}>
              <Icon name="chatbubble-ellipses-outline" size={60} color="#667eea" />
            </View>
            <Text style={styles.welcomeText}>
              {Strings.Ollama.chat.welcomeTitle}
            </Text>
            <Text style={styles.welcomeSubtext}>
              {Strings.Ollama.chat.welcomeSubtext1}
            </Text>
            <Text style={styles.welcomeSubtext}>
              {Strings.Ollama.chat.welcomeSubtext2}
            </Text>
            {isImageSelectionInProgress && (
              <Text style={styles.statusText}>
                {Strings.Ollama.chat.imageProgress}
              </Text>
            )}
          </Animated.View>
        ) : (
          messages.map(renderMessage)
        )}
        
        {isLoading && (
          <Animated.View style={[styles.messageContainer, styles.botMessage, { opacity: fadeAnim }]}>
            <View style={[styles.messageBubble, styles.botBubble]}>
              <View style={styles.typingContainer}>
                <ActivityIndicator size="small" color="#667eea" />
                <Text style={styles.typingIndicator}>
                  {Strings.Ollama.chat.thinking}
                </Text>
              </View>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={imageModalVisible}
        onRequestClose={() => setImageModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}
        >
          <View style={styles.modalContent}>
            <Image 
              source={{ uri: selectedImage?.uri }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.modalClose}
              onPress={() => setImageModalVisible(false)}
            >
              <Icon name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={styles.inputContainer}>
        {selectedImage && (
          <View style={styles.selectedImageContainer}>
            <Image 
              source={{ uri: selectedImage.uri }} 
              style={styles.selectedImage}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.removeImageButton}
              onPress={removeImage}
            >
              <Icon name="close-circle" size={20} color="#ff4757" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputRow}>
          <TouchableOpacity 
            style={styles.attachButton}
            onPress={pickImage}
            disabled={isImageSelectionInProgress}
          >
            <Icon name="camera-outline" size={24} color={isImageSelectionInProgress ? "#ccc" : "#667eea"} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={Strings.Ollama.chat.inputPlaceholder}
            placeholderTextColor="#999"
            multiline
            maxLength={1000}
            editable={!isLoading && !isImageSelectionInProgress}
          />
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() && !selectedImage) || isLoading ? styles.sendButtonDisabled : null
            ]}
            onPress={handleSend}
            disabled={(!inputText.trim() && !selectedImage) || isLoading || isImageSelectionInProgress}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {renderSidebar()}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#667eea',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#667eea',
  },
  headerButtons: {
    flexDirection: 'row',
  },
  clearButton: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  messagesContent: {
    padding: 20,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  welcomeIcon: {
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    textAlign: 'center',
    marginBottom: 10,
  },
  welcomeSubtext: {
    fontSize: 16,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 22,
  },
  statusText: {
    fontSize: 14,
    color: '#f39c12',
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  messageContainer: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userMessage: {
    alignSelf: 'flex-end',
    marginLeft: '20%',
  },
  botMessage: {
    alignSelf: 'flex-start',
    marginRight: '20%',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 20,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userBubble: {
    backgroundColor: '#667eea',
  },
  botBubble: {
    backgroundColor: '#f1f3f5',
    borderWidth: 0,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: 15,
    marginBottom: 8,
  },
  userText: {
    color: '#ffffff',
  },
  botText: {
    color: '#2c3e50',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  timestamp: {
    fontSize: 11,
    color: '#95a5a6',
    marginHorizontal: 18,
    marginTop: 4,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingIndicator: {
    fontSize: 16,
    color: '#7f8c8d',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalImage: {
    width: width * 0.8,
    height: height * 0.6,
    borderRadius: 15,
  },
  modalClose: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ed',
    backgroundColor: '#ffffff',
  },
  selectedImageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedImage: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  removeImageButton: {
    marginLeft: 10,
    backgroundColor: '#ffe8e8',
    borderRadius: 15,
    padding: 5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  attachButton: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#667eea',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  sendButton: {
    backgroundColor: '#667eea',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  sendButtonDisabled: {
    backgroundColor: '#bdc3c7',
    shadowOpacity: 0,
    elevation: 0,
  },
  sidebarContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newChatText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#667eea',
    fontWeight: '500',
  },
  chatList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  chatItem: {
    flex: 1,
    padding: 15,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  activeChatItem: {
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#667eea',
  },
  chatItemContent: {
    flex: 1,
  },
  chatItemTitle: {
    fontSize: 16,
    color: '#2c3e50',
    fontWeight: '500',
  },
  chatItemTime: {
    fontSize: 12,
    color: '#95a5a6',
    marginTop: 5,
  },
  activeChatIndicator: {
    marginLeft: 10,
  },
  deleteButton: {
    width: 40,
    height: 40,
    backgroundColor: '#fff',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});