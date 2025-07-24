import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Chip,
  Alert,
  CircularProgress,
  LinearProgress,
  AppBar,
  Toolbar,
  IconButton,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  Divider,
  Badge,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
} from '@mui/material';
import {
  Assignment,
  ArrowBack,
  CheckCircle,
  Schedule,
  Warning,
  ExpandMore,
  LocalHospital,
  Medication,
  FitnessCenter,
  Restaurant,
  MonitorHeart,
  EventNote,
  TrendingUp,
  CalendarToday,
  Notifications,
  Person,
} from '@mui/icons-material';
import { format, isAfter, isBefore, addDays } from 'date-fns';

import { useAuth } from '../contexts/auth/AuthContext';
import { patientApi, handleApiError } from '../services/apiClient';

// TypeScript interfaces
interface CarePlan {
  id: string;
  title: string;
  description: string;
  provider: string;
  providerTitle: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'completed' | 'paused' | 'cancelled';
  priority: 'low' | 'normal' | 'high' | 'critical';
  category: 'medication' | 'exercise' | 'diet' | 'monitoring' | 'lifestyle' | 'follow-up';
  goals: CarePlanGoal[];
  tasks: CarePlanTask[];
  reminders: CarePlanReminder[];
  progressNotes: ProgressNote[];
}

interface CarePlanGoal {
  id: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  targetDate: string;
  status: 'not_started' | 'in_progress' | 'achieved' | 'overdue';
  category: 'clinical' | 'lifestyle' | 'educational';
}

interface CarePlanTask {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly';
  status: 'pending' | 'completed' | 'missed' | 'cancelled';
  category: 'medication' | 'exercise' | 'diet' | 'monitoring' | 'appointment';
  completedAt?: string;
  instructions?: string;
}

interface CarePlanReminder {
  id: string;
  title: string;
  message: string;
  scheduledFor: string;
  type: 'medication' | 'appointment' | 'measurement' | 'exercise' | 'general';
  status: 'pending' | 'sent' | 'acknowledged' | 'missed';
}

interface ProgressNote {
  id: string;
  date: string;
  author: string;
  authorRole: 'patient' | 'doctor' | 'nurse';
  content: string;
  type: 'observation' | 'milestone' | 'concern' | 'adjustment';
}

const CarePlansPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // State management
  const [carePlans, setCarePlans] = useState<CarePlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<CarePlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Load care plans
  const loadCarePlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call: patientApi.carePlans.getPlans()
      await new Promise(resolve => setTimeout(resolve, 1000));

      const mockCarePlans: CarePlan[] = [
        {
          id: 'plan-1',
          title: 'Diabetes Management Plan',
          description: 'Comprehensive diabetes care plan including medication, diet, and monitoring',
          provider: 'Dr. Sarah Johnson',
          providerTitle: 'Endocrinologist',
          startDate: new Date(Date.now() - 2592000000).toISOString(), // 30 days ago
          status: 'active',
          priority: 'high',
          category: 'monitoring',
          goals: [
            {
              id: 'goal-1',
              description: 'Maintain HbA1c below 7%',
              targetValue: 7,
              currentValue: 7.2,
              unit: '%',
              targetDate: addDays(new Date(), 60).toISOString(),
              status: 'in_progress',
              category: 'clinical',
            },
            {
              id: 'goal-2',
              description: 'Exercise 150 minutes per week',
              targetValue: 150,
              currentValue: 120,
              unit: 'minutes',
              targetDate: addDays(new Date(), 7).toISOString(),
              status: 'in_progress',
              category: 'lifestyle',
            },
          ],
          tasks: [
            {
              id: 'task-1',
              title: 'Take Metformin 500mg',
              description: 'Take with breakfast and dinner',
              dueDate: new Date().toISOString(),
              frequency: 'daily',
              status: 'pending',
              category: 'medication',
              instructions: 'Take with food to reduce stomach upset',
            },
            {
              id: 'task-2',
              title: 'Check blood glucose',
              description: 'Morning and evening readings',
              dueDate: new Date().toISOString(),
              frequency: 'daily',
              status: 'completed',
              category: 'monitoring',
              completedAt: new Date(Date.now() - 3600000).toISOString(),
            },
            {
              id: 'task-3',
              title: 'Follow-up appointment',
              description: 'Quarterly diabetes check-up',
              dueDate: addDays(new Date(), 14).toISOString(),
              frequency: 'once',
              status: 'pending',
              category: 'appointment',
            },
          ],
          reminders: [
            {
              id: 'reminder-1',
              title: 'Medication Reminder',
              message: 'Time to take your evening Metformin',
              scheduledFor: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
              type: 'medication',
              status: 'pending',
            },
          ],
          progressNotes: [
            {
              id: 'note-1',
              date: new Date(Date.now() - 86400000).toISOString(),
              author: 'Dr. Sarah Johnson',
              authorRole: 'doctor',
              content: 'Patient is responding well to current medication regimen. Blood glucose levels showing improvement.',
              type: 'observation',
            },
          ],
        },
        {
          id: 'plan-2',
          title: 'Cardiac Rehabilitation Program',
          description: 'Post-surgery recovery and heart health improvement plan',
          provider: 'Dr. Michael Chen',
          providerTitle: 'Cardiologist',
          startDate: new Date(Date.now() - 1209600000).toISOString(), // 14 days ago
          endDate: addDays(new Date(), 76).toISOString(), // 90 days total
          status: 'active',
          priority: 'critical',
          category: 'exercise',
          goals: [
            {
              id: 'goal-3',
              description: 'Complete 36 supervised exercise sessions',
              targetValue: 36,
              currentValue: 8,
              unit: 'sessions',
              targetDate: addDays(new Date(), 76).toISOString(),
              status: 'in_progress',
              category: 'lifestyle',
            },
          ],
          tasks: [
            {
              id: 'task-4',
              title: 'Cardiac rehabilitation session',
              description: 'Supervised exercise at rehab center',
              dueDate: addDays(new Date(), 1).toISOString(),
              frequency: 'weekly',
              status: 'pending',
              category: 'exercise',
            },
          ],
          reminders: [],
          progressNotes: [],
        },
      ];

      setCarePlans(mockCarePlans);
      if (mockCarePlans.length > 0) {
        setSelectedPlan(mockCarePlans[0]);
      }
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark task as completed
  const markTaskCompleted = async (taskId: string) => {
    try {
      // TODO: Replace with actual API call: patientApi.carePlans.completeTask(taskId)
      await new Promise(resolve => setTimeout(resolve, 500));

      setCarePlans(prev => prev.map(plan => ({
        ...plan,
        tasks: plan.tasks.map(task =>
          task.id === taskId
            ? { ...task, status: 'completed', completedAt: new Date().toISOString() }
            : task
        )
      })));

      if (selectedPlan) {
        setSelectedPlan(prev => prev ? ({
          ...prev,
          tasks: prev.tasks.map(task =>
            task.id === taskId
              ? { ...task, status: 'completed', completedAt: new Date().toISOString() }
              : task
          )
        }) : null);
      }
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'paused': return 'warning';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'normal': return 'primary';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication': return <Medication />;
      case 'exercise': return <FitnessCenter />;
      case 'diet': return <Restaurant />;
      case 'monitoring': return <MonitorHeart />;
      case 'lifestyle': return <TrendingUp />;
      case 'follow-up': return <EventNote />;
      default: return <Assignment />;
    }
  };

  // Calculate progress percentage
  const calculateProgress = (plan: CarePlan) => {
    const completedTasks = plan.tasks.filter(task => task.status === 'completed').length;
    const totalTasks = plan.tasks.length;
    return totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  };

  // Get upcoming tasks
  const getUpcomingTasks = () => {
    const allTasks = carePlans.flatMap(plan =>
      plan.tasks.filter(task => task.status === 'pending').map(task => ({ ...task, planTitle: plan.title }))
    );
    return allTasks.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).slice(0, 5);
  };

  // Get overdue tasks
  const getOverdueTasks = () => {
    const now = new Date();
    const allTasks = carePlans.flatMap(plan =>
      plan.tasks.filter(task => task.status === 'pending' && isBefore(new Date(task.dueDate), now))
        .map(task => ({ ...task, planTitle: plan.title }))
    );
    return allTasks;
  };

  useEffect(() => {
    loadCarePlans();
  }, [loadCarePlans]);

  if (loading && carePlans.length === 0) {
    return (
      <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
        <AppBar position="static" elevation={0}>
          <Toolbar>
            <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
              <ArrowBack />
            </IconButton>
            <Typography variant="h6" sx={{ flexGrow: 1 }}>
              Care Plans
            </Typography>
          </Toolbar>
        </AppBar>
        <Container maxWidth="lg" sx={{ py: 4, textAlign: 'center' }}>
          <CircularProgress size={50} />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading your care plans...
          </Typography>
        </Container>
      </Box>
    );
  }

  const upcomingTasks = getUpcomingTasks();
  const overdueTasks = getOverdueTasks();

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* App Bar */}
      <AppBar position="static" elevation={0}>
        <Toolbar>
          <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 2 }}>
            <ArrowBack />
          </IconButton>
          <Assignment sx={{ mr: 2 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Care Plans & Progress
          </Typography>
          <Badge badgeContent={overdueTasks.length} color="error">
            <Notifications />
          </Badge>
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

        {/* Overdue Tasks Alert */}
        {overdueTasks.length > 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}
            </Typography>
            {overdueTasks.slice(0, 3).map((task) => (
              <Typography key={task.id} variant="body2">
                • {task.title} (from {task.planTitle})
              </Typography>
            ))}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Care Plans List */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
              <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Typography variant="h6">Your Care Plans</Typography>
              </Box>

              <List sx={{ p: 0 }}>
                {carePlans.map((plan) => (
                  <ListItem
                    key={plan.id}
                    button
                    selected={selectedPlan?.id === plan.id}
                    onClick={() => setSelectedPlan(plan)}
                    sx={{ borderBottom: 1, borderColor: 'divider' }}
                  >
                    <ListItemIcon>
                      {getCategoryIcon(plan.category)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle1">{plan.title}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Chip
                              size="small"
                              label={plan.priority}
                              color={getPriorityColor(plan.priority) as any}
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            {plan.provider} - {plan.providerTitle}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={calculateProgress(plan)}
                              sx={{ flex: 1, height: 6, borderRadius: 3 }}
                            />
                            <Typography variant="caption">
                              {Math.round(calculateProgress(plan))}%
                            </Typography>
                          </Box>
                          <Chip
                            size="small"
                            label={plan.status}
                            color={getStatusColor(plan.status) as any}
                            variant="filled"
                            sx={{ mt: 1 }}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Care Plan Details */}
          <Grid item xs={12} md={8}>
            {selectedPlan ? (
              <Paper sx={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                {/* Plan Header */}
                <Box sx={{ p: 3, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h5" gutterBottom>
                    {selectedPlan.title}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" paragraph>
                    {selectedPlan.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Chip
                      label={selectedPlan.status}
                      color={getStatusColor(selectedPlan.status) as any}
                    />
                    <Chip
                      label={`Priority: ${selectedPlan.priority}`}
                      color={getPriorityColor(selectedPlan.priority) as any}
                      variant="outlined"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Started: {format(new Date(selectedPlan.startDate), 'MMM dd, yyyy')}
                    </Typography>
                    {selectedPlan.endDate && (
                      <Typography variant="body2" color="text.secondary">
                        Ends: {format(new Date(selectedPlan.endDate), 'MMM dd, yyyy')}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Tabs */}
                <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tab label="Tasks" />
                  <Tab label="Goals" />
                  <Tab label="Progress Notes" />
                  <Tab label="Reminders" />
                </Tabs>

                {/* Tab Content */}
                <Box sx={{ p: 3 }}>
                  {/* Tasks Tab */}
                  {activeTab === 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Care Plan Tasks
                      </Typography>

                      {selectedPlan.tasks.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No tasks assigned yet.
                        </Typography>
                      ) : (
                        <List>
                          {selectedPlan.tasks.map((task) => (
                            <ListItem key={task.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                              <ListItemIcon>
                                <Checkbox
                                  checked={task.status === 'completed'}
                                  onChange={() => task.status === 'pending' && markTaskCompleted(task.id)}
                                  disabled={task.status !== 'pending'}
                                  icon={task.status === 'missed' ? <Warning color="error" /> : undefined}
                                />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography
                                      variant="subtitle1"
                                      sx={{
                                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                                        opacity: task.status === 'completed' ? 0.7 : 1
                                      }}
                                    >
                                      {task.title}
                                    </Typography>
                                    {getCategoryIcon(task.category)}
                                    <Chip
                                      size="small"
                                      label={task.frequency}
                                      variant="outlined"
                                    />
                                  </Box>
                                }
                                secondary={
                                  <Box>
                                    <Typography variant="body2" color="text.secondary">
                                      {task.description}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Due: {format(new Date(task.dueDate), 'MMM dd, yyyy h:mm a')}
                                    </Typography>
                                    {task.instructions && (
                                      <Typography variant="caption" display="block" sx={{ mt: 0.5, fontStyle: 'italic' }}>
                                        Instructions: {task.instructions}
                                      </Typography>
                                    )}
                                    {task.completedAt && (
                                      <Typography variant="caption" display="block" color="success.main">
                                        Completed: {format(new Date(task.completedAt), 'MMM dd, yyyy h:mm a')}
                                      </Typography>
                                    )}
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Chip
                                  size="small"
                                  label={task.status}
                                  color={
                                    task.status === 'completed' ? 'success' :
                                    task.status === 'missed' ? 'error' :
                                    task.status === 'pending' && isBefore(new Date(task.dueDate), new Date()) ? 'warning' :
                                    'default'
                                  }
                                />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  )}

                  {/* Goals Tab */}
                  {activeTab === 1 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Treatment Goals
                      </Typography>

                      {selectedPlan.goals.map((goal) => (
                        <Card key={goal.id} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              {goal.description}
                            </Typography>

                            {goal.targetValue && goal.currentValue && (
                              <Box sx={{ mb: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                  <Typography variant="body2">
                                    Current: {goal.currentValue} {goal.unit}
                                  </Typography>
                                  <Typography variant="body2">
                                    Target: {goal.targetValue} {goal.unit}
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={Math.min((goal.currentValue / goal.targetValue) * 100, 100)}
                                  sx={{ height: 8, borderRadius: 4 }}
                                  color={
                                    goal.currentValue >= goal.targetValue ? 'success' :
                                    goal.currentValue >= goal.targetValue * 0.7 ? 'warning' :
                                    'error'
                                  }
                                />
                              </Box>
                            )}

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Chip
                                size="small"
                                label={goal.status.replace('_', ' ')}
                                color={
                                  goal.status === 'achieved' ? 'success' :
                                  goal.status === 'overdue' ? 'error' :
                                  goal.status === 'in_progress' ? 'warning' :
                                  'default'
                                }
                              />
                              <Typography variant="body2" color="text.secondary">
                                Target Date: {format(new Date(goal.targetDate), 'MMM dd, yyyy')}
                              </Typography>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}

                  {/* Progress Notes Tab */}
                  {activeTab === 2 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Progress Notes
                      </Typography>

                      {selectedPlan.progressNotes.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No progress notes yet.
                        </Typography>
                      ) : (
                        <Timeline>
                          {selectedPlan.progressNotes.map((note, index) => (
                            <TimelineItem key={note.id}>
                              <TimelineOppositeContent color="text.secondary">
                                {format(new Date(note.date), 'MMM dd, yyyy')}
                              </TimelineOppositeContent>
                              <TimelineSeparator>
                                <TimelineDot color={note.authorRole === 'doctor' ? 'primary' : 'secondary'}>
                                  {note.authorRole === 'doctor' ? <LocalHospital /> : <Person />}
                                </TimelineDot>
                                {index < selectedPlan.progressNotes.length - 1 && <TimelineConnector />}
                              </TimelineSeparator>
                              <TimelineContent>
                                <Paper elevation={1} sx={{ p: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    {note.author} ({note.authorRole})
                                  </Typography>
                                  <Typography variant="body2" paragraph>
                                    {note.content}
                                  </Typography>
                                  <Chip size="small" label={note.type} variant="outlined" />
                                </Paper>
                              </TimelineContent>
                            </TimelineItem>
                          ))}
                        </Timeline>
                      )}
                    </Box>
                  )}

                  {/* Reminders Tab */}
                  {activeTab === 3 && (
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Upcoming Reminders
                      </Typography>

                      {selectedPlan.reminders.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No reminders set.
                        </Typography>
                      ) : (
                        <List>
                          {selectedPlan.reminders.map((reminder) => (
                            <ListItem key={reminder.id} sx={{ border: 1, borderColor: 'divider', borderRadius: 1, mb: 1 }}>
                              <ListItemIcon>
                                <Notifications color={reminder.status === 'pending' ? 'primary' : 'action'} />
                              </ListItemIcon>
                              <ListItemText
                                primary={reminder.title}
                                secondary={
                                  <Box>
                                    <Typography variant="body2">{reminder.message}</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                      Scheduled: {format(new Date(reminder.scheduledFor), 'MMM dd, yyyy h:mm a')}
                                    </Typography>
                                  </Box>
                                }
                              />
                              <ListItemSecondaryAction>
                                <Chip size="small" label={reminder.status} />
                              </ListItemSecondaryAction>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </Box>
                  )}
                </Box>
              </Paper>
            ) : (
              <Paper sx={{ height: 'calc(100vh - 250px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Assignment sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Select a Care Plan
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Choose a care plan from the list to view details and track progress
                  </Typography>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>

        {/* Upcoming Tasks Summary */}
        {upcomingTasks.length > 0 && (
          <Paper sx={{ mt: 3, p: 3 }}>
            <Typography variant="h6" gutterBottom>
              <CalendarToday sx={{ mr: 1, verticalAlign: 'middle' }} />
              Upcoming Tasks
            </Typography>
            <Grid container spacing={2}>
              {upcomingTasks.map((task) => (
                <Grid item xs={12} md={6} lg={4} key={task.id}>
                  <Card variant="outlined" size="small">
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        {task.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {task.planTitle}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Due: {format(new Date(task.dueDate), 'MMM dd, h:mm a')}
                      </Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Button
                        size="small"
                        onClick={() => markTaskCompleted(task.id)}
                        startIcon={<CheckCircle />}
                      >
                        Mark Complete
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        )}
      </Container>
    </Box>
  );
};

export default CarePlansPage;
