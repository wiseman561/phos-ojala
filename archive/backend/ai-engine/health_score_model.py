import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import joblib
import os
import sys

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from utils.metrics import calculate_risk_score
from utils.logging import log_prediction
from config.model_params import composite_params

class CompositeHealthScoreModel:
    """
    Composite Health Score Model
    
    This model combines outputs from individual health domain models
    (cardiovascular, metabolic, respiratory, mental) to produce a
    comprehensive health score and personalized recommendations.
    
    The composite score considers:
    - Individual domain scores and their trends
    - Interactions between health domains
    - Patient demographics and lifestyle factors
    - Medical history and conditions
    - Medication adherence
    - Social determinants of health
    """
    
    def __init__(self, model_path=None):
        """
        Initialize the composite health score model.
        
        Args:
            model_path (str, optional): Path to a pre-trained model file.
                If None, a new model will be initialized.
        """
        self.feature_names = [
            # Domain scores
            'cardiovascular_score', 'metabolic_score', 'respiratory_score', 'mental_score',
            # Domain trends (change over time)
            'cardiovascular_trend', 'metabolic_trend', 'respiratory_trend', 'mental_trend',
            # Demographics
            'age', 'gender_code',
            # Lifestyle
            'physical_activity_level', 'sleep_quality', 'diet_quality', 'smoking_status',
            # Medical
            'chronic_condition_count', 'medication_adherence', 'preventive_care_compliance',
            # Social determinants
            'social_support_score', 'stress_level'
        ]
        
        self.categorical_features = [
            'gender_code', 'physical_activity_level', 'sleep_quality', 
            'diet_quality', 'smoking_status'
        ]
        
        self.numerical_features = [f for f in self.feature_names if f not in self.categorical_features]
        
        self.scaler = StandardScaler()
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            self.model = RandomForestRegressor(
                n_estimators=composite_params['n_estimators'],
                max_depth=composite_params['max_depth'],
                min_samples_split=composite_params['min_samples_split'],
                min_samples_leaf=composite_params['min_samples_leaf'],
                random_state=42
            )
        
        # Domain weights for weighted average calculation
        self.domain_weights = {
            'cardiovascular': 0.30,
            'metabolic': 0.25,
            'respiratory': 0.20,
            'mental': 0.25
        }
    
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
        
        # Scale numerical features
        df[self.numerical_features] = self.scaler.transform(df[self.numerical_features])
        
        # One-hot encode categorical features
        df = pd.get_dummies(df, columns=self.categorical_features, drop_first=True)
        
        return df
    
    def train(self, X_train, y_train):
        """
        Train the composite health score model.
        
        Args:
            X_train (pd.DataFrame): Training features
            y_train (pd.Series): Training labels (health scores)
            
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
    
    def predict(self, patient_data, domain_scores=None):
        """
        Predict composite health score for a patient.
        
        Args:
            patient_data (pd.DataFrame): Patient data containing required features
            domain_scores (dict, optional): Pre-calculated domain scores and risk levels
                If None, will use domain scores from patient_data
                
        Returns:
            dict: Prediction results including health score, risk level, and recommendations
        """
        # Preprocess patient data
        processed_data = self.preprocess_data(patient_data)
        
        # Get domain scores either from input or patient data
        if domain_scores is None:
            domain_scores = {
                'cardiovascular': {
                    'score': patient_data['cardiovascular_score'].iloc[0],
                    'risk_level': self._score_to_risk_level(patient_data['cardiovascular_score'].iloc[0])
                },
                'metabolic': {
                    'score': patient_data['metabolic_score'].iloc[0],
                    'risk_level': self._score_to_risk_level(patient_data['metabolic_score'].iloc[0])
                },
                'respiratory': {
                    'score': patient_data['respiratory_score'].iloc[0],
                    'risk_level': self._score_to_risk_level(patient_data['respiratory_score'].iloc[0])
                },
                'mental': {
                    'score': patient_data['mental_score'].iloc[0],
                    'risk_level': self._score_to_risk_level(patient_data['mental_score'].iloc[0])
                }
            }
        
        # Predict health score using the model
        model_score = self.model.predict(processed_data)[0]
        
        # Calculate weighted average of domain scores as a baseline
        weighted_score = sum(domain_scores[domain]['score'] * self.domain_weights[domain] 
                            for domain in domain_scores)
        
        # Blend model prediction with weighted average for robustness
        # The model captures complex interactions, while weighted average provides stability
        final_score = 0.7 * model_score + 0.3 * weighted_score
        
        # Ensure score is within 0-100 range
        final_score = max(0, min(100, final_score))
        
        # Determine risk level
        risk_level = self._score_to_risk_level(final_score)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(patient_data, domain_scores, final_score)
        
        # Identify health anomalies
        anomalies = self._identify_anomalies(patient_data, domain_scores)
        
        # Generate explanation
        explanation = self._generate_explanation(patient_data, domain_scores, final_score)
        
        # Log the prediction
        log_prediction('composite', patient_data.iloc[0].name, final_score, risk_level)
        
        return {
            'health_score': round(final_score, 1),
            'risk_level': risk_level,
            'domain_scores': domain_scores,
            'recommendations': recommendations,
            'anomalies': anomalies,
            'explanation': explanation,
            'trends': self._calculate_trends(patient_data)
        }
    
    def _score_to_risk_level(self, score):
        """
        Convert a numerical score to a risk level category.
        
        Args:
            score (float): Health score (0-100)
            
        Returns:
            str: Risk level category
        """
        if score >= 80:
            return 'low'
        elif score >= 60:
            return 'moderate'
        elif score >= 40:
            return 'high'
        else:
            return 'critical'
    
    def _calculate_trends(self, patient_data):
        """
        Calculate score trends from the patient data.
        
        Args:
            patient_data (pd.DataFrame): Patient data
            
        Returns:
            dict: Score trends
        """
        trends = {}
        
        # Overall trend
        overall_trend = 0
        for domain in self.domain_weights:
            trend_col = f"{domain}_trend"
            if trend_col in patient_data.columns:
                domain_trend = patient_data[trend_col].iloc[0]
                overall_trend += domain_trend * self.domain_weights[domain]
        
        trends['overall'] = round(overall_trend, 1)
        
        # Domain-specific trends
        for domain in self.domain_weights:
            trend_col = f"{domain}_trend"
            if trend_col in patient_data.columns:
                trends[domain] = round(patient_data[trend_col].iloc[0], 1)
            else:
                trends[domain] = 0
        
        return trends
    
    def _generate_recommendations(self, patient_data, domain_scores, health_score):
        """
        Generate personalized health recommendations based on scores and patient data.
        
        Args:
            patient_data (pd.DataFrame): Patient data
            domain_scores (dict): Domain-specific health scores
            health_score (float): Overall health score
            
        Returns:
            list: Personalized recommendations
        """
        recommendations = []
        
        # Prioritize recommendations based on domain risk levels
        priority_domains = sorted(
            domain_scores.keys(),
            key=lambda domain: ['low', 'moderate', 'high', 'critical'].index(domain_scores[domain]['risk_level']),
            reverse=True
        )
        
        # Add domain-specific recommendations
        for domain in priority_domains:
            if domain_scores[domain]['risk_level'] in ['high', 'critical']:
                if domain == 'cardiovascular':
                    recommendations.append({
                        'category': 'cardiovascular',
                        'description': 'Schedule a cardiovascular health check with your provider',
                        'priority': 'high',
                        'timeframe': 'within 30 days'
                    })
                    
                    # Check blood pressure
                    if 'systolic_bp' in patient_data.columns and 'diastolic_bp' in patient_data.columns:
                        systolic = patient_data['systolic_bp'].iloc[0]
                        diastolic = patient_data['diastolic_bp'].iloc[0]
                        if systolic > 130 or diastolic > 80:
                            recommendations.append({
                                'category': 'cardiovascular',
                                'description': 'Monitor blood pressure daily and follow up with provider',
                                'priority': 'high',
                                'timeframe': 'ongoing'
                            })
                
                elif domain == 'metabolic':
                    recommendations.append({
                        'category': 'metabolic',
                        'description': 'Consider consultation with a nutritionist for metabolic health',
                        'priority': 'high',
                        'timeframe': 'within 60 days'
                    })
                    
                    # Check glucose levels
                    if 'fasting_glucose' in patient_data.columns:
                        glucose = patient_data['fasting_glucose'].iloc[0]
                        if glucose > 100:
                            recommendations.append({
                                'category': 'metabolic',
                                'description': 'Monitor blood glucose regularly and follow low-glycemic diet',
                                'priority': 'high',
                                'timeframe': 'ongoing'
                            })
                
                elif domain == 'respiratory':
                    recommendations.append({
                        'category': 'respiratory',
                        'description': 'Schedule pulmonary function testing with your provider',
                        'priority': 'high',
                        'timeframe': 'within 60 days'
                    })
                    
                    # Check smoking status
                    if 'smoking_status' in patient_data.columns:
                        smoking = patient_data['smoking_status'].iloc[0]
                        if smoking > 0:  # Assuming smoking_status is encoded numerically
                            recommendations.append({
                                'category': 'respiratory',
                                'description': 'Consider smoking cessation program or nicotine replacement therapy',
                                'priority': 'high',
                                'timeframe': 'immediate'
                            })
                
                elif domain == 'mental':
                    recommendations.append({
                        'category': 'mental',
                        'description': 'Consider mental health screening with a healthcare professional',
                        'priority': 'high',
                        'timeframe': 'within 30 days'
                    })
                    
                    # Check stress level
                    if 'stress_level' in patient_data.columns:
                        stress = patient_data['stress_level'].iloc[0]
                        if stress > 7:  # Assuming stress_level is 0-10
                            recommendations.append({
                                'category': 'mental',
                                'description': 'Practice daily stress reduction techniques like meditation or deep breathing',
                                'priority': 'high',
                                'timeframe': 'ongoing'
                            })
        
        # Add lifestyle recommendations
        if 'physical_activity_level' in patient_data.columns:
            activity = patient_data['physical_activity_level'].iloc[0]
            if activity < 2:  # Assuming lower values mean less activity
                recommendations.append({
                    'category': 'lifestyle',
                    'description': 'Increase physical activity to at least 150 minutes of moderate exercise per week',
                    'priority': 'medium',
                    'timeframe': 'ongoing'
                })
        
        if 'sleep_quality' in patient_data.columns:
            sleep = patient_data['sleep_quality'].iloc[0]
            if sleep < 2:  # Assuming lower values mean poor sleep
                recommendations.append({
                    'category': 'lifestyle',
                    'description': 'Improve sleep hygiene and aim for 7-8 hours of quality sleep per night',
                    'priority': 'medium',
                    
(Content truncated due to size limit. Use line ranges to read in chunks)