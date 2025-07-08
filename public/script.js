class CodeSentryApp {
  constructor() {
    this.elements = {
      statusIndicator: document.getElementById('status-indicator'),
      statusText: document.getElementById('status-text'),
      gitDiffInput: document.getElementById('git-diff-input'),
      analyzeBtn: document.getElementById('analyze-btn'),
      demoBtn: document.getElementById('demo-btn'),
      clearBtn: document.getElementById('clear-btn'),
      outputContainer: document.getElementById('output-container'),
      charCount: document.getElementById('char-count'),
      analysisTime: document.getElementById('analysis-time'),
      btnText: document.querySelector('.btn-text'),
      loadingSpinner: document.querySelector('.loading-spinner')
    };

    this.serverOnline = false;
    this.initializeEventListeners();
    this.checkServerStatus();
    
    // Check server status every 30 seconds
    setInterval(() => this.checkServerStatus(), 30000);
  }

  initializeEventListeners() {
    this.elements.analyzeBtn.addEventListener('click', () => this.analyzeCode());
    this.elements.demoBtn.addEventListener('click', () => this.loadDemo());
    this.elements.clearBtn.addEventListener('click', () => this.clearAll());
    
    this.elements.gitDiffInput.addEventListener('input', () => {
      this.updateCharCount();
    });
    
    // Keyboard shortcuts
    this.elements.gitDiffInput.addEventListener('keydown', (e) => {
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

  updateCharCount() {
    const text = this.elements.gitDiffInput.value;
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
        this.showNotification('✅ Demo carregado e analisado com sucesso!', 'success');
      } else {
        this.showError('Erro ao carregar demo', data.error);
      }
    } catch (error) {
      this.showError('Erro de conexão', 'Não foi possível carregar o demo.');
    }
  }

  async analyzeCode() {
    const gitDiff = this.elements.gitDiffInput.value.trim();
    
    if (!gitDiff) {
      this.showNotification('⚠️ Por favor, insira um git diff para análise.', 'warning');
      return;
    }

    if (!this.serverOnline) {
      this.showError('Erro de conexão', 'Servidor offline. Verifique a conexão.');
      return;
    }

    this.setLoadingState(true);
    const startTime = Date.now();

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gitDiff })
      });

      const data = await response.json();
      const analysisTime = Date.now() - startTime;

      if (data.success) {
        this.displayResults(data);
        this.elements.analysisTime.textContent = `Análise concluída em ${analysisTime}ms`;
        this.showNotification('✅ Análise concluída com sucesso!', 'success');
      } else {
        this.showError('Erro na análise', data.error);
      }

    } catch (error) {
      this.showError('Erro de conexão', 'Falha na comunicação com o servidor.');
    } finally {
      this.setLoadingState(false);
    }
  }

  displayResults(data) {
    const result = data.data;
    
    this.elements.outputContainer.innerHTML = `
      <div class="result-container">
        ${this.createResultCard('🧠 Análise Semântica', result.semanticResult)}
        ${result.patterns ? this.createPatternsCard(result.patterns) : ''}
        ${result.context ? this.createResultCard('📚 Contexto', result.context) : ''}
        ${result.stats ? this.createStatsCard(result.stats, result.metadata) : ''}
      </div>
    `;
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
        <div class="result-header">🔍 Padrões Detectados</div>
        <div class="result-content">
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--success);">✅ Padrões (${patterns.patterns?.length || 0})</h4>
            <pre>${this.escapeHtml(JSON.stringify(patterns.patterns || [], null, 2))}</pre>
          </div>
          
          <div style="margin-bottom: 1.5rem;">
            <h4 style="margin-bottom: 0.5rem; color: var(--warning);">⚠️ Antipadrões (${patterns.antipatterns?.length || 0})</h4>
            <pre>${this.escapeHtml(JSON.stringify(patterns.antipatterns || [], null, 2))}</pre>
          </div>
          
          ${patterns.ragInsights?.length > 0 ? `
          <div>
            <h4 style="margin-bottom: 0.5rem; color: var(--primary);">💡 Insights RAG (${patterns.ragInsights.length})</h4>
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
        <div class="result-header">📊 Estatísticas</div>
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
            ${metadata?.analysisTime ? `
            <div class="stat-item">
              <div class="stat-label">Tempo de Análise</div>
              <div class="stat-value">${metadata.analysisTime}</div>
            </div>
            ` : ''}
            <div class="stat-item">
              <div class="stat-label">RAG Status</div>
              <div class="stat-value ${metadata?.ragInitialized ? 'success' : 'warning'}">
                ${metadata?.ragInitialized ? 'Ativo' : 'Inativo'}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  showError(title, message) {
    this.elements.outputContainer.innerHTML = `
      <div class="error-container">
        <div class="error-title">❌ ${title}</div>
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
    this.updateCharCount();
    this.elements.analysisTime.textContent = '';
    
    this.elements.outputContainer.innerHTML = `
      <div class="welcome-state">
        <div class="welcome-icon">🚀</div>
        <h3>Bem-vindo ao CodeSentry!</h3>
        <p>Cole um git diff no campo ao lado e clique em "Analisar Código" para começar a análise.</p>
        
        <div class="features">
          <div class="feature">
            <span class="feature-icon">🧠</span>
            <div>
              <strong>Análise Semântica</strong>
              <p>IA avançada para entender seu código</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🔍</span>
            <div>
              <strong>Detecção de Padrões</strong>
              <p>Identifica boas práticas e antipadrões</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">📚</span>
            <div>
              <strong>RAG Integration</strong>
              <p>Base de conhecimento local</p>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.elements.gitDiffInput.focus();
  }

  setLoadingState(loading) {
    this.elements.analyzeBtn.disabled = loading;
    this.elements.demoBtn.disabled = loading;
    
    if (loading) {
      this.elements.btnText.textContent = 'Analisando...';
      this.elements.loadingSpinner.style.display = 'inline-block';
    } else {
      this.elements.btnText.textContent = 'Analisar Código';
      this.elements.loadingSpinner.style.display = 'none';
    }
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

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new CodeSentryApp();
});