import React from 'react';
import { Feature } from '../types';
import { featureGroups } from '../App';

interface SidebarProps {
  activeFeature: Feature;
  setActiveFeature: (feature: Feature) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeFeature, setActiveFeature }) => {
  return (
    <aside className="w-64 bg-gemini-grey-darker p-4 flex-shrink-0 flex flex-col border-r border-white/10">
      <div className="flex items-center gap-3 mb-8 px-2">
          <svg className="w-8 h-8 text-gemini-blue-light" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93s3.05-7.44 7-7.93v15.86zm2-15.86c1.03.13 2 .45 2.87.93L15 6.34V4.07zM15 17.66l-1.87-1.87c-.93.48-1.93.8-2.87.93v2.24c1.03-.13 2-.45 2.87-.93zM19.93 12c0 3.54-2.52 6.5-5.93 7.59V4.41C17.41 5.5 19.93 8.46 19.93 12z"></path></svg>
          <h1 className="text-xl font-bold tracking-tight">Gemini Suite</h1>
      </div>
      <nav className="flex-1 space-y-4">
        {featureGroups.map((group) => (
          <div key={group.title}>
            <h2 className="px-2 mb-2 text-xs font-bold uppercase text-gemini-grey tracking-wider">{group.title}</h2>
            <ul className="space-y-1">
              {group.features.map(({ id, icon: Icon }) => {
                const isActive = activeFeature === id;
                return (
                  <li key={id}>
                    <button
                      onClick={() => setActiveFeature(id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-left transition-colors duration-200 ${
                        isActive
                          ? 'bg-gemini-blue-light text-white'
                          : 'text-gemini-grey-light hover:bg-gemini-grey'
                      }`}
                    >
                      <Icon className="w-5 h-5 flex-shrink-0" />
                      <span>{id}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
