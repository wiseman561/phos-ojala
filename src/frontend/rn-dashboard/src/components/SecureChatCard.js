import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, FlatList } from 'react-native';
import { Card, Icon, Avatar } from '../common';
import { colors, typography } from '../../theme';

/**
 * SecureChatCard Component
 * 
 * Displays a secure messaging interface for patients to communicate
 * with their care team.
 * 
 * @param {Object} props
 * @param {Array} props.messages - Array of message objects
 * @param {Object} props.nurse - Nurse information object
 * @param {Function} props.onSendMessage - Function to call when sending a message
 * @param {Function} props.onViewAllPress - Function to call when "View All" is pressed
 */
const SecureChatCard = ({ 
  messages = [], 
  nurse = {
    id: '',
    name: 'Your Care Team',
    avatar: '',
    title: 'Registered Nurse',
    isOnline: false
  },
  onSendMessage,
  onViewAllPress
}) => {
  const [newMessage, setNewMessage] = useState('');
  
  // Helper function to format time
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Helper function to format date
  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };
  
  // Handle sending a new message
  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };
  
  // Render individual message item
  const renderMessageItem = ({ item, index }) => {
    const isFirstMessageOfDay = index === 0 || 
      formatDate(item.timestamp) !== formatDate(messages[index - 1].timestamp);
    
    return (
      <>
        {isFirstMessageOfDay && (
          <View style={styles.dateContainer}>
            <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
          </View>
        )}
        
        <View style={[
          styles.messageContainer,
          item.isFromPatient ? styles.patientMessage : styles.nurseMessage
        ]}>
          {!item.isFromPatient && (
            <Avatar 
              source={nurse.avatar ? { uri: nurse.avatar } : null}
              name={nurse.name}
              size={32}
              style={styles.avatar}
            />
          )}
          
          <View style={[
            styles.messageBubble,
            item.isFromPatient ? styles.patientBubble : styles.nurseBubble
          ]}>
            {!item.isFromPatient && (
              <Text style={styles.senderName}>{nurse.name}</Text>
            )}
            
            <Text style={[
              styles.messageText,
              item.isFromPatient ? styles.patientText : styles.nurseText
            ]}>
              {item.content}
            </Text>
            
            <Text style={styles.timeText}>{formatTime(item.timestamp)}</Text>
          </View>
        </View>
      </>
    );
  };
  
  // Empty state when no messages
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="message-circle" size={48} color={colors.icon.message} />
      <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
      <Text style={styles.emptyStateText}>
        Start a conversation with your care team. They're here to help!
      </Text>
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>Secure Chat</Text>
        <TouchableOpacity onPress={onViewAllPress}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.nurseInfoContainer}>
        <Avatar 
          source={nurse.avatar ? { uri: nurse.avatar } : null}
          name={nurse.name}
          size={40}
        />
        
        <View style={styles.nurseInfo}>
          <Text style={styles.nurseName}>{nurse.name}</Text>
          <Text style={styles.nurseTitle}>{nurse.title}</Text>
        </View>
        
        <View style={[
          styles.statusIndicator,
          { backgroundColor: nurse.isOnline ? colors.success : colors.text.disabled }
        ]} />
      </View>
      
      <FlatList
        data={messages.slice(-3)} // Show only the 3 most recent messages
        renderItem={renderMessageItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.messagesContainer}
        inverted={messages.length > 0} // Show newest messages at the bottom
        scrollEnabled={false} // Disable scrolling within the card
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder="Type a message..."
          placeholderTextColor={colors.text.placeholder}
          multiline
        />
        
        <TouchableOpacity 
          style={[
            styles.sendButton,
            !newMessage.trim() && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={!newMessage.trim()}
        >
          <Icon 
            name="send" 
            size={20} 
            color={newMessage.trim() ? colors.white : colors.text.disabled} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.footer}>
        <Icon name="lock" size={14} color={colors.text.secondary} />
        <Text style={styles.footerText}>
          HIPAA-compliant secure messaging
        </Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    ...typography.h3,
    color: colors.text.primary,
  },
  viewAllText: {
    ...typography.button,
    color: colors.primary,
  },
  nurseInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  nurseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  nurseName: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  nurseTitle: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  statusIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  messagesContainer: {
    padding: 16,
    minHeight: 200,
  },
  dateContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  dateText: {
    ...typography.caption,
    color: colors.text.secondary,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  messageContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    maxWidth: '80%',
  },
  patientMessage: {
    alignSelf: 'flex-end',
  },
  nurseMessage: {
    alignSelf: 'flex-start',
  },
  avatar: {
    marginRight: 8,
    alignSelf: 'flex-end',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '100%',
  },
  patientBubble: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  nurseBubble: {
    backgroundColor: colors.background.secondary,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    ...typography.caption,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  messageText: {
    ...typography.body,
  },
  patientText: {
    color: colors.white,
  },
  nurseText: {
    color: colors.text.primary,
  },
  timeText: {
    ...typography.tiny,
    color: colors.text.secondary,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  input: {
    flex: 1,
    ...typography.body,
    color: colors.text.primary,
    backgroundColor: colors.background.secondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.background.secondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: colors.background.secondary,
  },
  footerText: {
    ...typography.caption,
    color: colors.text.secondary,
    marginLeft: 6,
  },
});

export default SecureChatCard;
