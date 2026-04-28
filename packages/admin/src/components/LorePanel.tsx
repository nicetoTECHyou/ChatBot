'use client';

import React, { useState } from 'react';
import { BookOpen, Plus, Trash2, Edit3, Save, X, Tag, Star } from 'lucide-react';
import { useDashboardStore, type LoreEntry } from '@/lib/store';

export default function LorePanel() {
  const { loreEntries, addLore, updateLore, deleteLore } = useDashboardStore();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    tags: '',
    priority: 5,
  });
  const [editData, setEditData] = useState({
    title: '',
    content: '',
    tags: '',
    priority: 5,
  });

  const sortedLore = [...loreEntries].sort((a, b) => a.priority - b.priority);

  const handleAdd = () => {
    if (!formData.title.trim() || !formData.content.trim()) return;
    addLore({
      title: formData.title.trim(),
      content: formData.content.trim(),
      tags: formData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      priority: formData.priority,
    });
    setFormData({ title: '', content: '', tags: '', priority: 5 });
    setShowAdd(false);
  };

  const startEdit = (entry: LoreEntry) => {
    setEditingId(entry.id);
    setEditData({
      title: entry.title,
      content: entry.content,
      tags: entry.tags.join(', '),
      priority: entry.priority,
    });
  };

  const saveEdit = (id: string) => {
    updateLore(id, {
      title: editData.title.trim(),
      content: editData.content.trim(),
      tags: editData.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      priority: editData.priority,
    });
    setEditingId(null);
  };

  const getPriorityColor = (priority: number) => {
    if (priority <= 2) return 'text-red-400';
    if (priority <= 4) return 'text-yellow-400';
    if (priority <= 7) return 'text-blue-400';
    return 'text-forge-text-muted';
  };

  return (
    <div className="forge-panel space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="forge-section-title">
          <BookOpen className="w-5 h-5 text-forge-purple-light" />
          Lore-Datenbank
        </h2>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="forge-btn-primary text-xs flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Neuer Eintrag
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="forge-card p-4 animate-fade-in">
          <h3 className="text-sm font-semibold text-forge-text mb-3">Neuer Lore-Eintrag</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-forge-text-muted mb-1">Titel</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
                className="forge-input w-full text-sm"
                placeholder="Titel des Lore-Eintrags"
              />
            </div>
            <div>
              <label className="block text-xs text-forge-text-muted mb-1">Inhalt</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData((d) => ({ ...d, content: e.target.value }))}
                rows={4}
                className="forge-input w-full text-sm resize-none"
                placeholder="Lore-Inhalt eingeben..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-forge-text-muted mb-1">
                  <Tag className="w-3 h-3 inline mr-1" />Tags (kommagetrennt)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData((d) => ({ ...d, tags: e.target.value }))}
                  className="forge-input w-full text-xs"
                  placeholder="Hintergrund, Origins, ..."
                />
              </div>
              <div>
                <label className="block text-xs text-forge-text-muted mb-1">
                  <Star className="w-3 h-3 inline mr-1" />Priorität (1-10)
                </label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={formData.priority}
                  onChange={(e) => setFormData((d) => ({ ...d, priority: parseInt(e.target.value) || 5 }))}
                  className="forge-input w-full text-xs"
                />
              </div>
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button onClick={() => setShowAdd(false)} className="forge-btn-secondary text-xs px-3 py-1">
                Abbrechen
              </button>
              <button onClick={handleAdd} className="forge-btn-primary text-xs px-3 py-1 flex items-center gap-1">
                <Save className="w-3 h-3" /> Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lore Entries */}
      <div className="space-y-3">
        {sortedLore.length === 0 ? (
          <div className="forge-card p-8 text-center text-forge-text-muted text-sm">
            <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>Keine Lore-Einträge vorhanden</p>
            <p className="text-xs mt-1">Erstelle den ersten Eintrag, um das Lore-System zu nutzen.</p>
          </div>
        ) : (
          sortedLore.map((entry) => (
            <div key={entry.id} className="forge-card overflow-hidden">
              {editingId === entry.id ? (
                /* Edit Mode */
                <div className="p-4 bg-forge-surface/30 animate-fade-in">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-forge-text-muted mb-1">Titel</label>
                      <input
                        type="text"
                        value={editData.title}
                        onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
                        className="forge-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-forge-text-muted mb-1">Inhalt</label>
                      <textarea
                        value={editData.content}
                        onChange={(e) => setEditData((d) => ({ ...d, content: e.target.value }))}
                        rows={3}
                        className="forge-input w-full text-sm resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-forge-text-muted mb-1">Tags</label>
                        <input
                          type="text"
                          value={editData.tags}
                          onChange={(e) => setEditData((d) => ({ ...d, tags: e.target.value }))}
                          className="forge-input w-full text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-forge-text-muted mb-1">Priorität</label>
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={editData.priority}
                          onChange={(e) => setEditData((d) => ({ ...d, priority: parseInt(e.target.value) || 5 }))}
                          className="forge-input w-full text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 justify-end">
                      <button
                        onClick={() => setEditingId(null)}
                        className="forge-btn-secondary text-xs px-3 py-1 flex items-center gap-1"
                      >
                        <X className="w-3 h-3" /> Abbrechen
                      </button>
                      <button
                        onClick={() => saveEdit(entry.id)}
                        className="forge-btn-primary text-xs px-3 py-1 flex items-center gap-1"
                      >
                        <Save className="w-3 h-3" /> Speichern
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* View Mode */
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm text-forge-text">{entry.title}</h3>
                        <span className={`text-xs font-mono ${getPriorityColor(entry.priority)}`}>
                          P{entry.priority}
                        </span>
                      </div>
                      <p className="text-xs text-forge-text-dim mt-1 leading-relaxed line-clamp-3">
                        {entry.content}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          <Tag className="w-3 h-3 text-forge-text-muted" />
                          {entry.tags.map((tag, idx) => (
                            <span key={idx} className="forge-badge text-[10px] bg-forge-surface border border-forge-border text-forge-text-muted">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[10px] text-forge-text-muted mt-2">
                        Aktualisiert: {new Date(entry.updatedAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                      <button
                        onClick={() => startEdit(entry)}
                        className="p-1.5 rounded-lg text-forge-text-muted hover:text-forge-purple-light hover:bg-forge-purple/10 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteLore(entry.id)}
                        className="p-1.5 rounded-lg text-forge-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
