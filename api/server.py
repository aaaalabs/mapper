"""Main API server module."""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import tempfile
import os
from werkzeug.utils import secure_filename
from utils.data_processor import process_csv_data
from utils.map_generator import generate_community_map
from utils.config import API_PORT, DEBUG_MODE, ALLOWED_EXTENSIONS, TEMP_MAP_FILENAME

app = Flask(__name__)
CORS(app)

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/generate-map', methods=['POST'])
def generate_map():
    """Generate a community map from uploaded CSV data."""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
            
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file type. Please upload a CSV file.'}), 400

        # Create temp directory if it doesn't exist
        temp_dir = tempfile.gettempdir()
        os.makedirs(temp_dir, exist_ok=True)

        # Process data and generate map
        df = process_csv_data(file)
        map_obj = generate_community_map(df)

        # Save map to temporary file
        map_path = os.path.join(temp_dir, TEMP_MAP_FILENAME)
        map_obj.save(map_path)
        
        return send_file(map_path, mimetype='text/html')

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(port=API_PORT, debug=DEBUG_MODE)