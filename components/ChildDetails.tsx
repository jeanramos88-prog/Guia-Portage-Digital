
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Child, Assessment } from '../types';
import { ChevronLeft, Plus, History, FileText, Edit, Play, Activity } from 'lucide-react';

interface Props {
  children: Child[];
  onUpdateChild: (child: Child) => void;
}

const ChildDetails: React.FC<Props> = ({ children, onUpdateChild }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const child = children.find(c => c.id === id);
  const [isEditing, setIsEditing] = useState(false);
  const [historyText, setHistoryText] = useState(child?.clinicalHistory || '');

  if (!child) return <div>Criança não encontrada.</div>;

  const saveHistory = () => {
    onUpdateChild({ ...child, clinicalHistory: historyText });
    setIsEditing(false);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-blue-600 mb-6 group">
        <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4 border-4 border-white shadow-md">
              {child.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-slate-800">{child.name}</h2>
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-slate-500">{child.gender === 'M' ? 'Menino' : 'Menina'}</span>
              {child.condition !== 'Nenhum' && (
                <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">
                  <Activity size={10} /> {child.condition}
                </span>
              )}
            </div>
            
            <div className="text-left space-y-3 pt-6 border-t border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Nascimento:</span>
                <span className="font-medium">{new Date(child.birthDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 text-sm">Responsável:</span>
                <span className="font-medium">{child.guardianName}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2"><History size={18} className="text-blue-500" /> Histórico Clínico</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="text-slate-400 hover:text-blue-600">
                <Edit size={16} />
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea 
                  className="w-full p-3 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-blue-500 outline-none"
                  value={historyText}
                  onChange={(e) => setHistoryText(e.target.value)}
                  placeholder="Descreva antecedentes médicos..."
                />
                <button onClick={saveHistory} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                  Salvar Histórico
                </button>
              </div>
            ) : (
              <p className="text-slate-600 text-sm whitespace-pre-wrap leading-relaxed italic">
                {child.clinicalHistory || 'Nenhum histórico registrado.'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-slate-800">Avaliações</h3>
            <button 
              onClick={() => navigate(`/child/${child.id}/assess`)}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all font-medium shadow-md"
            >
              <Plus size={18} /> Nova Avaliação
            </button>
          </div>

          <div className="space-y-4">
            {child.assessments.length > 0 ? (
              [...child.assessments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((assessment) => (
                <div key={assessment.id} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-200 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl text-slate-400">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-800">Avaliação Portage</h4>
                        {assessment.status === 'draft' && (
                          <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Em aberto</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">Iniciada em {new Date(assessment.date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-blue-600 font-medium">{assessment.professionalName}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/child/${child.id}/assess/${assessment.id}`)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors flex items-center gap-2"
                    >
                      {assessment.status === 'draft' ? <Play size={16} /> : <Edit size={16} />} 
                      {assessment.status === 'draft' ? 'Continuar' : 'Editar'}
                    </button>
                    {assessment.status === 'completed' && (
                      <Link 
                        to={`/child/${child.id}/report/${assessment.id}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
                      >
                        Ver Relatório
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                <FileText className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500">Nenhuma avaliação registrada.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDetails;
