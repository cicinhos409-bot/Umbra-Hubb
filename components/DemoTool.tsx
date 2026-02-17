
import React, { useState } from 'react';
import { generateVideoIdeas, optimizeTitle } from '../services/geminiService';

const DemoTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'ideas' | 'titles'>('ideas');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleAction = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setResults(null);
    try {
      if (activeTab === 'ideas') {
        const ideas = await generateVideoIdeas(input);
        setResults(ideas);
      } else {
        const titles = await optimizeTitle(input);
        setResults(titles);
      }
    } catch (err) {
      alert("Houve um erro na geração. Verifique sua conexão.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 bg-gray-900/30 border-y border-gray-800" id="try-ai">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Teste o Poder da Umbra Hub</h2>
          <p className="text-gray-400">Experimente gratuitamente uma prévia do que nossas ferramentas podem fazer por você.</p>
        </div>

        <div className="bg-gray-950 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="flex border-b border-gray-800 bg-gray-900/50">
            <button 
              onClick={() => { setActiveTab('ideas'); setResults(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'ideas' ? 'text-violet-400 bg-gray-900 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              💡 IDEA FORGE
            </button>
            <button 
              onClick={() => { setActiveTab('titles'); setResults(null); }}
              className={`flex-1 py-4 text-sm font-bold transition-colors ${activeTab === 'titles' ? 'text-violet-400 bg-gray-900 border-b-2 border-violet-400' : 'text-gray-500 hover:text-gray-300'}`}
            >
              ✨ TITLE OPTIMIZER
            </button>
          </div>

          <div className="p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {activeTab === 'ideas' ? 'Qual é o nicho do seu canal?' : 'Qual é o título base do seu vídeo?'}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={activeTab === 'ideas' ? 'Ex: Mistérios, Curiosidades Animais...' : 'Ex: Como ganhar dinheiro na internet'}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder:text-gray-600 focus:outline-none focus:border-violet-500 transition-colors"
                />
                <button 
                  onClick={handleAction}
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold px-8 py-3 rounded-xl shadow-lg shadow-violet-500/20 transition-all whitespace-nowrap"
                >
                  {loading ? 'Processando...' : 'GERAR AGORA'}
                </button>
              </div>
            </div>

            {results && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="h-px bg-gray-800 mb-6" />
                <h3 className="text-lg font-bold text-violet-300 mb-4">Resultados Gerados:</h3>
                
                {activeTab === 'ideas' ? (
                  <div className="space-y-4">
                    {results.map((item: any, idx: number) => (
                      <div key={idx} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                        <div className="font-bold text-white mb-1">{item.title}</div>
                        <div className="text-sm text-gray-400">{item.hook}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <div className="text-xs font-bold text-violet-400 uppercase mb-1">Variação Curiosa</div>
                      <div className="text-white font-medium">{results.curious}</div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <div className="text-xs font-bold text-fuchsia-400 uppercase mb-1">Variação Urgente</div>
                      <div className="text-white font-medium">{results.urgent}</div>
                    </div>
                    <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-800">
                      <div className="text-xs font-bold text-indigo-400 uppercase mb-1">Variação Controversa</div>
                      <div className="text-white font-medium">{results.controversial}</div>
                    </div>
                  </div>
                )}
                
                <div className="mt-8 p-4 bg-violet-600/10 border border-violet-500/20 rounded-xl text-center">
                  <p className="text-sm text-violet-200">
                    Gostou? Esta é apenas uma amostra. No plano PRO você tem acesso ilimitado e ferramentas muito mais avançadas.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default DemoTool;
