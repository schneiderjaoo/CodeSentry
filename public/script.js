class CodeSentryApp {
  constructor() {
    this.elements = {
      statusIndicator: document.getElementById('status-indicator'),
      statusText: document.getElementById('status-text'),
      gitDiffInput: document.getElementById('git-diff-input'),
      commitDiffInput: document.getElementById('commit-diff-input'),
      refactoringDiffInput: document.getElementById('refactoring-diff-input'),
      commitMessage: document.getElementById('commit-message'),
      commitHash: document.getElementById('commit-hash'),
      beforeCode: document.getElementById('before-code'),
      afterCode: document.getElementById('after-code'),
      analyzeBtn: document.getElementById('analyze-btn'),
      demoBtn: document.getElementById('demo-btn'),
      clearBtn: document.getElementById('clear-btn'),
      statsBtn: document.getElementById('stats-btn'),
      outputContainer: document.getElementById('output-container'),
      charCount: document.getElementById('char-count'),
      analysisTime: document.getElementById('analysis-time'),
      btnText: document.querySelector('.btn-text'),
      loadingSpinner: document.querySelector('.loading-spinner'),
      tabBtns: document.querySelectorAll('.tab-btn'),
      tabContents: document.querySelectorAll('.tab-content')
    };

    this.serverOnline = false;
    this.currentTab = 'diff';
    this.initializeEventListeners();
    this.checkServerStatus();
    
    // Check server status every 30 seconds
    setInterval(() => this.checkServerStatus(), 30000);
  }

  initializeEventListeners() {
    this.elements.analyzeBtn.addEventListener('click', () => this.analyzeCode());
    this.elements.demoBtn.addEventListener('click', () => this.loadDemo());
    this.elements.clearBtn.addEventListener('click', () => this.clearAll());
    this.elements.statsBtn.addEventListener('click', () => this.loadStats());
    
    // Tab switching
    this.elements.tabBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
    });
    
    // Input listeners
    this.elements.gitDiffInput.addEventListener('input', () => this.updateCharCount());
    this.elements.commitDiffInput.addEventListener('input', () => this.updateCharCount());
    this.elements.refactoringDiffInput.addEventListener('input', () => this.updateCharCount());
    
    // Keyboard shortcuts
    this.elements.gitDiffInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.analyzeCode();
      }
    });
    
    this.elements.commitDiffInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.analyzeCode();
      }
    });
    
    this.elements.refactoringDiffInput.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        this.analyzeCode();
      }
    });
  }

  async checkServerStatus() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      if (data.status === 'online') {
        this.updateStatus(true, `Online (RAG: ${data.ragInitialized ? 'Ativo' : 'Inativo'})`);
      } else {
        this.updateStatus(false, 'Offline');
      }
    } catch (error) {
      this.updateStatus(false, 'Desconectado');
    }
  }

  updateStatus(online, text) {
    this.serverOnline = online;
    this.elements.statusIndicator.className = `status-indicator ${online ? 'online' : 'offline'}`;
    this.elements.statusText.textContent = text;
  }

  switchTab(tabName) {
    this.currentTab = tabName;
    
    // Update tab buttons
    this.elements.tabBtns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Update tab contents
    this.elements.tabContents.forEach(content => {
      content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Update character count
    this.updateCharCount();
  }

  updateCharCount() {
    let text = '';
    switch (this.currentTab) {
      case 'diff':
        text = this.elements.gitDiffInput.value;
        break;
      case 'commit':
        text = this.elements.commitDiffInput.value;
        break;
      case 'refactoring':
        text = this.elements.refactoringDiffInput.value;
        break;
    }
    this.elements.charCount.textContent = `${text.length} caracteres`;
  }

  async loadDemo() {
    try {
      const response = await fetch('/api/demo');
      const data = await response.json();
      
      if (data.success) {
        // Simulate the demo git diff for display
        const demoGitDiff = `diff --git a/index.js b/index.js
index e69de29..f3c2a1b 100644
--- a/index.js
+++ b/index.js
@@ -0,0 +1,5 @@
+function greet(name) {
+  console.log("Hello, " + name) 
+}
+
+greet("Hello, world!");`;
        
        this.elements.gitDiffInput.value = demoGitDiff;
        this.updateCharCount();
        this.displayResults(data);
        this.showNotification('? Demo carregado e analisado com sucesso!', 'success');
      } else {
        this.showError('Erro ao carregar demo', data.error);
      }
    } catch (error) {
      this.showError('Erro de conexão', 'Não foi possível carregar o demo.');
    }
  }

  async analyzeCode() {
    let gitDiff = '';
    let endpoint = '/api/analyze';
    let body = {};
    
    switch (this.currentTab) {
      case 'diff':
        gitDiff = this.elements.gitDiffInput.value.trim();
        body = { gitDiff };
        break;
      case 'commit':
        gitDiff = this.elements.commitDiffInput.value.trim();
        const commitMessage = this.elements.commitMessage.value.trim();
        const commitHash = this.elements.commitHash.value.trim();
        endpoint = '/api/analyze-commit';
        body = { gitDiff, commitMessage, commitHash };
        break;
      case 'refactoring':
        gitDiff = this.elements.refactoringDiffInput.value.trim();
        const beforeCode = this.elements.beforeCode.value.trim();
        const afterCode = this.elements.afterCode.value.trim();
        endpoint = '/api/analyze-refactoring';
        body = { gitDiff, beforeCode, afterCode };
        break;
    }
    
    if (!gitDiff) {
      this.showNotification('?? Por favor, insira um git diff para análise.', 'warning');
      return;
    }

    if (!this.serverOnline) {
      this.showError('Erro de conexão', 'Servidor offline. Verifique a conexão.');
      return;
    }

    this.setLoadingState(true);
    const startTime = Date.now();

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();
      const analysisTime = Date.now() - startTime;

      if (data.success) {
        this.displayResults(data);
        this.elements.analysisTime.textContent = `Análise concluída em ${analysisTime}ms`;
        this.showNotification('? Análise concluída com sucesso!', 'success');
      } else {
        this.showError('Erro na análise', data.error);
      }

    } catch (error) {
      this.showError('Erro de conexão', 'Falha na comunicação com o servidor.');
    } finally {
      this.setLoadingState(false);
    }
  }

  async loadStats() {
    if (!this.serverOnline) {
      this.showError('Erro de conexão', 'Servidor offline. Verifique a conexão.');
      return;
    }

    this.setLoadingState(true);

    try {
      const [commitStats, refactoringStats] = await Promise.all([
        fetch('/api/commit-stats').then(r => r.json()),
        fetch('/api/refactoring-stats').then(r => r.json())
      ]);

      this.displayStats(commitStats, refactoringStats);
      this.showNotification('? Estatísticas carregadas com sucesso!', 'success');

    } catch (error) {
      this.showError('Erro de conexão', 'Falha ao carregar estatísticas.');
    } finally {
      this.setLoadingState(false);
    }
  }

  displayResults(data) {
    const result = data.data;
    
    let html = '<div class="result-container">';
    
    // Display based on analysis type
    if (result.commitAnalysis) {
      html += this.createCommitAnalysisCard(result.commitAnalysis);
    }
    
    if (result.refactoringAnalysis) {
      html += this.createRefactoringAnalysisCard(result.refactoringAnalysis);
    }
    
    // Standard analysis results
    if (result.semanticResult) {
      html += this.createResultCard('?? Análise Semântica', result.semanticResult);
    }
    
    if (result.patterns) {
      html += this.createPatternsCard(result.patterns);
    }
    
    if (result.context) {
      html += this.createResultCard('?? Contexto', result.context);
    }
    
    if (result.stats) {
      html += this.createStatsCard(result.stats, result.metadata);
    }
    
    html += '</div>';
    
    this.elements.outputContainer.innerHTML = html;
  }

  createCommitAnalysisCard(analysis) {
    return `
      <div class="result-card">
        <div class="result-header">?? Análise de Commit</div>
        <div class="result-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Tipo de Commit</div>
              <div class="stat-value">${analysis.classification}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Tipo de Refatoração</div>
              <div class="stat-value">${analysis.refactoringType || 'N/A'}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Mudança de Complexidade</div>
              <div class="stat-value">${analysis.complexityChange}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Score de Risco</div>
              <div class="stat-value ${analysis.riskScore > 0.7 ? 'warning' : 'success'}">${(analysis.riskScore * 100).toFixed(1)}%</div>
            </div>
          </div>
          
          ${analysis.suggestions?.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">?? Sugestões</h4>
            <ul style="margin-left: 1rem;">
              ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.patterns?.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">?? Padrões Detectados</h4>
            <ul style="margin-left: 1rem;">
              ${analysis.patterns.map(p => `<li>${p}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  createRefactoringAnalysisCard(analysis) {
    return `
      <div class="result-card">
        <div class="result-header">?? Análise de Refatoração</div>
        <div class="result-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Tipo de Refatoração</div>
              <div class="stat-value">${analysis.refactoringType}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Confiança</div>
              <div class="stat-value">${(analysis.confidence * 100).toFixed(1)}%</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Complexidade Antes</div>
              <div class="stat-value">${analysis.complexity.before}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Complexidade Depois</div>
              <div class="stat-value">${analysis.complexity.after}</div>
            </div>
          </div>
          
          ${analysis.improvements?.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--success);">? Melhorias</h4>
            <ul style="margin-left: 1rem;">
              ${analysis.improvements.map(i => `<li>${i}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.risks?.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--warning);">?? Riscos</h4>
            <ul style="margin-left: 1rem;">
              ${analysis.risks.map(r => `<li>${r}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
          
          ${analysis.suggestions?.length > 0 ? `
          <div style="margin-top: 1rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">?? Sugestões</h4>
            <ul style="margin-left: 1rem;">
              ${analysis.suggestions.map(s => `<li>${s}</li>`).join('')}
            </ul>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  displayStats(commitStats, refactoringStats) {
    const html = `
      <div class="result-container">
        <div class="result-card">
          <div class="result-header">?? Estatísticas de Commits</div>
          <div class="result-content">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total de Commits</div>
                <div class="stat-value">${commitStats.data?.totalCommits || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Score de Risco Médio</div>
                <div class="stat-value">${((commitStats.data?.averageRiskScore || 0) * 100).toFixed(1)}%</div>
              </div>
            </div>
            
            ${commitStats.data?.byType ? `
            <div style="margin-top: 1rem;">
              <h4 style="margin-bottom: 0.5rem;">Por Tipo</h4>
              <pre>${this.escapeHtml(JSON.stringify(commitStats.data.byType, null, 2))}</pre>
            </div>
            ` : ''}
          </div>
        </div>
        
        <div class="result-card">
          <div class="result-header">?? Estatísticas de Refatoração</div>
          <div class="result-content">
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total de Refatorações</div>
                <div class="stat-value">${refactoringStats.data?.totalRefactorings || 0}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Mudança de Complexidade Média</div>
                <div class="stat-value">${(refactoringStats.data?.averageComplexityChange || 0).toFixed(2)}</div>
              </div>
            </div>
            
            ${refactoringStats.data?.byType ? `
            <div style="margin-top: 1rem;">
              <h4 style="margin-bottom: 0.5rem;">Por Tipo</h4>
              <pre>${this.escapeHtml(JSON.stringify(refactoringStats.data.byType, null, 2))}</pre>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
    
    this.elements.outputContainer.innerHTML = html;
  }

  createResultCard(title, content) {
    return `
      <div class="result-card">
        <div class="result-header">${title}</div>
        <div class="result-content">
          <pre>${this.escapeHtml(JSON.stringify(content, null, 2))}</pre>
        </div>
      </div>
    `;
  }

  createPatternsCard(patterns) {
    return `
      <div class="result-card">
        <div class="result-header">?? Padrões Detectados</div>
        <div class="result-content">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--success);">? Padrões (${patterns.patterns?.length || 0})</h4>
            <pre>${this.escapeHtml(JSON.stringify(patterns.patterns || [], null, 2))}</pre>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--warning);">?? Antipadrões (${patterns.antipatterns?.length || 0})</h4>
            <pre>${this.escapeHtml(JSON.stringify(patterns.antipatterns || [], null, 2))}</pre>
          </div>
          
          ${patterns.ragInsights?.length > 0 ? `
          <div>
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">?? Insights RAG (${patterns.ragInsights.length})</h4>
            <pre>${this.escapeHtml(JSON.stringify(patterns.ragInsights, null, 2))}</pre>
          </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  createStatsCard(stats, metadata) {
    return `
      <div class="result-card">
        <div class="result-header">?? Estatísticas</div>
        <div class="result-content">
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Arquivos Analisados</div>
              <div class="stat-value">${stats.filesAnalyzed}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">RAG Enriquecido</div>
              <div class="stat-value">${stats.ragEnhanced}</div>
            </div>
            ${stats.commitType ? `
            <div class="stat-item">
              <div class="stat-label">Tipo de Commit</div>
              <div class="stat-value">${stats.commitType}</div>
            </div>
            ` : ''}
            ${stats.refactoringType ? `
            <div class="stat-item">
              <div class="stat-label">Tipo de Refatoração</div>
              <div class="stat-value">${stats.refactoringType}</div>
            </div>
            ` : ''}
            ${stats.confidence ? `
            <div class="stat-item">
              <div class="stat-label">Confiança</div>
              <div class="stat-value">${(stats.confidence * 100).toFixed(1)}%</div>
            </div>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  showError(title, message) {
    this.elements.outputContainer.innerHTML = `
      <div class="error-container">
        <div class="error-title">? ${title}</div>
        <div class="error-message">${message}</div>
      </div>
    `;
  }

  showNotification(message, type = 'info') {
    // Simple notification - you could enhance this with a toast system
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  clearAll() {
    this.elements.gitDiffInput.value = '';
    this.elements.commitDiffInput.value = '';
    this.elements.refactoringDiffInput.value = '';
    this.elements.commitMessage.value = '';
    this.elements.commitHash.value = '';
    this.elements.beforeCode.value = '';
    this.elements.afterCode.value = '';
    this.updateCharCount();
    this.elements.analysisTime.textContent = '';
    
    this.elements.outputContainer.innerHTML = `
      <div class="welcome-state">
        <div class="welcome-icon">??</div>
        <h3>Bem-vindo ao CodeSentry Avançado!</h3>
        <p>Escolha um tipo de análise e cole o código para começar.</p>
        
        <div class="features">
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>Análise Semântica</strong>
              <p>IA avançada para entender seu código</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>Detecção de Padrões</strong>
              <p>Identifica boas práticas e antipadrões</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>RAG Avançado</strong>
              <p>Base de conhecimento com embeddings</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>Classificação de Commits</strong>
              <p>Análise automática de tipos de commit</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>Análise de Refatoração</strong>
              <p>Detecção de padrões de refatoração</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">??</span>
            <div>
              <strong>Métricas de Qualidade</strong>
              <p>Complexidade e risco calculados</p>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setLoadingState(loading) {
    this.elements.analyzeBtn.disabled = loading;
    this.elements.btnText.textContent = loading ? 'Analisando...' : 'Analisar Código';
    this.elements.loadingSpinner.style.display = loading ? 'inline-block' : 'none';
  }

  escapeHtml(unsafe) {
    return unsafe
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CodeSentryApp();
});