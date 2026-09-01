import React, { useState } from 'react';
import { IntermediateRepresentation, Entity, EntityField, Role, Relationship } from '../types/floe';
import { 
  X, Database, Key, Link2, Shield, Code, Check, Copy, 
  ArrowRight, Search, Table, Layers, ArrowUpRight
} from 'lucide-react';

interface EntityRelationshipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  ir: IntermediateRepresentation;
  onProceedToTestbed?: () => void;
}

export const EntityRelationshipsModal: React.FC<EntityRelationshipsModalProps> = ({
  isOpen,
  onClose,
  ir,
  onProceedToTestbed
}) => {
  const [activeTab, setActiveTab] = useState<'visual_erd' | 'sql_ddl' | 'rbac_matrix'>('visual_erd');
  const [selectedEntityName, setSelectedEntityName] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  if (!isOpen) return null;

  const entities: Entity[] = ir.entities || [];
  const roles: Role[] = ir.roles || [];
  const relationships: Relationship[] = ir.relationships || [];

  const filteredEntities = entities.filter(e => 
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.fields.some(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const selectedEntity = entities.find(e => e.name === selectedEntityName) || filteredEntities[0] || entities[0];

  // Helper to derive foreign key relations from entity fields or relationship specs
  const getEntityRelations = (entity: Entity) => {
    const outgoing: Array<{ field: string; target: string; type: string }> = [];
    
    // Check fields with ref:
    entity.fields.forEach(f => {
      if (f.type.startsWith('ref:')) {
        const target = f.type.replace('ref:', '');
        outgoing.push({ field: f.name, target, type: 'Many-to-One (N:1)' });
      } else if (f.name.endsWith('_id') || f.name.endsWith('Id')) {
        const targetGuess = f.name.replace(/_id$/i, '').replace(/Id$/i, '');
        const match = entities.find(e => e.name.toLowerCase() === targetGuess.toLowerCase());
        if (match) {
          outgoing.push({ field: f.name, target: match.name, type: 'Foreign Key (N:1)' });
        }
      }
    });

    // Check relationship array
    relationships.forEach(r => {
      if (r.from.toLowerCase() === entity.name.toLowerCase()) {
        outgoing.push({ field: r.field, target: r.to, type: r.cardinality || '1:N' });
      }
    });

    // Check incoming references
    const incoming: Array<{ fromEntity: string; field: string; type: string }> = [];
    entities.forEach(other => {
      if (other.name !== entity.name) {
        other.fields.forEach(f => {
          if (f.type === `ref:${entity.name}` || f.name.toLowerCase() === `${entity.name.toLowerCase()}_id`) {
            incoming.push({ fromEntity: other.name, field: f.name, type: 'One-to-Many (1:N)' });
          }
        });
      }
    });

    return { outgoing, incoming };
  };

  // Generate clean PostgreSQL DDL code
  const generatePostgresDdl = () => {
    let ddl = `-- PostgreSQL 15 Relational Schema for "${ir.name}"\n-- Generated deterministically by Floe AST Compiler\n\n`;
    
    entities.forEach(entity => {
      ddl += `CREATE TABLE "${entity.name.toLowerCase()}s" (\n`;
      ddl += `  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n`;
      
      entity.fields.forEach(f => {
        let pgType = 'VARCHAR(255)';
        if (f.type === 'number') pgType = 'NUMERIC(12, 2)';
        else if (f.type === 'boolean') pgType = 'BOOLEAN DEFAULT false';
        else if (f.type === 'date') pgType = 'TIMESTAMP WITH TIME ZONE';
        else if (f.type === 'text') pgType = 'TEXT';
        else if (f.type.startsWith('ref:')) {
          const target = f.type.replace('ref:', '').toLowerCase();
          pgType = `UUID REFERENCES "${target}s"("id") ON DELETE CASCADE`;
        }
        
        const reqStr = f.required ? ' NOT NULL' : '';
        const defStr = f.default !== undefined ? ` DEFAULT '${f.default}'` : '';
        ddl += `  "${f.name}" ${pgType}${reqStr}${defStr},\n`;
      });

      ddl += `  "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),\n`;
      ddl += `  "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()\n`;
      ddl += `);\n\n`;
    });

    return ddl;
  };

  const handleCopyDdl = () => {
    navigator.clipboard.writeText(generatePostgresDdl());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-700/60 flex items-center justify-center text-emerald-400 shadow-inner">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/50">
                  PostgreSQL 15 Relational Schema
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {entities.length} Tables • ACID Relational
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {ir.name} Entity Relationships (ERD)
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Close Modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('visual_erd')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'visual_erd'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Visual ER Diagram</span>
            </button>

            <button
              onClick={() => setActiveTab('sql_ddl')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'sql_ddl'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>PostgreSQL DDL / Schema</span>
            </button>

            <button
              onClick={() => setActiveTab('rbac_matrix')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'rbac_matrix'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Table RBAC Permissions</span>
            </button>
          </div>

          {activeTab === 'visual_erd' && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Filter entities..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 w-44"
              />
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* TAB 1: VISUAL ER DIAGRAM */}
          {activeTab === 'visual_erd' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Entity Cards Grid */}
              <div className="lg:col-span-8 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredEntities.map((entity, idx) => {
                    const isSelected = selectedEntity?.name === entity.name;
                    const { outgoing, incoming } = getEntityRelations(entity);

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedEntityName(entity.name)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'bg-slate-950 border-emerald-500 shadow-lg shadow-emerald-950/30'
                            : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        }`}
                      >
                        <div>
                          {/* Table Header */}
                          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2.5">
                            <div className="flex items-center gap-2">
                              <Table className="w-4 h-4 text-emerald-400" />
                              <span className="font-mono font-bold text-white text-xs">
                                {entity.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                              {entity.fields.length + 1} cols
                            </span>
                          </div>

                          {/* Fields List */}
                          <div className="space-y-1 text-[11px] font-mono">
                            {/* Primary Key ID */}
                            <div className="flex items-center justify-between text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded border border-emerald-800/30">
                              <span className="flex items-center gap-1">
                                <Key className="w-3 h-3 text-amber-400 shrink-0" />
                                <strong>id</strong>
                              </span>
                              <span className="text-[10px] text-emerald-400/80">UUID (PK)</span>
                            </div>

                            {/* Entity Defined Fields */}
                            {entity.fields.map((f, fIdx) => {
                              const isRef = f.type.startsWith('ref:') || f.name.endsWith('_id');
                              return (
                                <div key={fIdx} className="flex items-center justify-between text-slate-300 px-2 py-0.5 hover:bg-slate-900 rounded">
                                  <span className="flex items-center gap-1 truncate">
                                    {isRef && <Link2 className="w-3 h-3 text-sky-400 shrink-0" />}
                                    <span className={f.required ? 'font-semibold text-white' : 'text-slate-300'}>{f.name}</span>
                                    {f.required && <span className="text-amber-400 text-xs">*</span>}
                                  </span>
                                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">{f.type}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Relations Footer Indicator */}
                        {(outgoing.length > 0 || incoming.length > 0) && (
                          <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                            <span className="flex items-center gap-1 text-sky-400">
                              <Link2 className="w-3 h-3" />
                              <span>{outgoing.length} Outgoing FK</span>
                            </span>
                            <span className="text-emerald-400">
                              {incoming.length} Incoming Ref
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Entity Inspector & Relational Mapping */}
              <div className="lg:col-span-4 space-y-4">
                {selectedEntity && (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <Database className="w-3.5 h-3.5" />
                        <span>Entity Inspector</span>
                      </span>
                      <span className="font-mono text-xs text-white font-bold">{selectedEntity.name}</span>
                    </div>

                    {selectedEntity.description && (
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                        {selectedEntity.description}
                      </p>
                    )}

                    {/* Relations for selected entity */}
                    {(() => {
                      const { outgoing, incoming } = getEntityRelations(selectedEntity);
                      return (
                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-sky-400 block mb-1.5">
                              Outgoing Foreign Keys ({outgoing.length})
                            </span>
                            {outgoing.length > 0 ? (
                              <div className="space-y-1.5">
                                {outgoing.map((rel, rIdx) => (
                                  <div key={rIdx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                                    <span className="font-mono text-white">{rel.field}</span>
                                    <div className="flex items-center gap-1 text-sky-300">
                                      <span>→</span>
                                      <span className="font-bold">{rel.target}.id</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic block">No outgoing foreign keys.</span>
                            )}
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-emerald-400 block mb-1.5">
                              Incoming References ({incoming.length})
                            </span>
                            {incoming.length > 0 ? (
                              <div className="space-y-1.5">
                                {incoming.map((rel, rIdx) => (
                                  <div key={rIdx} className="p-2 rounded bg-slate-900 border border-slate-800 text-[11px] flex items-center justify-between">
                                    <span className="font-bold text-emerald-300">{rel.fromEntity}</span>
                                    <span className="text-slate-400 font-mono">.{rel.field}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic block">No child entities referencing this table.</span>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Constraints note */}
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-[11px] text-emerald-300 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <Key className="w-3.5 h-3.5" />
                        <span>Relational Integrity</span>
                      </div>
                      <p className="text-slate-300">
                        Primary UUID keys generated with gen_random_uuid(), with ON DELETE CASCADE foreign keys.
                      </p>
                    </div>

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 2: SQL DDL / PRISMA SCHEMA */}
          {activeTab === 'sql_ddl' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Synthesized PostgreSQL 15 DDL</h4>
                  <p className="text-xs text-slate-400">Strict schema compiled from intermediate representation AST.</p>
                </div>

                <button
                  onClick={handleCopyDdl}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-slate-700 transition-colors shadow-xs"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied DDL!' : 'Copy SQL Schema'}</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto max-h-[420px]">
                <pre className="whitespace-pre">{generatePostgresDdl()}</pre>
              </div>
            </div>
          )}

          {/* TAB 3: RBAC MATRIX */}
          {activeTab === 'rbac_matrix' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">Role-to-Table Access Control (RBAC) Matrix</h4>
                <p className="text-xs text-slate-400">Declarative authorization boundaries governing entity read, write, and transition actions.</p>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Table / Entity</th>
                      {roles.map((r, rIdx) => (
                        <th key={rIdx} className="py-3 px-4 font-semibold uppercase font-mono text-indigo-400">
                          {r.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 font-medium text-slate-300 bg-slate-900/60">
                    {entities.map((entity, eIdx) => (
                      <tr key={eIdx} className="hover:bg-slate-800/50">
                        <td className="py-3 px-4 font-mono font-bold text-white flex items-center gap-2">
                          <Table className="w-3.5 h-3.5 text-emerald-400" />
                          <span>{entity.name}</span>
                        </td>
                        {roles.map((role, rIdx) => {
                          const hasAdmin = role.name.toLowerCase().includes('admin') || role.permissions.includes('*');
                          const hasApprove = role.permissions.some(p => p.includes('approve') || p.includes('manage'));
                          return (
                            <td key={rIdx} className="py-3 px-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono ${
                                hasAdmin 
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                                  : hasApprove 
                                  ? 'bg-sky-950 text-sky-300 border border-sky-800' 
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {hasAdmin ? 'CRUD (All)' : hasApprove ? 'Read / Update' : 'Create / Read (Own)'}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors"
          >
            Close Inspector
          </button>

          {onProceedToTestbed && (
            <button
              onClick={() => {
                onClose();
                onProceedToTestbed();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition-colors flex items-center gap-1.5 shadow-md"
            >
              <span>Review Blueprint & Launch Free Testbed</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
