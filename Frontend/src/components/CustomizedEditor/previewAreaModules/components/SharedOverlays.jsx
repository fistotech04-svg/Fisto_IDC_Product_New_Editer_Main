import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from '@iconify/react';
import GalleryPopup from '../../popups/GalleryPopup';
import FlipbookSharePopup from '../../popups/FlipbookSharePopup';
import CreatorProfileModal from '../../../../pages/CreatorProfileModal';
import Sound from '../../popups/Sound';
import ExportModal from '../../../ExportModal';
import TableOfContentsPopup from '../../popups/TableOfContentsPopup';
import Interaction3DPreview from '../../../TemplateEditor/Interaction3DPreview';
import ShareModal from '../../../ShareModal';

// Fallback stubs for legacy unimported popups
const AddBookmarkPopup = ({ onClose }) => null;
const AddNotesPopup = ({ onClose }) => null;
const NotesViewerPopup = ({ onClose }) => null;
const ViewBookmarkPopup = ({ onClose }) => null;


const SharedOverlays = ({
  showGalleryPopup,
  setShowGalleryPopupMemo,
  galleryPopupSettings,
  activeDevice,
  isTablet,
  isMobile,
  isLandscape,
  showBookmarkMenu,
  setShowBookmarkMenu,
  setShowAddBookmarkPopupMemo,
  setShowViewBookmarkPopup,
  showNotesMenu,
  setShowNotesMenu,
  setShowAddNotesPopupMemo,
  setShowNotesViewerMemo,
  showMoreMenu,
  setShowMoreMenu,
  showSharePopup,
  setShowSharePopup,
  showExportPopup,
  setShowExportPopup,
  showProfilePopup,
  setShowProfilePopup,
  creatorProfileData,
  showSoundPopup,
  setShowSoundPopup,
  showTOC,
  setShowTOC,
  activeLayout,
  otherSetupSettings,
  onUpdateOtherSetup,
  isSidebarOpen,
  mobileIsMuted,
  setMobileIsMuted,
  isMuted,
  setIsMuted,
  mobileIsFlipMuted,
  setMobileIsFlipMuted,
  isFlipMuted,
  setIsFlipMuted,
  mobileFlipTrigger,
  flipTrigger,
  settings,
  onClose,
  isFullscreen,
  isLoading,
  onPageClick,
  layoutColors,
  getLayoutColor,
  getLayoutColorRgba,
  active3DModelUrl,
  setActive3DModelUrl,
  active3DModelVId,
  active3DModelHotspots,
  active3DModelConfig,
  showAddBookmarkPopup,
  setShowAddBookmarkPopup,
  showAddNotesPopup,
  setShowAddNotesPopup,
  showNotesViewer,
  setShowNotesViewer,
  showViewBookmarkPopup,
  currentPage,
  pages,
  onAddBookmark,
  onAddNote,
  onDeleteBookmark,
  onUpdateBookmark,
  bookmarks,
  notes,
  isMobileLandscape,
  vId,
  shareId,
  currentBook,
  countdown
}) => {
  return (
    <>
            {showGalleryPopup && (
                <GalleryPopup
                    onClose={() => setShowGalleryPopupMemo(false)}
                    settings={galleryPopupSettings}
                    isTablet={activeDevice === 'Tablet'}
                    isMobile={isMobile}
                />
            )}

            {/* Shared Overlays (Common for all layouts) */}
            {showBookmarkMenu && (
                <>
                    <div className="absolute inset-0 z-40 pointer-events-auto" onClick={() => setShowBookmarkMenu(false)} />
                    <div
                        className={`absolute ${isTablet ? 'bottom-[2.8vw] ' : 'bottom-[4.5vw]'} flex flex-col overflow-hidden shadow-[0_1vw_3vw_rgba(0,0,0,0.3)] z-50 animate-in fade-in slide-in-from-bottom-2 duration-200`}
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: getLayoutColorRgba('dropdown-bg', '87, 92, 156', '0.5'),
                            backdropFilter: 'blur(10px)',
                            right: `calc(7.5vw + ${settings.viewing.zoom ? '9.5vw' : '0vw'} + ${settings.shareExport.share || settings.shareExport.download || settings.viewing.fullScreen ? '9.8vw' : '0vw'})`,
                            width: isTablet ? '10vw' : 'auto',
                            minWidth: isTablet ? '0' : '10vw',
                            borderRadius: isTablet ? '0.8vw' : '1vw'
                        }}
                    >
                        <button
                            className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => { setShowAddBookmarkPopupMemo(true); setShowBookmarkMenu(false); }}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <Icon
                                icon="fluent:bookmark-add-24-filled"
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                            />
                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>Add Bookmark</span>
                        </button>
                        <div className="h-[1px] bg-white/10 w-full" />
                        <button
                            className={`flex items-center gap-[0.75vw] ${isTablet ? 'px-[0.8vw] py-[0.55vw]' : 'px-[1vw] py-[0.6vw]'} hover:bg-white/10 transition-colors text-left group`}
                            onClick={() => { setShowViewBookmarkPopup(true); setShowBookmarkMenu(false); }}
                            style={{ color: getLayoutColor('dropdown-text', '#FFFFFF') }}
                        >
                            <Icon
                                icon="lucide:view"
                                className={`${isTablet ? 'w-[0.9vw] h-[0.9vw]' : 'w-[1.2vw] h-[1.2vw]'} group-hover:scale-110 transition-transform`}
                                style={{ color: getLayoutColor('dropdown-icon', '#FFFFFF') }}
                            />
                            <span className={`${isTablet ? 'text-[0.75vw]' : 'text-[0.85vw]'} font-semibold`}>View Bookmark</span>
                        </button>
                    </div>
                </>
            )}

            {showAddBookmarkPopup && (
                <AddBookmarkPopup
                    onClose={() => setShowAddBookmarkPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddBookmark={onAddBookmark}
                    isSidebarOpen={isSidebarOpen && activeLayout === 3}
                    isMobile={isMobile}
                    activeLayout={activeLayout}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    bookmarkSettings={settings.navigation?.bookmarkSettings?.[activeLayout] || settings.navigation?.bookmarkSettings}
                    layoutColors={layoutColors?.[activeLayout]}
                />

            )}

            {showAddNotesPopup && (
                <AddNotesPopup
                    onClose={() => setShowAddNotesPopup(false)}
                    currentPageIndex={currentPage}
                    totalPages={pages.length}
                    onAddNote={onAddNote}
                    isSidebarOpen={isSidebarOpen && activeLayout === 3}
                    isMobile={isMobile}
                    activeLayout={activeLayout}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    layoutColors={layoutColors?.[activeLayout]}
                />

            )}

            {showNotesViewer && (
                <NotesViewerPopup
                    onClose={() => setShowNotesViewer(false)}
                    notes={notes.filter(n => n.layoutId === activeLayout)}
                    isSidebarOpen={isSidebarOpen}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isLandscape={isLandscape}
                    isMobileLandscape={isMobileLandscape}
                    layoutColors={layoutColors?.[activeLayout]}
                    activeLayout={activeLayout}
                />

            )}

            {showViewBookmarkPopup && Number(activeLayout) !== 5 && (
                <ViewBookmarkPopup
                    onClose={() => setShowViewBookmarkPopup(false)}
                    bookmarks={bookmarks}
                    onDelete={onDeleteBookmark}
                    onUpdate={onUpdateBookmark}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowViewBookmarkPopup(false);
                    }}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isBigBars={settings.toolbar?.isBigBars}
                    layoutColors={layoutColors?.[activeLayout]}
                />

            )}

            {showProfilePopup && (
                <CreatorProfileModal
                    isOpen={showProfilePopup}
                    onClose={() => setShowProfilePopup(false)}
                    creator={creatorProfileData}
                    isPreview={true}
                    isMobile={isMobile}
                    isTablet={isTablet}
                    isSidebarOpen={isSidebarOpen}
                />
            )}

            <Sound
                isOpen={showSoundPopup}
                onClose={() => setShowSoundPopup(false)}
                activeLayout={activeLayout}
                otherSetupSettings={otherSetupSettings}
                onUpdateOtherSetup={onUpdateOtherSetup}
                isSidebarOpen={isSidebarOpen}
                isMuted={activeDevice === 'Mobile' ? mobileIsMuted : isMuted}
                setIsMuted={activeDevice === 'Mobile' ? setMobileIsMuted : setIsMuted}
                isFlipMuted={activeDevice === 'Mobile' ? mobileIsFlipMuted : isFlipMuted}
                setIsFlipMuted={activeDevice === 'Mobile' ? setMobileIsFlipMuted : setIsFlipMuted}
                flipTrigger={activeDevice === 'Mobile' ? mobileFlipTrigger : flipTrigger}
                settings={settings}
                isTablet={isTablet}
                isMobile={isMobile}
                isLandscape={isLandscape}
                isEditor={!onClose}
                isFullscreen={isFullscreen}
                isLoading={isLoading}
            />

            {showTOC && !((isMobile && !isLandscape) || [4, 5, 6].includes(Number(activeLayout))) && !isTablet && (
                <TableOfContentsPopup
                    onClose={() => setShowTOC(false)}
                    onNavigate={(pageIndex) => {
                        onPageClick(pageIndex);
                        setShowTOC(false);
                    }}
                    settings={settings.tocSettings}
                    addTextBelowIcons={settings?.toolbar?.addTextBelowIcons}
                    activeLayout={activeLayout}
                    isTablet={isTablet}
                    isMobile={isMobile}
                    isLandscape={isLandscape}
                    isSidebarOpen={isSidebarOpen}
                    isEditor={!onClose}
                    isFullscreen={isFullscreen}
                    layoutColors={layoutColors}
                />
            )}

            {showSharePopup && !isMobile && (
                <ShareModal
                    isOpen={showSharePopup}
                    onClose={() => setShowSharePopup(false)}
                    flipbookUrl={currentBook?.shareUrl}
                    flipbookThumbnail={currentBook?.thumbnail}
                    currentBook={currentBook}
                    activeLayout={activeLayout}
                    isMobileLayout={isMobile}
                    isAbsolutePosition={true}
                />
            )}

            {showExportPopup && (
                <ExportModal
                    isOpen={showExportPopup}
                    onClose={() => setShowExportPopup(false)}
                    currentBook={currentBook}
                    pages={pages}
                    currentPageIndex={currentPage - 1}
                    isAbsolutePosition={true}
                />
            )}


            {/* Visual Countdown Overlay - Positioned after layouts to stay on top */}
            {countdown !== null && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none ">
                    <span
                        className="font-semibold text-[#E5E7EB] animate-pulse select-none drop-shadow-[0_1.2vw_1.2vw_rgba(0,0,0,0.5)]"
                        style={{ fontSize: isTablet ? '10vw' : '15vw' }}
                    >
                        {countdown}
                    </span>
                </div>
            )}

      {active3DModelUrl && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 z-[100000] bg-black/80 flex items-center justify-center p-[2vw]"
          onClick={() => setActive3DModelUrl(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full h-full max-w-[80vw] max-h-[80vh] bg-white rounded-[1vw] shadow-2xl flex flex-col overflow-hidden pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-[1vw] right-[1vw] z-50 flex gap-[1vw]">
              <button
                onClick={() => setActive3DModelUrl(null)}
                className="w-[2.5vw] h-[2.5vw] bg-white hover:bg-gray-100 rounded-full flex items-center justify-center shadow-md transition-colors"
              >
                <Icon icon="lucide:x" className="w-[1.2vw] h-[1.2vw] text-gray-800" />
              </button>
            </div>
            <div className="flex-1 w-full h-full relative">
              <Interaction3DPreview
                isOpen={true}
                dataUrl={active3DModelUrl}
                vId={active3DModelVId}
                hotspots={active3DModelHotspots}
                {...(active3DModelConfig || {})}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default SharedOverlays;
