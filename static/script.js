document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('screeningForm');
    const resultsDiv = document.getElementById('results');
    const datesTable = document.getElementById('datesTable');
    const errorDiv = document.getElementById('error');

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Hide previous results and errors
        resultsDiv.classList.add('d-none');
        errorDiv.classList.add('d-none');
        
        const birthDate = document.getElementById('birthDate').value;
        const birthWeight = document.getElementById('birthWeight').value;

        try {
            const response = await fetch('/calculate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    birth_date: birthDate,
                    birth_weight: birthWeight
                })
            });

            const data = await response.json();

            if (data.success) {
                // Clear previous results
                datesTable.innerHTML = '';
                
                // Add new results
                for (const [screening, date] of Object.entries(data.dates)) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${screening}</td>
                        <td>${date}</td>
                    `;
                    datesTable.appendChild(row);
                }
                
                // Show results
                resultsDiv.classList.remove('d-none');
            } else {
                throw new Error(data.error || 'Erro ao calcular as datas');
            }
        } catch (error) {
            errorDiv.textContent = error.message;
            errorDiv.classList.remove('d-none');
        }
    });

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('birthDate').max = today;
}); 