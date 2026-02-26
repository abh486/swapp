// import React from 'react';
// import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
// import Icon from 'react-native-vector-icons/Ionicons';

// export const FilterModal = ({ 
//     isVisible, 
//     onClose, 
//     selectedFilter, 
//     onFilterChange, 
//     filterOptions, 
//     selectedSort, 
//     onSortChange, 
//     sortOptions 
// }) => (
//     <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
//         <View style={styles.modalOverlay}>
//             <View style={styles.filterModal}>
//                 <View style={styles.filterModalHeader}>
//                     <Text style={styles.filterModalTitle}>Filter & Sort</Text>
//                     <TouchableOpacity onPress={onClose}>
//                         <Icon name="close" size={24} color="#111827" />
//                     </TouchableOpacity>
//                 </View>
                
//                 <ScrollView style={styles.modalContent}>
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Filter By</Text>
//                         {filterOptions.map((option) => (
//                             <TouchableOpacity
//                                 key={option.value}
//                                 style={[
//                                     styles.option,
//                                     selectedFilter === option.value && styles.selectedOption
//                                 ]}
//                                 onPress={() => onFilterChange(option.value)}
//                             >
//                                 <Text style={[
//                                     styles.optionText,
//                                     selectedFilter === option.value && styles.selectedOptionText
//                                 ]}>
//                                     {option.label}
//                                 </Text>
//                                 {selectedFilter === option.value && (
//                                     <Icon name="checkmark" size={20} color="#442728" />
//                                 )}
//                             </TouchableOpacity>
//                         ))}
//                     </View>
                    
//                     <View style={styles.section}>
//                         <Text style={styles.sectionTitle}>Sort By</Text>
//                         {sortOptions.map((option) => (
//                             <TouchableOpacity
//                                 key={option.value}
//                                 style={[
//                                     styles.option,
//                                     selectedSort === option.value && styles.selectedOption
//                                 ]}
//                                 onPress={() => onSortChange(option.value)}
//                             >
//                                 <Text style={[
//                                     styles.optionText,
//                                     selectedSort === option.value && styles.selectedOptionText
//                                 ]}>
//                                     {option.label}
//                                 </Text>
//                                 {selectedSort === option.value && (
//                                     <Icon name="checkmark" size={20} color="#442728" />
//                                 )}
//                             </TouchableOpacity>
//                         ))}
//                     </View>
//                 </ScrollView>
                
//                 <View style={styles.modalActions}>
//                     <TouchableOpacity style={styles.resetButton} onPress={() => {
//                         onFilterChange('all');
//                         onSortChange('distance');
//                     }}>
//                         <Text style={styles.resetButtonText}>Reset</Text>
//                     </TouchableOpacity>
//                     <TouchableOpacity style={styles.applyButton} onPress={onClose}>
//                         <Text style={styles.applyButtonText}>Apply Filters</Text>
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </View>
//     </Modal>
// );

// const styles = StyleSheet.create({
//     modalOverlay: { 
//         flex: 1, 
//         backgroundColor: 'rgba(0,0,0,0.5)', 
//         justifyContent: 'flex-end' 
//     },
//     filterModal: { 
//         backgroundColor: '#ffffff', 
//         borderTopLeftRadius: 16, 
//         borderTopRightRadius: 16, 
//         maxHeight: '70%', 
//         padding: 20 
//     },
//     filterModalHeader: { 
//         flexDirection: 'row', 
//         justifyContent: 'space-between', 
//         alignItems: 'center', 
//         marginBottom: 20 
//     },
//     filterModalTitle: { 
//         fontSize: 20, 
//         fontWeight: '600', 
//         color: '#111827' 
//     },
//     modalContent: {
//         flex: 1,
//     },
//     section: {
//         marginBottom: 24,
//     },
//     sectionTitle: {
//         fontSize: 18,
//         fontWeight: '600',
//         color: '#111827',
//         marginBottom: 12,
//     },
//     option: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 8,
//         marginBottom: 8,
//     },
//     selectedOption: {
//         backgroundColor: 'rgba(68, 39, 40, 0.1)',
//     },
//     optionText: {
//         fontSize: 16,
//         color: '#374151',
//     },
//     selectedOptionText: {
//         color: '#442728',
//         fontWeight: '500',
//     },
//     modalActions: {
//         flexDirection: 'row',
//         justifyContent: 'space-between',
//         marginTop: 20,
//     },
//     resetButton: {
//         flex: 1,
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 8,
//         borderWidth: 1,
//         borderColor: '#e5e7eb',
//         marginRight: 8,
//         alignItems: 'center',
//     },
//     resetButtonText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#6b7280',
//     },
//     applyButton: {
//         flex: 1,
//         paddingVertical: 12,
//         paddingHorizontal: 16,
//         borderRadius: 8,
//         backgroundColor: '#442728',
//         marginLeft: 8,
//         alignItems: 'center',
//     },
//     applyButtonText: {
//         fontSize: 16,
//         fontWeight: '600',
//         color: '#ffffff',
//     },
// });

// src/screens/home/location/FilterModal.jsx
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Strings } from '../../../config/config'; // Import Config

export const FilterModal = ({ 
    isVisible, 
    onClose, 
    selectedFilter, 
    onFilterChange, 
    filterOptions, 
    selectedSort, 
    onSortChange, 
    sortOptions 
}) => {
    const strings = Strings.Location.Filter;

    return (
        <Modal visible={isVisible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.modalOverlay}>
                <View style={styles.filterModal}>
                    <View style={styles.filterModalHeader}>
                        <Text style={styles.filterModalTitle}>{strings.title}</Text>
                        <TouchableOpacity onPress={onClose}>
                            <Icon name="close" size={24} color="#111827" />
                        </TouchableOpacity>
                    </View>
                    
                    <ScrollView style={styles.modalContent}>
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{strings.filterBy}</Text>
                            {filterOptions.map((option) => (
                                <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.option,
                                            selectedFilter === option.value && styles.selectedOption
                                        ]}
                                        onPress={() => onFilterChange(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedFilter === option.value && styles.selectedOptionText
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {selectedFilter === option.value && (
                                            <Icon name="checkmark" size={20} color="#442728" />
                                        )}
                                    </TouchableOpacity>
                            ))}
                        </View>
                        
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>{strings.sortBy}</Text>
                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                        key={option.value}
                                        style={[
                                            styles.option,
                                            selectedSort === option.value && styles.selectedOption
                                        ]}
                                        onPress={() => onSortChange(option.value)}
                                    >
                                        <Text style={[
                                            styles.optionText,
                                            selectedSort === option.value && styles.selectedOptionText
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {selectedSort === option.value && (
                                            <Icon name="checkmark" size={20} color="#442728" />
                                        )}
                                    </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>
                    
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.resetButton} onPress={() => {
                            onFilterChange(strings.options.all);
                            onSortChange(strings.sortOptions.distance);
                        }}>
                            <Text style={styles.resetButtonText}>{strings.actions.reset}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.applyButton} onPress={onClose}>
                            <Text style={styles.applyButtonText}>{strings.actions.apply}</Text>
                        </TouchableOpacity>
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
    filterModal: { 
        backgroundColor: '#ffffff', 
        borderTopLeftRadius: 16, 
        borderTopRightRadius: 16, 
        maxHeight: '70%', 
        padding: 20 
    },
    filterModalHeader: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 20 
    },
    filterModalTitle: { 
        fontSize: 20, 
        fontWeight: '600', 
        color: '#111827' 
    },
    modalContent: {
        flex: 1,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 12,
    },
    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    selectedOption: {
        backgroundColor: 'rgba(68, 39, 40, 0.1)',
    },
    optionText: {
        fontSize: 16,
        color: '#374151',
    },
    selectedOptionText: {
        color: '#442728',
        fontWeight: '500',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    resetButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        marginRight: 8,
        alignItems: 'center',
    },
    resetButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
    },
    applyButton: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        backgroundColor: '#442728',
        marginLeft: 8,
        alignItems: 'center',
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
    },
});