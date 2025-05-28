// src/components/Orb.jsx
import React from 'react';

export default function Orb() {
    return (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none -z-10">
            <div className="w-[480px] h-[480px] rounded-full relative animate-pulse-orb">
                <img
                    src="/src/assets/orb-network.png"
                    alt="Glowing Orb"
                    className="absolute inset-0 w-full h-full object-contain mix-blend-color-dodge opacity-90 animate-spin-slow"
                />
                <div className="absolute inset-0 rounded-full bg-white opacity-30 blur-3xl dark:opacity-10"></div>
            </div>
        </div>
    );
}
