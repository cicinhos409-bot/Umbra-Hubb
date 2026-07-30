
import React from 'react';
import { PLANS } from '../constants';
import { Check, Zap, Shield, Lock } from 'lucide-react';

interface PricingProps {
  userEmail?: string;
}

const Pricing: React.FC<PricingProps> = ({ userEmail }) => {
  const handleCta = (link?: string) => {
    if (link) {
      let finalLink = link;
      if (userEmail) {
        const sep = link.includes('?') ? '&' : '?';
        finalLink = `${link}${sep}email=${encodeURIComponent(userEmail)}`;
      }
      window.open(finalLink, '_blank');
    } else {
      document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-32 bg-white relative overflow-hidden" id="precos">
      <div className="max-w-3xl mx-auto px-4">

        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-gray-100 border border-gray-200 px-4 py-2 rounded-full text-[10px] font-black text-gray-600 mb-6 uppercase tracking-widest">
            Investimento Inteligente
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-gray-900 mb-4">
            Escolha seu plano
          </h2>
          <p className="text-gray-500 text-lg font-black max-w-xl mx-auto">
            Desbloqueie o arsenal definitivo para dominar o YouTube e escalar como um Criador Faceless.
          </p>
        </div>

        {/* Plan card */}
        {PLANS.map((plan, idx) => (
          <div
            key={idx}
            className="relative bg-white border-2 border-gray-900 rounded-3xl overflow-hidden shadow-[0_8px_40px_rgba(0,0,0,0.10)] hover:-translate-y-2 transition-all duration-500"
          >
            {/* TOP BADGE */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-md">
              ⭐ Plano Completo
            </div>

            {/* Card header */}
            <div className="px-10 md:px-16 pt-16 pb-10 border-b border-gray-100 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-5">
                <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-gray-900">{plan.name}</h3>
              </div>

              <div className="flex items-baseline justify-center md:justify-start gap-2 mb-4">
                <span className="text-6xl md:text-7xl font-black tracking-tighter text-gray-900">{plan.price}</span>
                <span className="text-gray-500 text-sm font-black uppercase tracking-widest">{plan.period}</span>
              </div>

              <p className="text-gray-600 text-base font-black leading-relaxed max-w-md mx-auto md:mx-0">
                {plan.description}
              </p>
            </div>

            {/* Features */}
            <div className="px-10 md:px-16 py-10">
              <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 mb-10">
                {plan.features.map((feature, fIdx) => {
                  if (feature === '---') {
                    return <div key={fIdx} className="col-span-full h-px bg-gray-100 my-2" />;
                  }
                  if (feature === 'Extensões Chrome') {
                    return (
                      <div key={fIdx} className="col-span-full text-center py-3">
                        <span className="bg-gray-100 text-gray-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border border-gray-200">
                          {feature}
                        </span>
                      </div>
                    );
                  }
                  return (
                    <div key={fIdx} className="flex items-start gap-3">
                      <div className="shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center bg-gray-900">
                        <Check className="w-3 h-3 text-white" strokeWidth={3} />
                      </div>
                      <span className="text-sm font-black text-gray-700 leading-tight">{feature}</span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <button
                onClick={() => handleCta(plan.ctaLink)}
                className="w-full py-5 rounded-2xl font-black uppercase tracking-widest text-sm bg-black hover:bg-gray-900 text-white transition-all active:scale-95 shadow-lg shadow-black/20"
              >
                {plan.cta}
              </button>
            </div>
          </div>
        ))}

        {/* Trust row */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-6">
          {[
            { icon: Shield, label: 'Pagamento Seguro via Cakto' },
            { icon: Lock,   label: 'Cancele quando quiser' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
