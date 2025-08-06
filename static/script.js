document.addEventListener('DOMContentLoaded', () => {
    // --- DOM Element References ---
    const themeSwitcher = document.getElementById('theme-switcher');
    const themeIconDark = document.getElementById('theme-icon-dark');
    const themeIconLight = document.getElementById('theme-icon-light');
    const csvFileInput = document.getElementById('csv-file');
    const fileLabel = document.getElementById('file-label');
    const uploadStatus = document.getElementById('upload-status');
    const analyzeBtn = document.getElementById('analyze-btn');
    const resultsSection = document.getElementById('results-section');
    const resultsSummary = document.getElementById('results-summary');
    const resultsTableBody = document.getElementById('results-table-body');
    const dropArea = document.getElementById('drop-area');
    const chartContainer = document.getElementById('chart-container');

    let uploadedFile = null;

    // --- Theme Management ---
    const applyTheme = (theme) => {
        if (theme === 'dark') {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
            themeIconDark.classList.add('hidden');
            themeIconLight.classList.remove('hidden');
        } else {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
            themeIconDark.classList.remove('hidden');
            themeIconLight.classList.add('hidden');
        }
    };
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    applyTheme(savedTheme);
    themeSwitcher.addEventListener('click', () => {
        const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
        applyTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- File Handling ---
    const handleFileSelect = (file) => {
        if (!file || (!file.type.includes('csv') && !file.name.endsWith('.csv'))) {
            updateStatus('Error: Please upload a valid .csv file.', 'error');
            return;
        }
        uploadedFile = file;
        fileLabel.textContent = file.name;
        updateStatus('File ready for analysis.', 'success');
        analyzeBtn.disabled = false;
    };
    csvFileInput.addEventListener('change', (e) => handleFileSelect(e.target.files[0]));
    dropArea.addEventListener('drop', (e) => {
        preventDefaults(e);
        dropArea.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    });
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, preventDefaults, false));
    ['dragenter', 'dragover'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.add('dragover'), false));
    ['dragleave', 'drop'].forEach(eventName => dropArea.addEventListener(eventName, () => dropArea.classList.remove('dragover'), false));
    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    function updateStatus(message, type) {
        uploadStatus.textContent = message;
        uploadStatus.className = 'mt-4 text-center text-sm font-medium ';
        const colors = {
            success: 'text-green-600 dark:text-green-400',
            error: 'text-red-600 dark:text-red-400',
            loading: 'text-gray-600 dark:text-gray-300'
        };
        uploadStatus.classList.add(colors[type] || colors.loading);
    }

    // --- Analysis Logic ---
    analyzeBtn.addEventListener('click', async () => {
        if (!uploadedFile) {
            updateStatus('Please select a file first.', 'error');
            return;
        }
        
        analyzeBtn.disabled = true;
        analyzeBtn.innerHTML = `
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Analyzing...`;
        
        const formData = new FormData();
        formData.append('file', uploadedFile);

        try {
            const response = await fetch('/analyze', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! Status: ${response.status}`);
            }

            const results = await response.json();
            displayResults(results);

        } catch (error) {
            console.error('Analysis failed:', error);
            updateStatus(`Analysis Error: ${error.message}`, 'error');
        } finally {
            analyzeBtn.disabled = false;
            analyzeBtn.textContent = 'Start Analysis';
        }
    });

    function displayResults(results) {
        // Display Summary
        const { summary, predictions, charts } = results;
        resultsSummary.innerHTML = `
            <div class="card p-4 rounded-lg text-center">
                <p class="text-sm text-gray-500 dark:text-gray-400">Total Passengers</p>
                <p class="text-3xl font-bold">${summary.total}</p>
            </div>
            <div class="card p-4 rounded-lg text-center">
                <p class="text-sm text-green-600 dark:text-green-400">Predicted Survivors</p>
                <p class="text-3xl font-bold">${summary.survived}</p>
            </div>
            <div class="card p-4 rounded-lg text-center">
                <p class="text-sm text-red-600 dark:text-red-400">Predicted Deceased</p>
                <p class="text-3xl font-bold">${summary.deceased}</p>
            </div>`;

        // Display Table
        resultsTableBody.innerHTML = '';
        predictions.forEach(p => {
            const row = resultsTableBody.insertRow();
            row.className = 'border-b border-gray-200 dark:border-gray-700';
            const outcomeText = p.Predicted_Outcome === 1 ? 'Survived' : 'Did Not Survive';
            const outcomeColor = p.Predicted_Outcome === 1 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
            row.innerHTML = `
                <td class="p-3">${p.PassengerId}</td>
                <td class="p-3">${p.Name}</td>
                <td class="p-3 font-semibold ${outcomeColor}">${outcomeText}</td>
                <td class="p-3">${(p.Survival_Probability * 100).toFixed(2)}%</td>`;
        });
        
        // Display Charts
        if (chartContainer && charts) {
            chartContainer.innerHTML = ''; // Clear previous charts
            for (const key in charts) {
                const chartDiv = document.createElement('div');
                chartDiv.className = 'card rounded-lg p-4 shadow-md';
                chartDiv.innerHTML = `<img src="data:image/png;base64,${charts[key]}" alt="Analysis Chart" class="mx-auto">`;
                chartContainer.appendChild(chartDiv);
            }
        }

        resultsSection.classList.remove('hidden');
    }
});
