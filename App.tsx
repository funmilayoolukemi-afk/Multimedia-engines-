import React, { useState } from 'react';
import { Feature } from './types';
import Sidebar from './components/Sidebar';
import {
  ChatPanel,
  ImageAnalysisPanel,
  ImageGenerationPanel,
  ImageEditingPanel,
  VideoGenerationPanel,
  SearchGroundingPanel,
  MapsGroundingPanel,
  LiveConversationPanel,
  ComplexReasoningPanel,
  TextToSpeechPanel,
  SummarizationPanel,
  GamesPanel,
  AudioTranscriptionPanel,
  VideoAnalysisPanel,
  QuickResponsePanel,
} from './components/features';
import {
  ChatIcon,
  ImageIcon,
  VideoIcon,
  SearchIcon,
  MapIcon,
  MicIcon,
  BrainIcon,
  SoundIcon,
  EditIcon,
  SummarizeIcon,
  GamepadIcon,
  TranscriptIcon,
  VideoFileIcon,
  BoltIcon,
} from './components/IconComponents';

export const featureGroups = [
  {
    title: 'Core & Popular',
    features: [
      { id: Feature.CHAT, icon: ChatIcon },
      { id: Feature.IMAGE_GENERATION, icon: ImageIcon },
      { id: Feature.VIDEO_GENERATION, icon: VideoIcon },
      { id: Feature.LIVE_CONVERSATION, icon: MicIcon },
    ],
  },
  {
    title: 'Analysis & Tools',
    features: [
      { id: Feature.IMAGE_ANALYSIS, icon: ImageIcon },
      { id: Feature.VIDEO_ANALYSIS, icon: VideoFileIcon },
      { id: Feature.AUDIO_TRANSCRIPTION, icon: TranscriptIcon },
      { id: Feature.IMAGE_EDITING, icon: EditIcon },
    ],
  },
  {
    title: 'Grounding & Speed',
    features: [
      { id: Feature.SEARCH_GROUNDING, icon: SearchIcon },
      { id: Feature.MAPS_GROUNDING, icon: MapIcon },
      { id: Feature.QUICK_RESPONSE, icon: BoltIcon },
    ],
  },
  {
    title: 'Advanced & Utility',
    features: [
      { id: Feature.COMPLEX_REASONING, icon: BrainIcon },
      { id: Feature.TEXT_TO_SPEECH, icon: SoundIcon },
      { id: Feature.SUMMARIZATION, icon: SummarizeIcon },
      { id: Feature.GAMES, icon: GamepadIcon },
    ],
  },
];

const App: React.FC = () => {
  const [activeFeature, setActiveFeature] = useState<Feature>(Feature.CHAT);

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case Feature.CHAT: return <ChatPanel />;
      case Feature.IMAGE_ANALYSIS: return <ImageAnalysisPanel />;
      case Feature.IMAGE_GENERATION: return <ImageGenerationPanel />;
      case Feature.IMAGE_EDITING: return <ImageEditingPanel />;
      case Feature.VIDEO_GENERATION: return <VideoGenerationPanel />;
      case Feature.SEARCH_GROUNDING: return <SearchGroundingPanel />;
      case Feature.MAPS_GROUNDING: return <MapsGroundingPanel />;
      case Feature.LIVE_CONVERSATION: return <LiveConversationPanel />;
      case Feature.COMPLEX_REASONING: return <ComplexReasoningPanel />;
      case Feature.TEXT_TO_SPEECH: return <TextToSpeechPanel />;
      case Feature.SUMMARIZATION: return <SummarizationPanel />;
      case Feature.GAMES: return <GamesPanel />;
      case Feature.AUDIO_TRANSCRIPTION: return <AudioTranscriptionPanel />;
      case Feature.VIDEO_ANALYSIS: return <VideoAnalysisPanel />;
      case Feature.QUICK_RESPONSE: return <QuickResponsePanel />;
      default: return <div className="text-center p-8">Select a feature from the sidebar.</div>;
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gemini-grey-darker to-gemini-grey-dark text-white font-sans">
      <Sidebar
        activeFeature={activeFeature}
        setActiveFeature={setActiveFeature}
      />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            {renderActiveFeature()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
