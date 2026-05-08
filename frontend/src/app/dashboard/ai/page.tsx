'use client';
import { useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';

interface AIAnalysis {
  summary: string;
  behavioral_insights: string[];
  recommendations: string[];
  anomalies: string[];
  spending_patterns: {
    peak_day?: string;
    highest_category?: string;
    savings_assessment?: string;
    risk_level?: string;
  };
}

interface Insight {
  type: string; icon: string; title: string; description: string;
  severity: string; value: string;
}

export default function AIPage() {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedInsights, setLoadedInsights] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const [aiRes, insRes] = await Promise.all([
        api.post('/ai/analyze', {}),
        api.get('/ai/insights/behavioral'),
      ]);
      setAnalysis(aiRes.data);
      setInsights(insRes.data.insights || []);
      setLoadedInsights(true);
    } catch (err: any) {
      toast.error(err.response?.data?.detail || 'AI analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (level: string) => {
    if (level === 'low') return 'var(--success)';
    if (level === 'medium') return 'var(--warning)';
    return 'var(--danger)';
  };

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-badge" style={{ marginBottom: '0.75rem' }}>
              <div className="dot" />
              <span>GPT-4o Powered</span>
            </div>
            <h1 style={{ fontSize: '1.75rem' }}>
              AI <span className="gradient-text">Insights</span>
            </h1>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Deep behavioral analysis of your financial patterns
            </p>
          </div>
          <button className="btn btn-primary btn-lg" onClick={runAnalysis} disabled={loading}>
            {loading ? (
              <><span className="spinner" style={{ width: '1rem', height: '1rem', borderWidth: '2px', borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />Analyzing...</>
            ) : (
              ' Run AI Analysis'
            )}
          </button>
        </div>
      </div>

      <div className="page-body">
        {!analysis && !loading && (
          <div style={{
            background: 'var(--foreground)', borderRadius: '1.25rem', padding: '3rem',
            textAlign: 'center', color: 'white', position: 'relative', overflow: 'hidden',
          }}>
            {/* Dot pattern */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '32px 32px',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}></div>
              <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                AI Financial Behavioral Analysis
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.65)', maxWidth: '500px', margin: '0 auto 1.75rem', lineHeight: 1.7 }}>
                Our AI analyzes your transaction history to identify spending patterns, behavioral traits, and actionable recommendations personalized to you.
              </p>
              <button className="btn btn-primary btn-lg" onClick={runAnalysis}>
                 Start Analysis
              </button>

              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginTop: '2.5rem', flexWrap: 'wrap' }}>
                {['Behavioral Patterns', 'Anomaly Detection', 'Personalized Tips', 'Risk Assessment'].map(f => (
                  <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.75)', fontSize: '0.875rem' }}>
                    <span style={{ width: '0.4rem', height: '0.4rem', borderRadius: '50%', background: '#0052FF', flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ width: '3rem', height: '3rem', borderWidth: '3px', margin: '0 auto 1rem' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>AI is analyzing your financial behavior...</p>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '1rem' }} />
            ))}
          </div>
        )}

        {analysis && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary */}
            <div className="card" style={{ background: 'var(--foreground)', color: 'white', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: 600 }}>AI</span>
                  <div className="section-badge" style={{ background: 'rgba(0,82,255,0.2)', borderColor: 'rgba(0,82,255,0.4)' }}>
                    <span style={{ color: '#4D7CFF' }}>AI Summary</span>
                  </div>
                </div>
                <p style={{ color: 'rgba(255,255,255,0.9)', lineHeight: 1.75, fontSize: '1rem' }}>{analysis.summary}</p>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
                  {analysis.spending_patterns && Object.entries(analysis.spending_patterns).map(([k, v]) => (
                    <div key={k} style={{ padding: '0.5rem 0.875rem', background: 'rgba(255,255,255,0.07)', borderRadius: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '0.65rem', letterSpacing: '0.1em', marginBottom: '0.15rem' }}>
                        {k.replace(/_/g, ' ')}
                      </div>
                      <div style={{ color: k === 'risk_level' ? riskColor(String(v)) : 'white', fontWeight: 600 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Behavioral Insights */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Behavioral Insights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analysis.behavioral_insights.map((insight, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <div style={{
                        width: '1.5rem', height: '1.5rem', borderRadius: '50%', background: 'var(--gradient)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0, marginTop: '0.1rem',
                      }}>
                        {i + 1}
                      </div>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>{insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Recommendations
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analysis.recommendations.map((rec, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--success)', fontSize: '1rem', flexShrink: 0 }}>•</span>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--muted-foreground)' }}>{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Anomalies */}
            {analysis.anomalies.length > 0 && (
              <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)', background: 'rgba(245,158,11,0.03)' }}>
                <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning)' }}>
                  Anomalies Detected
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {analysis.anomalies.map((a, i) => (
                    <div key={i} style={{ display: 'flex', gap: '0.75rem', padding: '0.75rem', background: 'rgba(245,158,11,0.08)', borderRadius: '0.625rem' }}>
                      <span style={{ fontWeight: 600 }}>!</span>
                      <p style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{a}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pre-computed insights */}
            {insights.length > 0 && (
              <div>
                <h3 style={{ marginBottom: '1rem' }}>Real-time Behavioral Signals</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {insights.map((ins, i) => (
                    <div key={i} className={`insight-card severity-${ins.severity}`} style={{ background: 'var(--card)', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                      <div className="insight-icon">{ins.icon}</div>
                      <div className="insight-content">
                        <div className="insight-title">{ins.title}</div>
                        <div className="insight-desc">{ins.description}</div>
                      </div>
                      <span className={`badge severity-${ins.severity}`}>{ins.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button className="btn btn-secondary" style={{ alignSelf: 'flex-start' }} onClick={runAnalysis}>
               Refresh Analysis
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
