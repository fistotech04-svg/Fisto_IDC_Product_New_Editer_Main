import React, { useState, useEffect } from 'react';
import TextEditor from './TextEditor';
import ImageEditor from './ImageEditor';
import VideoEditor from './VideoEditor';
import IconEditor from './IconEditor';
import FileInteractionEditor from './FileInteractionEditor';
import { Layers, Edit3, Eye, Video as VideoIcon, Compass } from 'lucide-react';
import GifEditor from './Gif';
import InteractionPanel from './InteractionPanel';


const isGif = (el) => {
  if (!el) return false;
  if (el.tagName !== "IMG") return false;

  // PRIMARY source of truth
  if (el.dataset?.mediaType === "gif") return true;

  // Fallback (for existing assets)
  return el.src?.toLowerCase().endsWith(".gif");
};

const RightSidebar = ({
  selectedElement,
  selectedElementType,
  onUpdate,
  isDoublePage,
  setIsDoublePage,
  openPreview,
  onPopupPreviewUpdate,
  closePanelsSignal,
  activePopupElement,
  onPopupUpdate,
  pages,
  currentPage,
  onStartInteractionDraw,
  onPDFUpload,
  onElementSelect,
  // Metadata for uploads
  folderName,
  flipbookName,
  flipbookVId,
  currentPageVId
}) => {
  const [dimensions, setDimensions] = useState({ width: 793, height: 1122 });

  useEffect(() => {
    if (selectedElement) {
      const updateDimensions = () => {
        setDimensions({
          width: selectedElement.offsetWidth || 0,
          height: selectedElement.offsetHeight || 0
        });
      };

      // Initial update
      updateDimensions();

      // Observer for style/attribute changes (resizing)
      const observer = new MutationObserver(updateDimensions);
      observer.observe(selectedElement, { 
        attributes: true, 
        attributeFilter: ['style', 'class', 'width', 'height'] 
      });

      window.addEventListener('resize', updateDimensions);

      return () => {
        observer.disconnect();
        window.removeEventListener('resize', updateDimensions);
      };
    } else {
      setDimensions({ width: 793, height: 1122 });
    }
  }, [selectedElement]);

  return (
    <aside className="w-[25vw] bg-white border-l border-gray-200 overflow-y-auto custom-scrollbar flex flex-col flex-shrink-0 h-full">
      
      {/* ================= Display Controls (New Top Section) ================= */}
      <div className="p-[1vw] border-b border-gray-100 bg-gray-50 space-y-[1vw]">
         {/* Preview & Double Page Toggle Row */}
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-[0.6vw]">
                <button
                    onClick={() => setIsDoublePage && setIsDoublePage(!isDoublePage)}
                    className={`
                        relative inline-flex h-[1.6vw] w-[2.8vw] shrink-0 cursor-pointer rounded-full border-[0.1vw] border-transparent 
                        items-center justify-start p-[0.2vw]
                        transition-colors duration-200 ease-in-out
                        ${isDoublePage ? 'bg-indigo-600' : 'bg-gray-200'}
                    `}
                >
                    <span className="sr-only">Use setting</span>
                    <span
                        aria-hidden="true"
                        className={`
                            pointer-events-none inline-block h-[1.2vw] w-[1.2vw] transform rounded-full bg-white shadow ring-0 
                            transition duration-200 ease-in-out
                            ${isDoublePage ? 'translate-x-[1.2vw]' : 'translate-x-0'}
                        `}
                    />
                </button>
                <span className="text-gray-700 font-medium text-[0.85vw]">Double Page</span>
            </div>

            <button
                onClick={openPreview}
                className="bg-indigo-600 cursor-pointer hover:bg-indigo-700 text-white rounded-[0.4vw] flex items-center gap-[0.4vw] px-[0.8vw] py-[0.4vw] text-[0.8vw] font-medium transition-colors shadow-sm"
            >
                <Eye size="1vw" /> Preview
            </button>
         </div>

         {/* Dimensions Row */}
          <div className="flex items-center justify-between pt-[0.8vw] pb-[0.2vw]">
             <span className="text-[0.85vw] font-semibold text-gray-800 tracking-wide">Dimensions in px :</span>
             <div className="flex items-center gap-[1vw]">
                 <div className="flex items-center gap-[0.4vw]">
                    <span className="text-gray-400 font-bold text-[0.6vw] tracking-tighter">W</span>
                    <div className="h-[1.8vw] px-[0.4vw] min-w-[3.5vw] bg-white border border-gray-200 rounded-[0.4vw] flex items-center justify-center text-[0.7vw] font-bold shadow-sm">
                        {dimensions.width}px
                    </div>
                 </div>

                 <div className="flex items-center gap-[0.4vw]">
                    <span className="text-gray-400 font-bold text-[0.6vw] tracking-tighter">H</span>
                    <div className="h-[1.8vw] px-[0.4vw] min-w-[3.5vw] bg-white border border-gray-200 rounded-[0.4vw] flex items-center justify-center text-[0.7vw] font-bold shadow-sm">
                        {dimensions.height}px
                    </div>
                 </div>
             </div>
         </div>
      </div>


      {/* ================= Properties Header ================= */}
      {/* <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {selectedElementType === 'text' ? <Edit3 size={16} className="text-blue-500" /> : 
             selectedElementType === 'video' ? <VideoIcon size={16} className="text-purple-500" /> :
             selectedElementType === 'svg' ? <Compass size={16} className="text-orange-500" /> :
             <Layers size={16} className="text-gray-500" />}
            <h3 className="font-semibold text-gray-800">
                {selectedElementType === 'text' ? 'Text Properties' : 
                 selectedElementType === 'image' ? 'Image Properties' : 
                 selectedElementType === 'video' ? 'Video Properties' : 
                 selectedElementType === 'svg' ? 'Icon Properties' : 'Properties'}
            </h3>
          </div>
          {selectedElementType && (
             <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium capitalize">
                 {selectedElementType === 'svg' ? 'Icon' : selectedElementType}
             </span>
          )}
      </div> */}

      {/* ================= Context-Sensitive Editor ================= */}
      <div className="flex-1 overflow-y-auto p-[1vw]">
        {selectedElementType === 'text' && (
          <TextEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            closePanelsSignal={closePanelsSignal}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}

        {selectedElementType === "image" && isGif(selectedElement) && (
          <GifEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}

        {/* IMAGE EDITOR (non-GIF images only) */}
        {selectedElementType === "image" && !isGif(selectedElement) && (
          <ImageEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}
        
        {selectedElementType === 'video' && (
          <VideoEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}

        {selectedElementType === 'svg' && (
          <IconEditor 
            selectedElement={selectedElement} 
            onUpdate={onUpdate} 
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            pages={pages}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}
        
        {selectedElementType === 'file-interaction' && (
          <FileInteractionEditor
            selectedElement={selectedElement}
            onUpdate={onUpdate}
            onStartInteractionDraw={onStartInteractionDraw}
            pages={pages}
            currentPage={currentPage}
            onPopupPreviewUpdate={onPopupPreviewUpdate}
            activePopupElement={activePopupElement}
            onPopupUpdate={onPopupUpdate}
            InteractionPanelComponent={InteractionPanel}
            onPDFUpload={onPDFUpload}
            onElementSelect={onElementSelect}
            TextEditorComponent={TextEditor}
            ImageEditorComponent={ImageEditor}
            VideoEditorComponent={VideoEditor}
            GifEditorComponent={GifEditor}
            IconEditorComponent={IconEditor}
            // Metadata
            folderName={folderName}
            flipbookName={flipbookName}
            flipbookVId={flipbookVId}
            currentPageVId={currentPageVId}
          />
        )}

        {!selectedElementType && (
          <div className="flex flex-col items-center justify-center h-[20vw] text-center text-gray-400">
            <Layers className="mx-auto mb-[0.8vw] opacity-10" size="4vw" />
            <p className="text-[0.9vw] font-bold text-gray-600 tracking-tight">No element selected</p>
            <p className="text-[0.65vw] mt-[0.2vw] max-w-[12vw] font-medium text-gray-400">Click on any text, image, icon or video in the canvas to edit its properties.</p>
          </div>
        )}
      </div>

    </aside>
  );
};

export default RightSidebar;