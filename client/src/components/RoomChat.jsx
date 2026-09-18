import React, { useState, useEffect, useRef } from 'react';
import { Send, Flame, CheckCheck, Mic, Music2, Info, MessageSquare } from 'lucide-react';
import AvatarIcon from './AvatarIcon';

export default function RoomChat({ messages = [], onSendMessage }) {
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="card-panel rounded-2xl p-4 flex flex-col h-[320px] shadow-lg shadow-black/20">
      {/* Chat Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#232332] mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-mauve-500/10 border border-mauve-500/20 flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-mauve-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">
              Live Room Chat
            </h3>
          </div>
        </div>
        <div className="px-2.5 py-1 rounded-full bg-[#191925] border border-[#252536] text-[11px] font-medium text-neutral-400">
          {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
        </div>
      </div>

      {/* Messages Feed Area */}
      <div ref={scrollRef} className="space-y-2 overflow-y-auto flex-1 pr-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 text-neutral-500">
            <MessageSquare className="w-8 h-8 mb-2 opacity-30" />
            <p className="text-xs font-medium">No messages yet. Say hi or start guessing!</p>
          </div>
        ) : (
          messages.map((msg) => {
            // Live System Events (found answer, streak, joined, left)
            if (msg.type === 'system') {
              let Icon = Info;
              let iconColor = 'text-neutral-400';
              let badgeBg = 'bg-[#181824] border-[#252536] text-neutral-300';

              if (msg.systemType === 'solve') {
                badgeBg = 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300';
                if (msg.solveType === 'both') {
                  Icon = CheckCheck;
                  iconColor = 'text-emerald-400';
                } else if (msg.solveType === 'artist') {
                  Icon = Mic;
                  iconColor = 'text-emerald-400';
                } else {
                  Icon = Music2;
                  iconColor = 'text-emerald-400';
                }
              } else if (msg.systemType === 'streak') {
                badgeBg = 'bg-amber-500/10 border-amber-500/25 text-amber-300';
                Icon = Flame;
                iconColor = 'text-amber-400 fill-amber-400/30';
              }

              return (
                <div
                  key={msg.id}
                  className={`text-[11px] py-1 px-2.5 rounded-lg border flex items-center justify-between gap-2 ${badgeBg}`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <Icon className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                    <span className="truncate font-medium">{msg.text}</span>
                  </div>
                  {msg.timestamp && (
                    <span className="text-[10px] text-neutral-500 shrink-0 tabular-nums">
                      {msg.timestamp}
                    </span>
                  )}
                </div>
              );
            }

            // User Chat Messages
            return (
              <div
                key={msg.id}
                className="text-xs p-2.5 rounded-xl bg-[#181824]/80 border border-[#232332] flex items-start gap-2.5"
              >
                <AvatarIcon id={msg.avatar} className="w-3.5 h-3.5" containerClassName="p-1 rounded-lg mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-neutral-200 text-xs truncate">
                      {msg.nickname}
                    </span>
                    <span className="text-[10px] text-neutral-500 shrink-0 tabular-nums">
                      {msg.timestamp}
                    </span>
                  </div>
                  <p className="text-neutral-300 text-xs break-words leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Deck */}
      <form onSubmit={handleSend} className="pt-3 border-t border-[#232332] flex items-center gap-2 mt-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send message to room..."
          maxLength={120}
          className="flex-1 px-3.5 py-2 text-xs bg-[#101017] border border-[#262638] rounded-xl text-white placeholder-neutral-500 focus:outline-none focus:border-mauve-500/60 transition"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-2 rounded-xl btn-primary transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shrink-0"
          title="Send"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
