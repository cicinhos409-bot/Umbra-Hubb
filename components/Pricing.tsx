
import React from 'react';
import { PLANS } from '../constants';
import { Check, Zap, Crown, Rocket } from 'lucide-react';
import { ToolTier } from '../types';

interface PricingProps {
  userEmail?: string;
}

const Pricing: React.FC<PricingProps> = ({ userEmail }) => {
  const handleCta = (link?: string) => {
    if (link) {
      let finalLink = link;
      if (userEmail) {
        const separator = link.includes('?') ? '&' : '?';
        finalLink = `${link}${separator}email=${encodeURIComponent(userEmail)}`;
      }
      window.open(finalLink, '_blank');
    } else {
      // For Free plan or missing links
      document.getElementById('root')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-32 bg-background-deep relative overflow-hidden" id="precos">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-purple/5 blur-[150px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-brand-purple/10 border border-brand-purple/20 px-4 py-1.5 rounded-full text-[10px] font-black text-brand-purple mb-6 tracking-widest uppercase">
            💰 INVESTIMENTO INTELIGENTE
          </div>
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6">Escolha seu plano</h2>
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
            Desbloqueie o arsenal definitivo para dominar o YouTube e escalar seus canais Dark.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 items-start">
          {PLANS.map((plan, idx) => (
            <div
              key={idx}
              className={`relative flex flex-col p-10 rounded-[48px] border transition-all duration-500 hover:translate-y-[-8px] ${plan.popular
                  ? 'bg-background-mid border-brand-purple shadow-[0_20px_60px_rgba(168,85,247,0.15)] ring-1 ring-brand-purple/30'
                  : plan.tier === ToolTier.TURBO
                    ? 'bg-background-mid border-brand-pink/30 shadow-2xl'
                    : 'bg-background-light/50 border-white/5 hover:border-white/10'
                }`}
            >
              {plan.popular && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-purple text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-xl shadow-brand-purple/40">
                  ⭐ MAIS VENDIDO
                </div>
              )}

              {plan.tier === ToolTier.TURBO && (
                <div className="absolute top-4 right-8 text-brand-pink opacity-50">
                  <Crown className="w-8 h-8" />
                </div>
              )}

              <div className="mb-10">
                <div className="flex items-center gap-3 mb-4">
                  {plan.tier === ToolTier.FREE && <Rocket className="w-5 h-5 text-gray-500" />}
                  {plan.tier === ToolTier.PRO && <Zap className="w-5 h-5 text-brand-purple" />}
                  {plan.tier === ToolTier.TURBO && <Zap className="w-5 h-5 text-brand-pink" />}
                  <h3 className={`text-2xl font-black uppercase tracking-tight ${plan.tier === ToolTier.TURBO ? 'text-brand-pink' :
                      plan.popular ? 'text-brand-purple' : 'text-white'
                    }`}>{plan.name}</h3>
                </div>

                <div className="flex items-baseline gap-2 mb-4">
                  <span className="text-5xl font-black tracking-tighter text-white">{plan.price}</span>
                  <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">{plan.period}</span>
                </div>

                <p className="text-gray-500 text-sm font-medium leading-relaxed">
                  {plan.description}
                </p>
              </div>

              <div className="flex-1 space-y-5 mb-10">
                {plan.features.map((feature, fIdx) => (
                  <div key={fIdx} className="flex items-start gap-4">
                    <div className={`shrink-0 mt-1 w-4 h-4 rounded-full flex items-center justify-center ${plan.tier === ToolTier.FREE ? 'bg-white/10' :
                        plan.tier === ToolTier.PRO ? 'bg-brand-purple/20' : 'bg-brand-pink/20'
                      }`}>
                      <Check className={`w-3 h-3 ${plan.tier === ToolTier.FREE ? 'text-gray-400' :
                          plan.tier === ToolTier.PRO ? 'text-brand-purple' : 'text-brand-pink'
                        }`} />
                    </div>
                    <span className={`text-sm font-medium leading-tight ${feature.includes('Tudo do') ? 'text-white font-black' : 'text-gray-400'}`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleCta(plan.ctaLink)}
                className={`w-full py-5 rounded-[24px] font-black uppercase tracking-[0.2em] text-xs transition-all transform active:scale-95 shadow-xl ${plan.popular
                    ? 'bg-brand-purple hover:bg-brand-purple/90 text-white shadow-brand-purple/30'
                    : plan.tier === ToolTier.TURBO
                      ? 'bg-brand-pink hover:bg-brand-pink/90 text-white shadow-brand-pink/30'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}>
                {plan.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-20 text-center">
          <p className="text-[10px] font-black text-gray-700 uppercase tracking-[0.3em]">Ambiente de Pagamento Seguro via Cakto</p>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
