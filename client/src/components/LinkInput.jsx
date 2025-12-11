import { useState } from 'react';
import { Link2, Plus, X, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function LinkInput({ taskId, links = [], onUpdate }) {
  const [newUrl, setNewUrl] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAdd = async () => {
    if (!newUrl.trim()) return;
    
    setLoading(true);
    const { error } = await supabase.from('task_links').insert([{
      task_id: taskId,
      url: newUrl.trim(),
      label: newLabel.trim() || null
    }]);
    
    setLoading(false);
    if (error) {
      console.error(error);
    } else {
      setNewUrl('');
      setNewLabel('');
      setIsAdding(false);
      if (onUpdate) onUpdate();
    }
  };

  const handleDelete = async (linkId) => {
    const { error } = await supabase.from('task_links').delete().eq('id', linkId);
    if (error) console.error(error);
    else if (onUpdate) onUpdate();
  };

  const getDomainIcon = (url) => {
    try {
      const domain = new URL(url).hostname;
      if (domain.includes('drive.google')) return '📁';
      if (domain.includes('wetransfer')) return '📦';
      if (domain.includes('dropbox')) return '📥';
      if (domain.includes('youtube') || domain.includes('vimeo')) return '🎬';
      if (domain.includes('figma')) return '🎨';
      return '🔗';
    } catch {
      return '🔗';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
          <Link2 size={14} />
          Links
        </label>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="text-blue-500 hover:text-blue-400 text-xs flex items-center gap-1"
          >
            <Plus size={14} /> Agregar
          </button>
        )}
      </div>

      {/* Existing Links */}
      <div className="space-y-2 mb-3">
        {links.map(link => (
          <div 
            key={link.id} 
            className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
          >
            <span className="text-lg">{getDomainIcon(link.url)}</span>
            <a 
              href={link.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex-1 text-sm text-blue-500 hover:text-blue-400 truncate flex items-center gap-1"
            >
              {link.label || link.url}
              <ExternalLink size={12} className="opacity-50" />
            </a>
            <button 
              onClick={() => handleDelete(link.id)}
              className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-500 transition"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {links.length === 0 && !isAdding && (
          <p className="text-xs text-gray-400 italic">Sin links adjuntos</p>
        )}
      </div>

      {/* Add Form */}
      {isAdding && (
        <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-600">
          <input
            type="url"
            placeholder="https://drive.google.com/..."
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <input
            type="text"
            placeholder="Etiqueta (opcional)"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdd}
              disabled={loading || !newUrl.trim()}
              className="flex-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {loading ? '...' : 'Guardar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
