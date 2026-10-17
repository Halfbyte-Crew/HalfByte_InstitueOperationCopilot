import React, { useState, useEffect, useRef } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { copilotApi } from '../copilotApi';
import {
  Bot,
  Send,
  Sparkles,
  BookOpen,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function CopilotPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello! I am your EduPilot College Knowledge Assistant. Ask me any question about official student policies, academic regulations, examination rules, syllabi, or campus safety.',
      citations: [],
      timestamp: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedCitationIdx, setExpandedCitationIdx] = useState(null);
  const messagesEndRef = useRef(null);

  const samplePrompts = [
    'What is the attendance and punctuality policy?',
    'What are the rules regarding examination re-evaluation?',
    'What are the emergency contacts for campus safety?',
    'How are course outcomes and syllabi structured?',
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg = {
      sender: 'user',
      text: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await copilotApi.queryKnowledgeBase(text, 4);

      const copilotResponse = {
        sender: 'copilot',
        text: response.answer,
        citations: response.citations || [],
        evidenceSufficient: response.evidence_sufficient,
        modelUsed: response.model_used,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, copilotResponse]);
    } catch (err) {
      const errorMsg = {
        sender: 'copilot',
        text: 'Sorry, I encountered an error searching the knowledge base. Please try again or contact administration.',
        citations: [],
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="College Knowledge Assistant — RAG Chatbot"
        description="Ask questions about official college regulations, student handbooks, syllabi, and safety protocols with verifiable citations."
      />

      {/* Suggested Quick Prompts */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-3">
        <span className="text-xs font-medium text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Suggested:
        </span>
        {samplePrompts.map((prompt, pIdx) => (
          <button
            key={pIdx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 transition-colors whitespace-nowrap"
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 max-w-3xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white font-medium text-sm'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {msg.sender === 'user' ? 'U' : <Bot className="h-4 w-4" />}
              </div>

              <div className="space-y-2 max-w-2xl">
                <div
                  className={`p-4 rounded-2xl text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line">{msg.text}</p>
                </div>

                {/* Evidence & Citations Tray */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="p-3 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                        Official Source Citations ({msg.citations.length})
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {msg.citations.map((cit, cIdx) => {
                        const isExpanded = expandedCitationIdx === `${idx}-${cIdx}`;
                        return (
                          <div
                            key={cIdx}
                            className="bg-white rounded-lg p-2 border border-indigo-100 text-xs shadow-2xs"
                          >
                            <div
                              onClick={() =>
                                setExpandedCitationIdx(isExpanded ? null : `${idx}-${cIdx}`)
                              }
                              className="flex items-center justify-between cursor-pointer"
                            >
                              <div className="flex items-center gap-1.5 font-medium text-slate-700 truncate pr-2">
                                <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="truncate">{cit.document_title}</span>
                                <Badge variant="primary">Page {cit.page_number}</Badge>
                              </div>
                              <div className="text-slate-400">
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded">
                                "{cit.excerpt}"
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Insufficient Evidence Warning Banner */}
                {msg.evidenceSufficient === false && (
                  <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>No verified official policy exists in the knowledge base for this question.</span>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {/* Thinking Indicator */}
          {loading && (
            <div className="flex items-start gap-3 max-w-2xl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                <Bot className="h-4 w-4 animate-pulse" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-none bg-slate-50 border border-slate-200 text-sm text-slate-500 flex items-center gap-2">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span
                  className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                />
                <span
                  className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                />
                <span className="ml-2 text-xs">Searching official documents...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3"
        >
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask about attendance, re-evaluation, refund rules, course syllabi..."
            className="bg-white flex-1"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            icon={Send}
            disabled={!inputMessage.trim() || loading}
            className="shrink-0"
          >
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
