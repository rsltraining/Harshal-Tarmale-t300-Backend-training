import React, { useState } from 'react';
import './App.css';

export default function App() {
  const [formData, setFormData] = useState({ name: 'Alice Wonderland', email: 'alice@example.com' });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(null);
  const [activeStep, setActiveStep] = useState(null);
  const [eventHistory, setEventHistory] = useState([]);

  const quickSamples = [
    { name: 'Alice Wonderland', email: 'alice@example.com' },
    { name: 'Bob Builder', email: 'bob@example.com' },
    { name: 'Charlie Chaplin', email: 'charlie@example.com' }
  ];

  const handleQuickFill = (sample) => {
    setFormData(sample);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    setActiveStep('publisher');

    const startTime = performance.now();

    try {
      const response = await fetch('http://localhost:8081/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      const elapsed = Math.round(performance.now() - startTime);

      if (response.ok && data.success) {
        setStatus({
          type: 'success',
          text: `${data.message} (API responded in ${elapsed}ms)`,
        });

        // Trigger visual fanout animation sequence
        setTimeout(() => setActiveStep('broker'), 200);
        setTimeout(() => setActiveStep('subscribers'), 500);
        setTimeout(() => setActiveStep(null), 2200);

        // Add to live event stream
        const newLog = {
          id: Date.now(),
          name: formData.name,
          email: formData.email,
          time: new Date().toLocaleTimeString(),
          latency: `${elapsed}ms`,
        };
        setEventHistory((prev) => [newLog, ...prev.slice(0, 7)]);
      } else {
        setStatus({
          type: 'error',
          text: data.message || 'Registration failed on backend.',
        });
        setActiveStep(null);
      }
    } catch (err) {
      setStatus({
        type: 'error',
        text: `Cannot reach Spring Boot (http://localhost:8081): ${err.message}. Is your backend running?`,
      });
      setActiveStep(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="eda-container">
      {/* Top Banner */}
      <div>
        <div className="header-badge">
          <span>⚡ EVENT-DRIVEN ARCHITECTURE</span>
        </div>
        <h1 className="eda-title">Pub/Sub Fan-Out System</h1>
      </div>

      <div className="eda-grid">
        {/* Left: User Registration Form */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>👤</span> Register New User
            </h2>
            <span style={{ fontSize: '12px', color: '#64748b' }}>HTTP POST /api/register</span>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>QUICK PRE-FILL:</span>
          </div>
          <div className="quick-fills">
            {quickSamples.map((sample, idx) => (
              <button
                key={idx}
                type="button"
                className="quick-btn"
                onClick={() => handleQuickFill(sample)}
              >
                + {sample.name.split(' ')[0]}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter user name"
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
                className="form-input"
              />
            </div>

            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? (
                <>
                  <span>Publishing Event...</span>
                </>
              ) : (
                <>
                  <span>🚀 Register & Fire Fan-Out</span>
                </>
              )}
            </button>
          </form>

          {status && (
            <div className={`status-banner ${status.type === 'success' ? 'status-success' : 'status-error'}`}>
              <span>{status.type === 'success' ? '✅' : '⚠️'}</span>
              <span>{status.text}</span>
            </div>
          )}
        </div>

        {/* Right: Live Fan-Out Pipeline Visualizer */}
        <div className="glass-panel">
          <div className="panel-header">
            <h2 className="panel-title">
              <span>📡</span> Live Fan-Out Visualizer
            </h2>
            <span style={{ fontSize: '12px', color: '#10b981' }}>Active Pipeline</span>
          </div>

          <div className="diagram-container">
            {/* Publisher Node */}
            <div className={`node node-publisher ${activeStep === 'publisher' ? 'active' : ''}`}>
              <div className="node-icon">📤</div>
              <div>
                <div className="node-label">1. Publisher (UserController)</div>
                <div className="node-desc">Receives registration, publishes `user.registered` & returns HTTP 200 immediately</div>
              </div>
            </div>

            <div className="arrow-divider">
              <span>▼ Event Published</span>
            </div>

            {/* Broker Node */}
            <div className={`node node-broker ${activeStep === 'broker' ? 'active' : ''}`}>
              <div className="node-icon">🔄</div>
              <div>
                <div className="node-label">2. Fan-Out Broker / Event Bus</div>
                <div className="node-desc">In-Memory ApplicationEventPublisher or RabbitMQ FanoutExchange</div>
              </div>
            </div>

            <div className="arrow-divider">
              <span>▼ Fans out copy to ALL subscribers</span>
            </div>

            {/* Subscribers (Parallel Branch) */}
            <div className="fanout-branch">
              <div className={`node node-email ${activeStep === 'subscribers' ? 'active' : ''}`}>
                <div className="node-icon">📧</div>
                <div>
                  <div className="node-label">Email Service</div>
                  <div className="node-desc">"Sending Welcome Email to [User]"</div>
                </div>
              </div>

              <div className={`node node-audit ${activeStep === 'subscribers' ? 'active' : ''}`}>
                <div className="node-icon">📝</div>
                <div>
                  <div className="node-label">Audit Service</div>
                  <div className="node-desc">"Logging: New user signed up at [Timestamp]"</div>
                </div>
              </div>
            </div>
          </div>

          {/* Event History Stream */}
          <div style={{ marginTop: '24px', textAlign: 'left' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#94a3b8' }}>
              RECENTLY PROCESSED EVENTS:
            </span>
            {eventHistory.length === 0 ? (
              <p style={{ fontSize: '12.5px', color: '#64748b', marginTop: '8px' }}>
                No events published yet. Submit the form on the left to trigger the Fan-Out flow!
              </p>
            ) : (
              <div className="log-list">
                {eventHistory.map((item) => (
                  <div key={item.id} className="log-item">
                    <div>
                      <strong style={{ color: '#60a5fa' }}>{item.name}</strong> ({item.email})
                      <div style={{ color: '#94a3b8', fontSize: '11px', marginTop: '2px' }}>
                        Fanned out to EmailService & AuditService
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="log-time">{item.time}</div>
                      <span style={{ fontSize: '11px', color: '#10b981' }}>{item.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
