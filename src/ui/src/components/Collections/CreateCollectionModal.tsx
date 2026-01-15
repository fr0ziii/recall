import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../Shared/Modal';
import { GlowButton } from '../Shared/GlowButton';
import { useCreateCollection, useSupportedModels } from '../../hooks/useRecall';
import type { FieldType, Modality, IndexSchema } from '../../types/recall';

interface CreateCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FIELD_TYPES: FieldType[] = ['keyword', 'text', 'int', 'float', 'bool'];

const TEXT_MODELS = ['all-MiniLM-L6-v2', 'all-mpnet-base-v2', 'paraphrase-MiniLM-L6-v2', 'multi-qa-MiniLM-L6-cos-v1'];
const IMAGE_MODELS = ['clip-ViT-B-32', 'clip-ViT-B-16', 'clip-ViT-L-14'];

const MODEL_INFO: Record<string, { dims: number; desc: string }> = {
  'all-MiniLM-L6-v2': { dims: 384, desc: 'Fast, lightweight general-purpose' },
  'all-mpnet-base-v2': { dims: 768, desc: 'High quality, balanced performance' },
  'paraphrase-MiniLM-L6-v2': { dims: 384, desc: 'Paraphrase detection optimized' },
  'multi-qa-MiniLM-L6-cos-v1': { dims: 384, desc: 'Question-answering focused' },
  'clip-ViT-B-32': { dims: 512, desc: 'Fast vision-language model' },
  'clip-ViT-B-16': { dims: 512, desc: 'Higher resolution, better quality' },
  'clip-ViT-L-14': { dims: 768, desc: 'Largest CLIP, best accuracy' },
};

interface SchemaField {
  id: string;
  name: string;
  type: FieldType;
}

export function CreateCollectionModal({ isOpen, onClose }: CreateCollectionModalProps) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [modality, setModality] = useState<Modality>('text');
  const [model, setModel] = useState('all-MiniLM-L6-v2');
  const [fields, setFields] = useState<SchemaField[]>([]);
  const [error, setError] = useState<string | null>(null);

  const { mutateAsync: createCollection, isPending } = useCreateCollection();
  useSupportedModels();

  const availableModels = modality === 'text' ? TEXT_MODELS : IMAGE_MODELS;

  const resetForm = () => {
    setStep(1);
    setName('');
    setModality('text');
    setModel('all-MiniLM-L6-v2');
    setFields([]);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addField = () => {
    setFields([...fields, { id: crypto.randomUUID(), name: '', type: 'keyword' }]);
  };

  const updateField = (id: string, key: 'name' | 'type', value: string) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, [key]: value } : f)));
  };

  const removeField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    setError(null);

    const indexSchema: IndexSchema = {};
    for (const field of fields) {
      if (field.name.trim()) {
        indexSchema[field.name.trim()] = field.type;
      }
    }

    try {
      await createCollection({
        name,
        embedding_config: { model, modality },
        index_schema: indexSchema,
      });
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create collection');
    }
  };

  const canProceed = () => {
    if (step === 1) return name.trim().length > 0 && /^[a-z0-9_-]+$/.test(name);
    if (step === 2) return !!model;
    if (step === 3) return fields.every((f) => !f.name || /^[a-z0-9_]+$/i.test(f.name));
    return true;
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create Collection" size="lg">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${s === step
                    ? 'bg-apple text-white'
                    : s < step
                      ? 'bg-apple-100 border border-apple-200 text-apple'
                      : 'bg-cloud-200 border border-cloud-400 text-ink-50'
                  }`}
              >
                {s < step ? '✓' : s}
              </div>
              {s < 4 && (
                <div className={`w-12 h-0.5 ${s < step ? 'bg-apple-200' : 'bg-cloud-300'}`} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2 text-xs text-ink-50 font-medium px-1">
          <span>Name</span>
          <span>Model</span>
          <span>Schema</span>
          <span>Review</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-ink-200 mb-2 font-medium">Collection Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                placeholder="my-collection"
                className="input-glow w-full font-mono"
                autoFocus
              />
              <p className="text-xs text-ink-50 mt-2">
                Lowercase letters, numbers, hyphens, and underscores only
              </p>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm text-ink-200 mb-3 font-medium">Modality</label>
              <div className="grid grid-cols-2 gap-3">
                {(['text', 'image'] as Modality[]).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setModality(m);
                      setModel(m === 'text' ? 'all-MiniLM-L6-v2' : 'clip-ViT-B-32');
                    }}
                    className={`p-4 rounded-xl border transition-all ${modality === m
                        ? m === 'text'
                          ? 'bg-apple-50 border-apple text-apple'
                          : 'bg-apricot-50 border-apricot text-apricot'
                        : 'bg-cloud-100 border-cloud-400 text-ink-200 hover:border-ink-50'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      {m === 'text' ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                      <span className="font-medium capitalize">{m}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-ink-200 mb-3 font-medium">Embedding Model</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableModels.map((m) => (
                  <button
                    key={m}
                    onClick={() => setModel(m)}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${model === m
                        ? modality === 'text'
                          ? 'bg-apple-50 border-apple'
                          : 'bg-apricot-50 border-apricot'
                        : 'bg-cloud-100 border-cloud-400 hover:border-ink-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`font-mono text-sm font-medium ${model === m ? (modality === 'text' ? 'text-apple' : 'text-apricot') : 'text-ink-300'}`}>
                        {m}
                      </span>
                      <span className="text-xs font-medium text-ink-50">
                        {MODEL_INFO[m]?.dims}d
                      </span>
                    </div>
                    <p className="text-xs text-ink-50 mt-1">{MODEL_INFO[m]?.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <label className="text-sm text-ink-200 font-medium">Index Schema (Optional)</label>
              <button
                onClick={addField}
                className="text-xs text-apple hover:text-apple-600 font-medium transition-colors"
              >
                + Add Field
              </button>
            </div>

            {fields.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-cloud-400 rounded-xl bg-cloud-100">
                <p className="text-sm text-ink-100">No fields defined</p>
                <p className="text-xs text-ink-50 mt-1">Add fields to enable filtering on document metadata</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {fields.map((field) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={field.name}
                      onChange={(e) => updateField(field.id, 'name', e.target.value)}
                      placeholder="field_name"
                      className="input-glow flex-1 text-sm font-mono py-2"
                    />
                    <select
                      value={field.type}
                      onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      className="input-glow text-sm font-mono py-2 w-28"
                    >
                      {FIELD_TYPES.map((t) => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeField(field.id)}
                      className="p-2 text-ink-50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="bg-cloud-100 rounded-xl p-4 space-y-3 border border-cloud-300">
              <div className="flex justify-between">
                <span className="text-sm text-ink-50">Name</span>
                <span className="text-sm font-mono text-ink font-medium">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-50">Modality</span>
                <span className={`text-sm font-medium ${modality === 'text' ? 'text-apple' : 'text-apricot'}`}>
                  {modality}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-50">Model</span>
                <span className="text-sm font-mono text-ink font-medium">{model}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-ink-50">Dimensions</span>
                <span className="text-sm font-mono text-grape font-medium">{MODEL_INFO[model]?.dims}</span>
              </div>
              {fields.filter((f) => f.name.trim()).length > 0 && (
                <div>
                  <span className="text-sm text-ink-50 block mb-2">Schema</span>
                  <div className="bg-cloud-200 rounded-lg p-2 font-mono text-xs text-ink-200">
                    {fields
                      .filter((f) => f.name.trim())
                      .map((f) => `${f.name}: ${f.type}`)
                      .join(', ')}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-6 pt-4 border-t border-cloud-300">
        <GlowButton
          variant="grape"
          size="sm"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          Back
        </GlowButton>
        {step < 4 ? (
          <GlowButton
            variant="apple"
            size="sm"
            onClick={() => setStep(Math.min(4, step + 1))}
            disabled={!canProceed()}
          >
            Continue
          </GlowButton>
        ) : (
          <GlowButton
            variant="apple"
            size="sm"
            onClick={handleSubmit}
            disabled={isPending || !canProceed()}
          >
            {isPending ? 'Creating...' : 'Create Collection'}
          </GlowButton>
        )}
      </div>
    </Modal>
  );
}
