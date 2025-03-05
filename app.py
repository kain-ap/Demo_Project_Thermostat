from flask import Flask, render_template, send_from_directory, jsonify, request
import os
import random
import json
import time

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

temperature = 22.0  # Initial temperature

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


telemetry_file = "assets/thermostat_schedule.json"

def generate_telemetry():
    data = []
    current_temp = 22
    heating_period = False  # Track if we're heating or cooling
    for t in range(0, 300, 5):
        # Simulate a heating or cooling cycle
        if heating_period:
            current_temp += 0.5  # Simulate a continuous increase in temperature (heating)
        else:
            current_temp -= 0.5  # Simulate a continuous decrease in temperature (cooling)
        
        # Toggle heating/cooling after some time (simulate change of cycles)
        if t % 50 == 0:
            heating_period = not heating_period
        
        current_temp = max(10, min(40, current_temp))  # Keep temperature within bounds
        data.append({"time": t, "temperature": current_temp})

    # Save to JSON File
    with open(telemetry_file, "w") as f:
        json.dump(data, f)

@app.route("/get-telemetry")
def get_telemetry():
    # Get the limit from the request query parameter (default to 100 if not provided)
    limit = int(request.args.get('limit', 100))

    # Simulate telemetry data with a heating/cooling cycle
    data = []
    temp = 22
    heating_period = False  # Toggle heating/cooling cycles

    for t in range(0, 300, 5):
        # Alternate between heating and cooling periods
        if heating_period:
            temp += 0.5  # Heating up
        else:
            temp -= 0.5  # Cooling down
        
        # Toggle heating/cooling period every 50 steps
        if t % 50 == 0:
            heating_period = not heating_period

        temp = max(10, min(40, temp))  # Clamp temperature between 10 and 40
        data.append({"time": t, "temperature": temp})

    # Return only the number of data points requested
    return jsonify(data[:limit])

if __name__ == '__main__':
    app.run(debug=True)
