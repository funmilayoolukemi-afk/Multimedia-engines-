
import React from 'react';

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onKeySelect: () => void;
}

const ApiKeyDialog: React.FC<ApiKeyDialogProps> = ({ isOpen, onClose, onKeySelect }) => {
  if (!isOpen) return null;

  const handleSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === 'function') {
      await window.aistudio.openSelectKey();
      onKeySelect();
    } else {
      alert('API key selection module is not available.');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gemini-grey-dark p-8 rounded-lg shadow-2xl max-w-md w-full border border-gemini-grey">
        <h2 className="text-2xl font-bold mb-4 text-white">Select API Key for Veo</h2>
        <p className="text-gemini-grey-light mb-6">
          Video generation with Veo requires you to select your own API key. This is a mandatory step.
          Please ensure your project has billing enabled.
        </p>
        <p className="mb-6">
          <a
            href="https://ai.google.dev/gemini-api/docs/billing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gemini-blue-light hover:underline"
          >
            Learn more about billing
          </a>
        </p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gemini-grey hover:bg-opacity-80 text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSelectKey}
            className="px-4 py-2 rounded bg-gemini-blue-dark hover:bg-gemini-blue-light text-white font-semibold transition-colors"
          >
            Select API Key
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyDialog;
