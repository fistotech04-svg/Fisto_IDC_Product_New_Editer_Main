import React from 'react';
import Layer from './Layer';
import MainEditor from './MainEditor';
import RightSidebar from './RightSidebar';

/**
 * TemplateEditor Layout Component
 * Integrates the various sub-components into a single editor interface.
 */
const TemplateEditor = () => {
  const [isDoublePage, setIsDoublePage] = React.useState(true);

  return (
    <div className="flex h-[92vh] w-full bg-white overflow-hidden">
      <Layer />
      <MainEditor isDoublePage={isDoublePage} />
      <RightSidebar isDoublePage={isDoublePage} setIsDoublePage={setIsDoublePage} />
    </div>
  );
};

export default TemplateEditor;
