

import React from 'react';
import { Idea } from '../types';
// FIX: The imported component is named Sparkles, not SparklesIcon. The usage has been updated accordingly.
import { Sparkles } from './icons';

interface IdeaCardProps {
  idea: Idea;
  index: number;
}

const IdeaCard: React.FC<IdeaCardProps> = ({ idea, index }) => {
  const animationDelay = `${index * 100}ms`;

  return (
    <div
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 shadow-lg hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 transform-gpu animate-fade-in-up"
      style={{ animationDelay }}
    >
      <div className="flex items-center mb-3">
        <Sparkles className="w-6 h-6 text-indigo-400 mr-3" />
        <h3 className="text-xl font-bold text-indigo-300">{idea.title}</h3>
      </div>
      <p className="text-slate-300">{idea.description}</p>
    </div>
  );
};

export default IdeaCard;
