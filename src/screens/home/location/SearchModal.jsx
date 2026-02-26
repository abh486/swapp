// import React from 'react';
// import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';

// export const SearchModal = ({ isVisible, onClose, query, onQueryChange }) => (
//   <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
//     <View style={styles.modalOverlay}>
//       <View style={styles.searchModal}>
//         <View style={styles.searchModalHeader}>
//           <Text style={styles.searchModalTitle}>Search Gyms</Text>
//           <TouchableOpacity onPress={onClose}>
//             <Icon name="close" size={24} color="#111827" />
//           </TouchableOpacity>
//         </View>
//         <View style={styles.searchInputContainer}>
//           <Icon name="search" size={20} color="#6b7280" />
//           <TextInput
//             style={styles.searchInput}
//             placeholder="Search by name, location..."
//             placeholderTextColor="#6b7280"
//             value={query}
//             onChangeText={onQueryChange}
//             autoFocus={true}
//           />
//         </View>
//       </View>
//     </View>
//   </Modal>
// );

// const styles = StyleSheet.create({
//   modalOverlay: { 
//     flex: 1, 
//     backgroundColor: 'rgba(0,0,0,0.5)', 
//     justifyContent: 'flex-end' 
//   },
//   searchModal: { 
//     backgroundColor: '#ffffff', 
//     borderTopLeftRadius: 16, 
//     borderTopRightRadius: 16, 
//     height: '80%', 
//     padding: 20 
//   },
//   searchModalHeader: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     marginBottom: 20 
//   },
//   searchModalTitle: { 
//     fontSize: 20, 
//     fontWeight: '600', 
//     color: '#111827' 
//   },
//   searchInputContainer: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     backgroundColor: '#f3f4f6', 
//     borderRadius: 12, 
//     paddingHorizontal: 16, 
//     marginBottom: 20 
//   },
//   searchInput: { 
//     flex: 1, 
//     marginLeft: 12, 
//     fontSize: 16, 
//     paddingVertical: 12, 
//     color: '#111827' 
//   },
// });

// src/screens/home/location/SearchModal.jsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Strings } from '../../../config/config'; // Import Config

export const SearchModal = ({ isVisible, onClose, query, onQueryChange }) => {
  const { title, placeholder } = Strings.Location.Search;

  return (
    <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.searchModal}>
          <View style={styles.searchModalHeader}>
            <Text style={styles.searchModalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#111827" />
            </TouchableOpacity>
          </View>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color="#6b7280" />
            <TextInput
              style={styles.searchInput}
              placeholder={placeholder}
              placeholderTextColor="#6b7280"
              value={query}
              onChangeText={onQueryChange}
              autoFocus={true}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)', 
    justifyContent: 'flex-end' 
  },
  searchModal: { 
    backgroundColor: '#ffffff', 
    borderTopLeftRadius: 16, 
    borderTopRightRadius: 16, 
    height: '80%', 
    padding: 20 
  },
  searchModalHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  searchModalTitle: { 
    fontSize: 20, 
    fontWeight: '600', 
    color: '#111827' 
  },
  searchInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f3f4f6', 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    marginBottom: 20 
  },
  searchInput: { 
    flex: 1, 
    marginLeft: 12, 
    fontSize: 16, 
    paddingVertical: 12, 
    color: '#111827' 
  },
});