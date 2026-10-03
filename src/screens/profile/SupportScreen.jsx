import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Linking,
  FlatList,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../context/AuthContext';
import { GlobalLoader } from '../../components/GlobalLoader';
import {
  fetchSupportTickets,
  createSupportTicket,
  resolveSupportTicket,
  cancelSupportTicket,
  addSupportReply,
} from '../../redux/actions/supportActions';

const CANCEL_REASONS = [
  'Issue resolved by myself',
  'Created by mistake',
  'No longer need assistance',
  'Found another solution',
  'Other',
];

const FAQS = [
  {
    q: 'How do I cancel my active subscription?',
    a: 'Go to Settings → Manage Subscription, click on your active plan, and press the Cancel Subscription button. Your benefits will continue until the end of the billing period.',
  },
  {
    q: 'Can I get a refund for a mistake booking?',
    a: 'Refunds depend on the partner policies. Please contact the gym manager or open a support ticket here with your transaction ID, and our admin team will review it.',
  },
  {
    q: 'How do I edit my workout goals?',
    a: 'Go to the Profile Tab → Edit Personal Info. You can update your height, weight, activity levels, and workout goals there.',
  },
  {
    q: 'Where do I scan my check-in QR code?',
    a: 'Navigate to your active subscription card on the Home Screen, tap on it to view details, then tap the scan icon on the top-right of your card to open the camera scanner.',
  },
  {
    q: 'How do I export my activity or diet logs?',
    a: 'You can request a data export by opening a high-priority support ticket specifying the date ranges you want exported.',
  },
];

const BLANK_FORM = { subject: '', priority: 'medium', description: '' };
const { width: screenWidth } = Dimensions.get('window');

export const SupportScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { tickets, loading, submitting } = useSelector(state => state.support);
  const ticketList = Array.isArray(tickets) ? tickets : [];
  
  const [activeTab, setActiveTab] = useState(route.params?.initialTab || 'tickets');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [detailTicket, setDetailTicket] = useState(null);
  const [openFaq, setOpenFaq] = useState(null);
  const [replyBody, setReplyBody] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Cancellation State
  const [ticketToCancel, setTicketToCancel] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState('');
  const [customCancelReason, setCustomCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    dispatch(fetchSupportTickets());
  }, [dispatch]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await dispatch(fetchSupportTickets());
    setRefreshing(false);
  }, [dispatch]);

  const handleCreateTicket = async () => {
    if (!form.subject.trim() || !form.description.trim()) {
      Alert.alert('Required Fields', 'Please enter both subject and description.');
      return;
    }
    const res = await dispatch(createSupportTicket(form));
    if (res?.success) {
      Alert.alert('Ticket Created', 'Your support ticket has been raised successfully.');
      setForm(BLANK_FORM);
      setShowCreateModal(false);
    } else {
      Alert.alert('Error', res?.message || 'Failed to submit support ticket.');
    }
  };

  const handleResolveTicket = async (id) => {
    const res = await dispatch(resolveSupportTicket(id));
    if (res?.success) {
      Alert.alert('Resolved', 'This ticket has been marked as resolved.');
      setDetailTicket(null);
    } else {
      Alert.alert('Error', res?.message || 'Failed to resolve support ticket.');
    }
  };

  const handleOpenCancelModal = (ticket) => {
    setTicketToCancel(ticket);
    setSelectedCancelReason('');
    setCustomCancelReason('');
    setShowCancelModal(true);
  };

  const handleConfirmCancel = async () => {
    let finalReason = selectedCancelReason;
    if (selectedCancelReason === 'Other') {
      finalReason = customCancelReason.trim();
    } else if (customCancelReason.trim()) {
      finalReason = selectedCancelReason
        ? `${selectedCancelReason} (${customCancelReason.trim()})`
        : customCancelReason.trim();
    }

    if (!finalReason || !finalReason.trim()) {
      Alert.alert('Reason Required', 'Please select or enter a reason for cancelling this ticket.');
      return;
    }

    if (!ticketToCancel) return;

    setCancelling(true);
    const targetId = ticketToCancel.id || ticketToCancel._id;
    const res = await dispatch(cancelSupportTicket(targetId, finalReason.trim()));
    setCancelling(false);

    if (res?.success) {
      Alert.alert('Ticket Cancelled', 'Your support ticket has been cancelled.');
      setShowCancelModal(false);
      setTicketToCancel(null);
      setSelectedCancelReason('');
      setCustomCancelReason('');
      if (detailTicket && (detailTicket.id === targetId || detailTicket._id === targetId)) {
        setDetailTicket(prev => ({
          ...prev,
          status: 'CANCELLED',
          cancellationReason: finalReason.trim(),
        }));
      }
    } else {
      Alert.alert('Error', res?.message || 'Failed to cancel support ticket.');
    }
  };

  const handleSendReply = async () => {
    if (!replyBody.trim()) return;
    setSendingReply(true);
    const res = await dispatch(addSupportReply(detailTicket.id, replyBody));
    if (res?.success) {
      setReplyBody('');
      setDetailTicket(prev => ({
        ...prev,
        replies: [...(prev.replies || []), res.data],
        updatedAt: new Date().toISOString(),
      }));
    } else {
      Alert.alert('Error', res?.message || 'Failed to send reply.');
    }
    setSendingReply(false);
  };

  const handleOpenWhatsApp = async () => {
    const phoneNumber = '919061611166';
    const message = 'Hello Swapp Support, I need assistance.';
    const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;
    const webUrl = `https://api.whatsapp.com/send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

    try {
      // Direct deep link to WhatsApp app
      await Linking.openURL(appUrl);
    } catch (err) {
      // Fallback to web WhatsApp if native app is not installed
      try {
        await Linking.openURL(webUrl);
      } catch (fallbackErr) {
        Alert.alert(
          'WhatsApp Support',
          'Could not open WhatsApp. Please ensure WhatsApp is installed or contact us at +91 90616 11166.',
        );
      }
    }
  };

  const handleOpenEmail = async () => {
    const email = 'support@swapp.fit';
    const subject = encodeURIComponent('Swapp Support Request');
    const mailtoUrl = `mailto:${email}?subject=${subject}`;
    const gmailWebUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${email}&su=${subject}`;

    try {
      const canOpen = await Linking.canOpenURL(mailtoUrl);
      if (canOpen) {
        await Linking.openURL(mailtoUrl);
        return;
      }
      await Linking.openURL(mailtoUrl);
    } catch (err) {
      // Native mail client unavailable or not configured on device/simulator
      Alert.alert(
        'Email Support',
        `No default mail client is configured on this device.\n\nEmail: ${email}\n\nYou can open webmail or raise a ticket directly in the app.`,
        [
          {
            text: 'Open Webmail',
            onPress: () => {
              Linking.openURL(gmailWebUrl).catch(() => {});
            },
          },
          {
            text: 'Raise Ticket',
            onPress: () => setShowCreateModal(true),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ],
      );
    }
  };

  const openCount = ticketList.filter(
    t => t.status !== 'RESOLVED' && t.status !== 'CLOSED' && t.status !== 'CANCELLED',
  ).length;

  const getPriorityColor = priority => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
      default:
        return '#3498db';
    }
  };

  const getStatusColor = status => {
    switch (status?.toUpperCase()) {
      case 'RESOLVED':
        return '#2ecc71';
      case 'CLOSED':
        return '#7f8c8d';
      case 'CANCELLED':
        return '#e74c3c';
      case 'IN_PROGRESS':
        return '#3498db';
      case 'OPEN':
      default:
        return '#e67e22';
    }
  };

  const renderTicketItem = ({ item }) => {
    const isClosedOrResolved = item.status === 'RESOLVED' || item.status === 'CLOSED';
    const isCancelled = item.status === 'CANCELLED';
    const canCancel = !isClosedOrResolved && !isCancelled;

    return (
      <TouchableOpacity
        style={styles.ticketCard}
        onPress={() => setDetailTicket(item)}
        activeOpacity={0.85}
      >
        <View style={styles.ticketCardHeader}>
          <Text style={styles.ticketId}>#{item.id?.substring(0, 8) || item._id?.substring(0, 8)}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.badgeText}>{item.priority}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.badgeText}>{item.status?.replace('_', ' ')}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.ticketSubject} numberOfLines={1}>{item.subject}</Text>
        <Text style={styles.ticketDesc} numberOfLines={2}>{item.description}</Text>

        {isCancelled && item.cancellationReason ? (
          <View style={styles.cardCancellationBanner}>
            <Icon name="information-circle-outline" size={14} color="#e74c3c" />
            <Text style={styles.cardCancellationText} numberOfLines={2}>
              Cancelled: {item.cancellationReason}
            </Text>
          </View>
        ) : null}

        <View style={styles.ticketCardFooter}>
          <Text style={styles.ticketDate}>
            Updated: {new Date(item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}
          </Text>
          <View style={styles.ticketCardActions}>
            {canCancel && (
              <TouchableOpacity
                style={styles.cardCancelBtn}
                onPress={(e) => {
                  e?.stopPropagation?.();
                  handleOpenCancelModal(item);
                }}
                activeOpacity={0.7}
              >
                <Icon name="close-circle-outline" size={14} color="#e74c3c" />
                <Text style={styles.cardCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            )}
            <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.75}
        >
          <Icon name="chevron-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            activeTab === 'faq' && { fontSize: 16 }
          ]}
          numberOfLines={1}
        >
          {activeTab === 'faq' ? 'Frequently Asked Questions' : 'Support'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Contact Cards Row */}
      {activeTab === 'tickets' && (
        <View style={styles.contactRow}>
          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleOpenEmail}
            activeOpacity={0.8}
          >
            <Icon name="mail-outline" size={24} color="#FFF" />
            <Text style={styles.contactLabel}>Email Support</Text>
            <Text style={styles.contactValue}>support@swapp.fit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contactCard}
            onPress={handleOpenWhatsApp}
            activeOpacity={0.8}
          >
            <Icon name="logo-whatsapp" size={24} color="#2ecc71" />
            <Text style={styles.contactLabel}>WhatsApp Support</Text>
            <Text style={styles.contactValue}>+91 90616 11166</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'tickets' && styles.tabButtonActive]}
          onPress={() => setActiveTab('tickets')}
        >
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
            My Tickets {openCount > 0 ? `(${openCount})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'faq' && styles.tabButtonActive]}
          onPress={() => setActiveTab('faq')}
        >
          <Text style={[styles.tabText, activeTab === 'faq' && styles.tabTextActive]}>
            FAQs
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      {activeTab === 'tickets' ? (
        loading ? (
          <View style={styles.centerContainer}>
            <GlobalLoader size={60} />
          </View>
        ) : ticketList.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyRefreshContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
          >
            <Icon name="chatbox-ellipses-outline" size={60} color="rgba(255,255,255,0.2)" />
            <Text style={styles.emptyText}>No support tickets raised yet</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => setShowCreateModal(true)}>
              <Text style={styles.createBtnText}>Raise a Ticket</Text>
            </TouchableOpacity>
          </ScrollView>
        ) : (
          <FlatList
            data={ticketList}
            renderItem={renderTicketItem}
            keyExtractor={item => item.id || item._id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="transparent"
                colors={['transparent']}
              />
            }
            ListFooterComponent={
              <TouchableOpacity
                style={[styles.createBtn, { alignSelf: 'center', marginTop: 16, marginBottom: 32 }]}
                onPress={() => setShowCreateModal(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.createBtnText}>Raise a Ticket</Text>
              </TouchableOpacity>
            }
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.faqContent} showsVerticalScrollIndicator={false}>
          {FAQS.map((faq, idx) => {
            const isFaqOpen = openFaq === idx;
            return (
              <View key={idx} style={styles.faqItem}>
                <TouchableOpacity
                  style={styles.faqHeader}
                  onPress={() => setOpenFaq(isFaqOpen ? null : idx)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <Icon name={isFaqOpen ? 'chevron-up' : 'chevron-down'} size={18} color="rgba(255,255,255,0.4)" />
                </TouchableOpacity>
                {isFaqOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Ticket Create Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            style={styles.modalContent}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Raise Support Ticket</Text>
              <TouchableOpacity onPress={() => setShowCreateModal(false)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.inputLabel}>Subject</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Subscription cancellation query"
                placeholderTextColor="rgba(255,255,255,0.3)"
                value={form.subject}
                onChangeText={text => setForm(f => ({ ...f, subject: text }))}
              />

              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.priorityRow}>
                {['low', 'medium', 'high'].map(p => {
                  const isSelected = form.priority === p;
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[
                        styles.priorityPill,
                        isSelected && { borderColor: getPriorityColor(p), backgroundColor: 'rgba(255,255,255,0.05)' },
                      ]}
                      onPress={() => setForm(f => ({ ...f, priority: p }))}
                    >
                      <Text style={[styles.priorityPillText, isSelected && { color: getPriorityColor(p) }]}>
                        {p.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.inputLabel}>Describe the issue</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Please describe your issue in detail so our support team can assist you..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={6}
                value={form.description}
                onChangeText={text => setForm(f => ({ ...f, description: text }))}
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.disabledBtn]}
                onPress={handleCreateTicket}
                disabled={submitting}
              >
                {submitting ? <GlobalLoader size={24} /> : <Text style={styles.submitBtnText}>SUBMIT TICKET</Text>}
              </TouchableOpacity>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* Ticket Details & Chat Conversation Modal */}
      {detailTicket && (
        <Modal visible={!!detailTicket} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              style={styles.chatModalContent}
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
            >
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.chatTitle} numberOfLines={1}>{detailTicket.subject}</Text>
                  <Text style={styles.chatSubtitle}>#{detailTicket.id?.substring(0, 8) || detailTicket._id?.substring(0, 8)}</Text>
                </View>
                <TouchableOpacity onPress={() => setDetailTicket(null)}>
                  <Icon name="close" size={24} color="#FFF" />
                </TouchableOpacity>
              </View>

              <FlatList
                data={detailTicket.replies || []}
                ListHeaderComponent={
                  <View style={styles.chatIntro}>
                    <Text style={styles.chatIntroDesc}>{detailTicket.description}</Text>
                    <View style={styles.divider} />
                    <View style={styles.chatStatusRow}>
                      <Text style={styles.statusLabel}>Priority: <Text style={{ color: getPriorityColor(detailTicket.priority), fontWeight: 'bold' }}>{detailTicket.priority?.toUpperCase()}</Text></Text>
                      <Text style={styles.statusLabel}>Status: <Text style={{ color: getStatusColor(detailTicket.status), fontWeight: 'bold' }}>{detailTicket.status?.replace('_', ' ')}</Text></Text>
                    </View>
                    {detailTicket.status === 'CANCELLED' && (
                      <View style={styles.detailCancellationBox}>
                        <Icon name="close-circle" size={18} color="#e74c3c" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.detailCancellationTitle}>Ticket Cancelled</Text>
                          {detailTicket.cancellationReason ? (
                            <Text style={styles.detailCancellationReason}>
                              Reason: {detailTicket.cancellationReason}
                            </Text>
                          ) : null}
                        </View>
                      </View>
                    )}
                    {detailTicket.status !== 'RESOLVED' && detailTicket.status !== 'CLOSED' && detailTicket.status !== 'CANCELLED' && (
                      <View style={styles.detailActionRow}>
                        <TouchableOpacity
                          style={styles.resolveBtn}
                          onPress={() => handleResolveTicket(detailTicket.id || detailTicket._id)}
                        >
                          <Icon name="checkmark-circle-outline" size={16} color="#FFF" />
                          <Text style={styles.resolveBtnText}>Mark Resolved</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.cancelTicketDetailBtn}
                          onPress={() => handleOpenCancelModal(detailTicket)}
                        >
                          <Icon name="close-circle-outline" size={16} color="#e74c3c" />
                          <Text style={styles.cancelTicketDetailBtnText}>Cancel Ticket</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                    <View style={styles.divider} />
                  </View>
                }
                renderItem={({ item }) => {
                  const isStaff = item.isStaff || item.isAdmin;
                  return (
                    <View style={[styles.replyBubble, isStaff ? styles.replyStaff : styles.replyUser]}>
                      <Text style={styles.replySender}>{isStaff ? 'Support Team' : 'You'}</Text>
                      <Text style={styles.replyText}>{item.body}</Text>
                      <Text style={styles.replyTime}>
                        {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  );
                }}
                keyExtractor={(item, index) => item.id || `reply-${index}`}
                contentContainerStyle={styles.chatScrollContent}
              />

              {detailTicket.status !== 'RESOLVED' && detailTicket.status !== 'CLOSED' && detailTicket.status !== 'CANCELLED' ? (
                <View style={styles.replyInputContainer}>
                  <TextInput
                    style={styles.replyInput}
                    placeholder="Type a message..."
                    placeholderTextColor="rgba(255,255,255,0.4)"
                    value={replyBody}
                    onChangeText={setReplyBody}
                    multiline
                  />
                  <TouchableOpacity
                    style={[styles.sendBtn, (!replyBody.trim() || sendingReply) && styles.disabledSendBtn]}
                    onPress={handleSendReply}
                    disabled={!replyBody.trim() || sendingReply}
                  >
                    {sendingReply ? <GlobalLoader size={20} /> : <Icon name="send" size={18} color="#FFF" />}
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.ticketClosedBanner}>
                  <Icon
                    name={detailTicket.status === 'CANCELLED' ? "close-circle-outline" : "checkmark-circle-outline"}
                    size={16}
                    color={detailTicket.status === 'CANCELLED' ? "#e74c3c" : "#2ecc71"}
                  />
                  <Text style={styles.ticketClosedText}>
                    {detailTicket.status === 'CANCELLED'
                      ? 'This ticket has been cancelled.'
                      : 'This ticket has been marked as resolved.'}
                  </Text>
                </View>
              )}
            </KeyboardAvoidingView>
          </View>
        </Modal>
      )}

      {/* Cancel Ticket Modal */}
      <Modal visible={showCancelModal} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.cancelModalContainer}
          >
            <View style={styles.cancelModalContent}>
              <View style={styles.cancelModalHeader}>
                <View style={styles.cancelIconWrap}>
                  <Icon name="close-circle" size={24} color="#e74c3c" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cancelModalTitle}>Cancel Support Ticket</Text>
                  <Text style={styles.cancelModalSubtitle}>
                    #{ticketToCancel?.id?.substring(0, 8) || ticketToCancel?._id?.substring(0, 8) || ''} - {ticketToCancel?.subject || ''}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    if (!cancelling) setShowCancelModal(false);
                  }}
                  style={styles.cancelModalCloseBtn}
                  disabled={cancelling}
                >
                  <Icon name="close" size={20} color="#FFF" />
                </TouchableOpacity>
              </View>

              <Text style={styles.cancelSectionTitle}>Reason for cancellation</Text>
              <Text style={styles.cancelSectionHint}>Please select why you wish to cancel this ticket:</Text>

              {/* Predefined reason options */}
              <View style={styles.reasonsContainer}>
                {CANCEL_REASONS.map((reason) => {
                  const isSelected = selectedCancelReason === reason;
                  return (
                    <TouchableOpacity
                      key={reason}
                      style={[
                        styles.reasonOption,
                        isSelected && styles.reasonOptionSelected,
                      ]}
                      onPress={() => setSelectedCancelReason(reason)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.reasonRadio, isSelected && styles.reasonRadioSelected]}>
                        {isSelected && <View style={styles.reasonRadioDot} />}
                      </View>
                      <Text style={[styles.reasonOptionText, isSelected && styles.reasonOptionTextSelected]}>
                        {reason}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Additional comments or custom reason */}
              <Text style={styles.cancelNotesLabel}>
                {selectedCancelReason === 'Other' ? 'Please specify reason *' : 'Additional comments (optional)'}
              </Text>
              <TextInput
                style={styles.cancelTextInput}
                placeholder={
                  selectedCancelReason === 'Other'
                    ? 'Enter your reason here...'
                    : 'Provide more details if needed...'
                }
                placeholderTextColor="rgba(255,255,255,0.3)"
                multiline
                numberOfLines={3}
                value={customCancelReason}
                onChangeText={setCustomCancelReason}
                editable={!cancelling}
              />

              {/* Buttons */}
              <View style={styles.cancelModalActions}>
                <TouchableOpacity
                  style={styles.cancelModalBackBtn}
                  onPress={() => setShowCancelModal(false)}
                  disabled={cancelling}
                >
                  <Text style={styles.cancelModalBackText}>Keep Ticket</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.cancelModalConfirmBtn,
                    (!selectedCancelReason && !customCancelReason.trim()) && styles.disabledCancelConfirmBtn,
                    cancelling && styles.disabledCancelConfirmBtn,
                  ]}
                  onPress={handleConfirmCancel}
                  disabled={(!selectedCancelReason && !customCancelReason.trim()) || cancelling}
                >
                  {cancelling ? (
                    <GlobalLoader size={18} />
                  ) : (
                    <>
                      <Icon name="close-circle-outline" size={16} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.cancelModalConfirmText}>Confirm Cancel</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 26 : 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  contactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  contactCard: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 14,
    alignItems: 'center',
  },
  contactLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
    marginTop: 8,
  },
  contactValue: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginTop: 20,
    marginHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    borderBottomWidth: 2,
    borderColor: '#EE822A',
  },
  tabText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyRefreshContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 15,
    marginBottom: 20,
  },
  createBtn: {
    backgroundColor: '#EE822A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  listContent: {
    padding: 16,
  },
  ticketCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 16,
    marginBottom: 12,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  ticketSubject: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ticketDesc: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    marginBottom: 12,
  },
  cardCancellationBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: 'rgba(231, 76, 60, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.25)',
    borderRadius: 8,
    padding: 8,
    marginBottom: 10,
  },
  cardCancellationText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  ticketCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
  },
  ticketCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardCancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
  },
  cardCancelBtnText: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: '600',
  },
  faqContent: {
    padding: 16,
  },
  faqItem: {
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    paddingRight: 15,
  },
  faqAnswer: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingBottom: 15,
    marginBottom: 15,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  inputLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#050505',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 8,
    color: '#FFF',
    padding: 12,
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  priorityPill: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  priorityPillText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 'bold',
  },
  submitBtn: {
    backgroundColor: '#EE822A',
    borderRadius: 8,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 30,
  },
  submitBtnText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  chatModalContent: {
    backgroundColor: '#0c0c0c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '92%',
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  chatTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    maxWidth: screenWidth - 100,
  },
  chatSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
  },
  chatIntro: {
    padding: 20,
    paddingBottom: 5,
  },
  chatIntroDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 12,
  },
  chatStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusLabel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
  },
  detailCancellationBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  detailCancellationTitle: {
    color: '#e74c3c',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  detailCancellationReason: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    lineHeight: 17,
  },
  detailActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  resolveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#2ecc71',
    paddingVertical: 10,
    borderRadius: 8,
  },
  resolveBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  cancelTicketDetailBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(231, 76, 60, 0.4)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  cancelTicketDetailBtnText: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
  },
  ticketClosedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    backgroundColor: '#0a0a0a',
  },
  ticketClosedText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 13,
    fontWeight: '500',
  },
  chatScrollContent: {
    paddingBottom: 20,
  },
  replyBubble: {
    maxWidth: '75%',
    borderRadius: 12,
    padding: 10,
    marginVertical: 6,
    marginHorizontal: 20,
  },
  replyUser: {
    backgroundColor: '#EE822A',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 2,
  },
  replyStaff: {
    backgroundColor: '#1b1b1b',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  replySender: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  replyText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 18,
  },
  replyTime: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 9,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  replyInputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    backgroundColor: '#050505',
  },
  replyInput: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20,
    color: '#FFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    fontSize: 14,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EE822A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSendBtn: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  cancelModalContainer: {
    width: '100%',
  },
  cancelModalContent: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cancelModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 16,
  },
  cancelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(231, 76, 60, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalTitle: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  cancelModalSubtitle: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  cancelModalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelSectionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cancelSectionHint: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    marginBottom: 14,
  },
  reasonsContainer: {
    gap: 8,
    marginBottom: 16,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  reasonOptionSelected: {
    borderColor: '#EE822A',
    backgroundColor: 'rgba(238, 130, 42, 0.1)',
  },
  reasonRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  reasonRadioSelected: {
    borderColor: '#EE822A',
  },
  reasonRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EE822A',
  },
  reasonOptionText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 13,
  },
  reasonOptionTextSelected: {
    color: '#FFF',
    fontWeight: '600',
  },
  cancelNotesLabel: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  cancelTextInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    color: '#FFF',
    padding: 12,
    fontSize: 13,
    minHeight: 65,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  cancelModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelModalBackBtn: {
    flex: 1,
    height: 46,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelModalBackText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelModalConfirmBtn: {
    flex: 1.2,
    height: 46,
    borderRadius: 10,
    backgroundColor: '#e74c3c',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCancelConfirmBtn: {
    opacity: 0.4,
  },
  cancelModalConfirmText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default SupportScreen;
