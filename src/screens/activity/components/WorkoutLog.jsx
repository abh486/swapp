

import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Dimensions,
    Image, TextInput, FlatList, SafeAreaView, Alert, RefreshControl, ActivityIndicator,
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { logWorkoutSession, deleteWorkoutSession, deleteExerciseFromSession } from '../../../redux/actions/workoutActions';
import { Strings } from '../../../config/config'; // Import Config

const { width } = Dimensions.get('window');

const transformExerciseData = (exercise) => {
    const tagLabel = exercise.type || Strings.WorkoutLog.tags.default;
    const tagKey = tagLabel.toLowerCase().split(',')[0];
    return {
        id: exercise.name,
        title: exercise.name,
        type: exercise.type,
        // Use config colors instead of hardcoded map
        tag: { 
            label: tagLabel, 
            color: Strings.WorkoutLog.tagColors[tagKey] || Strings.WorkoutLog.tagColors.default 
        },
        // Use image from config data directly
        image: exercise.image || require('../../../assets/image/boy.jpg'),
        equipment: exercise.equipment || ['N/A'],
        difficulty: exercise.difficulty || 'Intermediate',
        favorite: false,
    };
};

const ExerciseItem = React.memo(({ item, isSelected, isFavorite, onSelect, onToggleFavorite }) => (
    <TouchableOpacity style={[styles.exerciseItemSelectable, isSelected && styles.selectedItem]} onPress={() => onSelect(item)}>
        <View style={styles.imageContainer}>
            <Image source={item.image} style={styles.exerciseImage} />
            <View style={styles.difficultyBadge}>
                <Text style={styles.difficultyText}>{item.difficulty.substring(0, 1)}</Text>
            </View>
        </View>
        <View style={styles.exerciseInfo}>
            <Text style={styles.exerciseTitleSelectable} numberOfLines={1}>{item.title}</Text>
            <View style={[styles.tag, { backgroundColor: item.tag.color }]}>
                <Text style={styles.tagText}>{item.tag.label}</Text>
            </View>
            <View style={styles.metaRow}>
                <View style={styles.equipmentRow}>
                    {item.equipment.slice(0, 2).map((eq, idx) => (
                        <Text key={idx} style={styles.equipmentText}>
                            {eq}{idx < item.equipment.length - 1 && idx < 1 ? ', ' : ''}
                        </Text>
                    ))}
                    {item.equipment.length > 2 && (
                        <Text style={styles.equipmentText}>+{item.equipment.length - 2}</Text>
                    )}
                </View>
            </View>
        </View>
        <View style={styles.actionContainer}>
            {isSelected ? (
                <Icon name="checkmark-circle" size={26} color="#4CAF50" style={styles.actionIcon} />
            ) : (
                <View style={styles.spacer} />
            )}
            <TouchableOpacity style={styles.starButton} onPress={(e) => { 
                e.stopPropagation(); 
                onToggleFavorite(item.id); 
            }}>
                <Icon name={isFavorite ? "star" : "star-outline"} size={22} color="#FFC107" />
            </TouchableOpacity>
        </View>
    </TouchableOpacity>
));

const WorkoutLog = ({ navigation }) => {
    const dispatch = useDispatch();
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectedExercises, setSelectedExercises] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [tempSelectedExercises, setTempSelectedExercises] = useState(new Set());
    const [isSaving, setIsSaving] = useState(false);
    const [currentSessionId, setCurrentSessionId] = useState(null);

    // Initialize exercises from config
    const [exercises, setExercises] = useState(Strings.WorkoutLog.data.map(transformExerciseData));
    
    // Use equipment list from config
    const equipmentIcons = Strings.WorkoutLog.equipmentList;

    const handleDoneSelecting = async () => {
        if (isSaving) return;
        const finalSelectedList = exercises.filter(ex => tempSelectedExercises.has(ex.id));
        if (finalSelectedList.length === 0) { 
            setIsSelecting(false); 
            return; 
        }
        setIsSaving(true);
        
        const sessionData = {
            workoutName: 'Custom Workout',
            workoutType: 'Strength Training',
            muscleGroups: [...new Set(finalSelectedList.flatMap(ex => ex.tag.label.split(', ')))],
            equipment: [...new Set(finalSelectedList.flatMap(ex => ex.equipment))],
            exercises: finalSelectedList.map(exercise => ({
                name: exercise.title,
                type: exercise.type,
                equipment: exercise.equipment,
                difficulty: exercise.difficulty,
            })),
            date: new Date().toISOString(),
        };

        try {
            const response = await dispatch(logWorkoutSession(sessionData));
            console.log('Full session response:', JSON.stringify(response, null, 2));
            
            if (response && response.id) {
                setCurrentSessionId(response.id);
                
                const exerciseIdMap = {};
                if (response.logs && Array.isArray(response.logs)) {
                    response.logs.forEach(log => {
                        if (log.exercise && log.exercise.name) {
                            exerciseIdMap[log.exercise.name] = {
                                dbId: log.exercise.id,
                                logId: log.id
                            };
                        }
                    });
                }
                
                console.log('Exercise ID map:', exerciseIdMap);
                
                const exercisesWithDbIds = finalSelectedList.map(frontendExercise => {
                    const idInfo = exerciseIdMap[frontendExercise.title];
                    if (idInfo) {
                        return {
                            ...frontendExercise,
                            dbId: idInfo.dbId,
                            logId: idInfo.logId
                        };
                    } else {
                        console.error('No database ID found for exercise:', frontendExercise.title);
                        return frontendExercise;
                    }
                });
                
                console.log('Exercises with DB IDs:', exercisesWithDbIds);
                setSelectedExercises(exercisesWithDbIds);
                Alert.alert(Strings.WorkoutLog.alerts.saveSuccess, Strings.WorkoutLog.alerts.saveMsg);
                setIsSelecting(false);
            } else {
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            console.error('Error saving workout:', error);
            Alert.alert(Strings.WorkoutLog.alerts.saveErrorTitle, Strings.WorkoutLog.alerts.saveErrorMsg);
        } finally { 
            setIsSaving(false); 
        }
    };
    
    const handleAddExercise = () => {
        setTempSelectedExercises(new Set(selectedExercises.map(e => e.id)));
        setIsSelecting(true);
    };
    
    const toggleSelectExercise = (exercise) => { 
        const newSelection = new Set(tempSelectedExercises); 
        if (newSelection.has(exercise.id)) { 
            newSelection.delete(exercise.id); 
        } else { 
            newSelection.add(exercise.id); 
        } 
        setTempSelectedExercises(newSelection); 
    };
    
    const handleRemoveExercise = async (exercise) => {
        console.log('Attempting to remove exercise:', exercise);
        console.log('Exercise logId:', exercise.logId);
        console.log('Current session ID:', currentSessionId);
        
        if (!currentSessionId) {
            setSelectedExercises(prev => prev.filter(ex => ex.id !== exercise.id));
            return;
        }
        
        if (!exercise.logId) {
            console.error('No log ID found for exercise:', exercise);
            Alert.alert(Strings.WorkoutLog.alerts.genericError, Strings.WorkoutLog.alerts.removeErrorDetail);
            return;
        }
        
        Alert.alert(
            Strings.WorkoutLog.alerts.removeExerciseTitle,
            Strings.WorkoutLog.alerts.removeExerciseMsg,
            [
                { text: Strings.WorkoutLog.actions.cancel, style: 'cancel' }, // Fixed: Was Strings.Ollama
                {
                    text: Strings.WorkoutLog.actions.confirm, // Fixed: Was Strings.DietLog
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            console.log('Deleting exercise with log ID:', exercise.logId);
                            await dispatch(deleteExerciseFromSession(currentSessionId, exercise.logId));
                            
                            setSelectedExercises(prev => {
                                const updated = prev.filter(ex => ex.id !== exercise.id);
                                console.log('Updated exercises after removal:', updated);
                                return updated;
                            });
                            
                            Alert.alert(Strings.WorkoutLog.alerts.removeSuccess, Strings.WorkoutLog.alerts.removeSuccessMsg);
                        } catch (error) {
                            console.error('Error removing exercise:', error);
                            Alert.alert(Strings.WorkoutLog.alerts.genericError, Strings.WorkoutLog.alerts.removeError);
                        }
                    }
                }
            ]
        );
    };
    
    const handleDeleteSession = async () => {
        if (!currentSessionId) {
            Alert.alert(Strings.WorkoutLog.alerts.genericError, Strings.WorkoutLog.alerts.noSessionError);
            return;
        }
        
        Alert.alert(
            Strings.WorkoutLog.alerts.deleteSessionTitle,
            Strings.WorkoutLog.alerts.deleteSessionMsg,
            [
                { text: Strings.WorkoutLog.actions.cancel, style: 'cancel' }, // Fixed: Was Strings.Ollama
                {
                    text: Strings.WorkoutLog.actions.confirm, // Fixed: Was Strings.DietLog
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await dispatch(deleteWorkoutSession(currentSessionId));
                            setSelectedExercises([]);
                            setCurrentSessionId(null);
                            Alert.alert(Strings.WorkoutLog.alerts.removeSuccess, Strings.WorkoutLog.alerts.deleteSuccess);
                        } catch (error) {
                            console.error('Error deleting workout:', error);
                            Alert.alert(Strings.WorkoutLog.alerts.genericError, Strings.WorkoutLog.alerts.deleteError);
                        }
                    }
                }
            ]
        );
    };
    
    const filteredExercises = exercises.filter(ex => {
        const matchesCategory = selectedCategory === 'all' || 
            (selectedCategory === 'favorites' ? ex.favorite : ex.tag?.label?.toLowerCase().includes(selectedCategory));
        const matchesSearch = !searchText.trim() || 
            ex.title?.toLowerCase().includes(searchText.toLowerCase()) || 
            ex.tag?.label?.toLowerCase().includes(searchText.toLowerCase()) || 
            ex.equipment?.some(eq => eq.toLowerCase().includes(searchText.toLowerCase()));
        return matchesCategory && matchesSearch;
    });

    if (isSelecting) {
        return ( 
            <SafeAreaView style={styles.container}>
                <StatusBar barStyle="light-content" backgroundColor="#000000" />
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.iconButton} 
                        onPress={() => setIsSelecting(false)} 
                        disabled={isSaving}
                    >
                        <Icon name="arrow-back" size={24} color="#452829" />
                    </TouchableOpacity>
                    <Text style={styles.headerText}>{Strings.WorkoutLog.header.selectTitle}</Text>
                    <TouchableOpacity 
                        style={styles.doneButton} 
                        onPress={handleDoneSelecting} 
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <Text style={styles.doneButtonText}>{Strings.WorkoutLog.header.doneBtn}</Text>
                        )}
                    </TouchableOpacity>
                </View>
                <View style={styles.searchContainer}>
                    <Icon name="search" size={20} color="#57595B" />
                    <TextInput 
                        style={styles.searchInput} 
                        placeholder={Strings.WorkoutLog.search.placeholder} 
                        placeholderTextColor="#57595B" 
                        value={searchText} 
                        onChangeText={setSearchText} 
                    />
                    {searchText ? (
                        <TouchableOpacity onPress={() => setSearchText('')}>
                            <Icon name="close-circle" size={20} color="#57595B" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                <View style={styles.stickyCategories}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Strings.WorkoutLog.categories.map((cat) => (
                            <TouchableOpacity 
                                key={cat.id} 
                                style={styles.categoryTab} 
                                onPress={() => setSelectedCategory(cat.id)}
                            >
                                <Text style={[
                                    styles.categoryText, 
                                    selectedCategory === cat.id && styles.categoryTextActive
                                ]}>
                                    {cat.title}
                                </Text>
                                {selectedCategory === cat.id && <View style={styles.underline} />}
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                <FlatList 
                    data={filteredExercises} 
                    keyExtractor={(item) => item.id.toString()} 
                    renderItem={({ item }) => (
                        <ExerciseItem 
                            item={item} 
                            isSelected={tempSelectedExercises.has(item.id)} 
                            isFavorite={item.favorite} 
                            onSelect={toggleSelectExercise} 
                            onToggleFavorite={()=>{}} 
                        />
                    )} 
                    contentContainerStyle={styles.listContent} 
                    ItemSeparatorComponent={() => <View style={{ height: 8 }} />} 
                />
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <View style={styles.header}>
                <Text style={styles.headerTitle}>{Strings.WorkoutLog.header.logTitle}</Text>
                <View style={styles.profileImage} />
            </View>
            
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                <View style={styles.mainVideoContainer}>
                    <Video 
                        source={Strings.WorkoutLog.main.videoSource} // Fixed: Use config source
                        style={styles.video} 
                        resizeMode="cover" 
                        repeat 
                        muted 
                    />
                    <View style={styles.videoOverlay} />
                    <View style={styles.videoContent}>
                        <View style={styles.workoutInfo}>
                            <Text style={styles.workoutTitle}>{Strings.WorkoutLog.main.videoTitle}</Text>
                            <View style={styles.createdInfo}>
                                <Text style={styles.createdText}>{Strings.WorkoutLog.main.workoutType}</Text>
                            </View>
                        </View>
                    </View>
                </View>
                
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{Strings.WorkoutLog.main.equipment}</Text>
                        <View style={styles.badge}>
                            {/* Fixed: Dynamic count from config */}
                            <Text style={styles.badgeText}>{equipmentIcons.length}</Text>
                        </View>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {equipmentIcons.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.equipmentItem}>
                                <View style={styles.equipmentIconContainer}>
                                    <Image source={item.source} style={styles.equipmentIcon} />
                                </View>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>
                
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>{Strings.WorkoutLog.main.exercises}</Text>
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{selectedExercises.length}</Text>
                        </View>
                        <TouchableOpacity style={styles.addButton} onPress={handleAddExercise}>
                            <Text style={styles.addButtonText}>{Strings.WorkoutLog.main.addBtn}</Text>
                            <Text style={styles.addButtonIcon}>+</Text>
                        </TouchableOpacity>
                        {currentSessionId && (
                            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteSession}>
                                <Icon name="trash-outline" size={20} color="#FF5252" />
                            </TouchableOpacity>
                        )}
                    </View>
                    {selectedExercises.length === 0 ? (
                        <View style={styles.emptyExerciseContainer}>
                            <Icon name="barbell-outline" size={40} color="#452829" />
                            <Text style={styles.emptyExerciseText}>{Strings.WorkoutLog.main.emptyTitle}</Text>
                            <Text style={styles.emptyExerciseSubtext}>{Strings.WorkoutLog.main.emptySubtitle}</Text>
                        </View>
                    ) : (
                        selectedExercises.map((item) => (
                            <TouchableOpacity key={item.id} style={styles.exerciseItem}>
                                <View style={styles.exerciseImageContainer}>
                                    <Image source={item.image} style={styles.exerciseImageStyle} />
                                </View>
                                <View style={styles.exerciseInfo}>
                                    <Text style={styles.exerciseName}>{item.title}</Text>
                                    <Text style={styles.exerciseDetails}>{item.tag.label}</Text>
                                    {item.logId && (
                                        <Text style={styles.debugText}>Log ID: {item.logId.substring(0, 8)}...</Text>
                                    )}
                                </View>
                                <TouchableOpacity 
                                    style={styles.exerciseMenu} 
                                    onPress={() => handleRemoveExercise(item)}
                                >
                                    <Icon name="trash-outline" size={20} color="#FF5252" />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        ))
                    )}
                </View>
            </ScrollView>
            
            <TouchableOpacity
                style={[styles.startButton, selectedExercises.length === 0 && styles.disabledStartButton]}
                onPress={() => navigation.navigate('StartWorkout')}
                disabled={selectedExercises.length === 0}
            >
                <Text style={styles.startButtonText}>{Strings.WorkoutLog.main.startBtn}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        backgroundColor: '#000000' 
    }, 
    scrollView: { 
        flex: 1 
    }, 
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000000',
    },
    profileImage: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
    },
    mainVideoContainer: { 
        width: '100%', 
        height: 220 
    }, 
    video: { 
        ...StyleSheet.absoluteFillObject 
    }, 
    videoOverlay: { 
        ...StyleSheet.absoluteFillObject, 
        backgroundColor: 'rgba(0, 0, 0, 0.5)' 
    }, 
    videoContent: { 
        ...StyleSheet.absoluteFillObject, 
        padding: 24, 
        justifyContent: 'flex-end' 
    }, 
    workoutInfo: { 
        flex: 1, 
        justifyContent: 'flex-end' 
    }, 
    workoutTitle: { 
        fontSize: 28, 
        fontWeight: 'bold', 
        color: '#fff', 
        lineHeight: 34, 
        marginBottom: 16, 
        textShadowColor: 'rgba(0,0,0,0.6)', 
        textShadowOffset: { width: 0, height: 2 }, 
        textShadowRadius: 6 
    }, 
    createdInfo: { 
        marginBottom: 16 
    }, 
    createdText: { 
        color: '#452829', 
        fontSize: 14, 
        fontWeight: '500' 
    }, 
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        margin: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#000000',
        flex: 1,
    },
    badge: {
        backgroundColor: 'rgba(69, 40, 41, 0.1)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(69, 40, 41, 0.3)',
    },
    badgeText: {
        color: '#452829',
        fontSize: 12,
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginRight: 12,
    },
    addButtonText: {
        color: '#452829',
        fontSize: 16,
        fontWeight: '500',
    },
    addButtonIcon: {
        color: '#452829',
        fontSize: 18,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 4,
    },
    equipmentItem: {
        marginRight: 12,
    },
    equipmentIconContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(69, 40, 41, 0.2)',
    },
    equipmentIcon: {
        width: '100%',
        height: '100%',
    },
    exerciseItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
    },
    exerciseImageContainer: {
        width: 60,
        height: 60,
        borderRadius: 12,
        marginRight: 16,
        overflow: 'hidden',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    exerciseImageStyle: {
        width: '100%',
        height: '100%',
    },
    exerciseInfo: {
        flex: 1,
    },
    exerciseName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
        marginBottom: 4,
    },
    exerciseDetails: {
        color: '#452829',
        fontSize: 14,
    },
    debugText: {
        color: 'rgba(0, 0, 0, 0.5)',
        fontSize: 10,
        marginTop: 2,
    },
    exerciseMenu: {
        padding: 8,
    },
    exerciseMenuIcon: {
        color: '#452829',
        fontSize: 18,
    },
    startButton: {
        backgroundColor: '#452829',
        marginHorizontal: 20,
        marginBottom: 20,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        elevation: 5,
    },
    disabledStartButton: {
        backgroundColor: '#555',
        elevation: 0,
    },
    startButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    iconButton: {
        padding: 6,
    },
    headerText: {
        fontSize: 22,
        fontWeight: '800',
        color: '#000000',
        textAlign: 'center',
        marginHorizontal: 16,
    },
    doneButton: {
        backgroundColor: '#452829',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 6,
        minWidth: 70,
        alignItems: 'center',
        justifyContent: 'center',
    },
    doneButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        margin: 16,
        borderRadius: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.1)',
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12,
        paddingLeft: 10,
        fontSize: 16,
        color: '#000000',
    },
    stickyCategories: {
        backgroundColor: '#FFFFFF',
        paddingLeft: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    categoryTab: {
        marginRight: 24,
        paddingBottom: 10,
    },
    categoryText: {
        fontSize: 15,
        fontWeight: '600',
        color: 'rgba(0, 0, 0, 0.7)',
    },
    categoryTextActive: {
        color: '#452829',
    },
    underline: {
        width: '100%',
        height: 2,
        backgroundColor: '#452829',
        marginTop: 6,
        borderRadius: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    exerciseItemSelectable: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(0, 0, 0, 0.05)',
        marginBottom: 8,
    },
    selectedItem: {
        borderColor: '#4CAF50',
        backgroundColor: 'rgba(76, 175, 80, 0.05)',
    },
    imageContainer: {
        width: 70,
        height: 70,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: 16,
    },
    exerciseImage: {
        width: '100%',
        height: '100%',
    },
    difficultyBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        backgroundColor: 'rgba(0,0,0,0.7)',
        borderRadius: 4,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    difficultyText: {
        color: '#452829',
        fontSize: 12,
        fontWeight: '700',
    },
    exerciseTitleSelectable: {
        color: '#000000',
        fontWeight: '700',
        fontSize: 17,
        marginBottom: 6,
    },
    tag: {
        alignSelf: 'flex-start',
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    tagText: {
        fontSize: 12,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    metaRow: {
        marginTop: 8,
    },
    equipmentRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    equipmentText: {
        color: 'rgba(0, 0, 0, 0.7)',
        fontSize: 12,
        marginRight: 4,
    },
    actionContainer: {
        marginLeft: 'auto',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '100%',
    },
    actionIcon: {
        marginBottom: 8,
    },
    spacer: {
        height: 34,
    },
    starButton: {
        padding: 6,
    },
    emptyExerciseContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 12,
    },
    emptyExerciseText: {
        marginTop: 16,
        color: '#000000',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyExerciseSubtext: {
        marginTop: 4,
        color: 'rgba(0, 0, 0, 0.7)',
        fontSize: 14,
    },
});

export default WorkoutLog;