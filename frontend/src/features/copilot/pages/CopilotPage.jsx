import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Bot, Send, Sparkles, CheckCircle2 } from 'lucide-react';

export function CopilotPage() {
  const [messages, setMessages] = useState([
    {
      sender: 'copilot',
      text: 'Hello! I am your EduPilot Operations Assistant. You can ask me to analyze attendance trends, draft batch announcements, or review approval requests.',
      timestamp: 'Just now',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMsg = {
      sender: 'user',
      text: inputMessage,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');

    // Simulated copilot response with structured proposed action
    setTimeout(() => {
      const copilotResponse = {
        sender: 'copilot',
        text: `I analyzed your request. Based on current cohort metrics, 3 students in Python Batch B have attendance below 75%. I have drafted a proposed notification for the academic coordinator.`,
        proposedAction: {
          title: 'Dispatch Attendance Warning & Coordinator Alert',
          details: 'Action requires supervisor approval before emails are dispatched.',
        },
        timestamp: 'Just now',
      };
      setMessages((prev) => [...prev, copilotResponse]);
    }, 600);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <PageHeader
        title="AI Operations Copilot"
        description="Interact with the operational database, draft communications, and trigger approved workflows."
      />

      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-xs">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 max-w-2xl ${
                msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  msg.sender === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-indigo-100 text-indigo-700'
                }`}
              >
                {msg.sender === 'user' ? 'U' : <Bot className="h-4 w-4" />}
              </div>
              <div className="space-y-2">
                <div
                  className={`p-4 rounded-2xl text-sm ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-none'
                      : 'bg-slate-100 text-slate-800 rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>

                {msg.proposedAction && (
                  <div className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/60 text-xs">
                    <div className="flex items-center gap-2 text-indigo-900 font-semibold mb-1">
                      <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                      <span>{msg.proposedAction.title}</span>
                    </div>
                    <p className="text-slate-600 mb-3">{msg.proposedAction.details}</p>
                    <Button size="sm" variant="primary" icon={CheckCircle2}>
                      Submit for Approval
                    </Button>
                  </div>
                )}
                <span className="text-[10px] text-slate-400 block px-1">{msg.timestamp}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-slate-50 flex gap-3">
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Ask Copilot (e.g. 'Show me students with low attendance' or 'Schedule batch')..."
            className="bg-white"
          />
          <Button type="submit" variant="primary" icon={Send} className="shrink-0">
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}
