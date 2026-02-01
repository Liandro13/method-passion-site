import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  getAccommodations, 
  updateAccommodation, 
  uploadImage, 
  updateImage, 
  deleteImage, 
  reorderImages 
} from '../lib/api';
import type { Accommodation, AccommodationImage } from '../types';

type Language = 'pt' | 'en' | 'fr' | 'de' | 'es';

const languageLabels: Record<Language, string> = {
  pt: 'Português',
  en: 'English',
  fr: 'Français',
  de: 'Deutsch',
  es: 'Español'
};

export default function AccommodationManager() {
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [selectedAccommodation, setSelectedAccommodation] = useState<Accommodation | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeLanguage, setActiveLanguage] = useState<Language>('pt');
  const [dragOver, setDragOver] = useState(false);
  const [editedDescriptions, setEditedDescriptions] = useState<Record<Language, string>>({
    pt: '', en: '', fr: '', de: '', es: ''
  });
  const [editedAmenities, setEditedAmenities] = useState<Record<Language, string[]>>({
    pt: [], en: [], fr: [], de: [], es: []
  });
  const [newAmenity, setNewAmenity] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadAccommodations = useCallback(async () => {
    try {
      const result = await getAccommodations();
      if (result.accommodations) {
        setAccommodations(result.accommodations);
        if (!selectedAccommodation && result.accommodations.length > 0) {
          selectAccommodation(result.accommodations[0]);
        } else if (selectedAccommodation) {
          // Refresh selected accommodation
          const updated = result.accommodations.find((a: Accommodation) => a.id === selectedAccommodation.id);
          if (updated) selectAccommodation(updated);
        }
      }
    } catch (error) {
      console.error('Error loading accommodations:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedAccommodation]);

  useEffect(() => {
    loadAccommodations();
  }, []);

  const selectAccommodation = (acc: Accommodation) => {
    setSelectedAccommodation(acc);
    setEditedDescriptions({
      pt: acc.description_pt || '',
      en: acc.description_en || '',
      fr: acc.description_fr || '',
      de: acc.description_de || '',
      es: acc.description_es || ''
    });
    // Parse amenities from JSON or use empty arrays
    const amenities = typeof acc.amenities === 'string' 
      ? JSON.parse(acc.amenities || '{}') 
      : (acc.amenities || {});
    setEditedAmenities({
      pt: amenities.pt || [],
      en: amenities.en || [],
      fr: amenities.fr || [],
      de: amenities.de || [],
      es: amenities.es || []
    });
    setNewAmenity('');
  };

  const handleSaveDescriptions = async () => {
    if (!selectedAccommodation) return;
    setSaving(true);
    try {
      await updateAccommodation(selectedAccommodation.id, {
        description_pt: editedDescriptions.pt,
        description_en: editedDescriptions.en,
        description_fr: editedDescriptions.fr,
        description_de: editedDescriptions.de,
        description_es: editedDescriptions.es,
        amenities: editedAmenities
      });
      await loadAccommodations();
    } catch (error) {
      console.error('Error saving:', error);
    } finally {
      setSaving(false);
    }
  };

  const addAmenity = () => {
    if (!newAmenity.trim()) return;
    setEditedAmenities(prev => ({
      ...prev,
      [activeLanguage]: [...prev[activeLanguage], newAmenity.trim()]
    }));
    setNewAmenity('');
  };

  const removeAmenity = (index: number) => {
    setEditedAmenities(prev => ({
      ...prev,
      [activeLanguage]: prev[activeLanguage].filter((_, i) => i !== index)
    }));
  };

  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!selectedAccommodation) return;

    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    await uploadFiles(files);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !selectedAccommodation) return;
    const files = Array.from(e.target.files);
    await uploadFiles(files);
    e.target.value = ''; // Reset input
  };

  const uploadFiles = async (files: File[]) => {
    if (!selectedAccommodation || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    
    try {
      for (const file of files) {
        const result = await uploadImage(file, selectedAccommodation.id);
        if (result.error) {
          setUploadError(result.error);
          break;
        }
      }
      await loadAccommodations();
    } catch (error) {
      console.error('Upload error:', error);
      setUploadError('Erro ao carregar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    try {
      await updateImage(imageId, { is_primary: true });
      await loadAccommodations();
    } catch (error) {
      console.error('Error setting primary:', error);
    }
  };

  const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Tem certeza que deseja eliminar esta imagem?')) return;
    try {
      await deleteImage(imageId);
      await loadAccommodations();
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleUpdateCaption = async (imageId: number, caption: string) => {
    try {
      await updateImage(imageId, { caption });
    } catch (error) {
      console.error('Error updating caption:', error);
    }
  };

  const handleReorder = async (images: AccommodationImage[], fromIndex: number, toIndex: number) => {
    const newImages = [...images];
    const [removed] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, removed);
    
    // Optimistic update
    if (selectedAccommodation) {
      setSelectedAccommodation({
        ...selectedAccommodation,
        images: newImages
      });
    }

    try {
      await reorderImages(newImages.map(img => ({ id: img.id })));
      await loadAccommodations();
    } catch (error) {
      console.error('Error reordering:', error);
      await loadAccommodations(); // Revert on error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">A carregar alojamentos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-dark">Gerir Alojamentos</h2>
      </div>

      {/* Accommodation selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {accommodations.map(acc => (
          <button
            key={acc.id}
            onClick={() => selectAccommodation(acc)}
            className={`flex-shrink-0 px-4 py-3 rounded-xl transition-all ${
              selectedAccommodation?.id === acc.id
                ? 'bg-primary text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <div className="flex items-center gap-3">
              <img 
                src={acc.primary_image || acc.image_url || '/images/logo.jpeg'} 
                alt={acc.name}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="text-left">
                <div className="font-medium text-sm">{acc.name}</div>
                <div className={`text-xs ${selectedAccommodation?.id === acc.id ? 'opacity-80' : 'text-gray-500'}`}>
                  {acc.images?.length || 0} fotos
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {selectedAccommodation && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Images */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <span>📷</span> Fotografias
            </h3>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              {uploading ? (
                <div className="text-gray-500">
                  <div className="animate-spin inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full mb-2" />
                  <div>A carregar imagens...</div>
                </div>
              ) : (
                <>
                  <div className="text-4xl mb-2">📤</div>
                  <div className="text-gray-600 font-medium">Arrastar imagens aqui</div>
                  <div className="text-gray-400 text-sm mt-1">ou clique para selecionar</div>
                </>
              )}
            </div>

            {/* Upload error message */}
            {uploadError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                ⚠️ {uploadError}
              </div>
            )}

            {/* Image grid */}
            <div className="grid grid-cols-3 gap-3">
              {selectedAccommodation.images?.sort((a, b) => {
                if (a.is_primary) return -1;
                if (b.is_primary) return 1;
                return a.display_order - b.display_order;
              }).map((img, index) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  index={index}
                  totalImages={selectedAccommodation.images?.length || 0}
                  onSetPrimary={() => handleSetPrimary(img.id)}
                  onDelete={() => handleDeleteImage(img.id)}
                  onUpdateCaption={(caption) => handleUpdateCaption(img.id, caption)}
                  onMoveUp={() => handleReorder(selectedAccommodation.images || [], index, index - 1)}
                  onMoveDown={() => handleReorder(selectedAccommodation.images || [], index, index + 1)}
                />
              ))}
            </div>
          </div>

          {/* Right Column - Descriptions */}
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <h3 className="font-semibold text-dark flex items-center gap-2">
              <span>📝</span> Descrições
            </h3>

            {/* Language tabs */}
            <div className="flex gap-1 border-b border-gray-200">
              {(Object.keys(languageLabels) as Language[]).map(lang => (
                <button
                  key={lang}
                  onClick={() => setActiveLanguage(lang)}
                  className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeLanguage === lang
                      ? 'border-primary text-primary'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {languageLabels[lang]}
                </button>
              ))}
            </div>

            {/* Description textarea */}
            <div className="space-y-2">
              <label className="text-sm text-gray-600">
                Descrição em {languageLabels[activeLanguage]}
              </label>
              <textarea
                value={editedDescriptions[activeLanguage]}
                onChange={(e) => setEditedDescriptions(prev => ({
                  ...prev,
                  [activeLanguage]: e.target.value
                }))}
                rows={6}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                placeholder={`Escreva a descrição em ${languageLabels[activeLanguage]}...`}
              />
            </div>

            {/* Amenities section */}
            <div className="space-y-2 pt-4 border-t border-gray-100">
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <span>✨</span> Comodidades em {languageLabels[activeLanguage]}
              </label>
              
              {/* Add new amenity */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newAmenity}
                  onChange={(e) => setNewAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                  placeholder="Nova comodidade..."
                />
                <button
                  onClick={addAmenity}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                >
                  + Adicionar
                </button>
              </div>

              {/* Amenities list */}
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {editedAmenities[activeLanguage].map((amenity, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm group"
                  >
                    {amenity}
                    <button
                      onClick={() => removeAmenity(index)}
                      className="ml-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      ×
                    </button>
                  </span>
                ))}
                {editedAmenities[activeLanguage].length === 0 && (
                  <span className="text-gray-400 text-sm italic">
                    Nenhuma comodidade adicionada
                  </span>
                )}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={handleSaveDescriptions}
              disabled={saving}
              className="w-full btn-primary py-3 disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Guardar Alterações'}
            </button>

            {/* Info */}
            <div className="text-xs text-gray-400 text-center">
              Máximo de hóspedes: {selectedAccommodation.max_guests}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Image card component with actions
interface ImageCardProps {
  image: AccommodationImage;
  index: number;
  totalImages: number;
  onSetPrimary: () => void;
  onDelete: () => void;
  onUpdateCaption: (caption: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function ImageCard({ 
  image, 
  index, 
  totalImages, 
  onSetPrimary, 
  onDelete, 
  onUpdateCaption,
  onMoveUp, 
  onMoveDown 
}: ImageCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [editingCaption, setEditingCaption] = useState(false);
  const [caption, setCaption] = useState(image.caption || '');

  return (
    <div 
      className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <img 
        src={image.image_url} 
        alt={image.caption || 'Imagem'}
        className="w-full h-full object-cover"
      />
      
      {/* Primary badge */}
      {image.is_primary && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-primary text-white text-xs rounded-full font-medium">
          Principal
        </div>
      )}

      {/* Actions overlay */}
      {showActions && (
        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 p-2">
          {!image.is_primary && (
            <button
              onClick={onSetPrimary}
              className="w-full px-2 py-1 bg-white/90 text-xs rounded hover:bg-white transition-colors"
            >
              ⭐ Definir como principal
            </button>
          )}
          
          <div className="flex gap-1 w-full">
            <button
              onClick={onMoveUp}
              disabled={index === 0}
              className="flex-1 px-2 py-1 bg-white/90 text-xs rounded hover:bg-white transition-colors disabled:opacity-50"
            >
              ←
            </button>
            <button
              onClick={onMoveDown}
              disabled={index === totalImages - 1}
              className="flex-1 px-2 py-1 bg-white/90 text-xs rounded hover:bg-white transition-colors disabled:opacity-50"
            >
              →
            </button>
          </div>

          <button
            onClick={() => setEditingCaption(true)}
            className="w-full px-2 py-1 bg-white/90 text-xs rounded hover:bg-white transition-colors"
          >
            ✏️ Legenda
          </button>

          <button
            onClick={onDelete}
            className="w-full px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
          >
            🗑️ Eliminar
          </button>
        </div>
      )}

      {/* Caption editor modal */}
      {editingCaption && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setEditingCaption(false)}
        >
          <div 
            className="bg-white rounded-xl p-4 w-80 space-y-3"
            onClick={e => e.stopPropagation()}
          >
            <h4 className="font-medium">Editar Legenda</h4>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary"
              placeholder="Legenda da imagem..."
            />
            <div className="flex gap-2">
              <button
                onClick={() => setEditingCaption(false)}
                className="flex-1 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onUpdateCaption(caption);
                  setEditingCaption(false);
                }}
                className="flex-1 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
