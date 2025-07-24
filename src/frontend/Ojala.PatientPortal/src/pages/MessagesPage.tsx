import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Chip,
  Alert,
  CircularProgress,
  AppBar,
  Toolbar,
  IconButton,
  Fab,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Badge,
  InputAdornment,
} from '@mui/material';
import {
  Message,
  ArrowBack,
  Add,
  Send,
  AttachFile,
  Person,
  LocalHospital,
  Schedule,
  Priority,
  Reply,
  Search,
  FilterList,
  Security,
  Verified,
} from '@mui/icons-material';
import { format, isToday, isYesterday } from 'date-fns';

import { useAuth } from '../contexts/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface MessageThread {
  id: string;
  subject: string;
  participants: Participant[];
  lastMessage: MessageContent;
  unreadCount: number;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'active' | 'closed' | 'archived';
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  name: string;
  role: 'patient' | 'doctor' | 'nurse' | 'admin';
  avatar?: string;
  title?: string;
  department?: string;
}

interface MessageContent {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  sentAt: string;
  readAt?: string;
  attachments?: Attachment[];
  type: 'text' | 'appointment_request' | 'test_result' | 'prescription' | 'system';
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

interface NewMessageRequest {
  recipientId: string;
  subject: string;
  content: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: File[];
}

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // State management
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<MessageContent[]>([]);
  const [providers, setProviders] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Dialog states
  const [newMessageDialogOpen, setNewMessageDialogOpen] = useState(false);

  // Form states
  const [newMessage, setNewMessage] = useState<NewMessageRequest>({
    recipientId: '',
    subject: '',
    content: '',
    priority: 'normal',
    attachments: [],
  });
  const [replyContent, setReplyContent] = useState('');

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'closed' | 'archived'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'urgent'>('all');

  // Load message threads
  const loadThreads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.messages.getThreads()
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockThreads: MessageThread[] = [
        {
          id: 'thread-1',
          subject: 'Lab Results Review',
          participants: [
            { id: 'patient-1', name: user?.username || 'Patient', role: 'patient' },
            { id: 'doctor-1', name: 'Dr. Sarah Johnson', role: 'doctor', title: 'Cardiologist', department: 'Cardiology' },
          ],
          lastMessage: {
            id: 'msg-1',
            threadId: 'thread-1',
            senderId: 'doctor-1',
            content: 'Your recent blood work looks good. Cholesterol levels have improved since your last visit.',
            sentAt: new Date(Date.now() - 3600000).toISOString(),
            type: 'text',
          },
          unreadCount: 1,
          priority: 'normal',
          status: 'active',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          updatedAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 'thread-2',
          subject: 'Prescription Refill Request',
          participants: [
            { id: 'patient-1', name: user?.username || 'Patient', role: 'patient' },
            { id: 'nurse-1', name: 'Nurse Rebecca Martinez', role: 'nurse', department: 'Primary Care' },
          ],
          lastMessage: {
            id: 'msg-2',
            threadId: 'thread-2',
            senderId: 'patient-1',
            content: 'I need a refill for my blood pressure medication. Current prescription expires next week.',
            sentAt: new Date(Date.now() - 7200000).toISOString(),
            type: 'text',
          },
          unreadCount: 0,
          priority: 'normal',
          status: 'active',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          updatedAt: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: 'thread-3',
          subject: 'Appointment Scheduling',
          participants: [
            { id: 'patient-1', name: user?.username || 'Patient', role: 'patient' },
            { id: 'admin-1', name: 'Jessica Chen', role: 'admin', department: 'Scheduling' },
          ],
          lastMessage: {
            id: 'msg-3',
            threadId: 'thread-3',
            senderId: 'admin-1',
            content: 'Your appointment with Dr. Johnson has been confirmed for next Tuesday at 2:00 PM.',
            sentAt: new Date(Date.now() - 86400000).toISOString(),
            type: 'appointment_request',
          },
          unreadCount: 0,
          priority: 'high',
          status: 'closed',
          createdAt: new Date(Date.now() - 259200000).toISOString(),
          updatedAt: new Date(Date.now() - 86400000).toISOString(),
        },
      ];

      setThreads(mockThreads);

      // Load available providers
      const mockProviders: Participant[] = [
        { id: 'doctor-1', name: 'Dr. Sarah Johnson', role: 'doctor', title: 'Cardiologist', department: 'Cardiology' },
        { id: 'doctor-2', name: 'Dr. Michael Chen', role: 'doctor', title: 'Primary Care Physician', department: 'Primary Care' },
        { id: 'nurse-1', name: 'Nurse Rebecca Martinez', role: 'nurse', department: 'Primary Care' },
        { id: 'nurse-2', name: 'Nurse David Kim', role: 'nurse', department: 'Cardiology' },
      ];

      setProviders(mockProviders);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Load messages for selected thread
  const loadMessages = useCallback(async (threadId: string) => {
    try {
      setError(null);

      // TODO: Replace with actual API call: patientApi.messages.getMessages(threadId)
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockMessages: MessageContent[] = [
        {
          id: 'msg-1a',
          threadId,
          senderId: 'patient-1',
          content: 'Hi Dr. Johnson, I received my lab results and wanted to discuss them with you.',
          sentAt: new Date(Date.now() - 90000000).toISOString(),
          readAt: new Date(Date.now() - 89000000).toISOString(),
          type: 'text',
        },
        {
          id: 'msg-1b',
          threadId,
          senderId: 'doctor-1',
          content: 'Of course! I\'ve reviewed your results. Overall, they look quite positive. Your cholesterol levels have improved significantly since your last visit.',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          readAt: new Date(Date.now() - 82800000).toISOString(),
          type: 'text',
        },
        {
          id: 'msg-1c',
          threadId,
          senderId: 'patient-1',
          content: 'That\'s great to hear! What about my blood pressure readings?',
          sentAt: new Date(Date.now() - 7200000).toISOString(),
          readAt: new Date(Date.now() - 7000000).toISOString(),
          type: 'text',
        },
        {
          id: 'msg-1d',
          threadId,
          senderId: 'doctor-1',
          content: 'Your recent blood work looks good. Cholesterol levels have improved since your last visit.',
          sentAt: new Date(Date.now() - 3600000).toISOString(),
          type: 'text',
        },
      ];

      setMessages(mockMessages);

      // Mark thread as read
      setThreads(prev => prev.map(thread =>
        thread.id === threadId
          ? { ...thread, unreadCount: 0 }
          : thread
      ));
    } catch (err) {
      setError(handleApiError(err));
    }
  }, []);

  // Send new message
  const handleSendNewMessage = async () => {
    try {
      setSending(true);
      setError(null);

      if (!newMessage.recipientId || !newMessage.subject || !newMessage.content) {
        setError('Please fill in all required fields');
        return;
      }

      // TODO: Replace with actual API call: patientApi.messages.sendMessage(newMessage)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Close dialog and reset form
      setNewMessageDialogOpen(false);
      setNewMessage({
        recipientId: '',
        subject: '',
        content: '',
        priority: 'normal',
        attachments: [],
      });

      // Reload threads
      await loadThreads();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSending(false);
    }
  };

  // Send reply
  const handleSendReply = async () => {
    if (!selectedThread || !replyContent.trim()) return;

    try {
      setSending(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.messages.sendReply(selectedThread.id, replyContent)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Add new message to local state
      const newMessage: MessageContent = {
        id: `msg-${Date.now()}`,
        threadId: selectedThread.id,
        senderId: user?.id || 'patient-1',
        content: replyContent,
        sentAt: new Date().toISOString(),
        type: 'text',
      };

      setMessages(prev => [...prev, newMessage]);
      setReplyContent('');

      // Update thread's last message
      setThreads(prev => prev.map(thread =>
        thread.id === selectedThread.id
          ? { ...thread, lastMessage: newMessage, updatedAt: new Date().toISOString() }
          : thread
      ));
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSending(false);
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Get role icon
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'doctor': return <LocalHospital />;
      case 'nurse': return <Person />;
      case 'admin': return <Schedule />;
      default: return <Person />;
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM dd');
    }
  };

  // Filter threads
  const filteredThreads = threads.filter(thread => {
    const matchesSearch = searchQuery === '' ||
      thread.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      thread.participants.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || thread.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || thread.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  if (loading && threads.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Secure Messages
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your messages...
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Message sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Secure Messages
          </Typography>
          <Security sx={{ mr: 1 }} />
          <Typography variant="body2">HIPAA Compliant</Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert
            severity="error"
            sx={{ mb: 3 }}
            onClose={() => setError(null)}
          >
            {error}
          </Alert>
        )}

        {/* Security Notice */}
        <Alert severity="info" sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Verified sx={{ mr: 1 }} />
            <Typography variant="body2">
              <strong>Secure Communication:</strong> All messages are encrypted and HIPAA compliant.
              Please do not include sensitive information like SSN or payment details.
            </Typography>
          </Box>
        </Alert>

        <Grid container spacing={3} sx={{ height: 'calc(100vh - 300px)' }}>
          {/* Message Threads List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              {/* Thread List Header */}
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Messages</Typography>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => setNewMessageDialogOpen(true)}
                    startIcon={<Add />}
                  >
                    New
                  </Button>
                </Box>

                {/* Search and Filters */}
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 1 }}
                />

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">All Status</MenuItem>
                      <MenuItem value="active">Active</MenuItem>
                      <MenuItem value="closed">Closed</MenuItem>
                      <MenuItem value="archived">Archived</MenuItem>
                    </Select>
                  </FormControl>

                  <FormControl size="small" sx={{ flex: 1 }}>
                    <Select
                      value={priorityFilter}
                      onChange={(e) => setPriorityFilter(e.target.value as any)}
                    >
                      <MenuItem value="all">All Priority</MenuItem>
                      <MenuItem value="urgent">Urgent</MenuItem>
                      <MenuItem value="high">High</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {/* Thread List */}
              <Box sx={{ flex: 1, overflow: 'auto' }}>
                <List sx={{ p: 0 }}>
                  {filteredThreads.map((thread) => {
                    const otherParticipant = thread.participants.find(p => p.id !== user?.id);
                    return (
                      <ListItem
                        key={thread.id}
                        button
                        selected={selectedThread?.id === thread.id}
                        onClick={() => {
                          setSelectedThread(thread);
                          loadMessages(thread.id);
                        }}
                        sx={{
                          borderBottom: 1,
                          borderColor: 'divider',
                          backgroundColor: thread.unreadCount > 0 ? 'action.hover' : 'transparent',
                        }}
                      >
                        <ListItemAvatar>
                          <Badge badgeContent={thread.unreadCount} color="error">
                            <Avatar>
                              {getRoleIcon(otherParticipant?.role || 'person')}
                            </Avatar>
                          </Badge>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Typography variant="subtitle1" noWrap sx={{ fontWeight: thread.unreadCount > 0 ? 'bold' : 'normal' }}>
                                {thread.subject}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                {thread.priority !== 'normal' && (
                                  <Chip
                                    size="small"
                                    label={thread.priority}
                                    color={getPriorityColor(thread.priority) as any}
                                    variant="outlined"
                                  />
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  {formatMessageTime(thread.updatedAt)}
                                </Typography>
                              </Box>
                            </Box>
                          }
                          secondary={
                            <Box>
                              <Typography variant="body2" color="text.secondary" gutterBottom>
                                {otherParticipant?.name} - {otherParticipant?.title || otherParticipant?.department}
                              </Typography>
                              <Typography variant="body2" noWrap sx={{ fontWeight: thread.unreadCount > 0 ? 'bold' : 'normal' }}>
                                {thread.lastMessage.content}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </Box>
            </Paper>
          </Grid>

          {/* Message Thread View */}
          <Grid item xs={12} md={8}>
            {selectedThread ? (
              <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Thread Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">{selectedThread.subject}</Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      Participants: {selectedThread.participants.map(p => p.name).join(', ')}
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedThread.status}
                      color={selectedThread.status === 'active' ? 'success' : 'default'}
                      variant="outlined"
                    />
                    {selectedThread.priority !== 'normal' && (
                      <Chip
                        size="small"
                        label={selectedThread.priority}
                        color={getPriorityColor(selectedThread.priority) as any}
                        variant="outlined"
                      />
                    )}
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {messages.map((message) => {
                    const sender = selectedThread.participants.find(p => p.id === message.senderId);
                    const isOwnMessage = message.senderId === user?.id;

                    return (
                      <Box
                        key={message.id}
                        sx={{
                          display: 'flex',
                          flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                          alignItems: 'flex-start',
                          mb: 2,
                        }}
                      >
                        <Avatar sx={{ mx: 1 }}>
                          {isOwnMessage ? <Person /> : getRoleIcon(sender?.role || 'person')}
                        </Avatar>
                        <Box
                          sx={{
                            maxWidth: '70%',
                            p: 2,
                            borderRadius: 2,
                            backgroundColor: isOwnMessage ? 'primary.main' : 'grey.100',
                            color: isOwnMessage ? 'white' : 'text.primary',
                          }}
                        >
                          <Typography variant="body2" gutterBottom>
                            <strong>{isOwnMessage ? 'You' : sender?.name}</strong>
                          </Typography>
                          <Typography variant="body1" paragraph>
                            {message.content}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{
                              opacity: 0.8,
                              display: 'block',
                              textAlign: isOwnMessage ? 'right' : 'left'
                            }}
                          >
                            {format(new Date(message.sentAt), 'MMM dd, h:mm a')}
                            {message.readAt && isOwnMessage && ' • Read'}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </Box>

                {/* Reply Input */}
                {selectedThread.status === 'active' && (
                  <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={2}
                        placeholder="Type your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <IconButton size="small">
                          <AttachFile />
                        </IconButton>
                        <Button
                          variant="contained"
                          onClick={handleSendReply}
                          disabled={!replyContent.trim() || sending}
                          startIcon={sending ? <CircularProgress size={16} /> : <Send />}
                        >
                          Send
                        </Button>
                      </Box>
                    </Box>
                  </Box>
                )}
              </Paper>
            ) : (
              <Paper sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Message sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Select a Message
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a conversation from the list to view messages
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Floating Action Button */}
        <Fab
          color="primary"
          onClick={() => setNewMessageDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
          }}
        >
          <Add />
        </Fab>

        {/* New Message Dialog */}
        <Dialog
          open={newMessageDialogOpen}
          onClose={() => setNewMessageDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Message sx={{ mr: 2 }} />
              New Secure Message
            </Box>
          </DialogTitle>

          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Recipient</InputLabel>
                  <Select
                    value={newMessage.recipientId}
                    label="Recipient"
                    onChange={(e) => setNewMessage(prev => ({
                      ...prev,
                      recipientId: e.target.value
                    }))}
                  >
                    {providers.map((provider) => (
                      <MenuItem key={provider.id} value={provider.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {getRoleIcon(provider.role)}
                          <Box>
                            <Typography variant="body1">{provider.name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {provider.title} - {provider.department}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={8}>
                <TextField
                  label="Subject"
                  fullWidth
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage(prev => ({
                    ...prev,
                    subject: e.target.value
                  }))}
                />
              </Grid>

              <Grid item xs={4}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newMessage.priority}
                    label="Priority"
                    onChange={(e) => setNewMessage(prev => ({
                      ...prev,
                      priority: e.target.value as any
                    }))}
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="normal">Normal</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  label="Message"
                  multiline
                  rows={6}
                  fullWidth
                  value={newMessage.content}
                  onChange={(e) => setNewMessage(prev => ({
                    ...prev,
                    content: e.target.value
                  }))}
                  placeholder="Type your message here..."
                />
              </Grid>
            </Grid>

            <Alert severity="info" sx={{ mt: 2 }}>
              Messages are encrypted and HIPAA compliant. Your healthcare provider will respond within 24-48 hours.
            </Alert>
          </DialogContent>

          <DialogActions>
            <Button
              onClick={() => setNewMessageDialogOpen(false)}
              disabled={sending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNewMessage}
              variant="contained"
              disabled={sending}
              startIcon={sending ? <CircularProgress size={20} /> : <Send />}
            >
              Send Message
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default MessagesPage;
