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

@app.route("/get-telemetry")
def get_telemetry():
    generate_telemetry_data()  # Generate telemetry before serving
    try:
        with open(telemetry_file, "r") as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        print(f"Telemetry Error: {e}")
        return jsonify({"error": "Failed to load telemetry"}), 500


def generate_telemetry_data():
    data = []
    current_temp = 22
    heating_period = False  # Track if we're heating or cooling
    variability = random.choice([0.2, 0.5, 1.0, 2.0])  # Randomize variability levels
    cycle_length = random.choice([30, 50, 70])  # Randomize cycle duration

    for t in range(0, 300, 5):
        # Introduce random small or large fluctuations
        fluctuation = random.uniform(-2.0, 2.0) if random.random() > 0.3 else random.uniform(-0.2, 0.2)

        if heating_period:
            current_temp += variability + fluctuation
        else:
            current_temp -= variability + fluctuation

        if t % cycle_length == 0:
            heating_period = not heating_period
            variability = random.choice([0.2, 0.5, 1.0, 2.0])
            cycle_length = random.choice([30, 50, 70])

        current_temp = max(10, min(40, current_temp))
        data.append({"time": t, "temperature": current_temp})

    # Save to JSON File
    with open(telemetry_file, "w") as f:
        json.dump(data, f)



if __name__ == '__main__':
    app.run(debug=True)
