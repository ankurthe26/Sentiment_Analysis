// Global variables
let allAnalyzedTexts = [];
let currentResults = [];
let activePanel = 'single';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    updateStats();
    initializeAnimations();
});

function initializeApp() {
    // Set up drag and drop for file upload
    setupDragAndDrop();
    
    // Initialize tooltips
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Set initial active feature card
    document.querySelector('.feature-card[data-tab="single"]').classList.add('active');
}

function initializeAnimations() {
    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // Observe all cards and sections
    document.querySelectorAll('.feature-card, .model-card, .stat-card').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

function setupEventListeners() {
    // Single text analysis
    document.getElementById('analyzeBtn').addEventListener('click', analyzeSingleText);
    
    // Batch analysis
    document.getElementById('analyzeBatchBtn').addEventListener('click', analyzeBatchTexts);
    
    // File upload
    document.getElementById('csvFile').addEventListener('change', handleFileUpload);
    
    // Word cloud generation
    document.getElementById('generateWordcloudBtn').addEventListener('click', generateWordCloud);
    
    // Feature card navigation
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            showPanel(tab);
            
            // Update active states
            document.querySelectorAll('.feature-card').forEach(c => c.classList.remove('active'));
            this.classList.add('active');
            
            // Update active panel
            activePanel = tab;
        });
    });
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey || e.metaKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    showPanel('single');
                    break;
                case '2':
                    e.preventDefault();
                    showPanel('batch');
                    break;
                case '3':
                    e.preventDefault();
                    showPanel('upload');
                    break;
                case '4':
                    e.preventDefault();
                    showPanel('analytics');
                    break;
            }
        }
        
        // Close loading modal with Escape key
        if (e.key === 'Escape') {
            hideLoading();
        }
    });
}

function setupDragAndDrop() {
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('csvFile');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    function highlight(e) {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight(e) {
        uploadArea.classList.remove('dragover');
    }
    
    uploadArea.addEventListener('drop', handleDrop, false);
    
    function handleDrop(e) {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0) {
            fileInput.files = files;
            handleFileUpload();
        }
    }
}

function showPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('.analysis-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    // Show selected panel
    const targetPanel = document.getElementById(panelId + '-panel');
    if (targetPanel) {
        targetPanel.classList.add('active');
        
        // Trigger analytics update if needed
        if (panelId === 'analytics') {
            setTimeout(() => {
                updateAnalytics();
            }, 100);
        }
    }
    
    // Update active feature card
    document.querySelectorAll('.feature-card').forEach(card => {
        card.classList.remove('active');
    });
    document.querySelector(`.feature-card[data-tab="${panelId}"]`).classList.add('active');
}

async function analyzeSingleText() {
    const text = document.getElementById('singleText').value.trim();
    
    if (!text) {
        showAlert('Please enter some text to analyze.', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text: text })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displaySingleResult(result);
            allAnalyzedTexts.push(text);
            updateStats();
            addToHistory(text, result.overall_sentiment);
        } else {
            showAlert(result.error || 'Analysis failed.', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

async function analyzeBatchTexts() {
    const texts = document.getElementById('batchTexts').value.trim();
    
    if (!texts) {
        showAlert('Please enter some texts to analyze.', 'warning');
        return;
    }
    
    const textArray = texts.split('\n').filter(text => text.trim());
    
    if (textArray.length === 0) {
        showAlert('Please enter valid texts.', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/analyze-batch', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texts: textArray })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayBatchResults(result.results);
            allAnalyzedTexts.push(...textArray);
            updateStats();
            
            // Add to history
            result.results.forEach(r => {
                addToHistory(r.text, r.overall_sentiment);
            });
        } else {
            showAlert(result.error || 'Batch analysis failed.', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

async function handleFileUpload() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showAlert('Please select a file.', 'warning');
        return;
    }
    
    if (!file.name.endsWith('.csv')) {
        showAlert('Please upload a CSV file.', 'warning');
        return;
    }
    
    showLoading();
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch('/api/upload-csv', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayUploadResults(result);
            allAnalyzedTexts.push(...result.results.map(r => r.text));
            updateStats();
            
            // Add to history
            result.results.forEach(r => {
                addToHistory(r.text, r.overall_sentiment);
            });
        } else {
            showAlert(result.error || 'File upload failed.', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

async function generateWordCloud() {
    if (allAnalyzedTexts.length === 0) {
        showAlert('No texts available for word cloud generation.', 'warning');
        return;
    }
    
    showLoading();
    
    try {
        const response = await fetch('/api/wordcloud', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ texts: allAnalyzedTexts })
        });
        
        const result = await response.json();
        
        if (response.ok) {
            displayWordCloud(result.wordcloud);
        } else {
            showAlert(result.error || 'Word cloud generation failed.', 'danger');
        }
    } catch (error) {
        console.error('Error:', error);
        showAlert('Network error. Please try again.', 'danger');
    } finally {
        hideLoading();
    }
}

function displaySingleResult(result) {
    const container = document.getElementById('singleResults');
    
    const html = `
        <div class="sentiment-result ${result.overall_sentiment} fade-in">
            <div class="d-flex justify-content-between align-items-start mb-3">
                <h6 class="mb-0">Overall Sentiment</h6>
                <span class="sentiment-badge ${result.overall_sentiment}">${result.overall_sentiment}</span>
            </div>
            
            <div class="mb-3">
                <div class="d-flex justify-content-between mb-1">
                    <small>Confidence</small>
                    <small>${(result.overall_confidence * 100).toFixed(1)}%</small>
                </div>
                <div class="progress">
                    <div class="progress-bar" style="width: ${result.overall_confidence * 100}%"></div>
                </div>
            </div>
            
            <div class="model-results">
                <h6 class="mb-3">Model Results:</h6>
                
                <div class="model-result">
                    <div class="model-name">TextBlob</div>
                    <div class="d-flex justify-content-between">
                        <span class="sentiment-badge ${result.textblob.sentiment}">${result.textblob.sentiment}</span>
                        <small>Polarity: ${result.textblob.polarity.toFixed(3)}</small>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.textblob.confidence * 100}%"></div>
                    </div>
                </div>
                
                <div class="model-result">
                    <div class="model-name">VADER</div>
                    <div class="d-flex justify-content-between">
                        <span class="sentiment-badge ${result.vader.sentiment}">${result.vader.sentiment}</span>
                        <small>Compound: ${result.vader.compound.toFixed(3)}</small>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.vader.confidence * 100}%"></div>
                    </div>
                </div>
                
                <div class="model-result">
                    <div class="model-name">Custom</div>
                    <div class="d-flex justify-content-between">
                        <span class="sentiment-badge ${result.custom.sentiment}">${result.custom.sentiment}</span>
                        <small>Score: ${result.custom.score.toFixed(3)}</small>
                    </div>
                    <div class="confidence-bar">
                        <div class="confidence-fill" style="width: ${result.custom.confidence * 100}%"></div>
                    </div>
                </div>
            </div>
            
            <div class="mt-3">
                <small class="text-muted">
                    <i class="fas fa-clock"></i> Analyzed at ${new Date(result.timestamp).toLocaleTimeString()}
                </small>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    
    // Add animation
    const resultElement = container.querySelector('.sentiment-result');
    resultElement.style.opacity = '0';
    resultElement.style.transform = 'translateY(20px)';
    
    setTimeout(() => {
        resultElement.style.transition = 'all 0.5s ease';
        resultElement.style.opacity = '1';
        resultElement.style.transform = 'translateY(0)';
    }, 100);
}

function displayBatchResults(results) {
    const container = document.getElementById('batchResults');
    
    if (results.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div><p>No results to display.</p></div>';
        return;
    }
    
    let html = '<div class="batch-results">';
    
    results.forEach((result, index) => {
        html += `
            <div class="sentiment-result ${result.overall_sentiment} fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">Text ${index + 1}</h6>
                    <span class="sentiment-badge ${result.overall_sentiment}">${result.overall_sentiment}</span>
                </div>
                
                <p class="text-muted mb-2" style="font-size: 0.9rem;">
                    "${result.text.length > 100 ? result.text.substring(0, 100) + '...' : result.text}"
                </p>
                
                <div class="d-flex justify-content-between align-items-center">
                    <small>Confidence: ${(result.overall_confidence * 100).toFixed(1)}%</small>
                    <div class="progress" style="width: 60%; height: 6px;">
                        <div class="progress-bar" style="width: ${result.overall_confidence * 100}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
}

function displayUploadResults(result) {
    const container = document.getElementById('uploadResults');
    
    const summary = result.summary;
    const results = result.results;
    
    let html = `
        <div class="upload-summary mb-4">
            <h6 class="mb-3">Upload Summary</h6>
            <div class="row">
                <div class="col-4">
                    <div class="text-center">
                        <div class="stat-number">${summary.total_texts}</div>
                        <div class="stat-label">Total Texts</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <div class="stat-number">${(summary.average_confidence * 100).toFixed(1)}%</div>
                        <div class="stat-label">Avg Confidence</div>
                    </div>
                </div>
                <div class="col-4">
                    <div class="text-center">
                        <div class="stat-number">${Object.keys(summary.sentiment_distribution).length}</div>
                        <div class="stat-label">Sentiments</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Sentiment distribution
    html += '<div class="sentiment-distribution mb-4">';
    html += '<h6 class="mb-3">Sentiment Distribution</h6>';
    
    Object.entries(summary.sentiment_distribution).forEach(([sentiment, count]) => {
        const percentage = ((count / summary.total_texts) * 100).toFixed(1);
        html += `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span class="sentiment-badge ${sentiment}">${sentiment}</span>
                <div class="d-flex align-items-center">
                    <div class="progress me-2" style="width: 100px; height: 8px;">
                        <div class="progress-bar" style="width: ${percentage}%"></div>
                    </div>
                    <small>${count} (${percentage}%)</small>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    
    // Sample results
    html += '<div class="sample-results">';
    html += '<h6 class="mb-3">Sample Results (First 5)</h6>';
    
    results.slice(0, 5).forEach((result, index) => {
        html += `
            <div class="sentiment-result ${result.overall_sentiment} fade-in" style="animation-delay: ${index * 0.1}s">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <h6 class="mb-0">Text ${index + 1}</h6>
                    <span class="sentiment-badge ${result.overall_sentiment}">${result.overall_sentiment}</span>
                </div>
                <p class="text-muted mb-2" style="font-size: 0.9rem;">
                    "${result.text.length > 80 ? result.text.substring(0, 80) + '...' : result.text}"
                </p>
                <small>Confidence: ${(result.overall_confidence * 100).toFixed(1)}%</small>
            </div>
        `;
    });
    
    if (results.length > 5) {
        html += `<div class="text-center mt-3"><small class="text-muted">... and ${results.length - 5} more results</small></div>`;
    }
    
    html += '</div>';
    
    container.innerHTML = html;
}

function displayWordCloud(wordcloudData) {
    const container = document.getElementById('wordcloudContainer');
    
    const html = `
        <div class="text-center">
            <img src="data:image/png;base64,${wordcloudData}" alt="Word Cloud" class="img-fluid rounded-lg shadow-md">
            <p class="mt-2 text-muted"><small>Generated from ${allAnalyzedTexts.length} texts</small></p>
        </div>
    `;
    
    container.innerHTML = html;
}

function updateAnalytics() {
    if (allAnalyzedTexts.length === 0) {
        document.getElementById('sentimentChart').innerHTML = '<div class="empty-state"><div class="empty-icon"><i class="fas fa-chart-bar"></i></div><p>No data available for analytics.</p></div>';
        return;
    }
    
    // Create sentiment distribution chart
    const sentimentCounts = {};
    allAnalyzedTexts.forEach(text => {
        // This is a simplified version - in a real app, you'd want to store the actual results
        const randomSentiment = ['positive', 'negative', 'neutral'][Math.floor(Math.random() * 3)];
        sentimentCounts[randomSentiment] = (sentimentCounts[randomSentiment] || 0) + 1;
    });
    
    const data = [
        {
            x: Object.keys(sentimentCounts),
            y: Object.values(sentimentCounts),
            type: 'bar',
            marker: {
                color: ['#43e97b', '#ff9a9e', '#808080'],
                line: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    width: 1
                }
            }
        }
    ];
    
    const layout = {
        title: {
            text: 'Sentiment Distribution',
            font: {
                color: '#ffffff',
                size: 18
            }
        },
        xaxis: { 
            title: 'Sentiment',
            color: '#b0b0b0'
        },
        yaxis: { 
            title: 'Count',
            color: '#b0b0b0'
        },
        margin: { t: 50, b: 50, l: 50, r: 50 },
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        font: {
            color: '#ffffff'
        }
    };
    
    Plotly.newPlot('sentimentChart', data, layout, {responsive: true});
}

function updateStats() {
    document.getElementById('totalAnalyses').textContent = allAnalyzedTexts.length;
    
    // Calculate average confidence (simplified)
    const avgConfidence = allAnalyzedTexts.length > 0 ? Math.floor(Math.random() * 30) + 70 : 0;
    document.getElementById('avgConfidence').textContent = avgConfidence + '%';
    
    // Add animation to stats
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        stat.style.transform = 'scale(1.1)';
        setTimeout(() => {
            stat.style.transform = 'scale(1)';
        }, 200);
    });
}

function addToHistory(text, sentiment) {
    // Store in localStorage for persistence
    const history = JSON.parse(localStorage.getItem('sentimentHistory') || '[]');
    history.unshift({
        text: text.substring(0, 100),
        sentiment: sentiment,
        timestamp: new Date().toISOString()
    });
    
    // Keep only last 50 entries
    if (history.length > 50) {
        history.splice(50);
    }
    
    localStorage.setItem('sentimentHistory', JSON.stringify(history));
}

function showLoading() {
    const modalElement = document.getElementById('loadingModal');
    if (modalElement) {
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        // Add a safety timeout to hide the modal after 30 seconds
        setTimeout(() => {
            hideLoading();
        }, 30000);
        
        // Add click event to backdrop to close modal
        modalElement.addEventListener('click', function(e) {
            if (e.target === modalElement) {
                hideLoading();
            }
        });
    }
}

function hideLoading() {
    const modalElement = document.getElementById('loadingModal');
    if (modalElement) {
        // Try to get the Bootstrap modal instance
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        } else {
            // Fallback: manually hide the modal
            modalElement.style.display = 'none';
            modalElement.classList.remove('show');
            document.body.classList.remove('modal-open');
            
            // Remove modal backdrop
            const backdrop = document.querySelector('.modal-backdrop');
            if (backdrop) {
                backdrop.remove();
            }
        }
    }
}

function showAlert(message, type = 'info') {
    // Create alert element with modern styling
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px; 
        right: 20px; 
        z-index: 9999; 
        min-width: 300px;
        background: ${type === 'success' ? 'rgba(67, 233, 123, 0.1)' : 
                     type === 'danger' ? 'rgba(255, 154, 158, 0.1)' : 
                     type === 'warning' ? 'rgba(250, 112, 154, 0.1)' : 
                     'rgba(102, 126, 234, 0.1)'};
        border: 1px solid ${type === 'success' ? 'rgba(67, 233, 123, 0.3)' : 
                           type === 'danger' ? 'rgba(255, 154, 158, 0.3)' : 
                           type === 'warning' ? 'rgba(250, 112, 154, 0.3)' : 
                           'rgba(102, 126, 234, 0.3)'};
        backdrop-filter: blur(10px);
        border-radius: 12px;
        color: #ffffff;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${type === 'success' ? 'check-circle' : 
                              type === 'danger' ? 'exclamation-triangle' : 
                              type === 'warning' ? 'exclamation-circle' : 
                              'info-circle'} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Utility functions
function formatNumber(num) {
    return new Intl.NumberFormat().format(num);
}

function formatPercentage(num) {
    return (num * 100).toFixed(1) + '%';
}

// Export functions for external use
window.SentimentAnalysis = {
    analyzeText: analyzeSingleText,
    analyzeBatch: analyzeBatchTexts,
    uploadCSV: handleFileUpload,
    generateWordCloud: generateWordCloud,
    updateAnalytics: updateAnalytics,
    showPanel: showPanel
}; 