import React, { useEffect, useRef, useState } from 'react';
import { ArrowUp } from 'lucide-react';
export default function RoomChat({ messages = [], onSendMessage, disabled }) {
  const [text, setText] = useState('');
  const scroll = useRef(null);
  const nearBottom = useRef(true);
  useEffect(() => { if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight; }, [messages]);
  return <section className="room-chat" aria-label="Room chat">
    <h2>Room chat</h2>
    <div className="chat-messages" ref={scroll} role="log" aria-live="polite" onScroll={e => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
      {!messages.length && <p className="muted">Say hi to your next rival.</p>}
      {messages.map(msg => <p key={msg.id} className={msg.type === 'system' ? 'system-message' : ''}>{msg.type !== 'system' && <strong>{msg.nickname} </strong>}{msg.text}</p>)}
    </div>
    <form onSubmit={e => { e.preventDefault(); if (text.trim() && !disabled) { onSendMessage(text.trim()); setText(''); } }}>
      <input aria-label="Room message" placeholder="Message the room…" value={text} onChange={e => setText(e.target.value)} maxLength={120} disabled={disabled} />
      <button className="icon-button" data-slot="button" aria-label="Send message" disabled={!text.trim() || disabled}><ArrowUp size={18} /></button>
    </form>
  </section>;
}
