import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  TextField,
  IconButton,
  Button,
  Divider,
  Paper,
  Badge
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  InsertPhoto as InsertPhotoIcon,
  InsertDriveFile as InsertDriveFileIcon,
  Lock as LockIcon
} from '@mui/icons-material';
import theme from '../../theme';

/**
 * SecureMessagingPanel Component
 *
 * Provides a secure messaging interface for RNs to communicate
 * with patients and other care team members.
 *
 * @param {Object} props
 * @param {Object} props.conversation - Current conversation data
 * @param {Array} props.messages - Array of message objects
 * @param {Object} props.patient - Patient data for the current conversation
 * @param {Function} props.onSendMessage - Function to call when sending a message
 * @param {Function} props.onAttachFile - Function to call when attaching a file
 * @param {Function} props.onViewPatient - Function to call when viewing patient profile
 */
const SecureMessagingPanel = ({
  conversation,
  messages = [],
  patient,
  onSendMessage,
  onAttachFile,
  onViewPatient
}) => {
  const [newMessage, setNewMessage] = useState('');

  // Handle sending a new message
  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  // Handle key press in message input
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Format date for message timestamp
  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message grouping
  const formatMessageDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = {};

    messages.forEach(message => {
      const date = formatMessageDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });

    return Object.entries(groups).map(([date, messages]) => ({
      date,
      messages
    }));
  };

  // Get message groups
  const messageGroups = groupMessagesByDate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Conversation Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <Avatar
              src={patient?.profileImage}
              alt={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
              sx={{ width: 48, height: 48 }}
            >
              {patient && patient.firstName[0] + patient.lastName[0]}
            </Avatar>

            <Box ml={2}>
              <Typography variant="h6">
                {patient ? `${patient.firstName} ${patient.lastName}` : 'Select a patient'}
              </Typography>

              <Typography variant="body2" color="textSecondary">
                {patient ? `ID: ${patient.patientId} • ${patient.gender}, ${patient.age} years` : ''}
              </Typography>
            </Box>
          </Box>

          {patient && (
            <Button
              variant="outlined"
              size="small"
              onClick={onViewPatient}
            >
              View Patient
            </Button>
          )}
        </Box>
      </Box>

      {/* Messages Area */}
      <Box
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          backgroundColor: theme.palette.grey[50]
        }}
      >
        {messageGroups.length > 0 ? (
          messageGroups.map((group, groupIndex) => (
            <Box key={groupIndex} mb={3}>
              <DateDivider date={group.date} />

              {group.messages.map((message, messageIndex) => (
                <MessageBubble
                  key={messageIndex}
                  message={message}
                  isFromClinician={message.senderType === 'clinician'}
                />
              ))}
            </Box>
          ))
        ) : (
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            height="100%"
          >
            <LockIcon sx={{ fontSize: 48, color: theme.palette.grey[400], mb: 2 }} />
            <Typography variant="h6" color="textSecondary" gutterBottom>
              Secure Messaging
            </Typography>
            <Typography variant="body2" color="textSecondary" align="center">
              {patient
                ? 'Start a conversation with this patient. All messages are encrypted and HIPAA-compliant.'
                : 'Select a patient to start a secure conversation.'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Message Input Area */}
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.paper
        }}
      >
        <Box display="flex" alignItems="flex-end">
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={!patient}
            variant="outlined"
            size="small"
            sx={{ mr: 2 }}
          />

          <Box>
            <IconButton
              color="primary"
              onClick={() => onAttachFile('file')}
              disabled={!patient}
              sx={{ mr: 1 }}
            >
              <AttachFileIcon />
            </IconButton>

            <IconButton
              color="primary"
              onClick={() => onAttachFile('image')}
              disabled={!patient}
              sx={{ mr: 1 }}
            >
              <InsertPhotoIcon />
            </IconButton>

            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSend}
              disabled={!patient || !newMessage.trim()}
            >
              Send
            </Button>
          </Box>
        </Box>

        <Box display="flex" alignItems="center" justifyContent="center" mt={1}>
          <LockIcon fontSize="small" sx={{ color: theme.palette.grey[500], mr: 0.5 }} />
          <Typography variant="caption" color="textSecondary">
            HIPAA-compliant secure messaging
          </Typography>
        </Box>
      </Box>
    </Card>
  );
};

// Helper Components
const DateDivider = ({ date }) => (
  <Box display="flex" alignItems="center" justifyContent="center" my={2}>
    <Divider sx={{ flex: 1, mr: 2 }} />
    <Typography variant="caption" color="textSecondary">
      {date}
    </Typography>
    <Divider sx={{ flex: 1, ml: 2 }} />
  </Box>
);

const MessageBubble = ({ message, isFromClinician }) => {
  // Determine if message has attachments
  const hasAttachments = message.attachments && message.attachments.length > 0;

  return (
    <Box
      display="flex"
      justifyContent={isFromClinician ? 'flex-end' : 'flex-start'}
      mb={1.5}
    >
      {!isFromClinician && (
        <Avatar
          src={message.sender?.profileImage}
          alt={message.sender?.name || 'Patient'}
          sx={{ width: 36, height: 36, mr: 1 }}
        >
          {message.sender?.name ? message.sender.name[0] : 'P'}
        </Avatar>
      )}

      <Box maxWidth="70%">
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            backgroundColor: isFromClinician
              ? theme.palette.primary.main
              : theme.palette.background.paper,
            color: isFromClinician
              ? theme.palette.primary.contrastText
              : theme.palette.text.primary,
            borderRadius: 2,
            ...(isFromClinician
              ? { borderBottomRightRadius: 0 }
              : { borderBottomLeftRadius: 0 }),
            ...(isFromClinician ? {} : { boxShadow: theme.shadows[1] })
          }}
        >
          {!isFromClinician && (
            <Typography variant="caption" fontWeight="bold" display="block" gutterBottom>
              {message.sender?.name || 'Patient'}
            </Typography>
          )}

          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {message.content}
          </Typography>

          {hasAttachments && (
            <Box mt={1}>
              {message.attachments.map((attachment, index) => (
                <Box
                  key={index}
                  display="flex"
                  alignItems="center"
                  p={1}
                  mt={0.5}
                  bgcolor={isFromClinician
                    ? 'rgba(255, 255, 255, 0.1)'
                    : theme.palette.grey[100]
                  }
                  borderRadius={1}
                >
                  {attachment.type.startsWith('image/') ? (
                    <InsertPhotoIcon fontSize="small" sx={{ mr: 1 }} />
                  ) : (
                    <InsertDriveFileIcon fontSize="small" sx={{ mr: 1 }} />
                  )}
                  <Typography variant="caption" noWrap sx={{ flex: 1 }}>
                    {attachment.name}
                  </Typography>
                </Box>
              ))}
            </Box>
          )}
        </Paper>

        <Typography
          variant="caption"
          color="textSecondary"
          sx={{
            display: 'block',
            textAlign: isFromClinician ? 'right' : 'left',
            mt: 0.5
          }}
        >
          {formatMessageTime(message.timestamp)}
          {message.status && isFromClinician && (
            <span style={{ marginLeft: 4 }}>
              • {message.status === 'delivered' ? 'Delivered' : message.status === 'read' ? 'Read' : 'Sent'}
            </span>
          )}
        </Typography>
      </Box>

      {isFromClinician && (
        <Avatar
          sx={{
            width: 36,
            height: 36,
            ml: 1,
            backgroundColor: theme.palette.primary.dark
          }}
        >
          RN
        </Avatar>
      )}
    </Box>
  );
};

export default SecureMessagingPanel;
