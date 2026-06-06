import { useState, useEffect } from 'react';

export default function Home() {
  const [theme, setTheme] = useState('dark');
  const [config, setConfig] = useState({
    jiraUrl: '',
    jiraEmail: '',
    jiraToken: '',
    jiraIssueId: '',
    groqApiKey: '',
    groqModel: 'openai/gpt-oss-120b'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentStep, setCurrentStep] = useState(1); // 1: Config, 2: Fetched, 3: Generated

  const [issueData, setIssueData] = useState(null);
  const [strategyData, setStrategyData] = useState(null);

  // Apply Theme class to HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleConfigChange = (e) => {
    const { name, value } = e.target;
    setConfig(prev => ({ ...prev, [name]: value }));
  };

  // Step 1: Fetch JIRA Issue details
  const handleFetchIssue = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch-issue',
          config: config
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to fetch issue details.');
      }

      const issue = await response.json();
      setIssueData(issue);
      setCurrentStep(2);
      setSuccess(`Successfully retrieved issue ${issue.key} from JIRA!`);
    } catch (err) {
      setError(err.message || 'An error occurred while communicating with JIRA API.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate Test Strategy using Groq
  const handleGenerateStrategy = async () => {
    if (!issueData) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-strategy',
          config: config,
          issueData: issueData
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to generate test strategy.');
      }

      const strategy = await response.json();
      setStrategyData(strategy);
      setCurrentStep(3);
      setSuccess('Test Strategy generated successfully by Groq LLM!');
    } catch (err) {
      setError(err.message || 'An error occurred during LLM strategy generation.');
    } finally {
      setLoading(false);
    }
  };

  // Handle local text editing of generated strategy fields
  const handleFieldChange = (field, value) => {
    setStrategyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScopeChange = (subField, index, value) => {
    setStrategyData(prev => {
      const newScope = { ...prev.scope };
      newScope[subField][index] = value;
      return { ...prev, scope: newScope };
    });
  };

  const addScopeItem = (subField) => {
    setStrategyData(prev => {
      const newScope = { ...prev.scope };
      newScope[subField] = [...(newScope[subField] || []), ''];
      return { ...prev, scope: newScope };
    });
  };

  const handleFocusAreaChange = (index, key, value) => {
    setStrategyData(prev => {
      const newFocus = [...prev.focusAreas];
      newFocus[index] = { ...newFocus[index], [key]: value };
      return { ...prev, focusAreas: newFocus };
    });
  };

  const handleArrayFieldChange = (field, index, value) => {
    setStrategyData(prev => {
      const newArr = [...prev[field]];
      newArr[index] = value;
      return { ...prev, [field]: newArr };
    });
  };

  const addArrayItem = (field) => {
    setStrategyData(prev => ({
      ...prev,
      [field]: [...(prev[field] || []), '']
    }));
  };

  const handleScheduleChange = (index, value) => {
    setStrategyData(prev => {
      const newSchedule = [...prev.teamAndSchedule.schedule];
      newSchedule[index] = value;
      return {
        ...prev,
        teamAndSchedule: { ...prev.teamAndSchedule, schedule: newSchedule }
      };
    });
  };

  const addScheduleItem = () => {
    setStrategyData(prev => ({
      ...prev,
      teamAndSchedule: {
        ...prev.teamAndSchedule,
        schedule: [...(prev.teamAndSchedule.schedule || []), '']
      }
    }));
  };

  // Step 3: Send strategy JSON to backend to create and download .docx
  const handleDownloadDocx = async () => {
    if (!strategyData) return;
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'download-docx',
          strategyData: strategyData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to package Word document.');
      }

      // Handle download stream
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${strategyData.title.replace(/\s+/g, '_') || 'test_strategy'}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      setSuccess('Word document download initiated!');
    } catch (err) {
      setError(err.message || 'An error occurred while building the Word document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      {/* Header Panel */}
      <header className="header">
        <div className="logo-section">
          <div className="logo-icon">B</div>
          <div>
            <h1>BLAST QA Architect</h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              Deterministic Test Strategy Automation
            </p>
          </div>
        </div>

        <button 
          onClick={toggleTheme} 
          className="theme-toggle" 
          title="Toggle Light/Dark Theme"
          aria-label="Toggle Light/Dark Theme"
          id="theme-toggle-btn"
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </header>

      {/* Progress Step Tracker */}
      <div className="step-tracker">
        <div className={`step-node ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 1 ? '✓' : '1'}</div>
          <div className="step-label">Configuration</div>
        </div>
        <div className={`step-node ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
          <div className="step-circle">{currentStep > 2 ? '✓' : '2'}</div>
          <div className="step-label">JIRA Verification</div>
        </div>
        <div className={`step-node ${currentStep >= 3 ? 'active' : ''}`}>
          <div className="step-circle">3</div>
          <div className="step-label">Strategy Generator</div>
        </div>
      </div>

      {/* Main Grid */}
      <main className="dashboard-grid">
        {/* Left Hand: Controls & Inputs */}
        <aside className="card" id="config-panel">
          <h2 className="card-title">🔌 Connection details</h2>
          
          <form onSubmit={handleFetchIssue} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="form-group">
              <label htmlFor="jiraUrl">Jira Base URL</label>
              <input 
                type="url" 
                id="jiraUrl" 
                name="jiraUrl" 
                placeholder="https://company.atlassian.net" 
                value={config.jiraUrl} 
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="jiraEmail">Jira Mail ID</label>
              <input 
                type="email" 
                id="jiraEmail" 
                name="jiraEmail" 
                placeholder="user@company.com" 
                value={config.jiraEmail} 
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="jiraToken">Jira API Token</label>
              <input 
                type="password" 
                id="jiraToken" 
                name="jiraToken" 
                placeholder="••••••••••••••••••••" 
                value={config.jiraToken} 
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="jiraIssueId">JIRA Issue ID</label>
              <input 
                type="text" 
                id="jiraIssueId" 
                name="jiraIssueId" 
                placeholder="PROJ-101" 
                value={config.jiraIssueId} 
                onChange={handleConfigChange}
                required
              />
            </div>

            <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '0.25rem 0' }} />

            <div className="form-group">
              <label htmlFor="groqApiKey">Groq API Key</label>
              <input 
                type="password" 
                id="groqApiKey" 
                name="groqApiKey" 
                placeholder="gsk_••••••••••••••••" 
                value={config.groqApiKey} 
                onChange={handleConfigChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="groqModel">Groq LLM Model</label>
              <select
                id="groqModel"
                name="groqModel"
                value={config.groqModel}
                onChange={handleConfigChange}
              >
                <option value="openai/gpt-oss-120b">openai/gpt-oss-120b</option>
                <option value="llama-3.1-70b-versatile">llama-3.1-70b-versatile</option>
                <option value="llama3-70b-8192">llama3-70b-8192</option>
                <option value="llama3-8b-8192">llama3-8b-8192</option>
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                className={`btn btn-primary ${loading && currentStep === 1 ? 'btn-pulse' : ''}`}
                disabled={loading}
                id="fetch-issue-btn"
              >
                {loading && currentStep === 1 ? <div className="spinner"></div> : '1. Verify & Fetch Issue'}
              </button>

              <button 
                type="button" 
                className={`btn btn-secondary ${loading && currentStep === 2 ? 'btn-pulse' : ''}`}
                disabled={loading || currentStep < 2}
                onClick={handleGenerateStrategy}
                id="generate-strategy-btn"
              >
                {loading && currentStep === 2 ? <div className="spinner spinner-primary"></div> : '2. Generate Test Strategy'}
              </button>
            </div>
          </form>
        </aside>

        {/* Right Hand: Workspace & Results */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Notifications panel */}
          {error && (
            <div className="alert alert-error animate-fade-in" id="error-alert">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}
          
          {success && (
            <div className="alert alert-success animate-fade-in" id="success-alert">
              <span>✓</span>
              <div>{success}</div>
            </div>
          )}

          {/* Core Interactive Panel */}
          {currentStep === 1 && (
            <div className="card animate-fade-in">
              <h2 className="card-title">📖 BLAST Workspace Console</h2>
              <div className="alert alert-info">
                <span>ℹ️</span>
                <div>
                  <strong>Configuration Phase:</strong> Please fill in your JIRA Cloud connection details and your OpenAI-compatible Groq API Key on the sidebar panel. 
                  <br /><br />
                  <em>Note: If you do not have active credentials yet, you can enter dummy placeholder values, and the application will load a mock workspace for local evaluation.</em>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                <p>The application automatically coordinates steps based on the BLAST architectural guidelines:</p>
                <ol style={{ paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <li><strong>Link:</strong> Initiates connectivity handshake, parsing credentials securely.</li>
                  <li><strong>Architect:</strong> Reads the issue body (handling ADF format recursively) and compiles issue context.</li>
                  <li><strong>Stylize:</strong> Generates a full 9-section enterprise-grade strategy document and outputs a preview for adjustments.</li>
                  <li><strong>Trigger:</strong> Exports the strategy to a structured <code>.docx</code> format matching the reference template.</li>
                </ol>
              </div>
            </div>
          )}

          {currentStep === 2 && issueData && (
            <div className="card animate-fade-in" id="issue-workspace">
              <h2 className="card-title">📋 Step 2: Verify Issue Details</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
                  <strong>Key: {issueData.key}</strong>
                  <span style={{ color: 'var(--primary)', fontWeight: '600' }}>Project: {issueData.project}</span>
                </div>
                
                <div className="form-group">
                  <label>Summary / Title</label>
                  <input 
                    type="text" 
                    value={issueData.summary} 
                    onChange={(e) => setIssueData(prev => ({ ...prev, summary: e.target.value }))}
                  />
                </div>

                <div className="form-group">
                  <label>Description & Acceptance Criteria</label>
                  <textarea 
                    value={issueData.description} 
                    onChange={(e) => setIssueData(prev => ({ ...prev, description: e.target.value }))}
                    style={{ minHeight: '200px' }}
                  />
                </div>

                <div className="alert alert-info" style={{ marginTop: '0.5rem' }}>
                  <span>💡</span>
                  <div>
                    Review and edit the issue context if needed. Click <strong>"2. Generate Test Strategy"</strong> on the left panel to trigger Groq LLM generation.
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && strategyData && (
            <div className="viewer-container animate-fade-in" id="strategy-workspace">
              {/* Document Actions header */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ fontFamily: 'Outfit' }}>📝 Interactive Test Strategy Editor</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Edit the sections below. Changes will be compiled directly into the downloadable word document.</p>
                  </div>
                  <button 
                    onClick={handleDownloadDocx} 
                    className="btn btn-primary"
                    disabled={loading}
                    id="download-docx-btn"
                  >
                    {loading ? <div className="spinner"></div> : '⬇️ Download Polished .docx'}
                  </button>
                </div>
              </div>

              {/* Title Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>Document Title</span>
                </div>
                <input 
                  type="text" 
                  value={strategyData.title} 
                  onChange={(e) => handleFieldChange('title', e.target.value)}
                  style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                />
              </div>

              {/* Objective Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>1. Objective</span>
                </div>
                <textarea 
                  value={strategyData.objective} 
                  onChange={(e) => handleFieldChange('objective', e.target.value)}
                  style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', resize: 'vertical' }}
                />
              </div>

              {/* Scope Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>2. Scope</span>
                </div>
                
                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>In Scope:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
                  {strategyData.scope?.inScope?.map((item, idx) => (
                    <input 
                      key={`inscope-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleScopeChange('inScope', idx, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  ))}
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={() => addScopeItem('inScope')}>+ Add In-Scope Item</button>
                </div>

                <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Out of Scope:</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {strategyData.scope?.outOfScope?.map((item, idx) => (
                    <input 
                      key={`outscope-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleScopeChange('outOfScope', idx, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  ))}
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={() => addScopeItem('outOfScope')}>+ Add Out-of-Scope Item</button>
                </div>
              </div>

              {/* Focus Areas Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>3. Focus Areas</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {strategyData.focusAreas?.map((item, idx) => (
                    <div key={`focus-${idx}`} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                      <input 
                        type="text" 
                        value={item.area} 
                        onChange={(e) => handleFocusAreaChange(idx, 'area', e.target.value)}
                        style={{ fontWeight: 'bold', border: '0', borderBottom: '1px dashed var(--border-color)', backgroundColor: 'transparent', color: 'var(--text-main)', marginBottom: '0.25rem', outline: 'none' }}
                      />
                      <textarea 
                        value={item.details} 
                        onChange={(e) => handleFocusAreaChange(idx, 'details', e.target.value)}
                        style={{ width: '100%', minHeight: '60px', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)', resize: 'vertical' }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Approach Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>4. Approach</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {strategyData.approach?.map((item, idx) => (
                    <input 
                      key={`approach-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayFieldChange('approach', idx, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  ))}
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={() => addArrayItem('approach')}>+ Add Approach Item</button>
                </div>
              </div>

              {/* Deliverables Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>5. Deliverables</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {strategyData.deliverables?.map((item, idx) => (
                    <input 
                      key={`deliverable-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayFieldChange('deliverables', idx, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  ))}
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={() => addArrayItem('deliverables')}>+ Add Deliverable Item</button>
                </div>
              </div>

              {/* Team & Schedule Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>6. Team & Schedule</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Team Requirements</label>
                    <input 
                      type="text" 
                      value={strategyData.teamAndSchedule?.teamSize || ''} 
                      onChange={(e) => handleFieldChange('teamAndSchedule', { ...strategyData.teamAndSchedule, teamSize: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Duration</label>
                    <input 
                      type="text" 
                      value={strategyData.teamAndSchedule?.duration || ''} 
                      onChange={(e) => handleFieldChange('teamAndSchedule', { ...strategyData.teamAndSchedule, duration: e.target.value })}
                    />
                  </div>
                  <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>Timeline Schedule:</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {strategyData.teamAndSchedule?.schedule?.map((item, idx) => (
                      <input 
                        key={`sched-${idx}`}
                        type="text"
                        value={item}
                        onChange={(e) => handleScheduleChange(idx, e.target.value)}
                        style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                      />
                    ))}
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={addScheduleItem}>+ Add Schedule Item</button>
                  </div>
                </div>
              </div>

              {/* Entry & Exit Criteria Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>7. Entry & Exit Criteria</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div className="form-group">
                    <label>Entry Criteria</label>
                    <textarea 
                      value={strategyData.entryAndExitCriteria?.entry || ''} 
                      onChange={(e) => handleFieldChange('entryAndExitCriteria', { ...strategyData.entryAndExitCriteria, entry: e.target.value })}
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                  <div className="form-group">
                    <label>Exit Criteria</label>
                    <textarea 
                      value={strategyData.entryAndExitCriteria?.exit || ''} 
                      onChange={(e) => handleFieldChange('entryAndExitCriteria', { ...strategyData.entryAndExitCriteria, exit: e.target.value })}
                      style={{ minHeight: '60px' }}
                    />
                  </div>
                </div>
              </div>

              {/* Risks Section */}
              <div className="section-card">
                <div className="section-header">
                  <span>8. Risks</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {strategyData.risks?.map((item, idx) => (
                    <input 
                      key={`risk-${idx}`}
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayFieldChange('risks', idx, e.target.value)}
                      style={{ width: '100%', padding: '0.4rem', borderRadius: '4px', border: '1px solid var(--border-color)', backgroundColor: 'var(--bg-color)', color: 'var(--text-main)' }}
                    />
                  ))}
                  <button type="button" className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', alignSelf: 'flex-start' }} onClick={() => addArrayItem('risks')}>+ Add Risk Item</button>
                </div>
              </div>

              {/* Action Bar Footer */}
              <div className="card" style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button 
                    onClick={() => setCurrentStep(2)} 
                    className="btn btn-secondary"
                    disabled={loading}
                  >
                    ← Back to JIRA Verify
                  </button>
                  <button 
                    onClick={handleDownloadDocx} 
                    className="btn btn-primary"
                    disabled={loading}
                    id="download-docx-footer-btn"
                  >
                    {loading ? <div className="spinner"></div> : '⬇️ Export Final Word Document (.docx)'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
