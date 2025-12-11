import React, { useState } from 'react';
import { apiBase } from '../../../hooks/useGraphData';
import { useOptionalAuth } from '../../../context/AuthContext';
import baykocDefaultAvatar from '../../../assets/icons/baykoc_default.png';
import userDefaultAvatar from '../../../assets/icons/user_default.svg';

function toScore(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
}

function summarizeGraphContext(graphContext = {}) {
  const nodes = Array.isArray(graphContext.nodes) ? graphContext.nodes : [];
  const links = Array.isArray(graphContext.links) ? graphContext.links : [];
  const filters = graphContext.filters || {};

  const pickTop = (arr, asc = false) =>
    [...arr]
      .map((node) => ({
        label: node.label || node.name || node.id || 'Konu',
        score: toScore(
          node.basari_puani ??
            node.basari ??
            node.kazanim_basarisi ??
            node.success ??
            node.score ??
            node.puan ??
            node.value,
        ),
        type: node.type,
      }))
      .sort((a, b) => (asc ? a.score - b.score : b.score - a.score))
      .slice(0, 5);

  return {
    filters,
    stats: {
      node_count: nodes.length,
      link_count: links.length,
    },
    best_nodes: pickTop(nodes, false),
    worst_nodes: pickTop(nodes, true),
  };
}

export default function GraphChatWidget({ graphContext }) {
  const { user } = useOptionalAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const userAvatar = user?.profile_picture || userDefaultAvatar;
  const assistantAvatar = baykocDefaultAvatar;
  const userDisplayName =
    user?.first_name || user?.full_name || user?.name || user?.username || 'Sen';

  const toggle = () => setIsOpen((prev) => !prev);

  async function handleSend(event) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;
    const userMessage = { from: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    try {
      const payload = { message: text, graph: summarizeGraphContext(graphContext) };
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiBase()}/api/graph/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Token ${token}` } : {}),
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      if (!res.ok) {
        const errText = `Sohbet servisine ulaşılamadı (HTTP ${res.status})`;
        setMessages((prev) => [...prev, { from: 'bot', text: errText }]);
        return;
      }
      const data = await res.json();
      setMessages((prev) => [...prev, { from: 'bot', text: data.reply || 'Bir yanıt alınamadı.' }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          from: 'bot',
          text: 'Bir hata oluştu. Lütfen daha sonra tekrar dene.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-40">
      {!isOpen && (
        <button
          type="button"
          onClick={toggle}
          className="mb-2 inline-flex items-center gap-3 rounded-full bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-xl hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 animate-pulse" />
          BayKoç AI
        </button>
      )}

      {isOpen && (
        <div className="w-[340px] sm:w-[420px] h-[520px] rounded-3xl border border-slate-700/70 bg-slate-900/95 shadow-2xl flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/60 bg-slate-800/80 text-sm font-semibold">
            <p>BayKoç AI</p>
            <button
              type="button"
              onClick={toggle}
              className="text-slate-300 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 text-sm">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-slate-800/60 px-5 py-4 text-slate-300 text-sm">
                Grafik hakkında sorular sorabilir, filtrelediğin veriler için ek analiz talep
                edebilirsin.
              </div>
            )}
            {messages.map((message, index) => {
              const isUser = message.from === 'user';
              return (
                <div
                  key={index}
                  className={`flex gap-3 ${isUser ? 'flex-row-reverse text-right' : 'text-left'}`}
                >
                  <img
                    src={isUser ? userAvatar : assistantAvatar}
                    alt={isUser ? 'Kullanıcı avatarı' : 'Asistan avatarı'}
                    className="h-9 w-9 rounded-full border border-slate-700 object-cover shadow"
                  />
                  <div
                    className={`max-w-[80%] space-y-1 ${isUser ? 'items-end flex flex-col' : ''}`}
                  >
                    <p className="text-[11px] uppercase tracking-widest text-slate-400">
                      {isUser ? userDisplayName : 'BayKoç AI'}
                    </p>
                    <div
                      className={
                        'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow ' +
                        (isUser
                          ? 'bg-indigo-600 text-white rounded-br-sm'
                          : 'bg-slate-800 text-slate-100 rounded-bl-sm')
                      }
                    >
                      {message.text}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <form
            onSubmit={handleSend}
            className="border-t border-slate-700/60 bg-slate-900/90 px-4 py-4 flex items-center gap-3"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={loading ? 'Yanıt bekleniyor...' : 'Grafik hakkında soru sor'}
              className="flex-1 rounded-2xl bg-slate-800/80 border border-slate-700 px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor…' : 'Gönder'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
