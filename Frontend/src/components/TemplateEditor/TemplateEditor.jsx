import React from 'react';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';

/**
 * TemplateEditor Layout Component
 * Integrates the various sub-components into a single editor interface.
 */
const TemplateEditor = () => {
  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden">
      <Layer />
      <MainEditor />
      <RightSidebar />
    </div>
  );
};

export default TemplateEditor;
