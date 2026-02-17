
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Child, AreaScore, DevelopmentalArea, AssessmentItem } from '../types';
import { PORTAGE_QUESTIONS, AREA_LABELS } from '../data/portageData';
import { generateAssessmentReport } from '../services/geminiService';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { ChevronLeft, Printer, Sparkles, Loader2, Table as TableIcon, BarChart3, FileText } from 'lucide-react';

interface Props {
  children: Child[];
}

const ResultsReport: React.FC<Props> = ({ children }) => {
  const { id, assessmentId } = useParams();
  const child = children.find(c => c.id === id);
  const assessment = child?.assessments.find(a => a.id === assessmentId);
  const [aiAnalysis, setAiAnalysis] = useState<string>('');
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  useEffect(() => {
    if (child && assessment && !aiAnalysis && assessment.status === 'completed') {
      handleGenerateAI();
    }
  }, [child, assessment]);

  if (!child || !assessment) return <div className="p-8 text-center">Relatório não encontrado.</div>;

  const areaScores = (Object.keys(AREA_LABELS) as DevelopmentalArea[]).map(area => {
    const areaQuestions = PORTAGE_QUESTIONS.filter(q => q.area === area);
    const total = areaQuestions.length;
    let score = 0;
    areaQuestions.forEach(q => {
      const item = assessment.responses[q.id];
      if (item) score += item.score;
    });
    return { area, label: AREA_LABELS[area], score, total, percentage: total > 0 ? (score / total) * 100 : 0 };
  });

  const handleGenerateAI = async () => {
    setIsLoadingAnalysis(true);
    const report = await generateAssessmentReport(child, areaScores);
    setAiAnalysis(report || '');
    setIsLoadingAnalysis(false);
  };

  const PINK_SCALE = ['#E11D48', '#BE123C', '#9F1239', '#FB7185', '#F43F5E', '#881337'];

  return (
    <div className="max-w-6xl mx-auto pb-12 print:p-0">
      <div className="flex justify-between items-center mb-8 no-print">
        <Link to={`/child/${child.id}`} className="text-gray-500 hover:text-rose-600 inline-flex items-center gap-1 font-bold">
          <ChevronLeft size={20} /> Voltar ao Perfil
        </Link>
        <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 font-bold text-gray-700 shadow-sm">
          <Printer size={18} /> Imprimir Relatório
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
        <div className="bg-gray-900 p-8 md:p-12 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start gap-6">
            <div>
              <div className="inline-flex items-center gap-2 bg-rose-500/20 text-rose-300 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
                Inventário Portage Operacionalizado
              </div>
              <h1 className="text-4xl font-black mb-2">{child.name}</h1>
              <p className="text-gray-400 font-medium">Relatório Longitudinal - {new Date(assessment.date).toLocaleDateString('pt-BR')}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/10 min-w-[240px]">
              <p className="text-[10px] font-black uppercase text-rose-300 mb-2">Condição Clínica</p>
              <div className="text-xl font-bold">{child.condition || 'Típico'}</div>
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-gray-400">
                Avaliador: <span className="text-white block font-bold">{assessment.professionalName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Tabulação */}
          <section>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-3">
              <TableIcon className="text-rose-600" /> Tabulação de Dados
            </h2>
            <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase tracking-widest">Área de Desenvolvimento</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase text-center">Pontos / Total</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-500 uppercase">Aproveitamento (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {areaScores.map((score) => (
                    <tr key={score.area} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-700">{score.label}</td>
                      <td className="px-6 py-4 text-center font-black text-rose-600">{score.score} / {score.total}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-600" style={{ width: `${score.percentage}%` }} />
                          </div>
                          <span className="text-sm font-black text-gray-700 w-12 text-right">{Math.round(score.percentage)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Gráficos */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Perfil de Desenvolvimento (Radar)</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={areaScores}>
                    <PolarGrid stroke="#cbd5e1" />
                    <PolarAngleAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontWeight: 'bold' }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} />
                    <Radar name="Performance" dataKey="percentage" stroke="#E11D48" fill="#FB7185" fillOpacity={0.4} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-gray-50 p-8 rounded-3xl border border-gray-200">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-8 text-center">Distribuição de Scores (Barras)</h3>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={areaScores} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis dataKey="label" type="category" width={100} tick={{ fontSize: 9, fontWeight: 'bold' }} />
                    <Tooltip />
                    <Bar dataKey="percentage" radius={[0, 10, 10, 0]}>
                      {areaScores.map((_, index) => <Cell key={`cell-${index}`} fill={PINK_SCALE[index % PINK_SCALE.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

          {/* Análise IA */}
          <section>
            <h2 className="text-2xl font-black text-gray-800 uppercase tracking-tight mb-6 flex items-center gap-3">
              <Sparkles className="text-rose-600" /> Análise Qualitativa Automatizada
            </h2>
            <div className="bg-rose-50/30 rounded-3xl border-2 border-rose-100/50 p-8 md:p-12 relative overflow-hidden">
              <div className="relative z-10">
                {isLoadingAnalysis ? (
                  <div className="animate-pulse space-y-4">
                    <div className="h-4 bg-rose-100 rounded w-3/4"></div>
                    <div className="h-4 bg-rose-100 rounded w-full"></div>
                    <div className="h-32 bg-rose-100/50 rounded-2xl"></div>
                  </div>
                ) : aiAnalysis ? (
                  <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed text-lg whitespace-pre-wrap">
                    {aiAnalysis}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <button onClick={handleGenerateAI} className="bg-rose-600 text-white px-8 py-3 rounded-2xl font-bold hover:bg-rose-700 shadow-lg flex items-center gap-2 mx-auto">
                      <Sparkles size={18} /> Gerar Análise Profissional
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResultsReport;
