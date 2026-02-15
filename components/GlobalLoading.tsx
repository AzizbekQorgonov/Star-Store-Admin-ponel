import React from 'react';

interface GlobalLoadingProps {
  visible: boolean;
}

const GlobalLoading: React.FC<GlobalLoadingProps> = ({ visible }) => {
  return (
    <div
      className={`fixed inset-0 z-[150] flex items-center justify-center transition-all duration-300 ${
        visible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
      aria-hidden={!visible}
    >
      <div className="absolute inset-0 bg-white/72 dark:bg-slate-950/78 backdrop-blur-sm" />
      <div className="relative w-36 h-36 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border border-violet-300/35" />
        <div className="absolute inset-[14px] rounded-full border border-indigo-300/25" />
        <div className="absolute inset-[28px] rounded-full border border-violet-300/18" />
        <div className="admin-loader-star-core">★</div>
        <div className="admin-loader-orbit">
          <span className="admin-loader-earth" />
        </div>
      </div>
    </div>
  );
};

export default GlobalLoading;

