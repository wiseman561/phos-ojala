import React, { useState } from 'react';
import { Card, CardHeader, CardContent, Typography, Box, Tooltip, IconButton, TextField, Button, Chip, Divider } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SendIcon from '@mui/icons-material/Send';

/**
 * SecureChatCard component for the Nurse Assistant AI feature
 * 
 * @param {Object} props Component props
 * @param {Object} props.patient Patient data
 * @param {Function} props.onSendMessage Function to call when a message is sent
 */
const NurseAssistantCard = ({ patient, onSendMessage }) => {
  const [message, setMessage] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Example prompts that nurses can use
  const examplePrompts = [
    "Summarize this patient's top risks today.",
    "Suggest next steps for a diabetic patient with low glucose and missed infusion.",
    "What are the red flags in this patient's vitals?",
    "Generate patient education materials for hypertension.",
    "What medication interactions should I be aware of for this patient?"
  ];

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    
    // In a real implementation, this would call the AI assistant API
    // For this implementation, we'll simulate a response
    
    setTimeout(() => {
      // Simulate AI response
      const mockResponse = generateMockResponse(message, patient);
      
      setResponses(prev => [...prev, {
        query: message,
        response: mockResponse
      }]);
      
      setMessage('');
      setIsLoading(false);
    }, 1500);
    
    // Call the onSendMessage prop if provided
    if (onSendMessage) {
      onSendMessage(message);
    }
  };

  const handleExampleClick = (example) => {
    setMessage(example);
  };

  return (
    <Card elevation={2} sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardHeader
        title="AI Nurse Assistant"
        action={
          <Tooltip 
            title={
              <React.Fragment>
                <Typography variant="body2">The AI Nurse Assistant helps you make informed decisions by analyzing patient data and providing evidence-based recommendations.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>You can ask about patient risks, treatment suggestions, or request educational materials to share with patients.</Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>All recommendations should be verified with clinical judgment.</Typography>
              </React.Fragment>
            }
            arrow
            open={showTooltip}
            onClose={() => setShowTooltip(false)}
            disableFocusListener
            disableHoverListener
            disableTouchListener
          >
            <IconButton 
              aria-label="nurse assistant info"
              onClick={() => setShowTooltip(!showTooltip)}
            >
              <HelpOutlineIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ flexGrow: 1, mb: 2, overflowY: 'auto', maxHeight: 300 }}>
          {responses.length === 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 2 }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Ask the AI Nurse Assistant for help with patient care decisions, risk assessment, or educational materials.
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                Try one of the example prompts below to get started.
              </Typography>
            </Box>
          ) : (
            responses.map((item, index) => (
              <Box key={index} sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  You asked:
                </Typography>
                <Typography variant="body2" sx={{ mb: 1, backgroundColor: '#f5f5f5', p: 1, borderRadius: 1 }}>
                  {item.query}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                  AI Assistant:
                </Typography>
                <Typography variant="body2" sx={{ backgroundColor: '#e3f2fd', p: 1, borderRadius: 1 }}>
                  {item.response.content}
                </Typography>
                {item.response.sources && item.response.sources.length > 0 && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                      Sources:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                      {item.response.sources.map((source, idx) => (
                        <Chip 
                          key={idx} 
                          label={`${source.type}: ${source.description}`} 
                          size="small" 
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                <Divider sx={{ mt: 2 }} />
              </Box>
            ))
          )}
        </Box>
        
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 'bold' }}>
            Example prompts:
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {examplePrompts.map((prompt, index) => (
              <Chip 
                key={index} 
                label={prompt} 
                onClick={() => handleExampleClick(prompt)}
                clickable
                color="primary"
                variant="outlined"
                size="small"
              />
            ))}
          </Box>
          
          <Box sx={{ display: 'flex' }}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Ask the AI Nurse Assistant..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
              size="small"
            />
            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={!message.trim() || isLoading}
              sx={{ ml: 1 }}
            >
              {isLoading ? 'Thinking...' : 'Ask'}
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

/**
 * Generate a mock response for the AI assistant
 * @param {string} query User query
 * @param {Object} patient Patient data
 * @returns {Object} Mock response
 */
function generateMockResponse(query, patient) {
  // Normalize query for pattern matching
  const normalizedQuery = query.toLowerCase();
  
  // Define response patterns
  if (normalizedQuery.includes('summarize') && normalizedQuery.includes('risk')) {
    return {
      content: `Based on recent data, ${patient?.name || 'the patient'} has three primary risk factors:\n\n1. Elevated blood pressure (145/92, up 15% from baseline)\n2. Medication adherence issues (missed 2 doses in past week)\n3. HbA1c trending upward (7.8%, increased from 7.2%)\n\nThe health score has decreased by 5 points in the last 30 days, primarily due to these factors.`,
      sources: [
        { type: 'vitals', description: 'BP reading: 145/92 (04/20/2025)' },
        { type: 'medication', description: 'Adherence report (04/18/2025)' },
        { type: 'lab', description: 'HbA1c: 7.8% (04/15/2025)' },
        { type: 'health_score', description: 'Trend analysis (last 30 days)' }
      ]
    };
  } else if (normalizedQuery.includes('diabetic') && (normalizedQuery.includes('glucose') || normalizedQuery.includes('infusion'))) {
    return {
      content: `For a diabetic patient with low glucose and missed infusion, I recommend:\n\n1. Immediate glucose check to confirm current levels\n2. Contact patient to assess symptoms and provide guidance\n3. Schedule follow-up appointment within 24-48 hours\n4. Review medication regimen for potential adjustments\n5. Consider temporary adjustment to insulin dosing schedule\n\nIf glucose is below 70 mg/dL with symptoms, consider urgent intervention.`,
      sources: [
        { type: 'vitals', description: 'Glucose readings (past 7 days)' },
        { type: 'medication', description: 'Insulin administration record' },
        { type: 'note', description: 'Previous provider instructions' }
      ]
    };
  } else if (normalizedQuery.includes('red flag') && normalizedQuery.includes('vital')) {
    return {
      content: `Red flags in the patient's vitals include:\n\n1. Systolic blood pressure consistently above 140 mmHg for the past 3 readings\n2. Resting heart rate elevated (95-105 bpm) during last 5 measurements\n3. Oxygen saturation dropped to 93% during last night's sleep\n4. Weight increase of 4 lbs over 3 days, suggesting possible fluid retention\n\nThese patterns warrant closer monitoring and potential intervention.`,
      sources: [
        { type: 'vitals', description: 'BP trend (past 2 weeks)' },
        { type: 'vitals', description: 'Heart rate monitoring data' },
        { type: 'vitals', description: 'O2 saturation during sleep' },
        { type: 'vitals', description: 'Weight measurements (past week)' }
      ]
    };
  } else if (normalizedQuery.includes('education') && normalizedQuery.includes('hypertension')) {
    return {
      content: `# Understanding and Managing Hypertension\n\nHypertension (high blood pressure) is when the force of blood against your artery walls is consistently too high.\n\n## Key Points:\n\n- Normal blood pressure is below 120/80 mmHg\n- Hypertension is 130/80 mmHg or higher\n- Often has no symptoms ("silent killer")\n- Can lead to heart disease, stroke, and kidney problems if untreated\n\n## Managing Your Blood Pressure:\n\n1. Take medications as prescribed\n2. Reduce sodium (salt) in your diet\n3. Exercise regularly (aim for 30 minutes most days)\n4. Maintain a healthy weight\n5. Limit alcohol consumption\n6. Quit smoking\n7. Manage stress\n\n## When to Contact Your Healthcare Provider:\n\n- Readings consistently above 140/90 mmHg\n- Symptoms like severe headache, vision problems, chest pain\n- Side effects from medications\n\nRegular monitoring and following your treatment plan are essential for managing hypertension successfully.`,
      sources: [
        { type: 'health_score', description: 'Cardiovascular risk factors' }
      ]
    };
  } else if (normalizedQuery.includes('medication') && normalizedQuery.includes('interaction')) {
    return {
      content: `Based on the patient's current medication list, these potential interactions should be monitored:\n\n1. Lisinopril + Spironolactone: Increased risk of hyperkalemia (high potassium)\n2. Metformin + Hydrochlorothiazide: May affect glucose control\n3. Simvastatin + Amlodipine: Increased risk of myopathy at higher simvastatin doses\n\nRecommendations:\n- Monitor potassium levels regularly\n- Adjust metformin dosing if needed based on glucose readings\n- Keep simvastatin dose at or below 20mg daily with current regimen`,
      sources: [
        { type: 'medication', description: 'Current medication list' },
        { type: 'lab', description: 'Recent potassium level: 4.7 mEq/L' },
        { type: 'lab', description: 'Recent glucose readings' }
      ]
    };
  } else {
    // Default response for other queries
    return {
      content: `I've analyzed the patient data related to your question. Based on the available information, I recommend focusing on the following areas:\n\n1. Monitoring the patient's blood pressure, which has shown some elevation in recent readings\n2. Reviewing medication adherence, particularly for cardiovascular medications\n3. Following up on the most recent lab results, which indicate some values outside target range\n\nWould you like more specific information about any of these areas?`,
      sources: [
        { type: 'vitals', description: 'Recent measurements (past 2 weeks)' },
        { type: 'medication', description: 'Adherence report' },
        { type: 'lab', description: 'Results from 04/15/2025' }
      ]
    };
  }
}

export default NurseAssistantCard;
