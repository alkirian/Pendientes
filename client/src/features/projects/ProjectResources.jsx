import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, X, Globe, FileText, Image as ImageIcon, Link as LinkIcon, ExternalLink, Trash2 } from 'lucide-react';

export default function ProjectResources({ projectId, resources, onUpdate }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newResource, setNewResource] = useState({ title: '', url: '' });
  const [loading, setLoading] = useState(false);

  const getIcon = (type) => {
    switch (type) {
      case 'design': return <ImageIcon size={20} className="text-purple-500" />;
      case 'doc': return <FileText size={20} className="text-blue-500" />;
      case 'video': return <Globe size={20} className="text-red-500" />; // Placeholder for video
      default: return <LinkIcon size={20} className="text-gray-500" />;
    }
  };

  const detectType = (url) => {
    if (url.includes('figma.com')) return 'design';
    if (url.includes('docs.google.com') || url.includes('notion.so')) return 'doc';
    if (url.includes('youtube.com') || url.includes('vimeo.com')) return 'video';
    return 'link';
  };

  const cleanUrl = (url) => {
    if (!url.match(/^https?:\/\//i)) {
      return 'https://' + url;
    }
    return url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const type = detectType(newResource.url);
    const finalUrl = cleanUrl(newResource.url);

    const { error } = await supabase
      .from('project_resources')
      .insert([{
        project_id: projectId,
        title: newResource.title,
        url: finalUrl,
        type: type
      }]);

    if (!error) {
      setNewResource({ title: '', url: '' });
      setShowAdd(false);
      onUpdate();
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('project_resources')
      .delete()
      .eq('id', id);
    
    if (!error) onUpdate();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <LinkIcon size={18} /> Recursos y Enlaces
        </h3>
        <button 
          onClick={() => setShowAdd(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-blue-600 dark:text-blue-400"
          title="Agregar recurso"
        >
          <Plus size={20} />
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 animate-fade-in">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Título (ej: Guión, Figma)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={newResource.title}
              onChange={(e) => setNewResource({...newResource, title: e.target.value})}
              required
              autoFocus
            />
            <input
              type="text"
              placeholder="URL (https://...)"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm focus:ring-2 focus:ring-blue-500"
              value={newResource.url}
              onChange={(e) => setNewResource({...newResource, url: e.target.value})}
              required
            />
            <div className="flex gap-2 justify-end">
              <button 
                type="button" 
                onClick={() => setShowAdd(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400"
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                disabled={loading}
                className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {resources && resources.length > 0 ? (
          resources.map(resource => (
            <div key={resource.id} className="group flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors">
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 flex-1 min-w-0"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center shrink-0">
                  {getIcon(resource.type)}
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </p>
                  <p className="text-xs text-gray-400 truncate flex items-center gap-1">
                    {new URL(resource.url).hostname} <ExternalLink size={10} />
                  </p>
                </div>
              </a>
              <button 
                onClick={() => handleDelete(resource.id)}
                className="p-1.5 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-400 dark:text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <LinkIcon size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay recursos aún</p>
            <button 
              onClick={() => setShowAdd(true)}
              className="text-xs text-blue-500 hover:underline mt-2"
            >
              Agregar el primero
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
