from flask import Flask, render_template, request, jsonify
from datetime import datetime, timedelta

app = Flask(__name__)

def get_next_tuesday_or_friday(date):
    """Retorna a próxima terça ou sexta-feira a partir da data fornecida"""
    weekday = date.weekday()  # 0=Segunda, 1=Terça, 4=Sexta
    
    if weekday < 1:  # Se for domingo ou segunda, próxima é terça
        days_until_next = 1 - weekday
    elif weekday < 4:  # Se for terça, quarta ou quinta, próxima é sexta
        days_until_next = 4 - weekday
    else:  # Se for sexta ou sábado, próxima é terça
        days_until_next = 8 - weekday
    
    return date + timedelta(days=days_until_next)

def calculate_first_usg(birth_date):
    """Calcula apenas a data do primeiro USG de crânio"""
    # Data alvo para primeiro US (7 dias após nascimento)
    target_date = birth_date + timedelta(days=7)
    
    # Encontrar a próxima terça ou sexta para o primeiro USG
    first_us_date = get_next_tuesday_or_friday(target_date)
    return first_us_date

def calculate_usg_followup(usg_date, usg_result, gestational_age):
    """Calcula as datas de acompanhamento com base no resultado do USG"""
    result = []
    
    usg_date = datetime.strptime(usg_date, '%Y-%m-%d')
    
    # Adicionar o USG realizado
    result.append(("USG realizado", usg_date.strftime('%d/%m/%Y')))
    
    if usg_result == 'normal':
        # 30 dias após o USG
        follow_up_date = usg_date + timedelta(days=30)
        follow_up_date = get_next_tuesday_or_friday(follow_up_date)
        result.append(("Controle Normal", follow_up_date.strftime('%d/%m/%Y') + " (ter/sex)"))
        
        # Se tiver menos de 37 semanas, adicionar US às 40 semanas
        # Verificar se estamos em modo direto (gestational_age = 0) ou se temos IG
        if gestational_age and float(gestational_age) < 37:
            weeks_to_40 = 40 - float(gestational_age)
            date_40_weeks = usg_date + timedelta(weeks=weeks_to_40)
            date_40_weeks = get_next_tuesday_or_friday(date_40_weeks)
            if date_40_weeks > follow_up_date:
                result.append(("USG às 40 semanas", date_40_weeks.strftime('%d/%m/%Y') + " (ter/sex)"))
            
    elif usg_result in ['HI', 'HII']:
        # Repetir quinzenalmente por 2 meses
        current_date = usg_date
        for i in range(1, 5):  # 4 USGs quinzenais
            current_date = current_date + timedelta(days=14)
            current_date = get_next_tuesday_or_friday(current_date)
            result.append((f"Controle HI/HII ({i})", current_date.strftime('%d/%m/%Y') + " (ter/sex)"))
        
        result.append(("Medida PC", "1x por semana"))
        
    elif usg_result in ['HIII', 'HIV']:
        # Repetir semanalmente por 2 meses
        current_date = usg_date
        for i in range(1, 9):  # 8 USGs semanais
            current_date = current_date + timedelta(days=7)
            current_date = get_next_tuesday_or_friday(current_date)
            result.append((f"Controle HIII/HIV ({i})", current_date.strftime('%d/%m/%Y') + " (ter/sex)"))
        
        result.append(("Medida PC", "3x por semana (seg/qua/sex)"))
        result.append(("Consulta Neurocirurgia", "Agendar com urgência"))
        
    return result

def calculate_uti_dates(baby_name, birth_date, gestational_age, gestational_age_formatted, birth_weight, has_risk_factors):
    birth_date = datetime.strptime(birth_date, '%Y-%m-%d')
    gestational_age = float(gestational_age)  # Valor decimal (semanas.dias/7)
    birth_weight = float(birth_weight)
    results = {}

    # Extrair semanas inteiras para comparações
    gestational_weeks = int(gestational_age)

    # 1. HPIV - US Crânio Transfontanela - Apenas a data do primeiro USG
    needs_us_cranio = False
    
    if gestational_weeks <= 30 or birth_weight < 1500 or has_risk_factors:
        needs_us_cranio = True
    
    if needs_us_cranio:
        first_us_date = calculate_first_usg(birth_date)
        results['USG de Crânio'] = [("Primeiro USG", first_us_date.strftime('%d/%m/%Y') + " (ter/sex)")]

    # 2. Retinopatia da Prematuridade - Fundo de Olho
    if birth_weight < 1500 or gestational_weeks < 32:
        # Encontrar uma data entre 4-6 semanas que seja terça ou sexta
        target_date = birth_date + timedelta(weeks=4)
        fo_date = get_next_tuesday_or_friday(target_date)
        
        # Se a data for depois de 6 semanas, usar 6 semanas - 3 dias
        if (fo_date - birth_date).days > 42:  # 6 semanas
            fo_date = birth_date + timedelta(days=39)  # 6 semanas - 3 dias
            fo_date = get_next_tuesday_or_friday(fo_date)
        
        results['Retinopatia - Fundo de Olho'] = [("Fundo de Olho", fo_date.strftime('%d/%m/%Y') + " (ter/sex)")]

    # 3. Doença Metabólica Óssea
    if birth_weight < 1500 or gestational_weeks < 32:
        metabolic = []
        
        # Calcular todas as datas dos exames a cada 21 dias até atingir 40 semanas de IG corrigida
        
        # Data do primeiro exame (21 dias após nascimento)
        first_exam_date = birth_date + timedelta(days=21)
        metabolic.append(("1º Exame Metabólico", first_exam_date.strftime('%d/%m/%Y')))
        
        # Calcular data em que atingirá 40 semanas de IG
        # Semanas restantes = 40 - idade gestacional atual
        weeks_remaining = 40 - gestational_age
        date_40_weeks = birth_date + timedelta(weeks=weeks_remaining)
        
        # Gerar datas subsequentes a cada 21 dias até atingir a data de 40 semanas
        next_exam_date = first_exam_date + timedelta(days=21)
        exam_count = 2
        
        while next_exam_date < date_40_weeks:
            metabolic.append((f"{exam_count}º Exame Metabólico", next_exam_date.strftime('%d/%m/%Y')))
            next_exam_date = next_exam_date + timedelta(days=21)
            exam_count += 1
        
        # Adicionar a data final quando atingir 40 semanas de IG
        metabolic.append(("Exame Metabólico Final (40 sem)", date_40_weeks.strftime('%d/%m/%Y')))
        
        results['Doença Metabólica Óssea (Cálcio, Fósforo e Fosfatase Alcalina séricos)'] = metabolic

    # 4. Triagem Auditiva
    results['Triagem Auditiva'] = [("Triagem Auditiva", "Pré-alta hospitalar")]

    return results

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.get_json()
    baby_name = data.get('baby_name')
    birth_date = data.get('birth_date')
    gestational_age = data.get('gestational_age')
    gestational_age_formatted = data.get('gestational_age_formatted')
    birth_weight = data.get('birth_weight')
    has_risk_factors = data.get('has_risk_factors', False)
    
    try:
        dates = calculate_uti_dates(
            baby_name=baby_name, 
            birth_date=birth_date, 
            gestational_age=gestational_age, 
            gestational_age_formatted=gestational_age_formatted, 
            birth_weight=birth_weight,
            has_risk_factors=has_risk_factors
        )
        return jsonify({
            'success': True, 
            'dates': dates, 
            'baby_name': baby_name, 
            'birth_date': birth_date, 
            'gestational_age': gestational_age,
            'gestational_age_formatted': gestational_age_formatted,
            'birth_weight': birth_weight
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/calculate_usg_followup', methods=['POST'])
def calculate_usg_followup_endpoint():
    data = request.get_json()
    usg_date = data.get('usg_date')
    usg_result = data.get('usg_result')
    gestational_age = data.get('gestational_age', 0)
    
    try:
        dates = calculate_usg_followup(
            usg_date=usg_date,
            usg_result=usg_result,
            gestational_age=gestational_age
        )
        return jsonify({
            'success': True,
            'dates': dates
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True) 