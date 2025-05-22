document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais
    const screeningForm = document.getElementById('screeningForm');
    const resultsDiv = document.getElementById('results');
    const usgCranioCard = document.getElementById('usgCranioCard');
    const usgCranioForm = document.getElementById('usgCranioForm');
    const examsResults = document.getElementById('examsResults');
    const usgResults = document.getElementById('usgResults');
    const usgResultsSection = document.getElementById('usgResultsSection');
    const errorDiv = document.getElementById('error');
    const printButton = document.getElementById('printButton');
    const printDateSpan = document.getElementById('printDate');
    
    // Verificar elementos principais para evitar erros null
    if (!resultsDiv || !usgCranioCard || !errorDiv) {
        console.error('Elementos principais da página não encontrados');
        return;
    }
    
    // Configurar data de impressão
    if (printDateSpan) {
        const today = new Date();
        printDateSpan.textContent = today.toLocaleDateString('pt-BR');
    }
    
    // Botões
    const voltarBtn = document.getElementById('voltarBtn');
    const directUsgBtn = document.getElementById('directUsgBtn');
    
    // Verificar botões principais
    if (!directUsgBtn) {
        console.error('Botão de USG direto não encontrado');
        return;
    }
    
    // Modal de fatores de risco
    const riskFactorsModal = document.getElementById('riskFactorsModal') ? 
        new bootstrap.Modal(document.getElementById('riskFactorsModal')) : null;
    
    // Armazenar dados do RN
    let patientData = {};
    // Flag para controlar se estamos em modo direto de USG
    let directUsgMode = false;
    
    // Set max date to today e valor inicial como hoje
    const today = new Date().toISOString().split('T')[0];
    const birthDateInput = document.getElementById('birthDate');
    if (birthDateInput) {
        birthDateInput.max = today;
        birthDateInput.value = today;
    }
    
    // Botão para acessar diretamente o cálculo de USG
    directUsgBtn.addEventListener('click', function() {
        // Esconder formulário principal
        const mainCard = document.querySelector('.card:first-child');
        if (mainCard) mainCard.classList.add('d-none');
        
        // Esconder seção de resultados
        resultsDiv.classList.add('d-none');
        
        // Mostrar o card de USG
        usgCranioCard.classList.remove('d-none');
        
        // Configurar flag de modo direto
        directUsgMode = true;
        
        // Definir a data do USG como hoje por padrão
        const usgDateInput = document.getElementById('usgDate');
        if (usgDateInput) {
            usgDateInput.value = today;
            usgDateInput.max = today;
        }
    });
    
    // Botão para voltar à tela anterior
    if (voltarBtn) {
        voltarBtn.addEventListener('click', function() {
            // Recarregar a página completamente
            window.location.reload();
        });
    }
    
    // Botão de impressão
    if (printButton) {
        printButton.addEventListener('click', function() {
            // Preparar para impressão - compactar layout
            optimizeForPrinting();
            window.print();
        });
    }
    
    // Função para otimizar layout antes da impressão
    function optimizeForPrinting() {
        // Remover espaços desnecessários para economia de espaço
        const cardBody = document.querySelector('#results .card-body');
        if (cardBody) {
            cardBody.classList.add('compact-print');
        }
        
        // Ajustar tamanho das fontes para caber mais conteúdo
        const headings = document.querySelectorAll('#results h3, #results h4, #results h5');
        headings.forEach(heading => {
            heading.classList.add('print-compact-heading');
        });
        
        // Compactar checkboxes para economizar espaço
        const checkContainers = document.querySelectorAll('.check-container');
        checkContainers.forEach(container => {
            container.classList.add('print-compact-checks');
        });
    }
    
    // Gerenciar o fluxo do formulário principal
    if (screeningForm) {
        screeningForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Limpar resultados anteriores
            resultsDiv.classList.add('d-none');
            errorDiv.classList.add('d-none');
            
            // Coletar os dados básicos do formulário
            const babyNameInput = document.getElementById('babyName');
            const babyName = babyNameInput ? babyNameInput.value : '';
            
            // Processar idade gestacional (dois campos: semanas e dias)
            const gestWeeksInput = document.getElementById('gestationalAgeWeeks');
            const gestDaysInput = document.getElementById('gestationalAgeDays');
            
            if (!gestWeeksInput) {
                showError("Campo de semanas gestacionais não encontrado");
                return;
            }
            
            const weeks = parseInt(gestWeeksInput.value);
            const days = parseInt(gestDaysInput ? gestDaysInput.value || 0 : 0);
            
            // Validar semanas e dias
            if (weeks < 20 || weeks > 45) {
                showError("Idade gestacional deve estar entre 20 e 45 semanas.");
                return;
            }
            
            if (days < 0 || days > 6) {
                showError("Dias devem estar entre 0 e 6.");
                return;
            }
            
            // Calcular idade gestacional decimal (para backend)
            const gestationalAge = weeks + (days / 7);
            
            // Formatar para exibição
            const gestationalAgeFormatted = days > 0 ? `${weeks} semanas e ${days} dias` : `${weeks} semanas`;
            
            const birthDateInput = document.getElementById('birthDate');
            if (!birthDateInput) {
                showError("Campo de data de nascimento não encontrado");
                return;
            }
            const birthDate = birthDateInput.value;
            
            // Normalizar o peso
            const birthWeightInput = document.getElementById('birthWeight');
            if (!birthWeightInput) {
                showError("Campo de peso não encontrado");
                return;
            }
            let birthWeight = birthWeightInput.value;
            
            // Substituir vírgula por ponto para normalizar decimal
            birthWeight = birthWeight.replace(',', '.');
            
            // Converter para número
            let weightValue = parseFloat(birthWeight);
            
            // Verificar se é um número válido
            if (isNaN(weightValue)) {
                showError("Por favor, insira um peso válido.");
                return;
            }
            
            // Normalizar para gramas baseado na lógica:
            // - Se for menor que 20, provavelmente é em kg (ex: 2,5 kg)
            // - Se for maior que 6000, provavelmente é um erro (nenhum RN tem mais de 6kg)
            if (weightValue < 20) {
                // Provavelmente o peso está em kg, converter para gramas
                weightValue = weightValue * 1000;
            } else if (weightValue > 6000) {
                // Provavelmente um erro, limitar a 6000g
                weightValue = 6000;
            }
            
            // Arredondar para gramas inteiras
            weightValue = Math.round(weightValue);
            
            // Armazenar dados do formulário para uso posterior
            patientData = {
                baby_name: babyName,
                gestational_age: gestationalAge,
                gestational_age_formatted: gestationalAgeFormatted,
                birth_date: birthDate,
                birth_weight: weightValue,
                has_risk_factors: false
            };
            
            // Verificar se precisa perguntar sobre fatores de risco para HPIV
            if (weeks > 30 && weightValue >= 1500 && riskFactorsModal) {
                // Mostrar modal para perguntar sobre fatores de risco
                riskFactorsModal.show();
            } else {
                // Já tem indicação clara para US Crânio, enviar direto
                submitFormToServer();
            }
        });
    }
    
    // Formulário para cálculo do USG de Crânio
    if (usgCranioForm) {
        usgCranioForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Esconder erros anteriores
            errorDiv.classList.add('d-none');
            
            // Obter data do USG
            const usgDateInput = document.getElementById('usgDate');
            if (!usgDateInput) {
                showError("Campo de data do USG não encontrado");
                return;
            }
            const usgDate = usgDateInput.value;
            
            // Obter resultado do USG
            const usgResult = document.querySelector('input[name="usgResult"]:checked')?.value || 'normal';
            
            // Enviar para o backend
            try {
                const response = await fetch('/calculate_usg_followup', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        usg_date: usgDate,
                        usg_result: usgResult
                    })
                });
                
                const data = await response.json();
                
                if (data.success) {
                    // Se estamos em modo direto, exibir apenas os resultados do USG
                    if (directUsgMode) {
                        // Esconder o card de cálculo
                        usgCranioCard.classList.add('d-none');
                        
                        // Criar conteúdo de resultados para modo direto
                        const directResultsContent = `
                            <div class="card shadow mb-4">
                                <div class="card-header bg-info text-white">
                                    <h2 class="h4 mb-0">Acompanhamento de USG de Crânio</h2>
                                </div>
                                <div class="card-body">
                                    <ul class='list-group mb-2'>
                                        ${data.dates.map(([desc, date]) => 
                                            `<li class='list-group-item d-flex justify-content-between align-items-center'>
                                                <div class="d-flex align-items-center">
                                                    <span>${desc}</span>
                                                    <div class="check-container">
                                                        <input type="checkbox" id="req_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                                        <label for="req_${desc.replace(/\s+/g, '_')}">Solicitado</label>
                                                        <input type="checkbox" id="check_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                                        <label for="check_${desc.replace(/\s+/g, '_')}">Checado</label>
                                                    </div>
                                                </div>
                                                <span class='badge bg-info'>${date}</span>
                                            </li>`).join('')}
                                    </ul>
                                    <div class="d-grid mt-3">
                                        <button type="button" class="btn btn-secondary" id="backToMainBtn">Voltar</button>
                                    </div>
                                    <div class="d-grid print-button">
                                        <button type="button" class="btn btn-success" id="directPrintButton">
                                            <i class="bi bi-printer"></i> Imprimir Relatório
                                        </button>
                                    </div>
                                    <div class="print-only print-footer">
                                        <p>Data de emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
                                        <p>
                                            <span>______________________________</span><br>
                                            <span>Assinatura e carimbo do médico</span>
                                        </p>
                                    </div>
                                </div>
                            </div>
                        `;
                        
                        // Inserir o HTML no elemento de resultados
                        resultsDiv.innerHTML = directResultsContent;
                        
                        // Adicionar evento ao botão de voltar
                        const backBtn = document.getElementById('backToMainBtn');
                        if (backBtn) {
                            backBtn.addEventListener('click', function() {
                                // Forçar recarga completa da página
                                window.location.reload();
                            });
                        }
                        
                        // Adicionar evento ao botão de impressão
                        const directPrintBtn = document.getElementById('directPrintButton');
                        if (directPrintBtn) {
                            directPrintBtn.addEventListener('click', function() {
                                optimizeForPrinting();
                                window.print();
                            });
                        }
                        
                        // Mostrar a seção de resultados
                        resultsDiv.classList.remove('d-none');
                    } else {
                        // No modo normal, exibir resultados do USG na seção específica
                        if (usgResults) {
                            usgResults.innerHTML = '';
                            let html = `<ul class='list-group mb-2'>`;
                            for (const [desc, date] of data.dates) {
                                html += `
                                <li class='list-group-item d-flex justify-content-between align-items-center'>
                                    <div class="d-flex align-items-center">
                                        <span>${desc}</span>
                                        <div class="check-container">
                                            <input type="checkbox" id="usg_req_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                            <label for="usg_req_${desc.replace(/\s+/g, '_')}">Solicitado</label>
                                            <input type="checkbox" id="usg_check_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                            <label for="usg_check_${desc.replace(/\s+/g, '_')}">Checado</label>
                                        </div>
                                    </div>
                                    <span class='badge bg-info'>${date}</span>
                                </li>`;
                            }
                            html += '</ul>';
                            usgResults.innerHTML = html;
                        }
                        
                        // Mostrar seção de resultados do USG
                        if (usgResultsSection) {
                            usgResultsSection.classList.remove('d-none');
                        }
                        
                        // Mostrar a seção de resultados principal
                        resultsDiv.classList.remove('d-none');
                    }
                } else {
                    throw new Error(data.error || 'Erro ao calcular as datas de acompanhamento');
                }
            } catch (error) {
                showError(error.message);
            }
        });
    }
    
    // Quando confirmar os fatores de risco
    const confirmRiskBtn = document.getElementById('confirmRiskFactors');
    if (confirmRiskBtn) {
        confirmRiskBtn.addEventListener('click', function() {
            // Verificar se algum fator de risco foi selecionado
            const checkboxes = document.querySelectorAll('#riskFactorsModal input[type="checkbox"]');
            const hasRiskFactors = Array.from(checkboxes).some(checkbox => checkbox.checked);
            
            // Atualizar dados do paciente
            patientData.has_risk_factors = hasRiskFactors;
            
            // Fechar modal de fatores de risco
            if (riskFactorsModal) {
                riskFactorsModal.hide();
            }
            
            // Enviar o formulário para o servidor
            submitFormToServer();
        });
    }
    
    // Função para mostrar mensagens de erro
    function showError(message) {
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.classList.remove('d-none');
        } else {
            console.error(message);
            alert(message);
        }
    }
    
    // Função para enviar o formulário para o servidor
    async function submitFormToServer() {
        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(patientData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Preencher resumo do RN
                const resNameEl = document.getElementById('resName');
                const resBirthDateEl = document.getElementById('resBirthDate');
                const resGestAgeEl = document.getElementById('resGestAge');
                const resWeightEl = document.getElementById('resWeight');
                
                if (resNameEl) resNameEl.textContent = data.baby_name;
                if (resBirthDateEl) resBirthDateEl.textContent = data.birth_date.split('-').reverse().join('/');
                if (resGestAgeEl) resGestAgeEl.textContent = data.gestational_age_formatted;
                if (resWeightEl) resWeightEl.textContent = data.birth_weight;
                
                // Esconder seção de resultados de USG se estiver visível
                if (usgResultsSection) {
                    usgResultsSection.classList.add('d-none');
                }
                
                // Exibir exames de forma mais compacta para impressão
                if (examsResults) {
                    examsResults.innerHTML = '';
                    for (const [exam, items] of Object.entries(data.dates)) {
                        let html = `<h5 class='mt-3'>${exam}</h5><ul class='list-group mb-2'>`;
                        for (const [desc, date] of items) {
                            html += `
                            <li class='list-group-item d-flex justify-content-between align-items-center'>
                                <div class="d-flex align-items-center">
                                    <span>${desc}</span>
                                    <div class="check-container">
                                        <input type="checkbox" id="req_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                        <label for="req_${desc.replace(/\s+/g, '_')}">Solicitado</label>
                                        <input type="checkbox" id="check_${desc.replace(/\s+/g, '_')}" class="form-check-input">
                                        <label for="check_${desc.replace(/\s+/g, '_')}">Checado</label>
                                    </div>
                                </div>
                                <span class='badge bg-primary'>${date}</span>
                            </li>`;
                        }
                        html += '</ul>';
                        examsResults.innerHTML += html;
                    }
                }
                
                // Mostrar a seção de resultados
                resultsDiv.classList.remove('d-none');
            } else {
                throw new Error(data.error || 'Erro ao calcular as datas');
            }
        } catch (error) {
            showError(error.message);
        }
    }
}); 