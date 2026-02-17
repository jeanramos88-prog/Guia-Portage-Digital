
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Child, Assessment, ScoreValue, DevelopmentalArea, AssessmentItem, AreaScore } from '../types';
import { PORTAGE_QUESTIONS, AREA_LABELS } from '../data/portageData';
import { ChevronLeft, ChevronRight, Save, Info, CheckCircle2, CircleDashed, UserCircle, CalendarDays, History, AlertCircle, LayoutDashboard, ListChecks, Table as TableIcon } from 'lucide-react';

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
  const [currentAreaIndex, setCurrentAreaIndex] = useState(0);
  const [currentAgeFilter, setCurrentAgeFilter] = useState<string>('all');
  
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

  const persistAssessment = useCallback((currentResponses: Record<string, AssessmentItem>, status: 'draft' | 'completed' = 'draft') => {
    const assessmentData: Assessment = {
      id: assessmentId,
      date: existingAssessment?.date || new Date().toISOString(),
      professionalName: currentSessionProfessional || existingAssessment?.professionalName || 'Não Identificado',
      professionalRole: professionalRole || existingAssessment?.professionalRole || '',
      responses: currentResponses,
      status,
      summaryNotes: existingAssessment?.summaryNotes || ''
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
      persistAssessment({}, 'draft');
    }
  }, []);

  const handleScoreChange = (qId: string, score: ScoreValue) => {
    if (!currentSessionProfessional.trim()) {
      const name = prompt("Por favor, identifique-se para registrar esta resposta:");
      if (!name) return;
      setCurrentSessionProfessional(name);
      const newResponses = { ...responses, [qId]: { score, respondentName: name, answeredAt: new Date().toISOString() } };
      setResponses(newResponses);
      persistAssessment(newResponses, 'draft');
    } else {
      const newResponses = { ...responses, [qId]: { ...responses[qId], score, respondentName: currentSessionProfessional, answeredAt: new Date().toISOString() } };
      setResponses(newResponses);
      persistAssessment(newResponses, 'draft');
    }
  };

  const handleRespondentChange = (qId: string, name: string) => {
    const newResponses = { ...responses, [qId]: { ...responses[qId], respondentName: name } };
    setResponses(newResponses);
    persistAssessment(newResponses, 'draft');
  };

  const finalizeAssessment = () => {
    if (!currentSessionProfessional || !professionalRole) {
      alert("Por favor, preencha as informações do profissional.");
      return;
    }
    persistAssessment(responses, 'completed');
    navigate(`/child/${child.id}/report/${assessmentId}`);
  };

  const totalProgress = (Object.keys(responses).length / PORTAGE_QUESTIONS.length) * 100;
  
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

  const areaProgress = useMemo(() => {
    const areaIds = allQuestionsInArea.map(q => q.id);
    const answeredInArea = Object.keys(responses).filter(id => areaIds.includes(id)).length;
    return (answeredInArea / allQuestionsInArea.length) * 100;
  }, [responses, allQuestionsInArea]);

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-8">
        <Link to={`/child/${child.id}`} className="text-gray-500 hover:text-rose-600 inline-flex items-center gap-2 font-medium">
          <ChevronLeft size={20} /> Sair e Voltar
        </Link>
        <div className="text-right">
          <h2 className="text-2xl font-bold text-gray-800">{child.name}</h2>
          <div className="flex items-center justify-end gap-2 text-rose-500 font-bold text-[10px] uppercase tracking-widest">
            <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
            Auto-Tabulação Ativa
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden mb-6">
        {/* Header Profissional */}
        <div className="p-6 bg-gray-900 text-white grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase opacity-60">Avaliador Atual</label>
            <div className="relative">
              <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="text" 
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold"
                placeholder="Seu nome"
                value={currentSessionProfessional}
                onChange={e => setCurrentSessionProfessional(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase opacity-60">Especialidade</label>
            <input 
              type="text" 
              className="w-full px-4 py-2 rounded-xl bg-gray-800 border border-gray-700 text-white placeholder:text-gray-600 focus:ring-2 focus:ring-rose-500 outline-none transition-all font-bold"
              placeholder="Sua especialidade"
              value={professionalRole}
              onChange={e => setProfessionalRole(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b bg-gray-50 px-6 gap-4">
          <button onClick={() => setViewMode('questions')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${viewMode === 'questions' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>
            <ListChecks size={18} /> Itens do Inventário
          </button>
          <button onClick={() => setViewMode('summary')} className={`py-4 px-4 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${viewMode === 'summary' ? 'border-rose-600 text-rose-600' : 'border-transparent text-gray-400'}`}>
            <TableIcon size={18} /> Tabulação Prévia
          </button>
        </div>

        {viewMode === 'questions' ? (
          <>
            <div className="flex bg-white border-b overflow-x-auto no-scrollbar">
              {areas.map((area, idx) => {
                const hasStarted = PORTAGE_QUESTIONS.filter(q => q.area === area).some(q => responses[q.id] !== undefined);
                return (
                  <button key={area} onClick={() => { setCurrentAreaIndex(idx); setCurrentAgeFilter('all'); }} className={`px-6 py-5 whitespace-nowrap text-xs font-black transition-all relative border-b-4 uppercase tracking-tighter ${idx === currentAreaIndex ? 'border-rose-600 text-rose-600 bg-white' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    <div className="flex items-center gap-2">
                      {hasStarted && <CircleDashed size={12} className="text-rose-500 animate-spin-slow" />}
                      {AREA_LABELS[area]}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="px-6 py-3 bg-white border-b flex gap-2 overflow-x-auto no-scrollbar">
              {ageRanges.map(range => (
                <button key={range} onClick={() => setCurrentAgeFilter(range)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${currentAgeFilter === range ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                  {range === 'all' ? 'Ver Todas' : `${range} ANOS`}
                </button>
              ))}
            </div>

            <div className="p-8 space-y-4 max-h-[500px] overflow-y-auto">
              {filteredQuestions.map((q) => {
                const res = responses[q.id];
                return (
                  <div key={q.id} className={`p-6 rounded-2xl border transition-all duration-200 ${res !== undefined ? 'border-rose-100 bg-rose-50/20' : 'border-gray-100 bg-white'}`}>
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="text-[10px] font-black bg-gray-800 text-white px-2 py-0.5 rounded uppercase">ITEM {q.id}</span>
                          <span className="text-[10px] font-bold text-gray-400 uppercase">IDADE {q.ageRange}</span>
                        </div>
                        <p className="text-gray-700 font-semibold text-lg leading-tight">{q.description}</p>
                      </div>
                      <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl shadow-inner">
                        <button onClick={() => handleScoreChange(q.id, ScoreValue.ACHIEVED)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${res?.score === ScoreValue.ACHIEVED ? 'bg-green-500 text-white shadow-lg' : 'hover:bg-white text-gray-400'}`}>SIM</button>
                        <button onClick={() => handleScoreChange(q.id, ScoreValue.EMERGING)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${res?.score === ScoreValue.EMERGING ? 'bg-amber-500 text-white shadow-lg' : 'hover:bg-white text-gray-400'}`}>ÀS VEZES</button>
                        <button onClick={() => handleScoreChange(q.id, ScoreValue.NOT_ACHIEVED)} className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${res?.score === ScoreValue.NOT_ACHIEVED ? 'bg-red-500 text-white shadow-lg' : 'hover:bg-white text-gray-400'}`}>NÃO</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="p-8">
            <h3 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-3">
              <TableIcon className="text-rose-600" /> Tabulação de Resultados
            </h3>
            <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-[10px] font-black uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Área de Desenvolvimento</th>
                    <th className="px-6 py-4 text-center">Pontos</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {areaScores.map((score) => (
                    <tr key={score.area} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-bold text-gray-700">{score.label}</td>
                      <td className="px-6 py-4 text-center"><span className="font-black text-rose-600">{score.score}</span> / {score.total}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${score.percentage}%` }} />
                          </div>
                          <span className="text-[10px] font-black text-gray-500">{Math.round(score.percentage)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-8 bg-gray-900 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <button disabled={currentAreaIndex === 0} onClick={() => setCurrentAreaIndex(prev => prev - 1)} className="text-gray-400 font-black uppercase text-xs disabled:opacity-20 hover:text-white">
              Anterior
            </button>
            <div className="text-rose-400 font-black uppercase text-[10px]">Auto-Save Ativo</div>
          </div>
          <div className="flex items-center gap-6">
            {viewMode === 'questions' ? (
              <button onClick={() => { if(currentAreaIndex < areas.length - 1) setCurrentAreaIndex(prev => prev + 1); else setViewMode('summary'); }} className="bg-gray-700 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs hover:bg-gray-600">
                {currentAreaIndex < areas.length - 1 ? 'Próxima Área' : 'Revisar e Tabular'}
              </button>
            ) : (
              <button onClick={finalizeAssessment} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs hover:bg-rose-500 shadow-xl shadow-rose-900/20">
                <Save size={18} className="inline mr-2" /> Finalizar Avaliação
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700 flex items-center gap-6">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cobertura Global</div>
        <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-rose-400" style={{ width: `${totalProgress}%` }} />
        </div>
        <div className="text-xl font-black text-rose-400 tabular-nums">{Math.round(totalProgress)}%</div>
      </div>
    </div>
  );
};

export default AssessmentForm;
