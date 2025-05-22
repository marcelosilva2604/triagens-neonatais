from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta

app = Flask(__name__)

def calculate_screening_dates(birth_date, birth_weight):
    birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    
    # Define screening dates based on weight
    if birth_weight < 1500:  # Very low birth weight
        dates = {
            'Primeira Triagem': birth_date + timedelta(days=7),
            'Segunda Triagem': birth_date + timedelta(days=14),
            'Terceira Triagem': birth_date + timedelta(days=21),
            'Quarta Triagem': birth_date + timedelta(days=28),
            'Quinta Triagem': birth_date + timedelta(days=35),
            'Sexta Triagem': birth_date + timedelta(days=42),
            'Sétima Triagem': birth_date + timedelta(days=49),
            'Oitava Triagem': birth_date + timedelta(days=56),
            'Nona Triagem': birth_date + timedelta(days=63),
            'Décima Triagem': birth_date + timedelta(days=70),
            'Décima Primeira Triagem': birth_date + timedelta(days=77),
            'Décima Segunda Triagem': birth_date + timedelta(days=84),
        }
    elif birth_weight < 2500:  # Low birth weight
        dates = {
            'Primeira Triagem': birth_date + timedelta(days=7),
            'Segunda Triagem': birth_date + timedelta(days=14),
            'Terceira Triagem': birth_date + timedelta(days=21),
            'Quarta Triagem': birth_date + timedelta(days=28),
            'Quinta Triagem': birth_date + timedelta(days=35),
            'Sexta Triagem': birth_date + timedelta(days=42),
            'Sétima Triagem': birth_date + timedelta(days=49),
            'Oitava Triagem': birth_date + timedelta(days=56),
        }
    else:  # Normal birth weight
        dates = {
            'Primeira Triagem': birth_date + timedelta(days=7),
            'Segunda Triagem': birth_date + timedelta(days=14),
            'Terceira Triagem': birth_date + timedelta(days=21),
            'Quarta Triagem': birth_date + timedelta(days=28),
        }
    
    # Format dates for display
    formatted_dates = {key: value.strftime('%d/%m/%Y') for key, value in dates.items()}
    return formatted_dates

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    birth_date = data.get('birth_date')
    birth_weight = float(data.get('birth_weight'))
    
    try:
        dates = calculate_screening_dates(birth_date, birth_weight)
        return jsonify({'success': True, 'dates': dates})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True) 