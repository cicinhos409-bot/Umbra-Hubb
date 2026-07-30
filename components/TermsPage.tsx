
import React, { useEffect } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';

interface TermsPageProps {
  onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-4 pb-3 border-b border-gray-100">{title}</h2>
    <div className="legal-body space-y-3 text-sm leading-relaxed">{children}</div>
  </div>
);

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  useEffect(() => { window.scrollTo(0, 0); }, []);

  return (
    <div className="min-h-screen bg-white font-rajdhani">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar
          </button>
          <div className="h-5 w-px bg-gray-200" />
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Termos de Uso</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Page header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            <FileText className="w-3 h-3" /> Documento Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
            Termos de Uso
          </h1>
          <p className="text-sm text-gray-400 font-black uppercase tracking-widest">
            Última atualização: maio de 2025
          </p>
        </div>

        <Section title="1. Aceitação dos Termos">
          <p>
            Ao acessar ou utilizar a plataforma Umbra Hub, você concorda com estes Termos de Uso. Se não concordar com alguma parte dos termos, não poderá acessar o serviço.
          </p>
        </Section>

        <Section title="2. Descrição do Serviço">
          <p>
            O Umbra Hub é uma plataforma SaaS que oferece ferramentas de apoio à criação de conteúdo digital, incluindo templates de prompts, extensões de navegador, scripts e automações voltadas para criadores de conteúdo faceless no YouTube, TikTok e demais plataformas.
          </p>
          <p>
            O serviço <strong className="text-gray-900">não gera vídeos automaticamente</strong>. As ferramentas auxiliam no planejamento, estruturação e automação de processos, sendo o usuário responsável pela criação final do conteúdo em plataformas externas.
          </p>
        </Section>

        <Section title="3. Cadastro e Conta">
          <p>Para utilizar os recursos da plataforma, você deve criar uma conta com informações verídicas e manter a confidencialidade das suas credenciais de acesso.</p>
          <p>Você é inteiramente responsável por todas as atividades que ocorrem em sua conta. Notifique-nos imediatamente em caso de uso não autorizado.</p>
        </Section>

        <Section title="4. Planos e Pagamentos">
          <p>O Umbra Hub oferece planos pagos com acesso a funcionalidades PRO. Os valores e condições estão disponíveis na página de preços.</p>
          <p>Os pagamentos são processados de forma segura pela plataforma <strong className="text-gray-900">Cakto</strong>. O Umbra Hub não armazena dados de cartão de crédito.</p>
          <p>O cancelamento pode ser realizado a qualquer momento, sem multa ou burocracia, com efeito ao final do período já pago.</p>
        </Section>

        <Section title="5. Uso Aceitável">
          <p>Você concorda em utilizar a plataforma apenas para fins lícitos. É proibido:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Revender, sublicenciar ou compartilhar o acesso com terceiros</li>
            <li>Utilizar as ferramentas para criar conteúdo enganoso, difamatório ou ilegal</li>
            <li>Tentar acessar funcionalidades além do plano contratado por meios não autorizados</li>
            <li>Realizar engenharia reversa da plataforma ou de suas extensões</li>
          </ul>
        </Section>

        <Section title="6. Propriedade Intelectual">
          <p>Todo o conteúdo da plataforma — incluindo ferramentas, prompts, extensões, scripts e design — é propriedade do Umbra Hub e está protegido por direitos autorais.</p>
          <p>O conteúdo produzido por você utilizando as ferramentas permanece de sua propriedade.</p>
        </Section>

        <Section title="7. Limitação de Responsabilidade">
          <p>O Umbra Hub fornece as ferramentas "como estão", sem garantia de resultados específicos. Os resultados dependem de fatores externos como consistência, nicho, algoritmos das plataformas e qualidade de execução do usuário.</p>
          <p>Não nos responsabilizamos por perdas decorrentes de falhas em plataformas terceiras (YouTube, TikTok, Meta, etc.).</p>
        </Section>

        <Section title="8. Modificações">
          <p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma. O uso continuado após as alterações implica aceitação dos novos termos.</p>
        </Section>

        <Section title="9. Contato">
          <p>
            Dúvidas sobre estes Termos de Uso podem ser enviadas para nosso suporte via WhatsApp ou pelo e-mail disponível na plataforma.
          </p>
        </Section>

        {/* Footer inside page */}
        <div className="mt-16 pt-8 border-t border-gray-100 flex items-center justify-between">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o site
          </button>
          <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">© 2025 Umbra Hub</span>
        </div>
      </main>
    </div>
  );
};

export default TermsPage;
