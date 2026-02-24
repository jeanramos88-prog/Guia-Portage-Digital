
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Child, Assessment } from '../types';
import { ChevronLeft, Plus, History, FileText, Edit, Play, Activity, Trash2 } from 'lucide-react';

interface Props {
  children: Child[];
  onUpdateChild: (child: Child) => void;
  onDeleteChild: (id: string) => void;
}

const ChildDetails: React.FC<Props> = ({ children, onUpdateChild, onDeleteChild }) => {
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

  const handleDeletePatient = () => {
    if (window.confirm(`Tem certeza que deseja excluir permanentemente o cadastro de ${child.name}? Esta ação não pode ser desfeita.`)) {
      onDeleteChild(child.id);
      navigate('/');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <Link to="/" className="inline-flex items-center text-gray-500 hover:text-rose-600 group font-medium">
          <ChevronLeft className="group-hover:-translate-x-1 transition-transform" /> Voltar ao Painel
        </Link>
        <button 
          onClick={handleDeletePatient}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-red-600 transition-colors text-sm font-bold uppercase tracking-wider"
        >
          <Trash2 size={16} /> Excluir Paciente
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 p-3">
               {child.condition !== 'Nenhum' && (
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full text-[10px] font-black uppercase border border-rose-100">
                  <Activity size={10} /> {child.condition}
                </span>
              )}
            </div>
            <div className="w-24 h-24 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center font-bold text-4xl mx-auto mb-4 border-4 border-white shadow-md uppercase">
              {child.name.charAt(0)}
            </div>
            <h2 className="text-2xl font-bold text-gray-800">{child.name}</h2>
            <div className="flex justify-center gap-2 mb-4">
              <span className="text-gray-500 text-sm">{child.gender === 'M' ? 'Masculino' : child.gender === 'F' ? 'Feminino' : 'Outro'}</span>
            </div>
            
            <div className="text-left space-y-3 pt-6 border-t border-gray-100">
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs font-black uppercase tracking-wider">Nascimento</span>
                <span className="font-bold text-gray-800">{new Date(child.birthDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-xs font-black uppercase tracking-wider">Responsável</span>
                <span className="font-bold text-gray-800">{child.guardianName}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2 text-gray-800"><History size={18} className="text-rose-500" /> Histórico Clínico</h3>
              <button onClick={() => setIsEditing(!isEditing)} className="text-gray-400 hover:text-rose-600">
                <Edit size={16} />
              </button>
            </div>
            {isEditing ? (
              <div className="space-y-3">
                <textarea 
                  className="w-full p-3 border rounded-lg min-h-[150px] focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                  value={historyText}
                  onChange={(e) => setHistoryText(e.target.value)}
                  placeholder="Descreva antecedentes médicos, marcos do desenvolvimento, etc..."
                />
                <button onClick={saveHistory} className="w-full py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-semibold text-sm transition-colors">
                  Salvar Histórico
                </button>
              </div>
            ) : (
              <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed italic">
                {child.clinicalHistory || 'Nenhum histórico registrado.'}
              </p>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-800">Avaliações Portage</h3>
            <button 
              onClick={() => navigate(`/child/${child.id}/assess`)}
              className="flex items-center gap-2 bg-rose-600 text-white px-6 py-2.5 rounded-xl hover:bg-rose-700 transition-all font-bold shadow-lg shadow-rose-100 text-sm"
            >
              <Plus size={18} /> Nova Avaliação
            </button>
          </div>

          <div className="space-y-4">
            {child.assessments.length > 0 ? (
              [...child.assessments].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((assessment) => (
                <div key={assessment.id} className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-rose-200 hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                    <div className="bg-gray-50 p-3 rounded-xl text-gray-300">
                      <FileText size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-gray-800 uppercase tracking-tight text-sm">Avaliação Periódica</h4>
                        {assessment.status === 'draft' && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-black uppercase">Rascunho</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 font-medium">Data: {new Date(assessment.date).toLocaleDateString('pt-BR')}</p>
                      <p className="text-xs text-rose-600 font-black uppercase mt-1 tracking-tighter">{assessment.professionalName} • {assessment.professionalRole}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => navigate(`/child/${child.id}/assess/${assessment.id}`)}
                      className="px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-bold text-xs transition-colors flex items-center gap-2 border border-gray-100"
                    >
                      {assessment.status === 'draft' ? <Play size={14} className="text-rose-500" /> : <Edit size={14} />} 
                      {assessment.status === 'draft' ? 'Continuar' : 'Revisar Itens'}
                    </button>
                    {assessment.status === 'completed' && (
                      <Link 
                        to={`/child/${child.id}/report/${assessment.id}`}
                        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-bold text-xs transition-colors shadow-lg shadow-rose-100"
                      >
                        Ver Relatório & Gráficos
                      </Link>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <FileText className="text-gray-200" size={32} />
                </div>
                <p className="text-gray-400 font-medium italic">Nenhuma avaliação registrada para este paciente.</p>
                <button 
                  onClick={() => navigate(`/child/${child.id}/assess`)}
                  className="mt-4 text-rose-600 font-bold text-sm hover:underline"
                >
                  Começar primeira avaliação agora
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChildDetails;
