
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Child, Assessment, ScoreValue, DevelopmentalArea, AssessmentItem, AreaScore } from '../types';
import { PORTAGE_QUESTIONS, AREA_LABELS } from '../data/portageData';
import { ChevronLeft, Save, UserCircle, CalendarDays, ListChecks, Table as TableIcon, Users, CheckSquare, Square, MessageSquare, XCircle, CheckCircle2, Activity, FileText } from 'lucide-react';

interface Props {
  children: Child[];
  onUpdateChild: (child: Child) => void;
}

const AssessmentForm: React.FC<Props> = ({ children, onUpdateChild }) => {
  const { id, assessmentId: routeAssessmentId } = useParams();
  const navigate = useNavigate();
  const child = children.find(c => c.id === id);
  
  const [assessmentId] = useState(routeAssessmentId || crypto.randomUUID());
  const [viewMode, setViewMode] = useState<'questions' | 'summary'>('questions');
  
  const existingAssessment = useMemo(() => 
    child?.assessments.find(a => a.id === assessmentId),
  [child, assessmentId]);

  const [responses, setResponses] = useState<Record<string, AssessmentItem>>(existingAssessment?.responses || {});
  const [summaryNotes, setSummaryNotes] = useState(existingAssessment?.summaryNotes || '');
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [currentAgeFilter, setCurrentAgeFilter] = useState<string>('all');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showNoteFor, setShowNoteFor] = useState<string | null>(null);
  
  const [currentSessionProfessional, setCurrentSessionProfessional] = useState(
    localStorage.getItem('last_prof_name') || ''
  );
  const [professionalRole, setProfessionalRole] = useState(
    existingAssessment?.professionalRole || localStorage.getItem('last_prof_role') || ''
  );

  if (!child) return <div>Criança não encontrada.</div>;

  const areas = Object.keys(AREA_LABELS) as DevelopmentalArea[];
  const activeArea = areas[currentAreaIndex];
  
  const allQuestionsInArea = useMemo(() => 
    PORTAGE_QUESTIONS.filter(q => q.area === activeArea), 
  [activeArea]);

  const ageRanges = useMemo(() => 
    ['all', ...Array.from(new Set(allQuestionsInArea.map(q => q.ageRange)))], 
  [allQuestionsInArea]);

  const filteredQuestions = useMemo(() => {
    if (currentAgeFilter === 'all') return allQuestionsInArea;
    return allQuestionsInArea.filter(q => q.ageRange === currentAgeFilter);
  }, [allQuestionsInArea, currentAgeFilter]);

  const persistAssessment = useCallback((currentResponses: Record<string, AssessmentItem>, currentSummary: string, status: 'draft' | 'completed' = 'draft') => {
    const assessmentData: Assessment = {
      id: assessmentId,
      date: existingAssessment?.date || new Date().toISOString(),
      professionalName: currentSessionProfessional || existingAssessment?.professionalName || 'Não Identificado',
      professionalRole: professionalRole || existingAssessment?.professionalRole || '',
      responses: currentResponses,
      status,
      summaryNotes: currentSummary
    };

    const isNew = !child.assessments.find(a => a.id === assessmentId);
    const updatedAssessments = isNew 
      ? [...child.assessments, assessmentData]
      : child.assessments.map(a => a.id === assessmentId ? assessmentData : a);

    onUpdateChild({
      ...child,
      assessments: updatedAssessments
    });
    
    if (currentSessionProfessional) localStorage.setItem('last_prof_name', currentSessionProfessional);
    if (professionalRole) localStorage.setItem('last_prof_role', professionalRole);
  }, [assessmentId, child, existingAssessment, currentSessionProfessional, professionalRole, onUpdateChild]);

  useEffect(() => {
    if (!existingAssessment && child) {
      persistAssessment({}, '', 'draft');
    }
  }, []);

  const handleScoreChange = (qId: string, score: ScoreValue) => {
    if (!currentSessionProfessional.trim()) {
      const name = prompt("Identifique-se para registrar esta resposta:");
      if (!name) return;
      setCurrentSessionProfessional(name);
    }
    
    const newResponses = { 
      ...responses, 
      [qId]: { 
        ...responses[qId],
        score, 
        respondentName: currentSessionProfessional || 'Avaliador', 
        answeredAt: new Date().toISOString() 
      } 
    };
    setResponses(newResponses);
    persistAssessment(newResponses, summaryNotes, 'draft');
  };

  const handleBatchScore = (score: ScoreValue) => {
    if (selectedItems.size === 0) return;
    if (!currentSessionProfessional.trim()) {
      const name = prompt("Identifique-se para registrar estas respostas:");
      if (!name) return;
      setCurrentSessionProfessional(name);
    }

    const newResponses = { ...responses };
    const now = new Date().toISOString();
    
    selectedItems.forEach(qId => {
      newResponses[qId] = {
        ...newResponses[qId],
        score,
        respondentName: currentSessionProfessional || 'Avaliador',
        answeredAt: now
      };
    });

    setResponses(newResponses);
    persistAssessment(newResponses, summaryNotes, 'draft');
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (qId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(qId)) {
      newSelected.delete(qId);
    } else {
      newSelected.add(qId);
    }
    setSelectedItems(newSelected);
  };

  const selectAllInFilter = () => {
    const ids = filteredQuestions.map(q => q.id);
    const allSelected = ids.every(id => selectedItems.has(id));
    
    const newSelected = new Set(selectedItems);
    if (allSelected) {
      ids.forEach(id => newSelected.delete(id));
    } else {
      ids.forEach(id => newSelected.add(id));
    }
    setSelectedItems(newSelected);
  };

  const handleNoteChange = (qId: string, notes: string) => {
    const newResponses = {
      ...responses,
      [qId]: {
        ...responses[qId],
        notes,
        respondentName: responses[qId]?.respondentName || currentSessionProfessional || 'Avaliador',
        answeredAt: responses[qId]?.answeredAt || new Date().toISOString()
      }
    };
    setResponses(newResponses);
    persistAssessment(newResponses, summaryNotes, 'draft');
  };

  const handleSummaryChange = (val: string) => {
    setSummaryNotes(val);
    persistAssessment(responses, val, 'draft');
  };

  const finalizeAssessment = () => {
    if (!currentSessionProfessional || !professionalRole) {
      alert("Por favor, preencha as informações do profissional.");
      return;
    }
    persistAssessment(responses, summaryNotes, 'completed');
    navigate(`/child/${child.id}/report/${assessmentId}`);
  };

  const areaScores = useMemo((): AreaScore[] => {
    return areas.map(area => {
      const areaQuestions = PORTAGE_QUESTIONS.filter(q => q.area === area);
      const total = areaQuestions.length;
      let score = 0;
      areaQuestions.forEach(q => {
        const item = responses[q.id];
        if (item) score += item.score;
      });
      return { area, label: AREA_LABELS[area], score, total, percentage: total > 0 ? (score / total) * 100 : 0 };
    });
  }, [responses, areas]);

  const contributorsCount = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.values(responses).forEach(r => {
      const item = r as AssessmentItem;
      counts[item.respondentName] = (counts[item.respondentName] || 0) + 1;
    });
    return counts;
  }, [responses]);

  return (
    <div className="max-w-5xl mx-auto pb-32 relative">
      <div className="flex items-center justify-between mb-8">
        <Link to={`/child/${child.id}`} className="text-gray-500 hover:text-rose-600 inline-flex items-center gap-2 font-medium">
          <ChevronLeft size={20} /> Painel do Paciente
        </Link>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800">{child.name}</h2>
          <div className="flex items-center justify-end gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            Avaliador: {currentSessionProfessional || 'Não Identificado'}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-6">
        {/* Sticky Header com Profissional Atual */}
        <div className="p-6 bg-gray-900 text-white sticky top-0 z-30 shadow-lg border-b border-rose-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-rose-400">Identificação do Avaliador</label>
              <div className="relative">
                <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                  type="text" 
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold"
                  placeholder="Seu nome"
                  value={currentSessionProfessional}
                  onChange={e => setCurrentSessionProfessional(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block text-[9px] font-black uppercase text-rose-400">Especialidade Clínica</label>
              <input 
                type="text" 
                className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white text-sm focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold"
                placeholder="Ex: Psicólogo"
                value={professionalRole}
                onChange={e => setProfessionalRole(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Tabs de Modo */}
        <div className="flex border-b bg-gray-50 px-6 gap-4">
          <button onClick={() => setViewMode('questions')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${viewMode === 'questions' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>
            <ListChecks size={18} /> Itens do Inventário
          </button>
          <button onClick={() => setViewMode('summary')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${viewMode === 'summary' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>
            <Users size={18} /> Resumo e Conclusão
          </button>
        </div>

        {viewMode === 'questions' ? (
          <>
            <div className="flex bg-white border-b overflow-x-auto no-scrollbar">
              {areas.map((area, idx) => (
                <button key={area} onClick={() => { setCurrentAreaIndex(idx); setCurrentAgeFilter('all'); setSelectedItems(new Set()); }} className={`px-6 py-5 whitespace-nowrap text-[10px] font-black transition-all relative border-b-4 uppercase tracking-tighter ${idx === currentAreaIndex ? 'border-rose-600 text-rose-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                   {AREA_LABELS[area]}
                </button>
              ))}
            </div>

            <div className="px-6 py-3 bg-white border-b flex items-center justify-between gap-2 overflow-x-auto no-scrollbar">
              <div className="flex gap-2">
                {ageRanges.map(range => (
                  <button key={range} onClick={() => { setCurrentAgeFilter(range); setSelectedItems(new Set()); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all uppercase ${currentAgeFilter === range ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    {range === 'all' ? 'Ver Todas' : `${range} ANOS`}
                  </button>
                ))}
              </div>
              <button 
                onClick={selectAllInFilter}
                className="text-[10px] font-black text-rose-600 uppercase flex items-center gap-2 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-all shrink-0"
              >
                {filteredQuestions.every(q => selectedItems.has(q.id)) ? <XCircle size={14} /> : <CheckSquare size={14} />}
                {filteredQuestions.every(q => selectedItems.has(q.id)) ? 'Desmarcar Todos' : 'Selecionar Faixa'}
              </button>
            </div>

            <div className="p-8 space-y-4 max-h-[600px] overflow-y-auto">
              {filteredQuestions.map((q) => {
                const res = responses[q.id];
                const isSelected = selectedItems.has(q.id);
                return (
                  <div 
                    key={q.id} 
                    onClick={() => toggleItemSelection(q.id)}
                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col gap-4 cursor-pointer hover:shadow-md ${isSelected ? 'border-rose-400 bg-rose-50/20 ring-2 ring-rose-500/20' : res !== undefined ? 'border-rose-100 bg-rose-50/5' : 'border-gray-100 bg-white'}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <div 
                          className={`mt-1 shrink-0 transition-colors ${isSelected ? 'text-rose-600' : 'text-gray-200'}`}
                        >
                          {isSelected ? <CheckSquare size={22} /> : <Square size={22} />}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-[9px] font-black bg-gray-800 text-white px-2 py-0.5 rounded uppercase">{q.id}</span>
                            <span className="text-[9px] font-bold text-gray-400 uppercase">IDADE: {q.ageRange} ANOS</span>
                            {res?.notes && <MessageSquare size={12} className="text-rose-400" />}
                          </div>
                          <p className="text-gray-700 font-semibold text-base leading-tight pr-4">{q.description}</p>
                          
                          {res && (
                            <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-[10px] text-gray-400">
                               <div className="flex items-center gap-1 font-bold">
                                 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1" />
                                 Avaliado por: <span className="text-rose-600 ml-1">{res.respondentName}</span>
                               </div>
                               <div className="flex items-center gap-1">
                                 <CalendarDays size={12} />
                                 {new Date(res.answeredAt || '').toLocaleDateString('pt-BR')}
                               </div>
                               <button 
                                 onClick={(e) => { e.stopPropagation(); setShowNoteFor(showNoteFor === q.id ? null : q.id); }}
                                 className="text-rose-500 hover:underline font-black uppercase flex items-center gap-1"
                               >
                                 {res.notes ? 'Ver/Editar Nota' : '+ Observação'}
                               </button>
                            </div>
                          )}

                          {!res && (
                             <div className="mt-3">
                                <button 
                                  onClick={(e) => { e.stopPropagation(); setShowNoteFor(showNoteFor === q.id ? null : q.id); }}
                                  className="text-[10px] text-gray-400 hover:text-rose-500 font-bold uppercase flex items-center gap-1"
                                >
                                  + Adicionar Observação Clínica
                                </button>
                             </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl shrink-0 h-fit no-print" onClick={(e) => e.stopPropagation()}>
                        <button 
                          onClick={() => handleScoreChange(q.id, ScoreValue.ACHIEVED)} 
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${res?.score === ScoreValue.ACHIEVED ? 'bg-green-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-white hover:text-gray-600'}`}
                        >
                          ADQUIRIDO
                        </button>
                        <button 
                          onClick={() => handleScoreChange(q.id, ScoreValue.EMERGING)} 
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${res?.score === ScoreValue.EMERGING ? 'bg-amber-500 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-white hover:text-gray-600'}`}
                        >
                          EM DESENVOLVIMENTO
                        </button>
                        <button 
                          onClick={() => handleScoreChange(q.id, ScoreValue.NOT_ACHIEVED)} 
                          className={`px-4 py-2.5 rounded-xl text-[10px] font-black transition-all ${res?.score === ScoreValue.NOT_ACHIEVED ? 'bg-red-600 text-white shadow-lg scale-105' : 'text-gray-400 hover:bg-white hover:text-gray-600'}`}
                        >
                          NÃO ADQUIRIDO
                        </button>
                      </div>
                    </div>

                    {showNoteFor === q.id && (
                      <div className="mt-2 pt-2 border-t border-dashed border-gray-100 animate-in slide-in-from-top-2 duration-200" onClick={(e) => e.stopPropagation()}>
                        <textarea 
                          className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-rose-500 min-h-[80px]"
                          placeholder="Digite aqui as particularidades desta conduta ou marcos alcançados..."
                          value={res?.notes || ''}
                          onChange={(e) => handleNoteChange(q.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase mb-6 flex items-center gap-3">
                  <Users className="text-rose-600" /> Registro Multiprofissional
                </h3>
                <div className="space-y-3">
                  {Object.entries(contributorsCount).map(([name, count]) => (
                    <div key={name} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-bold text-gray-700">{name}</span>
                      <span className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-xs font-black">{count} itens registrados</span>
                    </div>
                  ))}
                  {Object.keys(contributorsCount).length === 0 && <p className="text-gray-400 italic">Nenhum dado registrado até o momento.</p>}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-black text-gray-800 uppercase mb-6 flex items-center gap-3">
                  <TableIcon className="text-rose-600" /> Rendimento por Áreas
                </h3>
                <div className="space-y-4">
                  {areaScores.map((score) => (
                    <div key={score.area} className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-gray-700 text-sm uppercase">{score.label}</h4>
                        <p className="text-xs text-gray-400">{score.score} pontos de {score.total} itens</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-black text-rose-600">{Math.round(score.percentage)}%</div>
                        <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden mt-1">
                          <div className="h-full bg-rose-500" style={{ width: `${score.percentage}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t pt-8">
              <h3 className="text-xl font-black text-gray-800 uppercase mb-6 flex items-center gap-3">
                <FileText className="text-rose-600" /> Resultados em Texto Descritivo
              </h3>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase text-gray-400">Conclusão Clínica / Parecer do Especialista</label>
                <textarea 
                  className="w-full p-6 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-rose-500 min-h-[250px] shadow-inner"
                  placeholder="Escreva aqui os resultados descritivos, pontos de atenção e observações gerais sobre a avaliação..."
                  value={summaryNotes}
                  onChange={(e) => handleSummaryChange(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 italic">Este texto será incluído integralmente no relatório final do paciente.</p>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-gray-900 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <button disabled={currentAreaIndex === 0} onClick={() => setCurrentAreaIndex(prev => prev - 1)} className="text-gray-400 font-black uppercase text-[10px] disabled:opacity-20 hover:text-white">Área Anterior</button>
            <div className="text-rose-400 font-black uppercase text-[10px]">Proteção de Dados Ativa</div>
          </div>
          <div className="flex items-center gap-6">
             <button onClick={() => navigate(`/child/${child.id}`)} className="text-gray-400 font-black uppercase text-[10px] hover:text-white">Salvar Rascunho</button>
            <button onClick={finalizeAssessment} className="bg-rose-600 text-white px-10 py-3 rounded-xl font-black uppercase text-xs hover:bg-rose-500 transition-all shadow-lg shadow-rose-900/20">
              <Save size={16} className="inline mr-2" /> Gerar Relatório Final
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Bar for Selection */}
      {selectedItems.size > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <div className="bg-gray-900/90 backdrop-blur-lg border border-rose-500/30 p-4 rounded-[2rem] shadow-2xl flex items-center gap-6">
             <div className="px-4 border-r border-gray-700">
                <p className="text-white font-black text-xs uppercase">{selectedItems.size} ITENS SELECIONADOS</p>
                <button onClick={() => setSelectedItems(new Set())} className="text-rose-400 text-[10px] font-bold uppercase hover:underline">Limpar Seleção</button>
             </div>
             <div className="flex gap-2">
                <button onClick={() => handleBatchScore(ScoreValue.ACHIEVED)} className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                  <CheckCircle2 size={14} /> Adquirido
                </button>
                <button onClick={() => handleBatchScore(ScoreValue.EMERGING)} className="bg-amber-500 hover:bg-amber-600 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                  <Activity size={14} /> Em Desenv.
                </button>
                <button onClick={() => handleBatchScore(ScoreValue.NOT_ACHIEVED)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                  <XCircle size={14} /> Não Adquirido
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentForm;
