import numpy as np
import pandas as pd
import os
import sys
import logging

# Add parent directory to path to import shared modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

def calculate_risk_score(risk_probabilities):
    """
    Calculate a normalized risk score (0-100) from risk probability distribution.
    
    Args:
        risk_probabilities (np.array): Array of probabilities for each risk level
            [low, moderate, high, critical]
            
    Returns:
        float: Risk score between 0-100
    """
    # Define weights for each risk level (0-3)
    # Low: 0-25, Moderate: 26-50, High: 51-75, Critical: 76-100
    weights = np.array([12.5, 37.5, 62.5, 87.5])
    
    # Calculate weighted average
    score = np.sum(risk_probabilities * weights)
    
    # Ensure score is within 0-100 range
    score = max(0, min(100, score))
    
    return score

def calculate_risk_level(score):
    """
    Map a numerical score to a risk level category.
    
    Args:
        score (float): Health score (0-100)
        
    Returns:
        str: Risk level category
    """
    if score >= 80:
        return 'critical'
    elif score >= 60:
        return 'high'
    elif score >= 40:
        return 'moderate'
    else:
        return 'low'

def calculate_trend(current_score, previous_score):
    """
    Calculate trend as percentage change between current and previous scores.
    
    Args:
        current_score (float): Current health score
        previous_score (float): Previous health score
        
    Returns:
        float: Percentage change
    """
    if previous_score == 0:
        return 0
    
    return ((current_score - previous_score) / previous_score) * 100

def normalize_score(value, min_val, max_val, reverse=False):
    """
    Normalize a value to a 0-100 scale.
    
    Args:
        value (float): Value to normalize
        min_val (float): Minimum possible value
        max_val (float): Maximum possible value
        reverse (bool): If True, higher values result in lower scores
        
    Returns:
        float: Normalized score (0-100)
    """
    # Ensure value is within range
    value = max(min_val, min(max_val, value))
    
    # Calculate normalized score
    normalized = (value - min_val) / (max_val - min_val) * 100
    
    # Reverse if needed (e.g., for metrics where lower is better)
    if reverse:
        normalized = 100 - normalized
    
    return normalized

def calculate_domain_score(metrics, weights=None):
    """
    Calculate a domain score from multiple metrics.
    
    Args:
        metrics (dict): Dictionary of metric names and values
        weights (dict, optional): Dictionary of metric names and weights
            If None, equal weights are used
            
    Returns:
        float: Domain score (0-100)
    """
    if not metrics:
        return 0
    
    # Use equal weights if not provided
    if weights is None:
        weights = {metric: 1/len(metrics) for metric in metrics}
    
    # Ensure weights sum to 1
    weight_sum = sum(weights.values())
    if weight_sum != 1:
        weights = {metric: weight/weight_sum for metric, weight in weights.items()}
    
    # Calculate weighted average
    score = sum(metrics[metric] * weights.get(metric, 0) for metric in metrics)
    
    # Ensure score is within 0-100 range
    score = max(0, min(100, score))
    
    return score

def calculate_composite_score(domain_scores, domain_weights=None):
    """
    Calculate a composite health score from multiple domain scores.
    
    Args:
        domain_scores (dict): Dictionary of domain names and scores
        domain_weights (dict, optional): Dictionary of domain names and weights
            If None, equal weights are used
            
    Returns:
        float: Composite health score (0-100)
    """
    return calculate_domain_score(domain_scores, domain_weights)

def get_reference_range(metric_name, age=None, gender=None):
    """
    Get reference range for a health metric based on age and gender.
    
    Args:
        metric_name (str): Name of the health metric
        age (int, optional): Patient age
        gender (str, optional): Patient gender ('male' or 'female')
        
    Returns:
        dict: Reference range with min and max values
    """
    # Default reference ranges
    reference_ranges = {
        'systolic_bp': {'min': 90, 'max': 130},
        'diastolic_bp': {'min': 60, 'max': 85},
        'heart_rate': {'min': 60, 'max': 100},
        'respiratory_rate': {'min': 12, 'max': 20},
        'oxygen_saturation': {'min': 95, 'max': 100},
        'temperature': {'min': 36.1, 'max': 37.2},
        'bmi': {'min': 18.5, 'max': 24.9},
        'fasting_glucose': {'min': 70, 'max': 99},
        'total_cholesterol': {'min': 125, 'max': 200},
        'ldl_cholesterol': {'min': 0, 'max': 100},
        'hdl_cholesterol': {'min': 40, 'max': 60},
        'triglycerides': {'min': 0, 'max': 150},
        'hba1c': {'min': 4.0, 'max': 5.6}
    }
    
    # Age and gender specific adjustments
    if metric_name in reference_ranges:
        range_data = reference_ranges[metric_name].copy()
        
        # Adjust for age if provided
        if age is not None:
            if metric_name == 'heart_rate' and age > 60:
                range_data['min'] = 55
            elif metric_name == 'systolic_bp' and age > 60:
                range_data['max'] = 140
        
        # Adjust for gender if provided
        if gender is not None:
            if metric_name == 'hdl_cholesterol':
                if gender.lower() == 'male':
                    range_data['min'] = 40
                elif gender.lower() == 'female':
                    range_data['min'] = 50
        
        return range_data
    
    # Return default range if metric not found
    return {'min': 0, 'max': 100}

def is_anomaly(value, metric_name, age=None, gender=None, threshold_multiplier=1.5):
    """
    Determine if a value is anomalous based on reference ranges.
    
    Args:
        value (float): Metric value to check
        metric_name (str): Name of the health metric
        age (int, optional): Patient age
        gender (str, optional): Patient gender ('male' or 'female')
        threshold_multiplier (float): Multiplier for range to determine anomaly
        
    Returns:
        bool: True if value is anomalous, False otherwise
    """
    range_data = get_reference_range(metric_name, age, gender)
    
    # Calculate extended range for anomaly detection
    range_width = range_data['max'] - range_data['min']
    extended_min = range_data['min'] - (range_width * (threshold_multiplier - 1))
    extended_max = range_data['max'] + (range_width * (threshold_multiplier - 1))
    
    # Check if value is outside extended range
    return value < extended_min or value > extended_max

def get_anomaly_severity(value, metric_name, age=None, gender=None):
    """
    Determine severity of an anomaly.
    
    Args:
        value (float): Metric value to check
        metric_name (str): Name of the health metric
        age (int, optional): Patient age
        gender (str, optional): Patient gender ('male' or 'female')
        
    Returns:
        str: Severity level ('low', 'medium', 'high')
    """
    range_data = get_reference_range(metric_name, age, gender)
    
    # Calculate deviation from normal range
    if value < range_data['min']:
        deviation = (range_data['min'] - value) / (range_data['min'] - 0)
    elif value > range_data['max']:
        max_possible = range_data['max'] * 2
        deviation = (value - range_data['max']) / (max_possible - range_data['max'])
    else:
        return 'normal'
    
    # Determine severity based on deviation
    if deviation < 0.3:
        return 'low'
    elif deviation < 0.6:
        return 'medium'
    else:
        return 'high'

def get_metric_trend(current_value, previous_values, window_size=5):
    """
    Calculate trend direction and magnitude for a health metric.
    
    Args:
        current_value (float): Current metric value
        previous_values (list): List of previous metric values
        window_size (int): Number of values to consider for trend
        
    Returns:
        dict: Trend information including direction and magnitude
    """
    if not previous_values:
        return {'direction': 'stable', 'magnitude': 0}
    
    # Use most recent values up to window_size
    values = previous_values[-window_size:] + [current_value]
    
    # Calculate simple linear regression
    n = len(values)
    x = np.arange(n)
    y = np.array(values)
    
    # Calculate slope
    x_mean = np.mean(x)
    y_mean = np.mean(y)
    slope = np.sum((x - x_mean) * (y - y_mean)) / np.sum((x - x_mean) ** 2)
    
    # Normalize slope as percentage of mean value
    if y_mean != 0:
        magnitude = (slope / y_mean) * 100
    else:
        magnitude = 0
    
    # Determine direction
    if abs(magnitude) < 1:
        direction = 'stable'
    elif magnitude > 0:
        direction = 'increasing'
    else:
        direction = 'decreasing'
    
    return {'direction': direction, 'magnitude': magnitude}

# Example usage
if __name__ == "__main__":
    # Example risk probabilities [low, moderate, high, critical]
    risk_probs = np.array([0.2, 0.5, 0.2, 0.1])
    
    # Calculate risk score
    score = calculate_risk_score(risk_probs)
    print(f"Risk Score: {score}")
    
    # Calculate risk level
    level = calculate_risk_level(score)
    print(f"Risk Level: {level}")
    
    # Example domain scores
    domain_scores = {
        'cardiovascular': 75,
        'metabolic': 65,
        'respiratory': 85,
        'mental': 70
    }
    
    # Example domain weights
    domain_weights = {
        'cardiovascular': 0.3,
        'metabolic': 0.25,
        'respiratory': 0.2,
        'mental': 0.25
    }
    
    # Calculate composite score
    composite = calculate_composite_score(domain_scores, domain_weights)
    print(f"Composite Health Score: {composite}")
    
    # Check if a value is anomalous
    systolic_bp = 155
    is_bp_anomaly = is_anomaly(systolic_bp, 'systolic_bp', age=65, gender='male')
    severity = get_anomaly_severity(systolic_bp, 'systolic_bp', age=65, gender='male')
    print(f"Systolic BP {systolic_bp} is anomalous: {is_bp_anomaly}, Severity: {severity}")
    
    # Calculate metric trend
    current_glucose = 110
    previous_glucose = [95, 98, 102, 105, 108]
    trend = get_metric_trend(current_glucose, previous_glucose)
    print(f"Glucose Trend: {trend['direction']} ({trend['magnitude']:.2f}%)")
