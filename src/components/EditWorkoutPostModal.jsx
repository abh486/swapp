import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { GlobalLoader } from './GlobalLoader';
import { useDispatch } from 'react-redux';
import { updateWorkoutSession } from '../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

/**
 * EditWorkoutPostModal
 * Reusable modal for editing an already posted workout post.
 * Allows editing title, description/caption, duration, calories, and visibility.
 */
const EditWorkoutPostModal = ({
  visible = false,
  post = null,
  onClose,
  onSaveSuccess,
}) => {
  const dispatch = useDispatch();

  const [cachedPost, setCachedPost] = useState(post);

  useEffect(() => {
    if (post) {
      setCachedPost(post);
    }
  }, [post]);

  const activePost = post || cachedPost;

  const [workoutTitle, setWorkoutTitle] = useState('');
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [durationMins, setDurationMins] = useState('');
  const [calories, setCalories] = useState('');
  const [visibility, setVisibility] = useState('EVERYONE');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activePost && visible) {
      setWorkoutTitle(activePost.workoutName || activePost.workoutType || 'Workout');
      setWorkoutNotes(activePost.notes || activePost.caption || activePost.description || '');
      const rawSecs = activePost.stats?.duration || activePost.duration || 0;
      setDurationMins(String(Math.max(1, Math.round(rawSecs / 60))));
      const rawCals = activePost.stats?.calories || activePost.calories || 0;
      setCalories(String(rawCals || ''));
      setVisibility(activePost.visibility || 'EVERYONE');
    }
  }, [activePost, visible]);

  const handleSave = async () => {
    if (!workoutTitle.trim()) {
      Alert.alert('Validation Error', 'Workout title cannot be empty.');
      return;
    }

    if (!activePost?.id) return;

    const durationSeconds = Math.max(60, (parseInt(durationMins, 10) || 0) * 60);
    const parsedCalories = Math.max(0, parseInt(calories, 10) || 0);

    const updatePayload = {
      workoutName: workoutTitle.trim(),
      notes: workoutNotes.trim() || null,
      duration: durationSeconds,
      calories: parsedCalories,
      visibility,
    };

    setIsSaving(true);
    try {
      const updated = await dispatch(updateWorkoutSession(activePost.id, updatePayload));
      setIsSaving(false);

      const updatedPostData = {
        ...activePost,
        ...updatePayload,
        stats: {
          ...(activePost.stats || {}),
          duration: durationSeconds,
          calories: parsedCalories,
        },
        ...(updated || {}),
        user: {
          ...(activePost.user || {}),
          ...(updated?.user || {}),
          avatar:
            updated?.user?.avatar ||
            updated?.user?.profileImage ||
            updated?.user?.userProfile?.profileImage ||
            activePost.user?.avatar ||
            activePost.user?.profileImage ||
            activePost.user?.userProfile?.profileImage ||
            null,
          name:
            updated?.user?.name ||
            updated?.user?.userProfile?.name ||
            activePost.user?.name ||
            activePost.user?.userProfile?.name ||
            null,
          username:
            updated?.user?.username ||
            updated?.user?.userProfile?.username ||
            activePost.user?.username ||
            activePost.user?.userProfile?.username ||
            null,
          firstName: updated?.user?.firstName || activePost.user?.firstName || null,
          lastName: updated?.user?.lastName || activePost.user?.lastName || null,
        },
      };

      // 1. Close modal first so iOS native modal dismisses cleanly
      if (typeof onClose === 'function') {
        onClose();
      }

      // 2. Delay parent update & success pop up until modal finishes dismissing
      setTimeout(() => {
        if (typeof onSaveSuccess === 'function') {
          onSaveSuccess(updatedPostData);
        }
      }, 350);
    } catch (err) {
      setIsSaving(false);
      console.error('Failed to update workout post:', err);
      Alert.alert(
        'Save Failed',
        err.message || 'Unable to update workout post. Please try again.'
      );
    }
  };

  return (
    <Modal
      visible={Boolean(visible && activePost)}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardAvoidingView}
      >
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Header */}
                <View style={styles.header}>
                  <View style={styles.headerLeft}>
                    <Icon name="pencil" size={18} color="#EE822A" style={{ marginRight: 8 }} />
                    <Text style={styles.headerTitle}>Edit Workout Post</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.closeBtn}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.divider} />

                <ScrollView
                  style={styles.formScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Workout Title Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Workout Title</Text>
                    <TextInput
                      style={styles.textInput}
                      value={workoutTitle}
                      onChangeText={setWorkoutTitle}
                      placeholder="e.g. Chest & Triceps"
                      placeholderTextColor="rgba(255,255,255,0.4)"
                    />
                  </View>

                  {/* Caption / Description Field */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Caption / Description</Text>
                    <TextInput
                      style={[styles.textInput, styles.multilineInput]}
                      value={workoutNotes}
                      onChangeText={setWorkoutNotes}
                      placeholder="How did your workout feel? Share notes, PRs..."
                      placeholderTextColor="rgba(255,255,255,0.4)"
                      multiline
                      numberOfLines={3}
                    />
                  </View>

                  {/* Stats Row: Duration & Calories */}
                  <View style={styles.rowFields}>
                    <View style={[styles.fieldGroup, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.fieldLabel}>Duration (mins)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={durationMins}
                        onChangeText={setDurationMins}
                        placeholder="e.g. 45"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="number-pad"
                        maxLength={4}
                      />
                    </View>

                    <View style={[styles.fieldGroup, { flex: 1, marginLeft: 10 }]}>
                      <Text style={styles.fieldLabel}>Calories (kcal)</Text>
                      <TextInput
                        style={styles.textInput}
                        value={calories}
                        onChangeText={setCalories}
                        placeholder="e.g. 350"
                        placeholderTextColor="rgba(255,255,255,0.4)"
                        keyboardType="number-pad"
                        maxLength={5}
                      />
                    </View>
                  </View>

                  {/* Visibility Option */}
                  <View style={styles.fieldGroup}>
                    <Text style={styles.fieldLabel}>Visibility</Text>
                    <View style={styles.visibilityRow}>
                      <TouchableOpacity
                        style={[
                          styles.visibilityPill,
                          visibility === 'EVERYONE' && styles.visibilityPillActive,
                        ]}
                        onPress={() => setVisibility('EVERYONE')}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name="globe-outline"
                          size={14}
                          color={visibility === 'EVERYONE' ? '#FFF' : '#8E8E93'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.visibilityText,
                            visibility === 'EVERYONE' && styles.visibilityTextActive,
                          ]}
                        >
                          Everyone
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.visibilityPill,
                          visibility === 'FOLLOWERS' && styles.visibilityPillActive,
                        ]}
                        onPress={() => setVisibility('FOLLOWERS')}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name="people-outline"
                          size={14}
                          color={visibility === 'FOLLOWERS' ? '#FFF' : '#8E8E93'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.visibilityText,
                            visibility === 'FOLLOWERS' && styles.visibilityTextActive,
                          ]}
                        >
                          Followers
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.visibilityPill,
                          (visibility === 'PRIVATE' || visibility === 'ONLY_ME') && styles.visibilityPillActive,
                        ]}
                        onPress={() => setVisibility('PRIVATE')}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name="lock-closed-outline"
                          size={14}
                          color={visibility === 'PRIVATE' || visibility === 'ONLY_ME' ? '#FFF' : '#8E8E93'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.visibilityText,
                            (visibility === 'PRIVATE' || visibility === 'ONLY_ME') && styles.visibilityTextActive,
                          ]}
                        >
                          Private
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Save Button */}
                  <TouchableOpacity
                    style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
                    onPress={handleSave}
                    disabled={isSaving}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      borderRadius={14}
                    />
                    {isSaving ? (
                      <GlobalLoader size={26} />
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Icon name="checkmark-circle-outline" size={18} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.saveBtnText}>Save Changes</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Cancel */}
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={onClose}
                    disabled={isSaving}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    paddingHorizontal: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 18,
  },
  formScroll: {
    width: '100%',
  },
  fieldGroup: {
    marginBottom: 16,
  },
  rowFields: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#2A2A2E',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#FFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  visibilityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2A2A2E',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  visibilityPillActive: {
    backgroundColor: 'rgba(238, 130, 42, 0.2)',
    borderColor: '#EE822A',
  },
  visibilityText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  visibilityTextActive: {
    color: '#FFF',
    fontWeight: '700',
  },
  saveBtn: {
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    overflow: 'hidden',
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  cancelBtnText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default EditWorkoutPostModal;
