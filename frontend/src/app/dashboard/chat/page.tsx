'use client';
import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTIONS = [
  "What's my biggest spending category this month?",
  "Why did my spending spike recently?",
  "Am I saving enough?",
  "What are my biggest recurring expenses?",
  "How does my weekend vs weekday spending compare?",
  "Give me 3 ways to reduce my expenses",
];

export default function ChatPage() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}!  I'm your AI financial advisor. I have access to your transaction data and can answer any questions about your spending, savings, and financial habits. What would you like to know?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: text,
        history: messages.slice(-10),
      });
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: ' Sorry, I encountered an error. Please check your OpenAI API key configuration.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="section-badge" style={{ marginBottom: '0.75rem' }}>
            <div className="dot" />
            <span>Conversational AI</span>
          </div>
          <h1 style={{ fontSize: '1.75rem' }}>
            AI <span className="gradient-text">Financial Chat</span>
          </h1>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem', marginTop: '0.25rem' }}>
            Ask anything about your finances in natural language
          </p>
        </div>
      </div>

      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>
          {/* Chat */}
          <div className="card" style={{ padding: 0 }}>
            <div className="chat-container">
              <div className="chat-messages">
                {messages.map((msg, i) => (
                  <div key={i} className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                    {msg.role === 'assistant' && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem', fontSize: '0.72rem', color: 'var(--muted-foreground)' }}>
                        SpendSense AI
                      </div>
                    )}
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.65 }}>{msg.content}</p>
                  </div>
                ))}

                {loading && (
                  <div className="chat-bubble ai">
                    <div style={{ display: 'flex', gap: '0.3rem', alignItems: 'center', padding: '0.25rem 0' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: '0.45rem', height: '0.45rem', borderRadius: '50%',
                          background: 'var(--muted-foreground)',
                          animation: 'pulse-dot 1.2s infinite',
                          animationDelay: `${i * 0.2}s`,
                        }} />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <div className="chat-input-row">
                <input
                  className="input"
                  placeholder="Ask about your finances..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKey}
                  disabled={loading}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => sendMessage(input)}
                  disabled={loading || !input.trim()}
                  style={{ flexShrink: 0 }}
                >
                  Send 
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', position: 'sticky', top: '1rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.875rem' }}> Suggested Questions</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => sendMessage(s)}
                    disabled={loading}
                    style={{
                      padding: '0.625rem 0.75rem',
                      borderRadius: '0.625rem',
                      border: '1px solid var(--border)',
                      background: 'var(--muted)',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      lineHeight: 1.4,
                      color: 'var(--foreground)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,82,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(0,82,255,0.3)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="card" style={{ background: 'var(--foreground)', color: 'white', fontSize: '0.8rem', lineHeight: 1.7 }}>
              <div style={{ marginBottom: '0.5rem', fontWeight: 600 }}> Privacy Note</div>
              <p style={{ color: 'rgba(255,255,255,0.7)' }}>
                Your financial data is only used in this session to provide context to the AI. Nothing is stored externally.
              </p>
            </div>

            <button
              className="btn btn-ghost btn-sm"
              style={{ width: '100%' }}
              onClick={() => setMessages([{
                role: 'assistant',
                content: `Hi ${user?.name?.split(' ')[0] || 'there'}!  I'm your AI financial advisor. How can I help?`,
              }])}
            >
               Clear Conversation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
