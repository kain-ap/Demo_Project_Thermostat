from flask import Flask, render_template, send_from_directory, jsonify, request
import os

app = Flask(__name__)

# Serve the HTML file
@app.route('/')
def serve_index():
    return render_template('index.html')

# Manually serve JavaScript files
@app.route('/js/<path:path>')
def serve_js(path):
    return send_from_directory(os.path.join(app.root_path, 'js'), path)

# Manually serve CSS files
@app.route('/styles/<path:path>')
def serve_styles(path):
    return send_from_directory(os.path.join(app.root_path, 'styles'), path)

# Manually serve assets (e.g., GLTF files)
@app.route('/assets/<path:path>')
def serve_assets(path):
    return send_from_directory(os.path.join(app.root_path, 'assets'), path)

temperature = 22.0

@app.route('/get-temperature', methods=['GET'])
def get_temperature():
    return jsonify({"temperature": temperature})

# Route for updating the temperature
@app.route('/update-temperature', methods=['POST'])
def update_temperature():
    global temperature
    data = request.get_json()  # Get JSON data from the request
    if 'change' in data:
        temperature += data['change']  # Update temperature based on the change value
    return jsonify({"temperature": temperature})

if __name__ == '__main__':
    app.run(debug=True)
