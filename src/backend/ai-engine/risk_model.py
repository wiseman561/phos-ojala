import numpy as np
import pandas as pd
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.preprocessing import StandardScaler
import joblib
import os
import sys

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.metrics import calculate_risk_score
from utils.logging import log_prediction
from config.model_params import mental_params

class MentalHealthRiskModel:
    """
    Mental Health Risk Prediction Model
    
    This model predicts mental health risk based on self-reported symptoms,
    behavioral patterns, sleep quality, stress levels, and social factors.
    It outputs a risk score (0-100) and risk level (low, moderate, high, critical).
    
    Features used:
    - Depression screening scores (PHQ-9)
    - Anxiety screening scores (GAD-7)
    - Sleep quality metrics
    - Stress levels
    - Social support indicators
    - Activity patterns
    - Substance use
    - Previous mental health history
    - Age and gender
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the mental health risk model.
        
        Args:
            model_path (str, optional): Path to a pre-trained model file.
                If None, a new model will be initialized.
        """
        self.feature_names = [
            'phq9_score', 'gad7_score', 'sleep_quality_score', 'stress_level',
            'social_support_score', 'physical_activity_level', 'substance_use_score',
            'previous_mental_health_diagnosis', 'previous_treatment',
            'age', 'gender_code'
        ]
        
        self.categorical_features = [
            'previous_mental_health_diagnosis', 'previous_treatment',
            'gender_code'
        ]
        
        self.numerical_features = [f for f in self.feature_names if f not in self.categorical_features]
        
        self.scaler = StandardScaler()
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = GradientBoostingClassifier(
                n_estimators=mental_params['n_estimators'],
                max_depth=mental_params['max_depth'],
                learning_rate=mental_params['learning_rate'],
                min_samples_split=mental_params['min_samples_split'],
                random_state=42
            )
    
    def preprocess_data(self, data):
        """
        Preprocess the input data for model prediction.
        
        Args:
            data (pd.DataFrame): Input data containing patient features
            
        Returns:
            pd.DataFrame: Preprocessed data ready for model prediction
        """
        # Create a copy to avoid modifying the original data
        df = data.copy()
        
        # Check for missing features
        missing_features = [f for f in self.feature_names if f not in df.columns]
        if missing_features:
            raise ValueError(f"Missing required features: {missing_features}")
        
        # Handle missing values
        for feature in self.numerical_features:
            if df[feature].isnull().any():
                # Impute missing values with median
                df[feature].fillna(df[feature].median(), inplace=True)
        
        for feature in self.categorical_features:
            if df[feature].isnull().any():
                # Impute missing categorical values with mode
                df[feature].fillna(df[feature].mode()[0], inplace=True)
        
        # Calculate derived features
        df['wellbeing_index'] = (
            (10 - df['stress_level']) * 
            df['social_support_score'] / 5
        )
        
        # Scale numerical features
        df[self.numerical_features] = self.scaler.transform(df[self.numerical_features])
        
        # One-hot encode categorical features
        df = pd.get_dummies(df, columns=self.categorical_features, drop_first=True)
        
        return df
    
    def train(self, X_train, y_train):
        """
        Train the mental health risk model.
        
        Args:
            X_train (pd.DataFrame): Training features
            y_train (pd.Series): Training labels (risk levels)
            
        Returns:
            self: The trained model instance
        """
        # Fit the scaler on training data
        self.scaler.fit(X_train[self.numerical_features])
        
        # Preprocess training data
        X_processed = self.preprocess_data(X_train)
        
        # Train the model
        self.model.fit(X_processed, y_train)
        
        return self
    
    def predict(self, patient_data):
        """
        Predict mental health risk for a patient.
        
        Args:
            patient_data (pd.DataFrame): Patient data containing required features
            
        Returns:
            dict: Prediction results including risk score, risk level, and contributing factors
        """
        # Preprocess patient data
        processed_data = self.preprocess_data(patient_data)
        
        # Get risk level prediction (0-3 corresponding to low, moderate, high, critical)
        risk_level_idx = self.model.predict(processed_data)[0]
        
        # Get probability scores for each risk level
        risk_probabilities = self.model.predict_proba(processed_data)[0]
        
        # Calculate risk score (0-100)
        risk_score = calculate_risk_score(risk_probabilities)
        
        # Map risk level index to label
        risk_levels = ['low', 'moderate', 'high', 'critical']
        risk_level = risk_levels[risk_level_idx]
        
        # Identify contributing factors
        contributing_factors = self._identify_contributing_factors(patient_data)
        
        # Calculate specific condition risks
        condition_risks = self._calculate_condition_risks(patient_data)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(patient_data, risk_level)
        
        # Log the prediction
        log_prediction('mental', patient_data.iloc[0].name, risk_score, risk_level)
        
        return {
            'risk_score': risk_score,
            'risk_level': risk_level,
            'risk_probabilities': {level: prob for level, prob in zip(risk_levels, risk_probabilities)},
            'contributing_factors': contributing_factors,
            'condition_risks': condition_risks,
            'recommendations': recommendations
        }
    
    def _calculate_condition_risks(self, patient_data):
        """
        Calculate specific mental health condition risks based on screening scores.
        
        Args:
            patient_data (pd.DataFrame): Patient data
            
        Returns:
            dict: Condition-specific risk assessments
        """
        # Extract relevant metrics
        phq9_score = patient_data['phq9_score'].iloc[0]
        gad7_score = patient_data['gad7_score'].iloc[0]
        sleep_score = patient_data['sleep_quality_score'].iloc[0]
        stress_level = patient_data['stress_level'].iloc[0]
        
        # Depression risk assessment
        depression_status = 'normal'
        if phq9_score >= 20:
            depression_status = 'severe'
        elif phq9_score >= 15:
            depression_status = 'moderately severe'
        elif phq9_score >= 10:
            depression_status = 'moderate'
        elif phq9_score >= 5:
            depression_status = 'mild'
        
        depression_risk = min(95, phq9_score * 4)
        
        # Anxiety risk assessment
        anxiety_status = 'normal'
        if gad7_score >= 15:
            anxiety_status = 'severe'
        elif gad7_score >= 10:
            anxiety_status = 'moderate'
        elif gad7_score >= 5:
            anxiety_status = 'mild'
        
        anxiety_risk = min(95, gad7_score * 5)
        
        # Sleep disorder risk assessment
        sleep_disorder_risk = 0
        sleep_status = 'normal'
        
        # Assuming sleep_quality_score is 0-10 where 10 is excellent sleep
        if sleep_score <= 3:
            sleep_status = 'poor'
            sleep_disorder_risk = 80
        elif sleep_score <= 5:
            sleep_status = 'fair'
            sleep_disorder_risk = 50
        elif sleep_score <= 7:
            sleep_status = 'good'
            sleep_disorder_risk = 20
        
        # Stress-related disorder risk assessment
        stress_disorder_risk = 0
        
        if stress_level >= 8:
            stress_disorder_risk = 80
        elif stress_level >= 6:
            stress_disorder_risk = 60
        elif stress_level >= 4:
            stress_disorder_risk = 40
        else:
            stress_disorder_risk = 20
        
        return {
            'depression': {
                'status': depression_status,
                'risk_percentage': round(depression_risk, 1),
                'phq9_score': phq9_score,
                'recommendation': self._get_depression_recommendation(depression_status, phq9_score)
            },
            'anxiety': {
                'status': anxiety_status,
                'risk_percentage': round(anxiety_risk, 1),
                'gad7_score': gad7_score,
                'recommendation': self._get_anxiety_recommendation(anxiety_status, gad7_score)
            },
            'sleep_disorder': {
                'status': sleep_status,
                'risk_percentage': round(sleep_disorder_risk, 1),
                'sleep_score': sleep_score,
                'recommendation': self._get_sleep_recommendation(sleep_status, sleep_score)
            },
            'stress_related_disorder': {
                'risk_percentage': round(stress_disorder_risk, 1),
                'stress_level': stress_level,
                'recommendation': self._get_stress_recommendation(stress_level)
            }
        }
    
    def _get_depression_recommendation(self, status, score):
        """
        Get personalized depression recommendations based on status and score.
        
        Args:
            status (str): Current depression status
            score (int): PHQ-9 score
            
        Returns:
            str: Personalized recommendation
        """
        if status == 'severe':
            return "Please consult with a mental health professional as soon as possible for evaluation and treatment options."
        elif status == 'moderately severe':
            return "Consider scheduling an appointment with a mental health professional to discuss your symptoms and treatment options."
        elif status == 'moderate':
            return "Consider talking to your healthcare provider about your mood and how it's affecting your daily life."
        elif status == 'mild':
            return "Monitor your mood and consider lifestyle changes like increased physical activity and stress reduction techniques."
        else:  # normal
            return "Continue maintaining good mental health practices like regular exercise, adequate sleep, and social connection."
    
    def _get_anxiety_recommendation(self, status, score):
        """
        Get personalized anxiety recommendations based on status and score.
        
        Args:
            status (str): Current anxiety status
            score (int): GAD-7 score
            
        Returns:
            str: Personalized recommendation
        """
        if status == 'severe':
            return "Please consult with a mental health professional as soon as possible to discuss treatment options for anxiety."
        elif status == 'moderate':
            return "Consider scheduling an appointment with a healthcare provider to discuss your anxiety symptoms."
        elif status == 'mild':
            return "Try incorporating stress reduction techniques like deep breathing, meditation, or mindfulness into your daily routine."
        else:  # normal
            return "Continue practicing good mental health habits and stress management techniques."
    
    def _get_sleep_recommendation(self, status, score):
        """
        Get personalized sleep recommendations based on status and score.
        
        Args:
            status (str): Current sleep status
            score (int): Sleep quality score
            
        Returns:
            str: Personalized recommendation
        """
        if status == 'poor':
            return "Consider consulting with a healthcare provider about your sleep difficulties. In the meantime, improve sleep hygiene by maintaining a regular sleep schedule and creating a restful environment."
        elif status == 'fair':
            return "Work on improving sleep hygiene by limiting screen time before bed, avoiding caffeine in the afternoon, and establishing a relaxing bedtime routine."
        elif status == 'good':
            return "Continue maintaining good sleep habits and consider tracking your sleep patterns to identify areas for improvement."
        else:  # excellent
            return "Maintain your excellent sleep habits to support overall mental and physical health."
    
    def _get_stress_recommendation(self, stress_level):
        """
        Get personalized stress recommendations based on stress level.
        
        Args:
            stress_level (int): Stress level score
            
        Returns:
            str: Personalized recommendation
        """
        if stress_level >= 8:
            return "Your stress levels are very high. Consider talking to a healthcare provider and implementing stress reduction techniques like meditation, deep breathing, or physical activity."
        elif stress_level >= 6:
            return "Your stress levels are elevated. Try incorporating stress management techniques like regular exercise, mindfulness, or talking with a trusted friend or family member."
        elif stress_level >= 4:
            return "Your stress levels are moderate. Regular self-care activities like exercise, adequate sleep, and relaxation techniques can help manage stress."
        else:
            return "Your stress levels appear well-managed. Continue practicing good stress management and self-care habits."
    
    def _generate_recommendations(self, patient_data, risk_level):
        """
        Generate personalized mental health recommendations based on patient data.
        
        Args:
            patient_data (pd.DataFrame): Patient data
            risk_level (str): Overall mental health risk level
            
        Returns:
            list: Personalized recommendations
        """
        recommendations = []
        
        # Extract relevant metrics
        phq9_score = patient_data['phq9_score'].iloc[0]
        gad7_score = patient_data['gad7_score'].iloc[0]
        sleep_score = patient_data['sleep_quality_score'].iloc[0]
        stress_level = patient_data['stress_level'].iloc[0]
        social_support = patient_data['social_support_score'].iloc[0]
        physical_activity = patient_data['physical_activity_level'].iloc[0]
        
        # Add clinical recommendations based on risk level
        if risk_level in ['high', 'critical']:
            recommendations.append({
                'category': 'clinical',
                'description': 'Schedule an appointment with a mental health professional',
                'priority': 'high',
                'timeframe': 'within 7 days'
            })
        elif risk_level == 'moderate':
            recommendations.append({
                'category': 'clinical',
                'description': 'Consider talking to your healthcare provider about your mental health',
                'priority': 'medium',
                'timeframe': 'within 30 days'
            })
        
        # Add depression-specific recommendations
        if phq9_score >= 10:
            recommendations.append({
                'category': 'depression',
                'description': 'Complete 
(Content truncated due to size limit. Use line ranges to read in chunks)