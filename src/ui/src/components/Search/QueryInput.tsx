import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

interface QueryInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  modality: 'text' | 'image';
}

export function QueryInput({ value, onChange, onSubmit, isLoading, modality }: QueryInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const isImageQuery = value.startsWith('http://') || value.startsWith('https://') || value.startsWith('data:image');
  const queryType = modality === 'image' || isImageQuery ? 'image' : 'text';

  return (
    <div className="relative">
      <motion.div
        className={`absolute inset-0 rounded-2xl blur-xl transition-opacity duration-300 ${
          queryType === 'image' ? 'bg-amber/20' : 'bg-cyan/20'
        }`}
        animate={{ opacity: isFocused ? 0.5 : 0 }}
      />
      <div
        className={`relative flex items-center gap-4 p-2 rounded-2xl border transition-all duration-300 ${
          isFocused
            ? queryType === 'image'
              ? 'bg-void-100/80 border-amber/50 shadow-glow-amber'
              : 'bg-void-100/80 border-cyan/50 shadow-glow-cyan'
            : 'bg-void-100/60 border-void-300'
        }`}
      >
        <div className={`pl-4 ${queryType === 'image' ? 'text-amber' : 'text-cyan'}`}>
          {queryType === 'image' ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          )}
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={modality === 'image' ? 'Enter image URL or search text...' : 'Search for anything...'}
          className="flex-1 bg-transparent text-slate-200 placeholder:text-slate-500 outline-none text-lg"
        />

        <motion.button
          onClick={onSubmit}
          disabled={isLoading || !value.trim()}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            isLoading || !value.trim()
              ? 'bg-void-200 text-slate-500 cursor-not-allowed'
              : queryType === 'image'
              ? 'bg-amber/20 text-amber border border-amber/30 hover:bg-amber/30'
              : 'bg-cyan/20 text-cyan border border-cyan/30 hover:bg-cyan/30'
          }`}
        >
          {isLoading ? (
            <motion.div
              className="w-5 h-5 border-2 border-current border-t-transparent rounded-full"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
          ) : (
            'Search'
          )}
        </motion.button>
      </div>

      <div className="flex items-center gap-4 mt-3 px-4">
        <span className="text-xs text-slate-500">
          {queryType === 'image' ? 'Image similarity search' : 'Semantic text search'}
        </span>
        <span className="text-xs text-slate-600">|</span>
        <span className="text-xs text-slate-600">Press Enter to search</span>
      </div>
    </div>
  );
}
