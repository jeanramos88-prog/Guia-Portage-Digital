
import React, { useState } from 'react';
import { Child } from '../types';
import { Link } from 'react-router-dom';
import { Plus, Search, User, Calendar, ClipboardCheck, Trash2, Edit3, X } from 'lucide-react';

interface Props {
  children: Child[];
  onAddChild: (child: Child) => void;
  onUpdateChild: (child: Child) => void;
  onDeleteChild: (id: string) => void;
}

const Dashboard: React.FC<Props> = ({ children, onAddChild, onUpdateChild, onDeleteChild }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Fix: Explicitly type the gender field to allow all valid 'M' | 'F' | 'Other' values
  const initialFormData = {
    name: '',
    birthDate: '',
    guardian: '',
    gender: 'M' as 'M' | 'F' | 'Other',
    condition: 'Nenhum'
  };
  
  const [formData, setFormData] = useState(initialFormData);

  const filteredChildren = children.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setEditingChild(null);
    setFormData(initialFormData);
    setShowModal(true);
  };

  const handleOpenEdit = (e: React.MouseEvent, child: Child) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingChild(child);
    setFormData({
      name: child.name,
      birthDate: child.birthDate,
      guardian: child.guardianName,
      gender: child.gender,
      condition: child.condition
    });
    setShowModal(true);
  };

  const handleDelete = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`Tem certeza que deseja excluir o cadastro de ${name}? Todas as avaliações serão perdidas.`)) {
      onDeleteChild(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChild) {
      onUpdateChild({
        ...editingChild,
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender,
        guardianName: formData.guardian,
        condition: formData.condition,
      });
    } else {
      const newChild: Child = {
        id: crypto.randomUUID(),
        name: formData.name,
        birthDate: formData.birthDate,
        gender: formData.gender,
        guardianName: formData.guardian,
        condition: formData.condition,
        clinicalHistory: '',
        assessments: []
      };
      onAddChild(newChild);
    }
    setShowModal(false);
    setFormData(initialFormData);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Pacientes</h2>
          <p className="text-gray-500">Gerencie as avaliações e progresso das crianças.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-xl font-semibold transition-all shadow-lg shadow-rose-200"
        >
          <Plus size={20} /> Novo Cadastro
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input 
          type="text" 
          placeholder="Buscar criança por nome..."
          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none bg-white shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredChildren.map(child => (
          <Link 
            key={child.id} 
            to={`/child/${child.id}`}
            className="group bg-white p-6 rounded-2xl border border-gray-200 hover:border-rose-300 hover:shadow-xl transition-all flex flex-col gap-4 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-3 flex flex-col items-end gap-2 z-10">
              <div className="flex gap-1 mb-1">
                <button 
                  onClick={(e) => handleOpenEdit(e, child)}
                  className="p-1.5 bg-gray-100 text-gray-400 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors"
                  title="Editar cadastro"
                >
                  <Edit3 size={14} />
                </button>
                <button 
                  onClick={(e) => handleDelete(e, child.id, child.name)}
                  className="p-1.5 bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors"
                  title="Excluir cadastro"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${child.assessments.length > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {child.assessments.length} {child.assessments.length === 1 ? 'Avaliação' : 'Avaliações'}
              </span>
              {child.condition !== 'Nenhum' && (
                <span className="text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold uppercase">
                  {child.condition}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4 pr-16">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center font-bold text-xl uppercase shrink-0">
                {child.name.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-gray-800 group-hover:text-rose-600 transition-colors truncate">{child.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar size={14} /> {new Date(child.birthDate).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-sm text-gray-400 border-t border-gray-50 pt-4">
              <ClipboardCheck size={16} />
              Última: {child.assessments.length > 0 
                ? new Date(child.assessments[child.assessments.length - 1].date).toLocaleDateString('pt-BR')
                : 'Nenhuma registrada'}
            </div>
          </Link>
        ))}

        {filteredChildren.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <User className="mx-auto text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Nenhuma criança encontrada.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <h3 className="text-2xl font-bold mb-6 text-gray-800">
              {editingChild ? 'Editar Cadastro' : 'Novo Cadastro'}
            </h3>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                  <input 
                    required
                    type="date" 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    value={formData.birthDate}
                    onChange={e => setFormData({...formData, birthDate: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                  <select 
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value as any})}
                  >
                    <option value="M">Masculino</option>
                    <option value="F">Feminino</option>
                    <option value="Other">Outro</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnóstico / Condição</label>
                <select 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={formData.condition}
                  onChange={e => setFormData({...formData, condition: e.target.value})}
                >
                  <option value="Nenhum">Nenhum / Típico</option>
                  <option value="Síndrome de Down">Síndrome de Down</option>
                  <option value="TEA (Autismo)">TEA (Autismo)</option>
                  <option value="Atraso Global">Atraso Global do Desenvolvimento</option>
                  <option value="Paralisia Cerebral">Paralisia Cerebral</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input 
                  required
                  type="text" 
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-rose-500 outline-none"
                  value={formData.guardian}
                  onChange={e => setFormData({...formData, guardian: e.target.value})}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors font-semibold"
                >
                  {editingChild ? 'Salvar Alterações' : 'Cadastrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
