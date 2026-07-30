
import React, { useEffect } from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface PrivacyPageProps {
  onBack: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="mb-10">
    <h2 className="text-lg font-black text-gray-900 uppercase tracking-widest mb-4 pb-3 border-b border-gray-100">{title}</h2>
    <div className="legal-body space-y-3 text-sm leading-relaxed">{children}</div>
  </div>
);

const PrivacyPage: React.FC<PrivacyPageProps> = ({ onBack }) => {
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
          <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Política de Privacidade</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-16">
        {/* Page header */}
        <div className="mb-14">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            <Shield className="w-3 h-3" /> Documento Legal
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tighter mb-4">
            Política de Privacidade
          </h1>
          <p className="text-sm text-gray-400 font-black uppercase tracking-widest">
            Última atualização: maio de 2025
          </p>
        </div>

        <Section title="1. Informações que Coletamos">
          <p>Ao utilizar o Umbra Hub, coletamos as seguintes informações:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-gray-900">Dados de cadastro:</strong> nome, endereço de e-mail e senha (armazenada de forma criptografada)</li>
            <li><strong className="text-gray-900">Dados de uso:</strong> ferramentas acessadas, frequência de uso e preferências de navegação</li>
            <li><strong className="text-gray-900">Dados de pagamento:</strong> processados exclusivamente pela plataforma Cakto — não armazenamos dados de cartão</li>
            <li><strong className="text-gray-900">Dados técnicos:</strong> endereço IP, tipo de navegador, sistema operacional e dispositivo</li>
          </ul>
        </Section>

        <Section title="2. Como Usamos suas Informações">
          <p>As informações coletadas são utilizadas para:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Gerenciar sua conta e fornecer acesso à plataforma</li>
            <li>Processar pagamentos e gerenciar assinaturas</li>
            <li>Enviar comunicações relacionadas ao serviço (atualizações, avisos importantes)</li>
            <li>Melhorar as funcionalidades e a experiência da plataforma</li>
            <li>Prevenir fraudes e garantir a segurança da plataforma</li>
          </ul>
        </Section>

        <Section title="3. Compartilhamento de Dados">
          <p>Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para fins comerciais.</p>
          <p>Podemos compartilhar dados com:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong className="text-gray-900">Cakto:</strong> processamento de pagamentos</li>
            <li><strong className="text-gray-900">Supabase:</strong> armazenamento seguro de dados da conta</li>
            <li><strong className="text-gray-900">Autoridades:</strong> quando exigido por lei ou ordem judicial</li>
          </ul>
        </Section>

        <Section title="4. Cookies e Rastreamento">
          <p>Utilizamos cookies e tecnologias similares para manter sua sessão ativa e lembrar suas preferências (como o modo escuro/claro).</p>
          <p>Você pode desativar cookies nas configurações do seu navegador, mas isso poderá afetar algumas funcionalidades da plataforma.</p>
        </Section>

        <Section title="5. Segurança dos Dados">
          <p>
            Adotamos medidas técnicas e organizacionais para proteger suas informações contra acesso não autorizado, alteração, divulgação ou destruição. Todos os dados são transmitidos via HTTPS e armazenados em servidores com criptografia.
          </p>
        </Section>

        <Section title="6. Retenção de Dados">
          <p>
            Mantemos seus dados pelo período necessário para a prestação do serviço. Após o cancelamento da conta, os dados são removidos em até 90 dias, salvo obrigações legais que exijam retenção por prazo maior.
          </p>
        </Section>

        <Section title="7. Seus Direitos (LGPD)">
          <p>Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Acessar os dados que temos sobre você</li>
            <li>Corrigir dados incompletos ou desatualizados</li>
            <li>Solicitar a exclusão de seus dados pessoais</li>
            <li>Revogar o consentimento para o tratamento de dados</li>
            <li>Portabilidade dos seus dados para outro serviço</li>
          </ul>
          <p>Para exercer esses direitos, entre em contato com nosso suporte.</p>
        </Section>

        <Section title="8. Alterações nesta Política">
          <p>
            Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você por e-mail ou por aviso na plataforma sobre mudanças significativas. O uso continuado após as alterações implica aceitação da nova política.
          </p>
        </Section>

        <Section title="9. Contato">
          <p>
            Para dúvidas, solicitações ou exercício dos seus direitos relacionados à privacidade, entre em contato pelo suporte disponível na plataforma.
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

export default PrivacyPage;
