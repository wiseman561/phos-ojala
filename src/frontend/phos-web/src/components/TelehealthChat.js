import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar,
  Card,
  CardContent,
  Divider,
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/system';
import SendIcon from '@mui/icons-material/Send';
import ChatIcon from '@mui/icons-material/Chat';
import { HubConnectionBuilder, LogLevel } from '@microsoft/signalr';

// Styled components
const ChatContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  height: '80vh',
  padding: theme.spacing(2),
  maxWidth: '800px',
  margin: '0 auto',
  gap: theme.spacing(2)
}));

const MessageArea = styled(Paper)(({ theme }) => ({
  flexGrow: 1,
  overflow: 'auto',
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1)
}));

const InputArea = styled(Box)(({ theme }) => ({
  display: 'flex',
  gap: theme.spacing(1)
}));

const UserMessage = styled(Card)(({ theme }) => ({
  alignSelf: 'flex-end',
  backgroundColor: theme.palette.primary.light,
  maxWidth: '70%'
}));

const OtherMessage = styled(Card)(({ theme }) => ({
  alignSelf: 'flex-start',
  backgroundColor: theme.palette.grey[100],
  maxWidth: '70%'
}));

const MessageText = styled(CardContent)(({ theme }) => ({
  padding: theme.spacing(1),
  '&:last-child': {
    paddingBottom: theme.spacing(1)
  }
}));

const ChatHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(2)
}));

/**
 * TelehealthChat Component
 * Provides a chat interface for telehealth consultations using SignalR
 */
const TelehealthChat = ({ username = 'Patient', providerName = 'Dr. Smith' }) => {
  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const latestMessages = useRef(null);
  const messageAreaRef = useRef(null);

  // Update ref whenever messages change
  latestMessages.current = messages;

  // Initialize SignalR connection
  useEffect(() => {
    const connect = async () => {
      try {
        // Create new connection
        const newConnection = new HubConnectionBuilder()
          .withUrl('/hubs/chat', {
            headers: {
              'X-Auth-Token': 'mock-auth-token-123'
            }
          })
          .configureLogging(LogLevel.Information)
          .withAutomaticReconnect()
          .build();

        // Set up message handler
        newConnection.on('ReceiveMessage', (user, message) => {
          const updatedMessages = [...latestMessages.current, { user, message, isUser: user === username }];
          setMessages(updatedMessages);
        });

        // Start connection
        await newConnection.start();
        console.log('Connected to SignalR hub');
        setConnection(newConnection);
        setLoading(false);
      } catch (error) {
        console.error('Error connecting to SignalR hub:', error);
        setLoading(false);
      }
    };

    connect();

    // Clean up on unmount
    return () => {
      if (connection) {
        connection.stop();
      }
    };
  }, [username]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messageAreaRef.current) {
      messageAreaRef.current.scrollTop = messageAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Send message
  const sendMessage = async (e) => {
    e.preventDefault();
    if (message.trim() !== '' && connection) {
      try {
        await connection.invoke('SendMessage', username, message);
        setMessage('');
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatIcon color="primary" />
        <Typography variant="h5" component="h2">
          Telehealth Chat with {providerName}
        </Typography>
      </ChatHeader>
      
      <Divider />
      
      <MessageArea ref={messageAreaRef}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Typography color="textSecondary">
              No messages yet. Start your conversation.
            </Typography>
          </Box>
        ) : (
          messages.map((msg, index) => (
            msg.isUser ? (
              <UserMessage key={index}>
                <MessageText>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                    You
                  </Typography>
                  <Typography variant="body1">{msg.message}</Typography>
                </MessageText>
              </UserMessage>
            ) : (
              <OtherMessage key={index}>
                <MessageText>
                  <Typography variant="body2" color="textSecondary" sx={{ fontWeight: 'bold' }}>
                    {msg.user}
                  </Typography>
                  <Typography variant="body1">{msg.message}</Typography>
                </MessageText>
              </OtherMessage>
            )
          ))
        )}
      </MessageArea>
      
      <form onSubmit={sendMessage}>
        <InputArea>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading || !connection}
          />
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            endIcon={<SendIcon />}
            disabled={loading || !connection || message.trim() === ''}
          >
            Send
          </Button>
        </InputArea>
      </form>
    </ChatContainer>
  );
};

export default TelehealthChat; 