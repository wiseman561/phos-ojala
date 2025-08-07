import React, { useState, useEffect } from 'react';
import { Card, Tabs, Button, Typography, Alert, Space, Divider, Steps, Tag, Row, Col } from 'antd';
import { PlayCircleOutlined, CheckCircleOutlined, CloseCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Step } = Steps;

const InteractiveDemoController = ({ onComplete }) => {
  const [activeTab, setActiveTab] = useState('patient');
  const [demoState, setDemoState] = useState({
    patient: { step: 0, completed: false },
    rn: { step: 0, completed: false },
    md: { step: 0, completed: false },
    employer: { step: 0, completed: false }
  });
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    // Load saved demo state from localStorage if available
    const savedState = localStorage.getItem('phos_demo_state');
    if (savedState) {
      setDemoState(JSON.parse(savedState));
    }
  }, []);

  const saveDemoState = (newState) => {
    localStorage.setItem('phos_demo_state', JSON.stringify(newState));
    setDemoState(newState);
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    setIsPlaying(false);
  };

  const handleStepChange = (role, step) => {
    const newState = {
      ...demoState,
      [role]: { ...demoState[role], step }
    };
    saveDemoState(newState);
  };

  const handleStart = () => {
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
  };

  const handleReset = () => {
    const newState = {
      ...demoState,
      [activeTab]: { step: 0, completed: false }
    };
    saveDemoState(newState);
    setIsPlaying(false);
  };

  const handleComplete = () => {
    const newState = {
      ...demoState,
      [activeTab]: { ...demoState[activeTab], completed: true }
    };
    saveDemoState(newState);
    setIsPlaying(false);
    
    // Check if all demos are completed
    const allCompleted = Object.values(newState).every(role => role.completed);
    if (allCompleted && onComplete) {
      onComplete();
    }
  };

  const handleNext = () => {
    const currentRole = activeTab;
    const currentStep = demoState[currentRole].step;
    const totalSteps = getDemoSteps(currentRole).length;
    
    if (currentStep < totalSteps - 1) {
      handleStepChange(currentRole, currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    const currentRole = activeTab;
    const currentStep = demoState[currentRole].step;
    
    if (currentStep > 0) {
      handleStepChange(currentRole, currentStep - 1);
    }
  };

  const getDemoSteps = (role) => {
    switch (role) {
      case 'patient':
        return [
          {
            title: 'Dashboard Overview',
            content: (
              <>
                <Title level={4}>Patient Dashboard</Title>
                <Paragraph>
                  The patient dashboard provides a comprehensive view of your health status and tools to manage your care.
                </Paragraph>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" title="Health Score" style={{ marginBottom: 16 }}>
                      <div style={{ textAlign: 'center' }}>
                        <span style={{ fontSize: 36, fontWeight: 'bold', color: '#52c41a' }}>85</span>
                        <Tag color="success" style={{ marginLeft: 8 }}>↑ Improving</Tag>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="Upcoming Appointments" style={{ marginBottom: 16 }}>
                      <div>
                        <Text>Dr. Smith - Checkup</Text>
                        <br />
                        <Text type="secondary">Apr 25, 2025 - 10:00 AM</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
                <Paragraph>
                  Key features include:
                  <ul>
                    <li>Health Score monitoring</li>
                    <li>Vital signs tracking</li>
                    <li>Appointment management</li>
                    <li>Secure messaging with your care team</li>
                    <li>Medication reminders</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Health Score',
            content: (
              <>
                <Title level={4}>Health Score Details</Title>
                <Paragraph>
                  Your Health Score is calculated using our AI-powered health assessment engine, which analyzes your:
                </Paragraph>
                <ul>
                  <li>Vital signs and biometric data</li>
                  <li>Medical history and conditions</li>
                  <li>Lifestyle factors</li>
                  <li>Medication adherence</li>
                </ul>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <Text strong>Cardiovascular</Text>
                      <div style={{ width: 200, height: 20, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
                        <div style={{ width: '80%', height: 20, backgroundColor: '#52c41a', borderRadius: 10 }}></div>
                      </div>
                      <Text>80/100</Text>
                    </div>
                    <div>
                      <Text strong>Metabolic</Text>
                      <div style={{ width: 200, height: 20, backgroundColor: '#f0f0f0', borderRadius: 10 }}>
                        <div style={{ width: '90%', height: 20, backgroundColor: '#52c41a', borderRadius: 10 }}></div>
                      </div>
                      <Text>90/100</Text>
                    </div>
                  </div>
                </Card>
                <Paragraph>
                  The platform provides personalized recommendations to improve your health score over time.
                </Paragraph>
              </>
            )
          },
          {
            title: 'Tracking Vitals',
            content: (
              <>
                <Title level={4}>Vitals Tracking</Title>
                <Paragraph>
                  Regularly tracking your vital signs helps you and your care team monitor your health.
                </Paragraph>
                <Card style={{ marginBottom: 16 }}>
                  <Row gutter={[16, 16]}>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Blood Pressure</Text>
                        <br />
                        <Text strong>120/80</Text>
                        <br />
                        <Tag color="success">Normal</Tag>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Heart Rate</Text>
                        <br />
                        <Text strong>72 bpm</Text>
                        <br />
                        <Tag color="success">Normal</Tag>
                      </div>
                    </Col>
                    <Col span={8}>
                      <div style={{ textAlign: 'center' }}>
                        <Text type="secondary">Weight</Text>
                        <br />
                        <Text strong>165 lbs</Text>
                        <br />
                        <Tag color="success">Stable</Tag>
                      </div>
                    </Col>
                  </Row>
                </Card>
                <Paragraph>
                  You can:
                  <ul>
                    <li>Manually enter vital measurements</li>
                    <li>Connect health devices for automatic updates</li>
                    <li>View trends over time with interactive charts</li>
                    <li>Set goals and receive alerts</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Telehealth',
            content: (
              <>
                <Title level={4}>Telehealth Sessions</Title>
                <Paragraph>
                  Connect with your healthcare providers through secure video consultations.
                </Paragraph>
                <Card style={{ marginBottom: 16, textAlign: 'center', padding: 20 }}>
                  <PlayCircleOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                  <br />
                  <Text strong>Join your scheduled appointment with Dr. Smith</Text>
                  <br />
                  <Text type="secondary">Tuesday, April 25 at 10:00 AM</Text>
                  <br /><br />
                  <Button type="primary">Join Session</Button>
                </Card>
                <Paragraph>
                  Telehealth features include:
                  <ul>
                    <li>HD video and audio quality</li>
                    <li>Screen sharing for reviewing test results</li>
                    <li>Secure messaging during sessions</li>
                    <li>Option to include family members or caregivers</li>
                    <li>Post-visit summary and care instructions</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Messaging',
            content: (
              <>
                <Title level={4}>Secure Messaging</Title>
                <Paragraph>
                  Communicate securely with your healthcare team through encrypted messaging.
                </Paragraph>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: 5, marginBottom: 8 }}>
                      <Text strong>Nurse Johnson:</Text>
                      <Paragraph style={{ margin: 0 }}>
                        How are you feeling after starting the new medication?
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>Yesterday, 2:30 PM</Text>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#e6f7ff', borderRadius: 5, marginBottom: 8 }}>
                      <Text strong>You:</Text>
                      <Paragraph style={{ margin: 0 }}>
                        I'm doing well, no side effects so far. My blood pressure readings have been consistent.
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>Yesterday, 3:15 PM</Text>
                    </div>
                    <div style={{ padding: '8px', backgroundColor: '#f0f0f0', borderRadius: 5 }}>
                      <Text strong>Nurse Johnson:</Text>
                      <Paragraph style={{ margin: 0 }}>
                        That's great news! Please continue monitoring and we'll review at your next appointment.
                      </Paragraph>
                      <Text type="secondary" style={{ fontSize: 12 }}>Yesterday, 3:30 PM</Text>
                    </div>
                  </div>
                </Card>
                <Paragraph>
                  Messaging features include:
                  <ul>
                    <li>HIPAA-compliant secure communication</li>
                    <li>Ability to attach photos or documents</li>
                    <li>Medication refill requests</li>
                    <li>Quick responses to non-urgent questions</li>
                    <li>Message notifications via email or SMS</li>
                  </ul>
                </Paragraph>
              </>
            )
          }
        ];
      
      case 'rn':
        return [
          {
            title: 'RN Dashboard',
            content: (
              <>
                <Title level={4}>RN Dashboard Overview</Title>
                <Paragraph>
                  The RN Dashboard is designed to help you efficiently manage your patient population and prioritize care.
                </Paragraph>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Card size="small" title="Patient Alerts" style={{ marginBottom: 16 }}>
                      <div>
                        <Tag color="error">3 Critical</Tag>
                        <Tag color="warning">7 High Risk</Tag>
                        <Tag color="processing">12 Moderate</Tag>
                      </div>
                    </Card>
                  </Col>
                  <Col span={12}>
                    <Card size="small" title="Today's Schedule" style={{ marginBottom: 16 }}>
                      <div>
                        <Text>8 Telehealth Sessions</Text>
                        <br />
                        <Text>5 Care Plan Reviews</Text>
                      </div>
                    </Card>
                  </Col>
                </Row>
                <Paragraph>
                  Key features include:
                  <ul>
                    <li>Patient list with risk stratification</li>
                    <li>Alert management system</li>
                    <li>Care plan creation and monitoring</li>
                    <li>Telehealth session management</li>
                    <li>Secure messaging with patients and care team</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Patient Management',
            content: (
              <>
                <Title level={4}>Patient Management</Title>
                <Paragraph>
                  Efficiently manage your patient population with advanced filtering and sorting capabilities.
                </Paragraph>
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <Text strong>Total Patients: 120</Text>
                    </div>
                    <div>
                      <Button size="small" type="primary">Add Patient</Button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong>John Smith</Text>
                        <br />
                        <Text type="secondary">ID: P-10045 | 55 yrs</Text>
                      </div>
                      <div>
                        <Tag color="error">Health Score: 45</Tag>
                      </div>
                    </div>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong>Mary Johnson</Text>
                        <br />
                        <Text type="secondary">ID: P-10046 | 62 yrs</Text>
                      </div>
                      <div>
                        <Tag color="warning">Health Score: 65</Tag>
                      </div>
                    </div>
                    <div style={{ padding: '8px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between' }}>
                      <div>
                        <Text strong>Robert Davis</Text>
                        <br />
                        <Text type="secondary">ID: P-10047 | 48 yrs</Text>
                      </div>
    
(Content truncated due to size limit. Use line ranges to read in chunks)