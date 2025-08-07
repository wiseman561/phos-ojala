import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Typography, Popover, Space, Divider } from 'antd';
import { InfoCircleOutlined, CheckCircleOutlined, RightOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;

const OnboardingWalkthrough = ({ onComplete, currentUser }) => {
  const [current, setCurrent] = useState(0);
  const [visible, setVisible] = useState(true);
  const [completedSteps, setCompletedSteps] = useState([]);

  useEffect(() => {
    // Load progress from localStorage if available
    const savedProgress = localStorage.getItem(`onboarding_progress_${currentUser?.id}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setCurrent(progress.currentStep);
      setCompletedSteps(progress.completedSteps);
      setVisible(progress.visible);
    }
  }, [currentUser]);

  const saveProgress = (step, completed, isVisible) => {
    const progress = {
      currentStep: step,
      completedSteps: completed,
      visible: isVisible
    };
    localStorage.setItem(`onboarding_progress_${currentUser?.id}`, JSON.stringify(progress));
  };

  const handleNext = () => {
    const nextStep = current + 1;
    const newCompletedSteps = [...completedSteps];
    
    if (!completedSteps.includes(current)) {
      newCompletedSteps.push(current);
      setCompletedSteps(newCompletedSteps);
    }
    
    setCurrent(nextStep);
    saveProgress(nextStep, newCompletedSteps, visible);
    
    if (nextStep >= steps.length) {
      setVisible(false);
      onComplete();
    }
  };

  const handlePrev = () => {
    const prevStep = current - 1;
    setCurrent(prevStep);
    saveProgress(prevStep, completedSteps, visible);
  };

  const handleSkip = () => {
    setVisible(false);
    saveProgress(current, completedSteps, false);
    onComplete();
  };

  const handleStepClick = (step) => {
    setCurrent(step);
    saveProgress(step, completedSteps, visible);
  };

  // Define the steps based on user role
  const getRoleSpecificSteps = () => {
    const role = currentUser?.role || 'patient';
    
    switch (role) {
      case 'patient':
        return [
          {
            title: 'Welcome',
            content: (
              <>
                <Title level={4}>Welcome to the Ojalá Healthcare Platform!</Title>
                <Paragraph>
                  This quick tour will help you get familiar with the key features of your patient dashboard.
                </Paragraph>
                <Paragraph>
                  You can exit this tour at any time by clicking "Skip" and restart it later from your profile settings.
                </Paragraph>
              </>
            )
          },
          {
            title: 'Health Score',
            content: (
              <>
                <Title level={4}>Your Health Score</Title>
                <Paragraph>
                  The Health Score card shows your overall health status on a scale from 0-100.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Higher scores indicate better health</li>
                    <li>The trend indicator shows if your health is improving or needs attention</li>
                    <li>Click on the card to see detailed breakdown and recommendations</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Vitals',
            content: (
              <>
                <Title level={4}>Vitals Tracking</Title>
                <Paragraph>
                  The Vitals card shows your most recent vital measurements.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Add new measurements by clicking the "+" button</li>
                    <li>View historical trends by clicking on any vital</li>
                    <li>Connect your health devices for automatic updates</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Appointments',
            content: (
              <>
                <Title level={4}>Appointments</Title>
                <Paragraph>
                  Manage your healthcare appointments from one place.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Schedule new appointments with your care team</li>
                    <li>Join telehealth sessions directly from the platform</li>
                    <li>Receive reminders before upcoming appointments</li>
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
                  Communicate securely with your healthcare providers.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Send messages to your care team</li>
                    <li>Attach photos or documents</li>
                    <li>Receive important notifications</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Complete',
            content: (
              <>
                <Title level={4}>You're All Set!</Title>
                <Paragraph>
                  You've completed the tour of your patient dashboard.
                </Paragraph>
                <Paragraph>
                  If you have any questions, you can contact your care team through the messaging feature or refer to the Help section in your profile.
                </Paragraph>
                <Paragraph>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} /> We're here to support your health journey!
                </Paragraph>
              </>
            )
          }
        ];
      
      case 'rn':
        return [
          {
            title: 'Welcome',
            content: (
              <>
                <Title level={4}>Welcome to the RN Dashboard!</Title>
                <Paragraph>
                  This quick tour will help you get familiar with the key features of your clinical dashboard.
                </Paragraph>
                <Paragraph>
                  You can exit this tour at any time by clicking "Skip" and restart it later from your profile settings.
                </Paragraph>
              </>
            )
          },
          {
            title: 'Patient List',
            content: (
              <>
                <Title level={4}>Patient Management</Title>
                <Paragraph>
                  The Patient List shows all patients under your care.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Sort by health score, risk level, or last contact</li>
                    <li>Filter patients by condition or status</li>
                    <li>Click on a patient to view their complete profile</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Alerts',
            content: (
              <>
                <Title level={4}>Alert Management</Title>
                <Paragraph>
                  The Alerts panel shows patients who need immediate attention.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Alerts are prioritized by severity</li>
                    <li>Acknowledge alerts to let the team know you're addressing them</li>
                    <li>Document your actions for each alert</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Care Plans',
            content: (
              <>
                <Title level={4}>Care Plan Management</Title>
                <Paragraph>
                  Create and manage care plans for your patients.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Draft care plans based on health score insights</li>
                    <li>Submit plans for MD approval</li>
                    <li>Track care plan progress and outcomes</li>
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
                  Conduct virtual visits with your patients.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Schedule telehealth appointments</li>
                    <li>Start or join sessions with one click</li>
                    <li>Document visit notes during or after the session</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Complete',
            content: (
              <>
                <Title level={4}>You're All Set!</Title>
                <Paragraph>
                  You've completed the tour of your RN dashboard.
                </Paragraph>
                <Paragraph>
                  If you have any questions, please refer to the clinical documentation or contact your administrator.
                </Paragraph>
                <Paragraph>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} /> Thank you for your dedication to patient care!
                </Paragraph>
              </>
            )
          }
        ];
      
      case 'md':
        return [
          {
            title: 'Welcome',
            content: (
              <>
                <Title level={4}>Welcome to the MD Dashboard!</Title>
                <Paragraph>
                  This quick tour will help you get familiar with the key features of your physician dashboard.
                </Paragraph>
                <Paragraph>
                  You can exit this tour at any time by clicking "Skip" and restart it later from your profile settings.
                </Paragraph>
              </>
            )
          },
          {
            title: 'Alert Queue',
            content: (
              <>
                <Title level={4}>MD Alert Queue</Title>
                <Paragraph>
                  The Alert Queue shows patients requiring physician attention.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Patients are escalated by RNs or the AI health score engine</li>
                    <li>Sort by urgency, health score, or escalation time</li>
                    <li>Filter by specific clinical conditions</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Care Plan Review',
            content: (
              <>
                <Title level={4}>Care Plan Review</Title>
                <Paragraph>
                  Review and approve care plans submitted by the nursing team.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Review proposed interventions and goals</li>
                    <li>Approve, modify, or request revisions</li>
                    <li>Add clinical notes and recommendations</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Clinical Notes',
            content: (
              <>
                <Title level={4}>Clinical Notes</Title>
                <Paragraph>
                  Document clinical observations and decisions.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Add structured notes with tags</li>
                    <li>View chronological history of all notes</li>
                    <li>Search and filter notes by category</li>
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
                  Conduct virtual consultations with patients.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Review patient data before sessions</li>
                    <li>Conduct secure video consultations</li>
                    <li>Document findings and update care plans</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Complete',
            content: (
              <>
                <Title level={4}>You're All Set!</Title>
                <Paragraph>
                  You've completed the tour of your MD dashboard.
                </Paragraph>
                <Paragraph>
                  If you have any questions, please refer to the physician documentation or contact your administrator.
                </Paragraph>
                <Paragraph>
                  <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '24px' }} /> Thank you for your clinical leadership!
                </Paragraph>
              </>
            )
          }
        ];
      
      case 'employer':
        return [
          {
            title: 'Welcome',
            content: (
              <>
                <Title level={4}>Welcome to the Employer Dashboard!</Title>
                <Paragraph>
                  This quick tour will help you get familiar with the key features of your analytics dashboard.
                </Paragraph>
                <Paragraph>
                  You can exit this tour at any time by clicking "Skip" and restart it later from your profile settings.
                </Paragraph>
              </>
            )
          },
          {
            title: 'Population Health',
            content: (
              <>
                <Title level={4}>Population Health Overview</Title>
                <Paragraph>
                  The Population Health card shows aggregate health metrics for your employee population.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>View average health scores and distribution</li>
                    <li>Track trends over time</li>
                    <li>Identify high-risk population segments</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Cost Analysis',
            content: (
              <>
                <Title level={4}>Cost Savings Analysis</Title>
                <Paragraph>
                  Track healthcare cost metrics and savings.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>View cost trends by category</li>
                    <li>Compare against industry benchmarks</li>
                    <li>Quantify ROI from preventive interventions</li>
                  </ul>
                </Paragraph>
              </>
            )
          },
          {
            title: 'Program Effectiveness',
            content: (
              <>
                <Title level={4}>Program Effectiveness</Title>
                <Paragraph>
                  Measure the impact of your wellness programs.
                </Paragraph>
                <Paragraph>
                  <ul>
                    <li>Track participation rates</li>
                    <li>Measure health outcomes by progra
(Content truncated due to size limit. Use line ranges to read in chunks)