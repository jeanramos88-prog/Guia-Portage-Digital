
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { Child } from './types';
import Dashboard from './components/Dashboard';
import ChildDetails from './components/ChildDetails';
import AssessmentForm from './components/AssessmentForm';
import ResultsReport from './components/ResultsReport';
import { Layout, Users, Home } from 'lucide-react';

const App: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('portage_data');
    if (saved) {
      setChildren(JSON.parse(saved));
    }
  }, []);

  const saveToStorage = (updatedChildren: Child[]) => {
    setChildren(updatedChildren);
    localStorage.setItem('portage_data', JSON.stringify(updatedChildren));
  };

  const handleAddChild = (newChild: Child) => {
    saveToStorage([...children, newChild]);
  };

  const handleUpdateChild = (updatedChild: Child) => {
    saveToStorage(children.map(c => c.id === updatedChild.id ? updatedChild : c));
  };

  return (
    <Router>
      <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
        {/* Sidebar */}
        <nav className="w-full md:w-64 bg-gray-900 text-white p-6 md:sticky md:top-0 md:h-screen flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <Layout className="w-8 h-8 text-rose-500" />
            <h1 className="text-xl font-bold tracking-tight">Portage Digital</h1>
          </div>
          
          <div className="flex flex-col gap-2">
            <Link to="/" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
              <Home size={20} className="text-gray-400" /> Painel Inicial
            </Link>
            <Link to="/children" className="flex items-center gap-3 p-3 hover:bg-gray-800 rounded-lg transition-colors">
              <Users size={20} className="text-gray-400" /> Pacientes
            </Link>
          </div>

          <div className="mt-auto pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center uppercase font-black tracking-widest">v1.2.0 Rose Edition</p>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route path="/" element={<Dashboard children={children} onAddChild={handleAddChild} />} />
            <Route path="/children" element={<Dashboard children={children} onAddChild={handleAddChild} />} />
            <Route path="/child/:id" element={<ChildDetails children={children} onUpdateChild={handleUpdateChild} />} />
            <Route path="/child/:id/assess" element={<AssessmentForm children={children} onUpdateChild={handleUpdateChild} />} />
            <Route path="/child/:id/assess/:assessmentId" element={<AssessmentForm children={children} onUpdateChild={handleUpdateChild} />} />
            <Route path="/child/:id/report/:assessmentId" element={<ResultsReport children={children} />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
