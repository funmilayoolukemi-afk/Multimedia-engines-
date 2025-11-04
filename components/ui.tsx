import React from 'react';

// --- Reusable UI Components ---

export const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
);

export const ThinkingIndicator: React.FC = () => (
    <div className="flex items-center space-x-1 p-1">
        <span className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-white rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
    </div>
);

interface PanelProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const FeaturePanel: React.FC<PanelProps> = ({ title, description, children }) => (
  <div className="bg-gemini-grey-dark/50 backdrop-blur-sm p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/10 transition-all duration-300">
    <div className="text-center">
        <h2 className="text-3xl font-bold text-white mb-2">{title}</h2>
        <p className="text-gemini-grey-light mb-8 max-w-2xl mx-auto">{description}</p>
    </div>
    <div className="space-y-6">{children}</div>
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const ActionButton: React.FC<ButtonProps> = ({ children, isLoading, ...props }) => (
  <button
    {...props}
    className="w-full bg-gradient-to-r from-gemini-blue-dark to-gemini-blue-light hover:from-gemini-blue-light hover:to-gemini-blue-dark disabled:from-gemini-grey disabled:to-gemini-grey-dark disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 ease-in-out flex items-center justify-center shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    disabled={isLoading || props.disabled}
  >
    {isLoading ? <Spinner /> : children}
  </button>
);

export const FileInput: React.FC<{ onFileChange: (file: File) => void; accept: string, id?: string }> = ({ onFileChange, accept, id = "file-upload" }) => (
    <div className="w-full p-4 text-center bg-gemini-grey-darker border-2 border-dashed border-gemini-grey rounded-lg cursor-pointer hover:border-gemini-blue-light transition-colors">
        <label htmlFor={id} className="cursor-pointer">
            <p className="text-gemini-grey-light">Drag & drop a file or <span className="text-gemini-blue-light font-semibold">click to select</span></p>
        </label>
        <input
            id={id}
            type="file"
            accept={accept}
            onChange={(e) => e.target.files && onFileChange(e.target.files[0])}
            className="hidden"
        />
    </div>
);

export const ResultCard: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="p-5 bg-gemini-grey-darker rounded-xl border border-white/10 mt-6 animate-fade-in">
        <h3 className="text-xl font-bold mb-3 text-gemini-blue-light">{title}</h3>
        <div className="text-gemini-grey-light whitespace-pre-wrap leading-relaxed">{children}</div>
    </div>
);

export const TextArea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
     <textarea
        {...props}
        className="w-full p-3 bg-gemini-grey-darker rounded-lg border border-gemini-grey focus:outline-none focus:ring-2 focus:ring-gemini-blue-light transition-all"
    />
);

export const TextInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
     <input
        {...props}
        className="w-full p-3 bg-gemini-grey-darker rounded-lg border border-gemini-grey focus:outline-none focus:ring-2 focus:ring-gemini-blue-light transition-all"
    />
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select {...props} className="p-3 bg-gemini-grey-darker rounded-lg border border-gemini-grey text-white focus:outline-none focus:ring-2 focus:ring-gemini-blue-light">
        {props.children}
    </select>
);