
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Child, AreaScore, DevelopmentalArea, AssessmentItem, ScoreValue } from '../types';
import { PORTAGE_QUESTIONS, AREA_LABELS } from '../data/portageData';
import { generateAssessmentReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChevronLeft, Printer, Sparkles, Copy, Check, List, UserCheck, Users, FileText, Activity } from 'lucide-react';

interface Props {
  children: Child[];
}

const ResultsReport: React.FC<Props> = ({ children }) => {
  const { id, assessmentId } = useParams();
  const child = children.find(c => c.id === id);
  const assessment = child?.assessments.find(a => a.id === assessmentId);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [copied, setCopied] = useState(false);

  // Extrair profissionais únicos
  const uniqueProfessionals = useMemo(() => {
    if (!assessment) return [];
    return Array.from(new Set(
      Object.values(assessment.responses).map(r => (r as AssessmentItem).respondentName)
    )).filter(name => name && name !== 'Não Identificado');
  }, [assessment]);

  const areaScores = useMemo(() => {
    if (!assessment) return [];
    return (Object.keys(AREA_LABELS) as DevelopmentalArea[]).map(area => {
      const areaQuestions = PORTAGE_QUESTIONS.filter(q => q.area === area);
      const total = areaQuestions.length;
      let score = 0;
      areaQuestions.forEach(q => {
        const item = assessment.responses[q.id];
        if (item) score += item.score;
      });
      return { area, label: AREA_LABELS[area], score, total, percentage: total > 0 ? (score / total) * 100 : 0 };
    });
  }, [assessment]);

  // Texto descritivo automático baseado em lógica determinística
  const deterministicSummary = useMemo(() => {
    if (areaScores.length === 0) return "";
    
    const sorted = [...areaScores].sort((a, b) => b.percentage - a.percentage);
    const topArea = sorted[0];
    const bottomArea = sorted[sorted.length - 1];

    let text = `O paciente apresenta um perfil de desenvolvimento com maior prontidão na área de **${topArea.label}**, onde atingiu **${Math.round(topArea.percentage)}%** das competências avaliadas. `;
    
    if (bottomArea.percentage < 50) {
      text += `Por outro lado, a área de **${bottomArea.label}** apresenta-se como um ponto de atenção prioritário, com um aproveitamento de **${Math.round(bottomArea.percentage)}%**, sugerindo a necessidade de intervenções focadas. `;
    } else {
      text += `Observa-se um equilíbrio relativo entre as áreas, com **${bottomArea.label}** sendo a área com menor pontuação nominal (${Math.round(bottomArea.percentage)}%). `;
    }

    const average = areaScores.reduce((acc, curr) => acc + curr.percentage, 0) / areaScores.length;
    text += `A média global de desenvolvimento nas áreas do Portage é de **${Math.round(average)}%**.`;

    return text;
  }, [areaScores]);

  useEffect(() => {
    if (child && assessment && !aiAnalysis && assessment.status === 'completed') {
      handleGenerateAI();
    }
  }, [child, assessment]);

  if (!child || !assessment) return <div className="p-8 text-center font-bold">Relatório não localizado.</div>;

  const handleGenerateAI = async () => {
    setIsLoadingAnalysis(true);
    const report = await generateAssessmentReport(child, areaScores, uniqueProfessionals);
    setAiAnalysis(report || '');
    setIsLoadingAnalysis(false);
  };

  const copyToClipboard = () => {
    let text = `RELATÓRIO DE AVALIAÇÃO - INVENTÁRIO PORTAGE\n`;
    text += `Paciente: ${child.name}\n`;
    text += `Data: ${new Date(assessment.date).toLocaleDateString('pt-BR')}\n`;
    text += `Equipe: ${uniqueProfessionals.join(', ') || assessment.professionalName}\n\n`;
    
    text += `--- RESUMO EXECUTIVO ---\n`;
    text += deterministicSummary + "\n\n";

    if (assessment.summaryNotes) {
      text += `--- CONCLUSÃO CLÍNICA ---\n`;
      text += assessment.summaryNotes + "\n\n";
    }

    text += `--- TABULAÇÃO DAS ÁREAS ---\n`;
    areaScores.forEach(s => {
      text += `${s.label}: ${Math.round(s.percentage)}% (${s.score}/${s.total})\n`;
    });

    text += `\n--- ANÁLISE QUALITATIVA (IA) ---\n`;
    text += aiAnalysis || "Análise descritiva não gerada.";

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const PINK_SCALE = ['#E11D48', '#BE123C', '#9F1239', '#FB7185', '#F43F5E', '#881337'];

  return (
    <div className="max-w-6xl mx-auto pb-12 print:p-0">
      <div className="flex justify-between items-center mb-8 no-print">
        <Link to={`/child/${child.id}`} className="text-gray-500 hover:text-rose-600 inline-flex items-center gap-1 font-bold">
          <ChevronLeft size={20} /> Painel do Paciente
        </Link>
        <div className="flex gap-3">
          <button 
            onClick={copyToClipboard}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold transition-all shadow-sm border ${copied ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
            {copied ? 'Copiado!' : 'Copiar Texto Completo'}
          </button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-bold shadow-lg shadow-rose-100 transition-all">
            <Printer size={18} /> Imprimir PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
        {/* Banner de Cabeçalho */}
        <div className="bg-gray-900 p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 border border-rose-500/30">
                Inventário Portage Operacionalizado
              </div>
              <h1 className="text-5xl font-black mb-2 tracking-tight">{child.name}</h1>
              <p className="text-gray-400 font-medium">Avaliação Concluída em {new Date(assessment.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl p-6 rounded-3xl border border-white/10 min-w-[280px]">
              <p className="text-[10px] font-black uppercase text-rose-400 mb-2">Equipe Participante</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {uniqueProfessionals.map((prof, i) => (
                  <span key={i} className="bg-rose-500/20 text-rose-200 px-2 py-1 rounded-lg text-xs font-bold border border-rose-500/20">{prof}</span>
                ))}
                {uniqueProfessionals.length === 0 && <span className="text-xs text-gray-500">{assessment.professionalName}</span>}
              </div>
              <div className="pt-4 border-t border-white/10 text-[10px] text-gray-400 uppercase tracking-widest font-black">
                {child.condition || 'Desenvolvimento Típico'}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-16">
          {/* Resultados em Texto Descritivo e Gráficos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
               <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200">
                  <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-4 flex items-center gap-3">
                    <FileText className="text-rose-600" /> Resumo de Desempenho
                  </h2>
                  <p className="text-gray-700 leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: deterministicSummary.replace(/\*\*(.*?)\*\*/g, '<b class="text-rose-600">$1</b>') }} />
               </div>

               {assessment.summaryNotes && (
                 <div className="bg-white p-8 rounded-[2rem] border-2 border-dashed border-gray-100">
                    <h2 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-4 flex items-center gap-3">
                      <Activity className="text-rose-600" /> Conclusão Clínica
                    </h2>
                    <p className="text-gray-600 whitespace-pre-wrap leading-relaxed text-sm italic">
                      {assessment.summaryNotes}
                    </p>
                 </div>
               )}
            </div>

            <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-200 shadow-inner">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 text-center">Perfil de Desenvolvimento (Radar)</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={areaScores}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance %" dataKey="percentage" stroke="#E11D48" fill="#FB7185" fillOpacity={0.4} />
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Gráfico de Barras Adicional */}
          <section className="bg-gray-50 p-10 rounded-[2.5rem] border border-gray-200">
              <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.3em] mb-10 text-center">Distribuição Proporcional por Área</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaScores} layout="vertical">
                    <XAxis type="number" hide domain={[0, 100]} />
                    <YAxis dataKey="label" type="category" width={120} tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }} />
                    <Tooltip cursor={{fill: 'transparent'}} />
                    <Bar dataKey="percentage" radius={[0, 10, 10, 0]}>
                      {areaScores.map((_, index) => <Cell key={`cell-${index}`} fill={PINK_SCALE[index % PINK_SCALE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
          </section>

          {/* Análise IA */}
          <section className="no-break">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-8 flex items-center gap-4">
              <div className="p-3 bg-rose-100 rounded-2xl text-rose-600"><Sparkles size={24} /></div>
              Análise Qualitativa Narrativa (AI)
            </h2>
            <div className="bg-rose-50/20 rounded-[2.5rem] border-2 border-rose-100/50 p-10 md:p-14 relative overflow-hidden">
              <div className="relative z-10">
                {isLoadingAnalysis ? (
                  <div className="animate-pulse space-y-6 text-center">
                    <div className="h-4 bg-rose-100 rounded w-3/4 mx-auto"></div>
                    <div className="h-4 bg-rose-100 rounded w-full"></div>
                    <p className="text-rose-400 font-bold text-sm">IA processando resultados multiprofissionais...</p>
                  </div>
                ) : aiAnalysis ? (
                  <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <button onClick={handleGenerateAI} className="bg-rose-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs hover:bg-rose-700 shadow-xl shadow-rose-900/10 flex items-center gap-3 mx-auto transition-all">
                      <Sparkles size={20} /> Gerar Análise Narrativa
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Resultados em Texto - Itens Detalhados */}
          <section className="no-break pt-8">
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-8 flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-2xl text-gray-600"><List size={24} /></div>
              Listagem Detalhada por Competência
            </h2>
            <div className="space-y-10">
              {areaScores.map((areaScore) => {
                const areaQuestions = PORTAGE_QUESTIONS.filter(q => q.area === areaScore.area);
                const achievedItems = areaQuestions.filter(q => assessment.responses[q.id]?.score === ScoreValue.ACHIEVED);
                const emergingItems = areaQuestions.filter(q => assessment.responses[q.id]?.score === ScoreValue.EMERGING);
                
                if (achievedItems.length === 0 && emergingItems.length === 0) return null;

                return (
                  <div key={areaScore.area} className="border-l-4 border-gray-100 pl-8">
                    <h3 className="text-lg font-black text-rose-600 uppercase tracking-wide mb-4">{areaScore.label}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black uppercase text-green-600 mb-3 flex items-center gap-2">
                          <UserCheck size={14} /> Marcos Adquiridos ({achievedItems.length})
                        </h4>
                        <ul className="space-y-2">
                          {achievedItems.map(q => (
                            <li key={q.id} className="text-sm text-gray-600 flex gap-2">
                              <span className="font-bold text-gray-400 shrink-0">•</span>
                              <span>{q.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-[10px] font-black uppercase text-amber-600 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-amber-500 mr-1" /> Em Desenvolvimento ({emergingItems.length})
                        </h4>
                        <ul className="space-y-2">
                          {emergingItems.map(q => (
                            <li key={q.id} className="text-sm text-gray-600 flex gap-2">
                              <span className="font-bold text-gray-400 shrink-0">•</span>
                              <span>{q.description}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Rodapé do Relatório */}
          <footer className="pt-16 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8 opacity-50 no-print">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-full"><Users size={20} className="text-gray-400" /></div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Plataforma</p>
                <p className="text-sm font-bold text-gray-600">Portage Digital Pro v1.2</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">Protocolo</p>
              <p className="text-xs font-mono text-gray-600 uppercase">PORT_{assessment.id.substring(0,6)}</p>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default ResultsReport;
