import React from 'react';

interface HeroProps {
  onEnterDashboard: () => void;
}

const Hero: React.FC<HeroProps> = () => {
  return (
    <section className="relative flex min-h-[78vh] items-center overflow-hidden bg-white px-4 pb-20 pt-32">
      <div className="absolute inset-0 -z-10 bg-grid opacity-[0.04] pointer-events-none" />

      <div className="mx-auto w-full max-w-4xl text-center">
        <div className="mx-auto rounded-3xl border border-amber-200 bg-amber-50/80 px-6 py-12 shadow-sm sm:px-12 md:py-16">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-widest text-amber-700">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Plataforma encerrada
          </div>

          <h1 className="mb-6 text-4xl font-black leading-tight tracking-tight text-gray-900 md:text-6xl">
            Obrigado por fazer parte da nossa história.
          </h1>

          <p className="mx-auto max-w-2xl text-lg font-semibold leading-relaxed text-gray-600 md:text-xl">
            Agradecemos de coração por fazer parte da nossa história. Informamos
            que esta plataforma encerrou suas atividades. Obrigado pela
            confiança, pelo apoio e por todos os momentos compartilhados
            conosco. <span aria-label="coração amarelo">💛</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
