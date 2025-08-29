import os
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS

# Import AI engine modules
try:
    from health_score_model import calculate_health_score
    from risk_model import predict_risk
    from metrics import calculate_metrics
except ImportError:
    logging.warning("Could not import one or more AI modules. Some endpoints may not function correctly.")

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load configuration from Vault-provided JSON
config = {}
try:
    config_path = os.path.join('/vault/secrets', 'appsettings.json')
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
        logger.info("Configuration loaded from Vault")
    else:
        logger.warning("Vault configuration not found, using environment variables or defaults")
except Exception as e:
    logger.error(f"Error loading configuration: {str(e)}")

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "ai-engine"}), 200

# AI prediction endpoints
@app.route('/api/health-score', methods=['POST'])
def health_score():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        result = calculate_health_score(data)
        return jsonify({"health_score": result}), 200
    except Exception as e:
        logger.error(f"Error calculating health score: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/risk-prediction', methods=['POST'])
def risk_prediction():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        result = predict_risk(data)
        return jsonify({"risk_prediction": result}), 200
    except Exception as e:
        logger.error(f"Error predicting risk: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/metrics', methods=['POST'])
def metrics():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        result = calculate_metrics(data)
        return jsonify({"metrics": result}), 200
    except Exception as e:
        logger.error(f"Error calculating metrics: {str(e)}")
        return jsonify({"error": str(e)}), 500

# Configuration endpoint (for debugging, disable in production)
@app.route('/api/config', methods=['GET'])
def get_config():
    if os.environ.get('ASPNETCORE_ENVIRONMENT') == 'Development':
        # Redact sensitive information
        safe_config = {k: "***REDACTED***" if "key" in k.lower() or "connection" in k.lower() else v 
                      for k, v in config.items()}
        return jsonify(safe_config), 200
    return jsonify({"error": "Not available in production"}), 403

if __name__ == '__main__':
    # Get port from environment or default to 80
    port = int(os.environ.get('PORT', 80))
    
    # Run the Flask app
    app.run(host='0.0.0.0', port=port, debug=os.environ.get('ASPNETCORE_ENVIRONMENT') == 'Development')
