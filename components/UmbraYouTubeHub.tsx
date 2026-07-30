
import React from 'react';
import UmbraYouTubeTool from './UmbraYouTubeTool';

/**
 * Unified YouTube Hub
 * Consolidates 'Descobrir', 'Pesquisa' and 'Download' into a single, 
 * powerful modular interface. Legacy tab-based tools have been 
 * merged into this new unified system.
 */
const UmbraYouTubeHub: React.FC = () => {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
            <UmbraYouTubeTool />
        </div>
    );
};

export default UmbraYouTubeHub;
