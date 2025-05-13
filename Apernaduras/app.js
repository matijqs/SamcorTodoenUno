document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('results');
    
    // Cargar datos
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            // Mostrar todos los resultados al cargar
            displayResults(data, '');
            
            // Filtrar mientras se escribe
            searchInput.addEventListener('input', (e) => {
                const searchTerm = e.target.value.toLowerCase();
                const filteredData = data.filter(item => 
                    item.MARCA.toLowerCase().includes(searchTerm)
                );
                displayResults(filteredData, searchTerm);
            });
        });

        function displayResults(data, term) {
            resultsDiv.innerHTML = '';
            
            // Mensaje solo si hay término y no hay resultados
            if (term && data.length === 0) {
                resultsDiv.innerHTML = '<p>No se encontraron resultados</p>';
                return;
            }
        
            data.forEach(item => {
                const card = document.createElement('div');
                card.className = 'vehicle-card';
                
                // Resaltado solo si hay término de búsqueda
                const marca = term ? 
                    item.MARCA.replace(
                        new RegExp(term, 'gi'), 
                        match => `<span class="highlight">${match}</span>`
                    ) : 
                    item.MARCA;
                    
                card.innerHTML = `
                    <h3>${marca}</h3>
                    <p><strong>Pernos:</strong> ${item.PERNOS}</p>
                    <p><strong>Apernadura:</strong> ${item.APERNADURA}</p>
                    <p><strong>Centrador:</strong> ${item.CENTRADOR || 'N/A'}</p>
                    <p><strong>Tipo:</strong> ${item['TUERCA/PERNO'] || 'N/A'}</p>
                    <p><strong>Hilo:</strong> ${item.HILO || 'N/A'}</p>
                    ${item.COMENTARIO ? `
                    <div class="comment-box">
                        <em>${item.COMENTARIO}</em>
                    </div>` : ''}
                `;
                
                resultsDiv.appendChild(card);
            });
    }
});