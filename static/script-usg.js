document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const usgCranioForm = document.getElementById('usgCranioForm');
    const resultsDiv = document.getElementById('results');
    const examsResults = document.getElementById('examsResults');
    const errorDiv = document.getElementById('error');
    const printButton = document.getElementById('printButton');
    const printDateSpan = document.getElementById('printDate');
    
    // Elementos para USG
    const usgPatientNameInput = document.getElementById('usgPatientName');
    const usgResNameSpan = document.getElementById('usgResName');
    const usgResDateSpan = document.getElementById('usgResDate');
    const usgResResultSpan = document.getElementById('usgResResult');
    
    // Data de hoje
    const today = new Date().toISOString().split('T')[0];
    
    // Configuração inicial da data
    const usgDateInput = document.getElementById('usgDate');
    if (usgDateInput) {
        usgDateInput.max = today;
        usgDateInput.value = today;
    }
    
    // IMPLEMENTAÇÃO DAS FUNÇÕES
    
    // Função para obter a próxima terça ou sexta-feira a partir de uma data
    function getNextTuesdayOrFriday(date) {
        const d = new Date(date);
        const weekday = d.getDay(); // 0=Dom, 1=Seg, 2=Ter, 5=Sex
        
        let daysToAdd;
        if (weekday < 2) { // Dom ou Seg
            daysToAdd = 2 - weekday; // Próxima terça
        } else if (weekday < 5) { // Ter, Qua ou Qui
            daysToAdd = 5 - weekday; // Próxima sexta
        } else { // Sex ou Sáb
            daysToAdd = 9 - weekday; // Próxima terça
        }
        
        d.setDate(d.getDate() + daysToAdd);
        return d;
    }
    
    // Função para formatar datas
    function formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        return date.toLocaleDateString('pt-BR');
    }
    
    // Adicionar dias a uma data
    function addDays(dateObj, days) {
        const date = new Date(dateObj);
        date.setDate(date.getDate() + days);
        return date;
    }
    
    // Função para traduzir resultado do USG
    function translateUsgResult(result) {
        const translations = {
            'normal': 'Normal',
            'HI': 'Hemorragia Grau I',
            'HII': 'Hemorragia Grau II',
            'HIII': 'Hemorragia Grau III',
            'HIV': 'Hemorragia Grau IV'
        };
        return translations[result] || result;
    }
    
    // Calcular datas de follow-up de USG baseado no resultado
    function calculateUsgFollowup(usgDate, usgResult, gestationalAge) {
        const results = [];
        
        // Converter string para objeto de data
        const usgDateObj = new Date(usgDate);
        
        // Adicionar o USG realizado
        results.push(["USG realizado", formatDate(usgDateObj)]);
        
        if (usgResult === 'normal') {
            // 30 dias após o USG
            let followUpDate = addDays(usgDateObj, 30);
            followUpDate = getNextTuesdayOrFriday(followUpDate);
            results.push(["Controle Normal", formatDate(followUpDate) + " (ter/sex)"]);
            
            // Se tiver menos de 37 semanas, adicionar US às 40 semanas
            if (gestationalAge && parseFloat(gestationalAge) < 37) {
                const weeksTo40 = 40 - parseFloat(gestationalAge);
                let date40Weeks = addDays(usgDateObj, weeksTo40 * 7);
                date40Weeks = getNextTuesdayOrFriday(date40Weeks);
                if (date40Weeks > followUpDate) {
                    results.push(["USG às 40 semanas", formatDate(date40Weeks) + " (ter/sex)"]);
                }
            }
        } else if (usgResult === 'HI' || usgResult === 'HII') {
            // Repetir quinzenalmente por 2 meses
            let currentDate = usgDateObj;
            for (let i = 1; i <= 4; i++) { // 4 USGs quinzenais
                currentDate = addDays(currentDate, 14);
                currentDate = getNextTuesdayOrFriday(currentDate);
                results.push([`Controle HI/HII (${i})`, formatDate(currentDate) + " (ter/sex)"]);
            }
            
            results.push(["Medida PC", "1x por semana"]);
        } else if (usgResult === 'HIII' || usgResult === 'HIV') {
            // Repetir semanalmente por 2 meses
            let currentDate = usgDateObj;
            for (let i = 1; i <= 8; i++) { // 8 USGs semanais
                currentDate = addDays(currentDate, 7);
                currentDate = getNextTuesdayOrFriday(currentDate);
                results.push([`Controle HIII/HIV (${i})`, formatDate(currentDate) + " (ter/sex)"]);
            }
            
            results.push(["Medida PC", "3x por semana (seg/qua/sex)"]);
            results.push(["Consulta Neurocirurgia", "Agendar com urgência"]);
        }
        
        return results;
    }
    
    // Criar item de lista com checkbox
    function createChecklistItem(text, date) {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-start';
        
        const div = document.createElement('div');
        div.className = 'd-flex align-items-center';
        
        // Container para os checkboxes
        const checkContainer = document.createElement('div');
        checkContainer.className = 'check-container';
        
        // Checkbox para "Solicitado"
        const requestedCheck = document.createElement('input');
        requestedCheck.type = 'checkbox';
        requestedCheck.id = `requested_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        requestedCheck.className = 'form-check-input no-print';
        
        const requestedLabel = document.createElement('label');
        requestedLabel.htmlFor = requestedCheck.id;
        requestedLabel.className = 'no-print';
        requestedLabel.textContent = 'Solicitado';
        
        // Checkbox para "Verificado"
        const verifiedCheck = document.createElement('input');
        verifiedCheck.type = 'checkbox';
        verifiedCheck.id = `verified_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        verifiedCheck.className = 'form-check-input no-print';
        
        const verifiedLabel = document.createElement('label');
        verifiedLabel.htmlFor = verifiedCheck.id;
        verifiedLabel.className = 'no-print';
        verifiedLabel.textContent = 'Verificado';
        
        // Adicionar os checkboxes e labels ao container
        checkContainer.appendChild(requestedCheck);
        checkContainer.appendChild(requestedLabel);
        checkContainer.appendChild(verifiedCheck);
        checkContainer.appendChild(verifiedLabel);
        
        // Texto do item
        const textSpan = document.createElement('span');
        textSpan.textContent = text;
        
        div.appendChild(textSpan);
        div.appendChild(checkContainer);
        
        // Badge para a data
        const badge = document.createElement('span');
        badge.className = 'badge bg-info';
        badge.textContent = date;
        
        li.appendChild(div);
        li.appendChild(badge);
        
        return li;
    }
    
    // Exibir resultados
    function displayResults(followupResults) {
        examsResults.innerHTML = '';
        
        // Criar uma lista para os resultados
        const usgList = document.createElement('ul');
        usgList.className = 'list-group mb-4';
        
        // Adicionar cada data à lista
        followupResults.forEach(item => {
            const [text, date] = item;
            const li = createChecklistItem(text, date);
            usgList.appendChild(li);
        });
        
        // Adicionar a lista à seção de resultados
        examsResults.appendChild(usgList);
        
        // Mostrar a seção de resultados
        resultsDiv.classList.remove('d-none');
        
        // Definir data de impressão
        const today = new Date();
        printDateSpan.textContent = today.toLocaleDateString('pt-BR');
    }
    
    // Mostrar erro
    function showError(message) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
    
    // Limpar erro
    function clearError() {
        errorDiv.textContent = '';
        errorDiv.classList.add('d-none');
    }
    
    // HANDLERS DE EVENTOS
    
    // Formulário de USG
    usgCranioForm.addEventListener('submit', function(e) {
        e.preventDefault();
        clearError();
        
        try {
            // Obter valores do formulário
            const patientName = usgPatientNameInput.value.trim();
            const usgDate = document.getElementById('usgDate').value;
            const usgResult = document.querySelector('input[name="usgResult"]:checked').value;
            
            // Validar dados
            if (!patientName || !usgDate) {
                throw new Error('Preencha o nome do paciente e a data do USG');
            }
            
            // Calcular acompanhamento
            const followupResults = calculateUsgFollowup(usgDate, usgResult, 0);
            
            // Preencher dados do USG
            usgResNameSpan.textContent = patientName;
            usgResDateSpan.textContent = formatDate(usgDate);
            usgResResultSpan.textContent = translateUsgResult(usgResult);
            
            // Exibir resultados
            displayResults(followupResults);
            
        } catch (error) {
            showError(error.message);
        }
    });
    
    // Botão de impressão
    printButton.addEventListener('click', function() {
        window.print();
    });
}); 