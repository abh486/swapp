// // src/screens/community/Community.jsx

// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   StatusBar,
//   SafeAreaView,
//   TextInput,
//   FlatList,
//   Image,
//   Modal,
//   ActivityIndicator,
//   Alert,
//   AppState,
//   Platform,
//   PermissionsAndroid,
//   Linking,
// } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';
// // Import only the specific function we need from ImagePicker
// import { launchImageLibrary } from 'react-native-image-picker';
// import { useDispatch } from 'react-redux';
// import { getAllPosts, likePost, addComment, createPost } from '../../redux/actions/postActions';
// import { API_BASE_URL } from '../../api/apiClient';
// import FindTrainers from './components/FindTrainers';
// import { useImageSelection } from '../../context/AuthContext';

// const { width: screenWidth } = Dimensions.get('window');

// const Community = () => {
//   const dispatch = useDispatch();
//   const { 
//     isImageSelectionInProgress, 
//     setIsImageSelectionInProgress,
//     pendingImage,
//     setPendingImage
//   } = useImageSelection();
  
//   const [activeTab, setActiveTab] = useState('posts');
//   const [posts, setPosts] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isUploading, setIsUploading] = useState(false);

//   const [isPostModalVisible, setPostModalVisible] = useState(false);
//   const [newPostCaption, setNewPostCaption] = useState('');
//   const [newPostImage, setNewPostImage] = useState(null);

//   // Add refs to track state that shouldn't trigger re-renders
//   const isMounted = useRef(true);
//   const appState = useRef(AppState.currentState);
//   const appStateSubscription = useRef(null);
  
//   // Track component mount/unmount
//   useEffect(() => {
//     console.log('Community component mounted');
//     isMounted.current = true;
    
//     // Check if there's a pending image from a previous selection
//     if (pendingImage) {
//       console.log('Found pending image from previous selection');
//       setNewPostImage(pendingImage);
//       setPendingImage(null);
//     }
    
//     // Add app state listener
//     appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
//       console.log('AppState changed to', nextAppState);
//       appState.current = nextAppState;
//     });
    
//     return () => {
//       console.log('Community component unmounting');
//       isMounted.current = false;
//       if (appStateSubscription.current) {
//         appStateSubscription.current.remove();
//       }
//     };
//   }, [pendingImage, setPendingImage]);

//   const fetchPosts = useCallback(async () => {
//     // Don't fetch if we're in the middle of image selection
//     if (isImageSelectionInProgress) {
//       console.log('Skipping fetchPosts during image selection');
//       return;
//     }
    
//     console.log('Fetching posts...');
//     setIsLoading(true);
//     try {
//       const response = await dispatch(getAllPosts());
//       const postsData = response?.data?.data || response?.data || [];
//       console.log('Posts fetched successfully:', postsData.length);
//       const postsWithFullUrls = postsData.map(post => ({
//         ...post,
//         imageUrl: post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE_URL.replace('/api', '')}${post.imageUrl}`,
//         userAvatar: post.author?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg',
//         userName: post.author?.email || 'Anonymous',
//       }));
      
//       // Only update state if component is still mounted
//       if (isMounted.current) {
//         setPosts(postsWithFullUrls);
//       }
//     } catch (error) {
//       console.error('Failed to fetch posts:', error);
//       if (isMounted.current) {
//         Alert.alert('Error', 'Could not fetch community posts.');
//       }
//     } finally {
//       if (isMounted.current) {
//         setIsLoading(false);
//       }
//     }
//   }, [isImageSelectionInProgress]);

//   useEffect(() => {
//     if (activeTab === 'posts') {
//       fetchPosts();
//     }
//   }, [activeTab, fetchPosts]);

//   const handleLike = async (postId) => {
//     console.log('Liking post:', postId);
//     const originalPosts = JSON.parse(JSON.stringify(posts));
//     const post = posts.find(p => p.id === postId);
//     if (!post) return;

//     // Optimistic update
//     const updatedPosts = posts.map(p =>
//       p.id === postId
//         ? {
//             ...p,
//             liked: !p.liked,
//             _count: {
//               ...p._count,
//               likes: p.liked ? p._count.likes - 1 : p._count.likes + 1,
//             },
//           }
//         : p
//     );
    
//     if (isMounted.current) {
//       setPosts(updatedPosts);
//     }

//     try {
//       await dispatch(likePost(postId));
//       console.log('Post liked successfully');
//     } catch (error) {
//       console.error('Failed to like post:', error);
//       if (isMounted.current) {
//         Alert.alert('Error', 'Could not update like status.');
//         setPosts(originalPosts);
//       }
//     }
//   };

//   const handleComment = async (postId, commentText) => {
//     if (!commentText.trim()) return;
//     console.log('Adding comment to post:', postId);
//     const originalPosts = JSON.parse(JSON.stringify(posts));
//     const newComment = {
//       id: Date.now().toString(),
//       content: commentText,
//       author: { email: 'You' },
//     };

//     const updatedPosts = posts.map(p =>
//       p.id === postId
//         ? {
//             ...p,
//             comments: [newComment, ...p.comments],
//             _count: { ...p._count, comments: p._count.comments + 1 },
//           }
//         : p
//     );
    
//     if (isMounted.current) {
//       setPosts(updatedPosts);
//     }

//     try {
//       await dispatch(addComment(postId, commentText));
//       console.log('Comment added successfully');
//     } catch (error) {
//       console.error('Failed to add comment:', error);
//       if (isMounted.current) {
//         Alert.alert('Error', 'Could not add your comment.');
//         setPosts(originalPosts);
//       }
//     }
//   };

//   // Check if a specific permission is granted
//   const checkPermission = async (permission) => {
//     try {
//       const result = await PermissionsAndroid.check(permission);
//       console.log(`Permission ${permission}: ${result}`);
//       return result;
//     } catch (error) {
//       console.error(`Error checking permission ${permission}:`, error);
//       return false;
//     }
//   };

//   // Request camera and storage permissions for Android
//   const requestPermissions = async () => {
//     if (Platform.OS === 'android') {
//       try {
//         console.log('Android version:', Platform.Version);
        
//         // Define permissions based on Android version
//         let permissionsToRequest = [];
        
//         if (Platform.Version >= 33) {
//           // Android 13+ (API 33+)
//           permissionsToRequest = [
//             PermissionsAndroid.PERMISSIONS.CAMERA,
//             PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
//           ];
//         } else if (Platform.Version >= 29) {
//           // Android 10-12
//           permissionsToRequest = [
//             PermissionsAndroid.PERMISSIONS.CAMERA,
//             PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//           ];
//         } else {
//           // Android 9 and below
//           permissionsToRequest = [
//             PermissionsAndroid.PERMISSIONS.CAMERA,
//             PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
//             PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
//           ];
//         }
        
//         console.log('Permissions to request:', permissionsToRequest);
        
//         // Request permissions
//         const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);
//         console.log('Permission results:', granted);
        
//         // Check if all required permissions are granted
//         const allGranted = permissionsToRequest.every(permission => 
//           granted[permission] === PermissionsAndroid.RESULTS.GRANTED
//         );
        
//         if (allGranted) {
//           console.log('All permissions granted');
//           return true;
//         } else {
//           console.log('Some permissions were denied');
          
//           // Show which permissions were denied
//           const deniedPermissions = permissionsToRequest.filter(permission => 
//             granted[permission] !== PermissionsAndroid.RESULTS.GRANTED
//           );
//           console.log('Denied permissions:', deniedPermissions);
          
//           Alert.alert(
//             'Permission Required', 
//             'Please grant camera and storage permissions to select images. You can enable them in your device settings.',
//             [
//               { text: 'Cancel', style: 'cancel' },
//               { text: 'Settings', onPress: () => Linking.openSettings() }
//             ]
//           );
//           return false;
//         }
//       } catch (err) {
//         console.error('Permission request error:', err);
//         Alert.alert('Error', 'Failed to request permissions. Please try again.');
//         return false;
//       }
//     }
//     return true; // iOS doesn't need explicit permission for image library
//   };

//   // Simplified image selection function
//   const handleSelectImage = useCallback(async () => {
//     console.log('=== START IMAGE SELECTION ===');
    
//     // Check if component is still mounted
//     if (!isMounted.current) {
//       console.error('Component is not mounted, aborting image selection');
//       return;
//     }
    
//     // Check if we're already selecting an image
//     if (isImageSelectionInProgress) {
//       console.log('Image selection already in progress');
//       return;
//     }
    
//     // Request permissions first
//     const hasPermission = await requestPermissions();
//     if (!hasPermission) {
//       console.log('Permission not granted, aborting image selection');
//       return;
//     }
    
//     // Set flag to indicate we're starting image selection
//     setIsImageSelectionInProgress(true);
    
//     const options = {
//       mediaType: 'photo',
//       quality: 0.8,
//       maxWidth: 1024,
//       maxHeight: 1024,
//       includeBase64: false,
//       includeExtra: true,
//     };

//     try {
//       console.log('Launching image library...');
      
//       // Launch the image library with a callback
//       launchImageLibrary(options, (response) => {
//         console.log('Image picker callback received');
//         console.log('Callback response:', JSON.stringify(response, null, 2));
        
//         // Reset the flag after processing
//         setIsImageSelectionInProgress(false);
        
//         // Defensive check: ensure response is an object
//         if (!response) {
//           console.error('Image picker callback received null/undefined response');
//           return;
//         }
        
//         // Check if component is still mounted
//         if (!isMounted.current) {
//           console.error('Component was unmounted before callback, saving image to context');
          
//           // If the component was unmounted, save the selected image to context
//           if (response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
//             const asset = response.assets[0];
//             const newImage = {
//               uri: asset.uri,
//               type: asset.type || 'image/jpeg',
//               fileName: asset.fileName || `photo_${Date.now()}.jpg`,
//             };
//             setPendingImage(newImage);
//           }
//           return;
//         }

//         if (response.didCancel) {
//           console.log('User cancelled image picker');
//           return;
//         }
        
//         if (response.errorCode) {
//           console.error('ImagePicker Error: ', response.errorMessage);
//           Alert.alert('Image Error', response.errorMessage || 'An unknown error occurred');
//           return;
//         }

//         if (response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
//           const asset = response.assets[0];
//           console.log('Selected image asset:', asset);
          
//           console.log('Setting new post image...');
//           const newImage = {
//             uri: asset.uri,
//             type: asset.type || 'image/jpeg',
//             fileName: asset.fileName || `photo_${Date.now()}.jpg`,
//           };
          
//           // Update state
//           setNewPostImage(newImage);
//           console.log('New post image set successfully');
//         } else {
//           console.error('No assets found in image picker result');
//         }
        
//         console.log('=== END IMAGE SELECTION ===');
//       });
      
//     } catch (error) {
//       console.error('An error occurred in launchImageLibrary: ', error);
//       if (isMounted.current) {
//         Alert.alert('Error', 'An unexpected error occurred while selecting the image.');
//       }
//       setIsImageSelectionInProgress(false);
//     }
//   }, [isMounted, isImageSelectionInProgress, requestPermissions, setIsImageSelectionInProgress, setPendingImage]);

//   const handleAddPost = async () => {
//     console.log('Adding new post...');
//     if (!newPostImage || !newPostCaption.trim()) {
//       console.log('Post incomplete - missing image or caption');
//       Alert.alert('Incomplete Post', 'Please select an image and write a caption.');
//       return;
//     }
    
//     console.log('Post data is valid, starting upload...');
//     setIsUploading(true);
//     try {
//       await dispatch(createPost(newPostCaption, newPostImage));
//       console.log('Post created successfully');
//       if (isMounted.current) {
//         setPostModalVisible(false);
//         setNewPostImage(null);
//         setNewPostCaption('');
//         fetchPosts();
//       }
//     } catch (error) {
//       const message = error.message || 'Could not create post.';
//       console.error('Failed to create post:', error);
//       if (isMounted.current) {
//         Alert.alert('Upload Error', message);
//       }
//     } finally {
//       if (isMounted.current) {
//         setIsUploading(false);
//       }
//     }
//   };

//   const PostCard = ({ item }) => {
//     const [postComment, setPostComment] = useState('');
//     const submitComment = () => {
//         if (postComment.trim()) {
//           handleComment(item.id, postComment);
//           setPostComment('');
//         }
//     };

//     return (
//       <View style={styles.postCard}>
//         <View style={styles.postHeader}>
//           <View style={styles.avatarContainer}>
//             <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
//             <View style={[styles.statusIndicator, styles.statusOnline]} />
//           </View>
//           <View style={styles.postUserInfo}>
//             <Text style={styles.userName}>{item.userName}</Text>
//             <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleString()}</Text>
//           </View>
//           <TouchableOpacity style={styles.moreButton}>
//             <Icon name="ellipsis-horizontal" size={20} color="#57595B" />
//           </TouchableOpacity>
//         </View>
//         <Text style={styles.caption}>{item.content}</Text>
//         {item.imageUrl && (
//           <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
//         )}
//         <View style={styles.postActions}>
//           <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.actionButton}>
//             <Icon name={item.liked ? 'heart' : 'heart-outline'} size={24} color={item.liked ? '#452829' : '#57595B'} />
//             <Text style={styles.actionText}>{item._count.likes}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionButton}>
//             <Icon name="chatbubble-outline" size={24} color="#57595B" />
//             <Text style={styles.actionText}>{item._count.comments}</Text>
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.actionButton}>
//             <Icon name="send-outline" size={24} color="#57595B" />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.commentsSection}>
//           {item.comments.slice(0, 2).map(comment => (
//             <Text key={comment.id} style={styles.commentText}>
//               <Text style={{ fontWeight: 'bold' }}>{comment.author?.email || 'User'}:</Text> {comment.content}
//             </Text>
//           ))}
//           <View style={styles.commentInputContainer}>
//             <TextInput
//               style={styles.commentInput}
//               placeholder="Add a comment..."
//               placeholderTextColor="#888"
//               value={postComment}
//               onChangeText={setPostComment}
//               onSubmitEditing={submitComment}
//               returnKeyType="send"
//             />
//             <TouchableOpacity onPress={submitComment}>
//               <Icon name="send" size={24} color={postComment.trim() ? '#452829' : '#888'} />
//             </TouchableOpacity>
//           </View>
//         </View>
//       </View>
//     );
//   };
  
//   const renderPostsTab = () => (
//     <>
//       {isLoading && posts.length === 0 ? (
//         <ActivityIndicator size="large" color="#452829" style={{ marginTop: 20 }} />
//       ) : (
//         <FlatList
//           data={posts}
//           keyExtractor={item => item.id}
//           renderItem={({ item }) => <PostCard item={item} />}
//           showsVerticalScrollIndicator={false}
//           onRefresh={fetchPosts}
//           refreshing={isLoading}
//           ListEmptyComponent={
//             !isLoading ? (
//                 <Text style={styles.emptyListText}>
//                 No posts yet. Be the first to share!
//                 </Text>
//             ) : null
//           }
//         />
//       )}
//     </>
//   );

//   const tabs = [
//     { id: 'posts', title: 'Community Posts' },
//     { id: 'trainers', title: 'Find Trainers' },
//   ];

//   return (
//     <SafeAreaView style={styles.container}>
//       <StatusBar barStyle="light-content" backgroundColor="#1c1617" />

//       {/* Header */}
//       <View style={styles.header}>
//         <Text style={styles.headerTitle}>Community</Text>
//         <View style={styles.headerActions}>
//           <TouchableOpacity style={styles.headerButton}>
//             <Icon name="search" size={24} color="#fff" />
//           </TouchableOpacity>
//           <TouchableOpacity style={styles.headerButton}>
//             <Icon name="notifications-outline" size={24} color="#fff" />
//           </TouchableOpacity>
//         </View>
//       </View>

//       {/* Tab Selector */}
//       <View style={styles.tabContainer}>
//         <View style={styles.tabSelector}>
//           {tabs.map(tab => (
//             <TouchableOpacity
//               key={tab.id}
//               style={[
//                 styles.tab,
//                 activeTab === tab.id && styles.activeTab
//               ]}
//               onPress={() => {
//                 console.log('Tab changed to:', tab.id);
//                 setActiveTab(tab.id);
//               }}
//             >
//               <Text style={[
//                 styles.tabText,
//                 activeTab === tab.id && styles.activeTabText
//               ]}>{tab.title}</Text>
//             </TouchableOpacity>
//           ))}
//         </View>
//       </View>

//       {/* Content */}
//       <View style={styles.content}>
//         {activeTab === 'posts' && renderPostsTab()}
//         {activeTab === 'trainers' && <FindTrainers />}
//       </View>

//       {/* Floating Action Button */}
//       {activeTab === 'posts' && (
//         <TouchableOpacity 
//           style={styles.fab} 
//           onPress={() => {
//             console.log('Opening create post modal');
//             setPostModalVisible(true);
//           }}
//         >
//           <Icon name="add" size={32} color="#fff" />
//         </TouchableOpacity>
//       )}

//       {/* Create Post Modal */}
//       <Modal
//         animationType="slide"
//         transparent={true}
//         visible={isPostModalVisible}
//         onRequestClose={() => {
//           console.log('Modal close requested');
//           setPostModalVisible(false);
//         }}
//       >
//         <View style={styles.modalContainer}>
//           <View style={styles.modalContent}>
//             <View style={styles.modalHeader}>
//               <Text style={styles.modalTitle}>Create a New Post</Text>
//               <TouchableOpacity 
//                 style={styles.closeButton} 
//                 onPress={() => {
//                   console.log('Cancel button pressed');
//                   setPostModalVisible(false);
//                 }}
//               >
//                 <Icon name="close" size={24} color="#fff" />
//               </TouchableOpacity>
//             </View>
            
//             <TouchableOpacity style={styles.imagePicker} onPress={handleSelectImage}>
//               {newPostImage ? (
//                 <Image source={{ uri: newPostImage.uri }} style={styles.imagePreview} resizeMode="cover" />
//               ) : (
//                 <>
//                   <Icon name="camera" size={40} color="#452829" />
//                   <Text style={styles.imagePickerText}>Select an Image</Text>
//                 </>
//               )}
//             </TouchableOpacity>
            
//             <TextInput
//               style={styles.captionInput}
//               placeholder="Write a caption..."
//               placeholderTextColor="#888"
//               value={newPostCaption}
//               onChangeText={setNewPostCaption}
//               multiline
//             />
            
//             <TouchableOpacity
//               style={[
//                 styles.postButton, 
//                 (isUploading || !newPostCaption.trim() || !newPostImage) && styles.disabledButton
//               ]}
//               onPress={handleAddPost}
//               disabled={isUploading || !newPostCaption.trim() || !newPostImage}
//             >
//               {isUploading ? (
//                 <ActivityIndicator color="#fff" />
//               ) : (
//                 <Text style={styles.postButtonText}>Post</Text>
//               )}
//             </TouchableOpacity>
//           </View>
//         </View>
//       </Modal>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#f7f6f6' 
//   },
//   header: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#1c1617',
//   },
//   headerTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#fff',
//   },
//   headerActions: {
//     flexDirection: 'row',
//     gap: 8,
//   },
//   headerButton: {
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   tabContainer: {
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     backgroundColor: '#f7f6f6',
//   },
//   tabSelector: {
//     flexDirection: 'row',
//     height: 48,
//     backgroundColor: '#e5e5e5',
//     borderRadius: 24,
//     padding: 4,
//   },
//   tab: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     borderRadius: 20,
//   },
//   activeTab: {
//     backgroundColor: '#452829',
//   },
//   tabText: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#57595B',
//   },
//   activeTabText: {
//     color: '#fff',
//   },
//   content: { 
//     flex: 1, 
//     backgroundColor: '#f7f6f6' 
//   },
//   postCard: {
//     backgroundColor: '#fff',
//     marginHorizontal: 16,
//     marginVertical: 8,
//     borderRadius: 16,
//     padding: 16,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 3,
//   },
//   postHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//   },
//   avatarContainer: {
//     position: 'relative',
//     marginRight: 12,
//   },
//   avatar: {
//     width: 48,
//     height: 48,
//     borderRadius: 24,
//   },
//   statusIndicator: {
//     position: 'absolute',
//     bottom: 0,
//     right: 0,
//     width: 12,
//     height: 12,
//     borderRadius: 6,
//     borderWidth: 2,
//     borderColor: '#fff',
//   },
//   statusOnline: {
//     backgroundColor: '#4CAF50',
//   },
//   statusOffline: {
//     backgroundColor: '#9E9E9E',
//   },
//   postUserInfo: {
//     flex: 1,
//   },
//   userName: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   postTime: {
//     fontSize: 12,
//     color: '#57595B',
//     marginTop: 2,
//   },
//   moreButton: {
//     padding: 4,
//   },
//   caption: {
//     fontSize: 16,
//     color: '#333',
//     marginBottom: 12,
//     lineHeight: 22,
//   },
//   postImage: { 
//     width: '100%', 
//     height: 200, 
//     borderRadius: 12,
//     marginBottom: 12,
//   },
//   postActions: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 12,
//   },
//   actionButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 4,
//   },
//   actionText: { 
//     color: '#57595B', 
//     marginLeft: 6, 
//     fontSize: 14,
//     fontWeight: '500',
//   },
//   commentsSection: {
//     borderTopWidth: 1,
//     borderTopColor: '#f0f0f0',
//     paddingTop: 12,
//   },
//   commentText: { 
//     color: '#333', 
//     marginBottom: 4, 
//     fontSize: 14,
//     lineHeight: 20,
//   },
//   commentInputContainer: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginTop: 8,
//   },
//   commentInput: { 
//     flex: 1, 
//     backgroundColor: '#f0f0f0',
//     borderRadius: 20,
//     paddingHorizontal: 16,
//     paddingVertical: 8,
//     marginRight: 8,
//     color: '#333',
//     fontSize: 14,
//   },
//   emptyListText: { 
//     color: '#57595B', 
//     textAlign: 'center', 
//     marginTop: 40,
//     fontSize: 16,
//   },
//   fab: {
//     position: 'absolute',
//     bottom: 24,
//     right: 24,
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: '#452829',
//     justifyContent: 'center',
//     alignItems: 'center',
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.25,
//     shadowRadius: 4,
//     elevation: 5,
//   },
//   modalContainer: {
//     flex: 1,
//     justifyContent: 'flex-end',
//     backgroundColor: 'rgba(0, 0, 0, 0.5)',
//   },
//   modalContent: {
//     backgroundColor: '#fff',
//     borderTopLeftRadius: 24,
//     borderTopRightRadius: 24,
//     padding: 24,
//     paddingBottom: 40,
//   },
//   modalHeader: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     alignItems: 'center',
//     marginBottom: 24,
//   },
//   modalTitle: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   closeButton: {
//     padding: 4,
//   },
//   imagePicker: {
//     width: '100%',
//     height: 200,
//     borderRadius: 12,
//     borderWidth: 2,
//     borderColor: '#e5e5e5',
//     borderStyle: 'dashed',
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f9f9f9',
//     marginBottom: 24,
//   },
//   imagePickerText: { 
//     color: '#452829', 
//     marginTop: 10, 
//     fontSize: 16,
//     fontWeight: '500',
//   },
//   imagePreview: { 
//     width: '100%', 
//     height: '100%', 
//     borderRadius: 12 
//   },
//   captionInput: {
//     width: '100%',
//     minHeight: 100,
//     backgroundColor: '#f9f9f9',
//     borderRadius: 12,
//     borderWidth: 1,
//     borderColor: '#e5e5e5',
//     padding: 16,
//     color: '#333',
//     fontSize: 16,
//     textAlignVertical: 'top',
//     marginBottom: 24,
//   },
//   postButton: {
//     backgroundColor: '#452829',
//     paddingVertical: 14,
//     borderRadius: 12,
//     alignItems: 'center',
//   },
//   disabledButton: {
//     backgroundColor: '#cccccc',
//   },
//   postButtonText: {
//     color: '#fff',
//     fontWeight: 'bold',
//     fontSize: 16,
//   },
// });

// export default Community;


// src/screens/community/Community.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  TextInput,
  FlatList,
  Image,
  Modal,
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  PermissionsAndroid,
  Linking,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { launchImageLibrary } from 'react-native-image-picker';
import { useDispatch } from 'react-redux';
import { getAllPosts, likePost, addComment, createPost } from '../../redux/actions/postActions';
import { API_BASE_URL } from '../../api/apiClient';
import FindTrainers from './components/FindTrainers';
import { useImageSelection } from '../../context/AuthContext';
import { Strings } from '../../config/config'; // Import Config

const { width: screenWidth } = Dimensions.get('window');

const Community = () => {
  const dispatch = useDispatch();
  const { 
    isImageSelectionInProgress, 
    setIsImageSelectionInProgress,
    pendingImage,
    setPendingImage
  } = useImageSelection();
  
  const { header, tabs, postModal, post, alerts } = Strings.Community;

  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [isPostModalVisible, setPostModalVisible] = useState(false);
  const [newPostCaption, setNewPostCaption] = useState('');
  const [newPostImage, setNewPostImage] = useState(null);

  const isMounted = useRef(true);
  const appState = useRef(AppState.currentState);
  const appStateSubscription = useRef(null);
  
  useEffect(() => {
    console.log('Community component mounted');
    isMounted.current = true;
    
    if (pendingImage) {
      console.log('Found pending image from previous selection');
      setNewPostImage(pendingImage);
      setPendingImage(null);
    }
    
    appStateSubscription.current = AppState.addEventListener('change', nextAppState => {
      console.log('AppState changed to', nextAppState);
      appState.current = nextAppState;
    });
    
    return () => {
      console.log('Community component unmounting');
      isMounted.current = false;
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, [pendingImage, setPendingImage]);

  const fetchPosts = useCallback(async () => {
    if (isImageSelectionInProgress) {
      console.log('Skipping fetchPosts during image selection');
      return;
    }
    
    console.log('Fetching posts...');
    setIsLoading(true);
    try {
      const response = await dispatch(getAllPosts());
      const postsData = response?.data?.data || response?.data || [];
      console.log('Posts fetched successfully:', postsData.length);
      const postsWithFullUrls = postsData.map(post => ({
        ...post,
        imageUrl: post.imageUrl.startsWith('http') ? post.imageUrl : `${API_BASE_URL.replace('/api', '')}${post.imageUrl}`,
        userAvatar: post.author?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg',
        userName: post.author?.email || post.anonymous,
      }));
      
      if (isMounted.current) {
        setPosts(postsWithFullUrls);
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      if (isMounted.current) {
        Alert.alert(alerts.genericError, alerts.fetchError);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [isImageSelectionInProgress]);

  useEffect(() => {
    if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab, fetchPosts]);

  const handleLike = async (postId) => {
    console.log('Liking post:', postId);
    const originalPosts = JSON.parse(JSON.stringify(posts));
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? {
            ...p,
            liked: !p.liked,
            _count: {
              ...p._count,
              likes: p.liked ? p._count.likes - 1 : p._count.likes + 1,
            },
          }
        : p
    );
    
    if (isMounted.current) {
      setPosts(updatedPosts);
    }

    try {
      await dispatch(likePost(postId));
      console.log('Post liked successfully');
    } catch (error) {
      console.error('Failed to like post:', error);
      if (isMounted.current) {
        Alert.alert(alerts.genericError, alerts.likeError);
        setPosts(originalPosts);
      }
    }
  };

  const handleComment = async (postId, commentText) => {
    if (!commentText.trim()) return;
    console.log('Adding comment to post:', postId);
    const originalPosts = JSON.parse(JSON.stringify(posts));
    const newComment = {
      id: Date.now().toString(),
      content: commentText,
      author: { email: post.you },
    };

    const updatedPosts = posts.map(p =>
      p.id === postId
        ? {
            ...p,
            comments: [newComment, ...p.comments],
            _count: { ...p._count, comments: p._count.comments + 1 },
          }
        : p
    );
    
    if (isMounted.current) {
      setPosts(updatedPosts);
    }

    try {
      await dispatch(addComment(postId, commentText));
      console.log('Comment added successfully');
    } catch (error) {
      console.error('Failed to add comment:', error);
      if (isMounted.current) {
        Alert.alert(alerts.genericError, alerts.commentError);
        setPosts(originalPosts);
      }
    }
  };

  const checkPermission = async (permission) => {
    try {
      const result = await PermissionsAndroid.check(permission);
      console.log(`Permission ${permission}: ${result}`);
      return result;
    } catch (error) {
      console.error(`Error checking permission ${permission}:`, error);
      return false;
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        console.log('Android version:', Platform.Version);
        
        let permissionsToRequest = [];
        
        if (Platform.Version >= 33) {
          permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
          ];
        } else if (Platform.Version >= 29) {
          permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          ];
        } else {
          permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.CAMERA,
            PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          ];
        }
        
        console.log('Permissions to request:', permissionsToRequest);
        
        // Check which permissions are actually missing
        const missingPermissions = [];
        for (const permission of permissionsToRequest) {
          const isGranted = await PermissionsAndroid.check(permission);
          if (!isGranted) {
            missingPermissions.push(permission);
          }
        }
        
        // If no permissions are missing, we're good to go
        if (missingPermissions.length === 0) {
          console.log('All permissions are already granted');
          return true;
        }
        
        console.log('Missing permissions to request:', missingPermissions);
        const granted = await PermissionsAndroid.requestMultiple(missingPermissions);
        console.log('Permission results:', granted);
        
        const allGranted = missingPermissions.every(permission => 
          granted[permission] === PermissionsAndroid.RESULTS.GRANTED || granted[permission] === 'granted'
        );
        
        if (allGranted) {
          console.log('All requested permissions granted');
          return true;
        } else {
          console.log('Some permissions were denied');
          
          const deniedPermissions = missingPermissions.filter(permission => 
            granted[permission] !== PermissionsAndroid.RESULTS.GRANTED && granted[permission] !== 'granted'
          );
          console.log('Denied permissions:', deniedPermissions);
          
          Alert.alert(
            alerts.permissions?.title || 'Permissions Required', 
            alerts.permissions?.message || 'Please grant the required permissions to proceed.',
            [
              { text: alerts.permissions?.cancel || 'Cancel', style: 'cancel' },
              { text: alerts.permissions?.settings || 'Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return false;
        }
      } catch (err) {
        console.error('Permission request error:', err);
        Alert.alert(alerts.genericError || 'Error', 'Failed to request permissions. Please try again.');
        return false;
      }
    }
    return true;
  };

  const handleSelectImage = useCallback(async () => {
    console.log('=== START IMAGE SELECTION ===');
    
    if (!isMounted.current) {
      console.error('Component is not mounted, aborting image selection');
      return;
    }
    
    if (isImageSelectionInProgress) {
      console.log('Image selection already in progress');
      return;
    }
    
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      console.log('Permission not granted, aborting image selection');
      return;
    }
    
    setIsImageSelectionInProgress(true);
    
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1024,
      maxHeight: 1024,
      includeBase64: false,
      includeExtra: true,
    };

    try {
      console.log('Launching image library...');
      
      launchImageLibrary(options, (response) => {
        console.log('Image picker callback received');
        console.log('Callback response:', JSON.stringify(response, null, 2));
        
        setIsImageSelectionInProgress(false);
        
        if (!response) {
          console.error('Image picker callback received null/undefined response');
          return;
        }
        
        if (!isMounted.current) {
          console.error('Component was unmounted before callback, saving image to context');
          
          if (response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
            const asset = response.assets[0];
            const newImage = {
              uri: asset.uri,
              type: asset.type || 'image/jpeg',
              fileName: asset.fileName || `photo_${Date.now()}.jpg`,
            };
            setPendingImage(newImage);
          }
          return;
        }

        if (response.didCancel) {
          console.log('User cancelled image picker');
          return;
        }
        
        if (response.errorCode) {
          console.error('ImagePicker Error: ', response.errorMessage);
          Alert.alert(alerts.genericError, response.errorMessage || alerts.imageError);
          return;
        }

        if (response.assets && Array.isArray(response.assets) && response.assets.length > 0) {
          const asset = response.assets[0];
          console.log('Selected image asset:', asset);
          
          console.log('Setting new post image...');
          const newImage = {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            fileName: asset.fileName || `photo_${Date.now()}.jpg`,
          };
          
          setNewPostImage(newImage);
          console.log('New post image set successfully');
        } else {
          console.error('No assets found in image picker result');
        }
        
        console.log('=== END IMAGE SELECTION ===');
      });
      
    } catch (error) {
      console.error('An error occurred in launchImageLibrary: ', error);
      if (isMounted.current) {
        Alert.alert(alerts.genericError, 'An unexpected error occurred while selecting a image.');
      }
      setIsImageSelectionInProgress(false);
    }
  }, [isMounted, isImageSelectionInProgress, requestPermissions, setIsImageSelectionInProgress, setPendingImage]);

  const handleAddPost = async () => {
    console.log('Adding new post...');
    if (!newPostImage || !newPostCaption.trim()) {
      console.log('Post incomplete - missing image or caption');
      Alert.alert(alerts.incompletePost, alerts.incompletePostMsg);
      return;
    }
    
    console.log('Post data is valid, starting upload...');
    setIsUploading(true);
    try {
      await dispatch(createPost(newPostCaption, newPostImage));
      console.log('Post created successfully');
      if (isMounted.current) {
        setPostModalVisible(false);
        setNewPostImage(null);
        setNewPostCaption('');
        fetchPosts();
      }
    } catch (error) {
      const message = error.message || alerts.uploadErrorMsg;
      console.error('Failed to create post:', error);
      if (isMounted.current) {
        Alert.alert(alerts.uploadErrorTitle, message);
      }
    } finally {
      if (isMounted.current) {
        setIsUploading(false);
      }
    }
  };

  const PostCard = ({ item }) => {
    const [postComment, setPostComment] = useState('');
    const submitComment = () => {
        if (postComment.trim()) {
          handleComment(item.id, postComment);
          setPostComment('');
        }
    };

    return (
      <View style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: item.userAvatar }} style={styles.avatar} />
            <View style={[styles.statusIndicator, styles.statusOnline]} />
          </View>
          <View style={styles.postUserInfo}>
            <Text style={styles.userName}>{item.userName}</Text>
            <Text style={styles.postTime}>{new Date(item.createdAt).toLocaleString()}</Text>
          </View>
          <TouchableOpacity style={styles.moreButton}>
            <Icon name="ellipsis-horizontal" size={20} color="#57595B" />
          </TouchableOpacity>
        </View>
        <Text style={styles.caption}>{item.content}</Text>
        {item.imageUrl && (
          <Image source={{ uri: item.imageUrl }} style={styles.postImage} resizeMode="cover" />
        )}
        <View style={styles.postActions}>
          <TouchableOpacity onPress={() => handleLike(item.id)} style={styles.actionButton}>
            <Icon name={item.liked ? 'heart' : 'heart-outline'} size={24} color={item.liked ? '#452829' : '#57595B'} />
            <Text style={styles.actionText}>{item._count.likes}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="chatbubble-outline" size={24} color="#57595B" />
            <Text style={styles.actionText}>{item._count.comments}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="send-outline" size={24} color="#57595B" />
          </TouchableOpacity>
        </View>
        <View style={styles.commentsSection}>
          {item.comments.slice(0, 2).map(comment => (
            <Text key={comment.id} style={styles.commentText}>
              <Text style={{ fontWeight: 'bold' }}>{comment.author?.email || 'User'}:</Text> {comment.content}
            </Text>
          ))}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={post.addCommentPlaceholder}
              placeholderTextColor="#888"
              value={postComment}
              onChangeText={setPostComment}
              onSubmitEditing={submitComment}
              returnKeyType="send"
            />
            <TouchableOpacity onPress={submitComment}>
              <Icon name="send" size={24} color={postComment.trim() ? '#452829' : '#888'} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };
  
  const renderPostsTab = () => (
    <>
      {isLoading && posts.length === 0 ? (
        <ActivityIndicator size="large" color="#452829" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => <PostCard item={item} />}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchPosts}
          refreshing={isLoading}
          ListEmptyComponent={
            !isLoading ? (
                <Text style={styles.emptyListText}>
                {post.emptyList}
                </Text>
            ) : null
          }
        />
      )}
    </>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1c1617" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{header.title}</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="search" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <View style={styles.tabSelector}>
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => {
                console.log('Tab changed to:', tab.id);
                setActiveTab(tab.id);
              }}
            >
              <Text style={[
                styles.tabText,
                activeTab === tab.id && styles.activeTabText
              ]}>{tab.title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'posts' && renderPostsTab()}
        {activeTab === 'trainers' && <FindTrainers />}
      </View>

      {/* Floating Action Button */}
      {activeTab === 'posts' && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={() => {
            console.log('Opening create post modal');
            setPostModalVisible(true);
          }}
        >
          <Icon name="add" size={32} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Create Post Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPostModalVisible}
        onRequestClose={() => {
          console.log('Modal close requested');
          setPostModalVisible(false);
        }}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{postModal.title}</Text>
              <TouchableOpacity 
                style={styles.closeButton} 
                onPress={() => {
                  console.log('Cancel button pressed');
                  setPostModalVisible(false);
                }}
              >
                <Icon name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.imagePicker} onPress={handleSelectImage}>
              {newPostImage ? (
                <Image source={{ uri: newPostImage.uri }} style={styles.imagePreview} resizeMode="cover" />
              ) : (
                <>
                  <Icon name="camera" size={40} color="#452829" />
                  <Text style={styles.imagePickerText}>{postModal.imagePicker}</Text>
                </>
              )}
            </TouchableOpacity>
            
            <TextInput
              style={styles.captionInput}
              placeholder={postModal.captionPlaceholder}
              placeholderTextColor="#888"
              value={newPostCaption}
              onChangeText={setNewPostCaption}
              multiline
            />
            
            <TouchableOpacity
              style={[
                styles.postButton, 
                (isUploading || !newPostCaption.trim() || !newPostImage) && styles.disabledButton
              ]}
              onPress={handleAddPost}
              disabled={isUploading || !newPostCaption.trim() || !newPostImage}
            >
              {isUploading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.postButtonText}>{postModal.postButton}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex:1, 
    backgroundColor: '#f7f6f6' 
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1c1617',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f7f6f6',
  },
  tabSelector: {
    flexDirection: 'row',
    height: 48,
    backgroundColor: '#e5e5e5',
    borderRadius: 24,
    padding: 4,
  },
  tab: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#452829',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#57595B',
  },
  activeTabText: {
    color: '#fff',
  },
  content: { 
    flex:1, 
    backgroundColor: '#f7f6f6' 
  },
  postCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
  statusOnline: {
    backgroundColor: '#4CAF50',
  },
  statusOffline: {
    backgroundColor: '#9E9E9E',
  },
  postUserInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  postTime: {
    fontSize: 12,
    color: '#57595B',
    marginTop: 2,
  },
  moreButton: {
    padding: 4,
  },
  caption: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
    lineHeight: 22,
  },
  postImage: { 
    width: '100%', 
    height: 200, 
    borderRadius: 12,
    marginBottom: 12,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: { 
    color: '#57595B', 
    marginLeft: 6, 
    fontSize: 14,
    fontWeight: '500',
  },
  commentsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  commentText: { 
    color: '#333', 
    marginBottom: 4, 
    fontSize: 14,
    lineHeight: 20,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentInput: { 
    flex:1, 
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#333',
    fontSize: 14,
  },
  emptyListText: { 
    color: '#57595B', 
    textAlign: 'center', 
    marginTop: 40,
    fontSize: 16,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#452829',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalContainer: {
    flex:1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    padding: 4,
  },
  imagePicker: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    marginBottom: 24,
  },
  imagePickerText: { 
    color: '#452829', 
    marginTop: 10, 
    fontSize: 16,
    fontWeight: '500',
  },
  imagePreview: { 
    width: '100%', 
    height: '100%', 
    borderRadius: 12 
  },
  captionInput: {
    width: '100%',
    minHeight: 100,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
    padding: 16,
    color: '#333',
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  postButton: {
    backgroundColor: '#452829',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  postButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default Community;