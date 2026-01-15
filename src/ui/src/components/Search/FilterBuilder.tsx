import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FilterCondition, FilterOperator, IndexSchema } from '../../types/recall';

interface FilterBuilderProps {
  schema: IndexSchema;
  filter: FilterCondition | null;
  onChange: (filter: FilterCondition | null) => void;
}

const OPERATORS: { op: FilterOperator; label: string; types: string[] }[] = [
  { op: 'EQ', label: '=', types: ['keyword', 'text', 'int', 'float', 'bool'] },
  { op: 'NEQ', label: '!=', types: ['keyword', 'text', 'int', 'float', 'bool'] },
  { op: 'LT', label: '<', types: ['int', 'float'] },
  { op: 'LTE', label: '<=', types: ['int', 'float'] },
  { op: 'GT', label: '>', types: ['int', 'float'] },
  { op: 'GTE', label: '>=', types: ['int', 'float'] },
  { op: 'IN', label: 'in', types: ['keyword', 'text', 'int', 'float'] },
];

interface SimpleCondition {
  id: string;
  field: string;
  op: FilterOperator;
  value: string;
}

export function FilterBuilder({ schema, filter, onChange }: FilterBuilderProps) {
  const [conditions, setConditions] = useState<SimpleCondition[]>([]);
  const [logicalOp, setLogicalOp] = useState<'AND' | 'OR'>('AND');
  const [showDsl, setShowDsl] = useState(false);

  const fields = Object.entries(schema);

  const addCondition = () => {
    if (fields.length === 0) return;
    const newCondition: SimpleCondition = {
      id: crypto.randomUUID(),
      field: fields[0][0],
      op: 'EQ',
      value: '',
    };
    const updated = [...conditions, newCondition];
    setConditions(updated);
    updateFilter(updated, logicalOp);
  };

  const updateCondition = (id: string, key: keyof SimpleCondition, val: string) => {
    const updated = conditions.map((c) => (c.id === id ? { ...c, [key]: val } : c));
    setConditions(updated);
    updateFilter(updated, logicalOp);
  };

  const removeCondition = (id: string) => {
    const updated = conditions.filter((c) => c.id !== id);
    setConditions(updated);
    updateFilter(updated, logicalOp);
  };

  const updateFilter = (conds: SimpleCondition[], op: 'AND' | 'OR') => {
    const validConditions = conds.filter((c) => c.field && c.value.trim());

    if (validConditions.length === 0) {
      onChange(null);
      return;
    }

    const filterConditions = validConditions.map((c) => {
      const fieldType = schema[c.field];
      let value: string | number | boolean | (string | number)[] = c.value;

      if (c.op === 'IN') {
        value = c.value.split(',').map((v) => {
          const trimmed = v.trim();
          if (fieldType === 'int') return parseInt(trimmed, 10);
          if (fieldType === 'float') return parseFloat(trimmed);
          return trimmed;
        });
      } else if (fieldType === 'int') {
        value = parseInt(c.value, 10);
      } else if (fieldType === 'float') {
        value = parseFloat(c.value);
      } else if (fieldType === 'bool') {
        value = c.value.toLowerCase() === 'true';
      }

      return { op: c.op, field: c.field, value } as FilterCondition;
    });

    if (filterConditions.length === 1) {
      onChange(filterConditions[0]);
    } else {
      onChange({ op, conditions: filterConditions });
    }
  };

  const handleLogicalOpChange = (op: 'AND' | 'OR') => {
    setLogicalOp(op);
    updateFilter(conditions, op);
  };

  const getAvailableOperators = (fieldType: string) => {
    return OPERATORS.filter((o) => o.types.includes(fieldType));
  };

  if (fields.length === 0) {
    return (
      <div className="bg-white rounded-xl p-4 border border-cloud-300 shadow-soft">
        <h3 className="text-sm font-medium text-ink-200 mb-2">Filters</h3>
        <p className="text-xs text-ink-50">No filterable fields in schema</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl p-4 border border-cloud-300 shadow-soft">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-ink-200">Filters</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowDsl(!showDsl)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${showDsl ? 'bg-grape-100 text-grape' : 'text-ink-50 hover:text-ink-200 hover:bg-cloud-200'
              }`}
          >
            DSL
          </button>
          <button onClick={addCondition} className="text-xs text-apple hover:text-apple-600 font-medium transition-colors">
            + Add
          </button>
        </div>
      </div>

      {conditions.length > 1 && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-ink-50 font-medium">Combine with:</span>
          <div className="flex rounded-lg overflow-hidden border border-cloud-400">
            {(['AND', 'OR'] as const).map((op) => (
              <button
                key={op}
                onClick={() => handleLogicalOpChange(op)}
                className={`px-3 py-1 text-xs font-medium transition-colors ${logicalOp === op
                    ? 'bg-apple text-white'
                    : 'bg-cloud-100 text-ink-100 hover:text-ink'
                  }`}
              >
                {op}
              </button>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {conditions.length === 0 ? (
          <div className="text-center py-4 border border-dashed border-cloud-400 rounded-xl bg-cloud-100">
            <p className="text-xs text-ink-50">No filters applied</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conditions.map((condition, index) => {
              const fieldType = schema[condition.field] || 'keyword';
              const availableOps = getAvailableOperators(fieldType);

              return (
                <motion.div
                  key={condition.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-2"
                >
                  {index > 0 && (
                    <span className="text-xs text-grape font-medium w-8">{logicalOp}</span>
                  )}
                  {index === 0 && conditions.length > 1 && <span className="w-8" />}

                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, 'field', e.target.value)}
                    className="input-glow text-xs font-mono py-1.5 px-2 flex-1"
                  >
                    {fields.map(([name, type]) => (
                      <option key={name} value={name}>
                        {name} ({type})
                      </option>
                    ))}
                  </select>

                  <select
                    value={condition.op}
                    onChange={(e) => updateCondition(condition.id, 'op', e.target.value)}
                    className="input-glow text-xs font-mono py-1.5 px-2 w-16"
                  >
                    {availableOps.map((o) => (
                      <option key={o.op} value={o.op}>
                        {o.label}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, 'value', e.target.value)}
                    placeholder={condition.op === 'IN' ? 'val1, val2, ...' : 'value'}
                    className="input-glow text-xs font-mono py-1.5 px-2 flex-1"
                  />

                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="p-1.5 text-ink-50 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showDsl && filter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            <div className="bg-cloud-100 rounded-lg p-3 border border-cloud-300">
              <pre className="text-xs font-mono text-ink-200 overflow-x-auto">
                {JSON.stringify(filter, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
