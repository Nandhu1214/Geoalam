from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# Temporary in-memory storage
alarms = []

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/alarms', methods=['GET', 'POST', 'DELETE'])
def handle_alarms():
    global alarms

    if request.method == 'GET':
        return jsonify(alarms)

    elif request.method == 'POST':
        data = request.json
        if not data:
            return jsonify({'error': 'No data received'}), 400
        alarms.append(data)
        return jsonify({'message': 'Alarm added', 'alarm': data})

    elif request.method == 'DELETE':
        alarm_id = request.args.get('id')
        if not alarm_id:
            return jsonify({'error': 'No ID provided'}), 400
        alarms = [alarm for alarm in alarms if str(alarm.get('id')) != alarm_id]
        return jsonify({'message': f'Alarm with ID {alarm_id} deleted'})

if __name__ == '__main__':
    app.run(debug=True)
