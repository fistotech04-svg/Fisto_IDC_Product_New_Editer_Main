import React from 'react';
import MobileFrame from '../../MobileFrame';
import MobileLayoutRenderer from '../../Mobile/MobileLayoutRenderer';
import Grid1Layout from '../../Layouts/Grid1Layout';
import Grid2Layout from '../../Layouts/Grid2Layout';
import Grid3Layout from '../../Layouts/Grid3Layout';
import Grid4Layout from '../../Layouts/Grid4Layout';
import Grid5Layout from '../../Layouts/Grid5Layout';
import Grid6Layout from '../../Layouts/Grid6Layout';
import Grid7Layout from '../../Layouts/Grid7Layout';
import Grid8Layout from '../../Layouts/Grid8Layout';
import TabletLayout1 from '../../Tablet/TabletLayouts/TabletLayout1';
import TabletLayout2 from '../../Tablet/TabletLayouts/TabletLayout2';
import TabletLayout3 from '../../Tablet/TabletLayouts/TabletLayout3';
import TabletLayout4 from '../../Tablet/TabletLayouts/TabletLayout4';
import TabletLayout5 from '../../Tablet/TabletLayouts/TabletLayout5';
import TabletLayout6 from '../../Tablet/TabletLayouts/TabletLayout6';
import TabletLayout7 from '../../Tablet/TabletLayouts/TabletLayout7';
import TabletLayout8 from '../../Tablet/TabletLayouts/TabletLayout8';
import TurnJsBookRenderer from './TurnJsBookRenderer';

const DeviceLayoutRenderer = ({
  activeDevice,
  isPublishedPreview,
  isPhysicalTablet,
  isPhysicalMobile,
  backgroundLayers,
  screenRef,
  commonLayoutProps,
  bookRendererProps,
  currentBookmarks,
  currentNotes,
  isLandscape,
  activeLayout,
  isTablet,
  deviceStyles,
  renderSharedOverlays,
  layout1Bookmarks, layout1Notes,
  layout2Bookmarks, layout2Notes,
  layout3Bookmarks, layout3Notes,
  layout4Bookmarks, layout4Notes,
  layout5Bookmarks, layout5Notes,
  layout6Bookmarks, layout6Notes,
  layout7Bookmarks, layout7Notes,
  layout8Bookmarks, layout8Notes,
  setShowAddNotesPopupMemo,
  setShowAddBookmarkPopupMemo,
  setShowViewBookmarkPopup,
  setShowProfilePopup,
  showProfilePopup,
  setShowGalleryPopupMemo,
  showGalleryPopup,
  showExportPopup,
  showSoundPopup,
  setShowSoundPopupMemo,
  showSharePopup,
  showBookmarkMenu,
  setShowBookmarkMenuMemo,
  showMoreMenu,
  setShowMoreMenuMemo,
  showNotesMenu,
  setShowNotesMenuMemo,
  getScreenWrapperStyle: customGetScreenWrapperStyle
}) => {
  const {
    settings,
    bookName,
    hideHeader,
    searchQuery,
    setSearchQuery,
    handleQuickSearch,
    logoSettings,
    logoObjectFit,
    logoCropStyle,
    onPageClick,
    currentPage,
    pages,
    bookRef,
    showThumbnailBar,
    setShowThumbnailBarMemo,
    showTOC,
    setShowTOCMemo,
    setShowSoundPopup,
    setShowNotesViewerMemo,
    showViewBookmarkPopup,
    isAutoFlipping,
    setIsPlaying,
    currentZoom,
    setCurrentZoom,
    handleZoomIn,
    handleZoomOut,
    handleDownload,
    currentBook,
    isSinglePage,
    offset,
    backgroundSettings,
    layoutBackgroundSettings = backgroundSettings,
    backgroundStyle,
    layoutBackgroundStyle = backgroundStyle,
    isMuted,
    onToggleAudio,
    handleToggleAudio = onToggleAudio,
    isSidebarOpen,
    isFullscreen,
    isMobile,
    isMobileLandscape,
    setShowTOC,
    setShowExportPopup,
    handleFullScreen,
    onAddNote,
    onDeleteBookmark,
    onUpdateBookmark,
    profileSettings,
    handleShare,
    onAddBookmark,
    onClose,
    layoutColors,
    augmentedPages,
    notes
  } = commonLayoutProps || {};

  const getScreenWrapperStyle = () => {
    if (customGetScreenWrapperStyle) return customGetScreenWrapperStyle();
    if (activeDevice === 'Desktop') return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1 };
    if (activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet) return {
      position: 'absolute',
      top: '9.38%',
      bottom: '7.7%',
      left: '5.3%',
      right: '6.6%',
      borderRadius: '12px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transform: 'translateZ(0)'
    };
    return { width: '100%', height: '100%', position: 'relative', display: 'flex', flexDirection: 'column', flex: 1, transform: 'translateZ(0)' };
  };

  return (
    <>
      {activeDevice === 'Mobile' ? (
                (() => {
                    const mobileContent = (
                        <div ref={screenRef} className="w-full h-full relative overflow-hidden">
                            {backgroundLayers}

                            <style>{`
                                #preview-area-root .flipbook-magazine-wrapper {
                                    transition: transform 0.8s cubic-bezier(0.22, 1, 0.36, 1) !important;
                                }
                            `}</style>

                            <MobileLayoutRenderer
                                {...commonLayoutProps}
                                bookmarks={currentBookmarks}
                                notes={currentNotes}
                            >
                                <TurnJsBookRenderer
                                    {...bookRendererProps}
                                    bookmarks={currentBookmarks}
                                    bookmarkSpacing={5}
                                    singlePage={true}
                                />
                            </MobileLayoutRenderer>

                            {renderSharedOverlays()}

                        </div>
                    );

                    return isPhysicalMobile ? mobileContent : (
                        <MobileFrame isLandscape={isLandscape} hideHomeIndicator={Number(activeLayout) === 1 || Number(activeLayout) === 2 || Number(activeLayout) === 6 || Number(activeLayout) === 7 || (Number(activeLayout) === 3 && !isLandscape)}>
                            {mobileContent}
                        </MobileFrame>
                    );
                })()
      ) : (
                    <div style={{ ...((activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet) ? deviceStyles.Tablet : deviceStyles.Desktop), zIndex: 10 }} className="relative">
                        {/* Floor shadow effect for Tablet bottom (using the style of the SVG) */}
                        {activeDevice === 'Tablet' && !isPublishedPreview && !isPhysicalTablet && (
                            <svg
                                viewBox="0 0 1000 100"
                                preserveAspectRatio="none"
                                className="absolute left-1/2 -translate-x-1/2 z-[-1] pointer-events-none opacity-60 -bottom-[6%] w-[94%] h-[7%]"
                            >
                                <defs>
                                    <radialGradient id="tablet-floor-shadow" cx="50%" cy="50%" r="50%">
                                        <stop offset="0%" stopColor="rgba(0,0,0,0.7)" />
                                        <stop offset="40%" stopColor="rgba(0,0,0,0.4)" />
                                        <stop offset="100%" stopColor="rgba(0,0,0,0)" />
                                    </radialGradient>
                                </defs>
                                <ellipse cx="500" cy="50" rx="490" ry="45" fill="url(#tablet-floor-shadow)" />
                            </svg>
                        )}
                        <div ref={screenRef} id="device-screen-container" style={getScreenWrapperStyle()} className="relative">

                            {backgroundLayers}

                            <style>{`
                                #preview-area-root .flipbook-magazine-wrapper {
                                    transition: transform 0.8 s cubic-bezier(0.22, 1, 0.36, 1) !important;
                                }
                            `}</style>



                            {activeDevice === 'Tablet' && (!activeLayout || Number(activeLayout) === 1) ? (
                                <TabletLayout1
                                    settings={settings}
                                    bookName={bookName}
                                    activeLayout={activeLayout}
                                    hideHeader={hideHeader}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                    logoSettings={logoSettings}
                                    logoObjectFit={logoObjectFit}
                                    logoCropStyle={logoCropStyle}
                                    onPageClick={onPageClick}
                                    currentPage={currentPage}
                                    pages={pages}
                                    notes={layout1Notes}
                                    bookRef={bookRef}
                                    showBookmarkMenu={showBookmarkMenu}
                                    setShowBookmarkMenuMemo={setShowBookmarkMenuMemo}
                                    showMoreMenu={showMoreMenu}
                                    setShowMoreMenuMemo={setShowMoreMenuMemo}
                                    showThumbnailBar={showThumbnailBar}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    showTOC={showTOC}
                                    setShowTOCMemo={setShowTOCMemo}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    showViewBookmarkPopup={showViewBookmarkPopup}
                                    setShowProfilePopup={setShowProfilePopup}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    isAutoFlipping={isAutoFlipping}
                                    setIsPlaying={setIsPlaying}
                                    currentZoom={currentZoom}
                                    setCurrentZoom={setCurrentZoom}
                                    handleZoomIn={handleZoomIn}
                                    handleZoomOut={handleZoomOut}
                                    handleDownload={handleDownload}
                                    currentBook={currentBook}
                                    offset={isSinglePage ? 0 : offset}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    isSidebarOpen={isSidebarOpen}
                                    isFullscreen={isFullscreen}
                                    isTablet={isTablet}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout1>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 2 ? (
                                <TabletLayout2
                                    bookRef={bookRef}
                                    currentPage={currentPage}
                                    pages={pages}
                                    offset={isSinglePage ? 0 : offset}
                                    onPageClick={onPageClick}
                                    settings={settings}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    handleDownload={handleDownload}
                                    currentBook={currentBook}
                                    activeLayout={activeLayout}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout2>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 3 ? (
                                <TabletLayout3
                                    bookRef={bookRef}
                                    currentPage={currentPage}
                                    pages={pages}
                                    offset={isSinglePage ? 0 : offset}
                                    onPageClick={onPageClick}
                                    settings={settings}
                                    bookName={bookName}
                                    showTOC={showTOC}
                                    setShowTOCMemo={setShowTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopup}
                                    showProfilePopup={showProfilePopup}
                                    setShowProfilePopupMemo={setShowProfilePopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopupMemo={setShowExportPopup}
                                    currentBook={currentBook}
                                    activeLayout={activeLayout}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout3Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout3>
                            ) : activeDevice === 'Tablet' && Number(activeLayout) === 8 ? (
                                <TabletLayout8
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    settings={settings}
                                    bookName={bookName}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    setShowTOCMemo={setShowTOCMemo}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    bookRef={bookRef}
                                    pages={pages}
                                    setIsPlaying={setIsPlaying}
                                    isAutoFlipping={isAutoFlipping}
                                    currentBook={currentBook}
                                    handleDownload={handleDownload}
                                    handleFullScreen={handleFullScreen}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
                                    logoSettings={logoSettings}
                                    currentPage={currentPage}
                                    pagesCount={pages.length}
                                    currentZoom={currentZoom}
                                    setCurrentZoom={setCurrentZoom}
                                    onPageClick={onPageClick}
                                    bookmarks={layout8Bookmarks}
                                    notes={layout8Notes}
                                    onAddNote={onAddNote}
                                    onDeleteBookmark={onDeleteBookmark}
                                    onUpdateBookmark={onUpdateBookmark}
                                    profileSettings={profileSettings}
                                    isSidebarOpen={isSidebarOpen}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    showExportPopup={showExportPopup}
                                    setShowExportPopupMemo={setShowExportPopup}
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout8Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </TabletLayout8>
                            ) : Number(activeLayout) === 2 ? (
                                <Grid2Layout
                                    settings={settings}
                                    bookName={bookName}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    setShowTOCMemo={setShowTOCMemo}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    bookRef={bookRef}
                                    pages={pages}
                                    setIsPlaying={setIsPlaying}
                                    isAutoFlipping={isAutoFlipping}
                                    handleShare={handleShare}
                                    handleDownload={handleDownload}
                                    handleFullScreen={handleFullScreen}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
                                    logoSettings={logoSettings}
                                    currentPage={currentPage}
                                    pagesCount={pages.length}
                                    currentZoom={currentZoom}
                                    setCurrentZoom={setCurrentZoom}
                                    onPageClick={onPageClick}
                                    bookmarks={layout2Bookmarks}
                                    notes={layout2Notes}
                                    onAddNote={onAddNote}
                                    onDeleteBookmark={onDeleteBookmark}
                                    onUpdateBookmark={onUpdateBookmark}
                                    onAddBookmark={onAddBookmark}
                                    profileSettings={profileSettings}
                                    isSidebarOpen={isSidebarOpen}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout2Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </Grid2Layout>
                            ) : Number(activeLayout) === 3 ? (
                                <Grid3Layout
                                    settings={settings}
                                    bookName={bookName}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    setShowTOCMemo={setShowTOCMemo}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    bookRef={bookRef}
                                    pages={pages}
                                    setIsPlaying={setIsPlaying}
                                    isAutoFlipping={isAutoFlipping}
                                    handleShare={handleShare}
                                    handleDownload={handleDownload}
                                    handleFullScreen={handleFullScreen}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
                                    logoSettings={logoSettings}
                                    currentPage={currentPage}
                                    pagesCount={pages.length}
                                    currentZoom={currentZoom}
                                    setCurrentZoom={setCurrentZoom}
                                    onPageClick={onPageClick}
                                    bookmarks={layout3Bookmarks}
                                    notes={layout3Notes}
                                    onAddNote={onAddNote}
                                    onDeleteBookmark={onDeleteBookmark}
                                    onUpdateBookmark={onUpdateBookmark}
                                    onAddBookmark={onAddBookmark}
                                    profileSettings={profileSettings}
                                    isSidebarOpen={isSidebarOpen}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    offset={isSinglePage ? 0 : offset}
                                    isFullscreen={isFullscreen}
                                    isTablet={activeDevice === 'Tablet'}
                                    isMobile={isMobile}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    activeLayout={activeLayout}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    showTOC={showTOC}
                                    showThumbnailBar={showThumbnailBar}
                                    isEditor={!onClose}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout3Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </Grid3Layout>
                            ) : Number(activeLayout) === 4 ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout4
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        currentBook={currentBook}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout4Bookmarks}
                                        notes={layout4Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        isSidebarOpen={isSidebarOpen}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        isEditor={!onClose}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout4Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout4>
                                ) : (
                                    <Grid4Layout
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        handleShare={handleShare}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout4Bookmarks}
                                        notes={layout4Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        isSidebarOpen={isSidebarOpen}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        isEditor={!onClose}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout4Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid4Layout>
                                )
                            ) : Number(activeLayout) === 5 ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout5
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        currentBook={currentBook}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout5Bookmarks}
                                        notes={layout5Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout5Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout5>
                                ) : (
                                    <Grid5Layout
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        handleShare={handleShare}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout5Bookmarks}
                                        notes={layout5Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout5Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid5Layout>
                                )
                            ) : (Number(activeLayout) === 6) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout6
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        currentBook={currentBook}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout6Bookmarks}
                                        notes={layout6Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        activeLayout={activeLayout}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout6Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout6>
                                ) : (
                                    <Grid6Layout
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        handleShare={handleShare}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout6Bookmarks}
                                        notes={layout6Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout6Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid6Layout>
                                )
                            ) : (Number(activeLayout) === 7) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout7
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        currentBook={currentBook}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout7Bookmarks}
                                        notes={layout7Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        layoutColors={layoutColors}
                                        activeLayout={activeLayout}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout7Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout7>
                                ) : (
                                    <Grid7Layout
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        handleShare={handleShare}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout7Bookmarks}
                                        notes={layout7Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        layoutColors={layoutColors}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout7Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid7Layout>
                                )
                            ) : (Number(activeLayout) === 8) ? (
                                activeDevice === 'Tablet' ? (
                                    <TabletLayout8
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        currentBook={currentBook}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout8Bookmarks}
                                        notes={layout8Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        showGalleryPopup={showGalleryPopup}
                                        showExportPopup={showExportPopup}
                                        setShowExportPopupMemo={setShowExportPopup}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout8Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </TabletLayout8>
                                ) : (
                                    <Grid8Layout
                                        settings={settings}
                                        bookName={bookName}
                                        searchQuery={searchQuery}
                                        setSearchQuery={setSearchQuery}
                                        handleQuickSearch={handleQuickSearch}
                                        setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                        setShowTOCMemo={setShowTOCMemo}
                                        setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                        setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                        setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                        setShowNotesViewerMemo={setShowNotesViewerMemo}
                                        bookRef={bookRef}
                                        pages={pages}
                                        setIsPlaying={setIsPlaying}
                                        isAutoFlipping={isAutoFlipping}
                                        handleShare={handleShare}
                                        handleDownload={handleDownload}
                                        handleFullScreen={handleFullScreen}
                                        setShowProfilePopup={setShowProfilePopup}
                                        showProfilePopup={showProfilePopup}
                                        logoSettings={logoSettings}
                                        currentPage={currentPage}
                                        pagesCount={pages.length}
                                        currentZoom={currentZoom}
                                        setCurrentZoom={setCurrentZoom}
                                        onPageClick={onPageClick}
                                        bookmarks={layout8Bookmarks}
                                        notes={layout8Notes}
                                        onAddNote={onAddNote}
                                        onDeleteBookmark={onDeleteBookmark}
                                        onUpdateBookmark={onUpdateBookmark}
                                        profileSettings={profileSettings}
                                        isSidebarOpen={isSidebarOpen}
                                        backgroundSettings={layoutBackgroundSettings}
                                        backgroundStyle={layoutBackgroundStyle}
                                        isMuted={isMuted}
                                        onToggleAudio={handleToggleAudio}
                                        setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                        offset={isSinglePage ? 0 : offset}
                                        isFullscreen={isFullscreen}
                                        isTablet={activeDevice === 'Tablet'}
                                        isMobile={activeDevice === 'Mobile'}
                                        isLandscape={isLandscape}
                                        isMobileLandscape={isMobileLandscape}
                                        activeLayout={activeLayout}
                                        showSoundPopup={showSoundPopup}
                                        setShowSoundPopupMemo={setShowSoundPopupMemo}
                                        showTOC={showTOC}
                                        showThumbnailBar={showThumbnailBar}
                                        layoutColors={layoutColors}
                                    >
                                        <TurnJsBookRenderer
                                            {...bookRendererProps}
                                            bookmarks={layout8Bookmarks}
                                            bookmarkSpacing={5}
                                        />
                                    </Grid8Layout>
                                )
                            ) : (
                                <Grid1Layout
                                    settings={settings}
                                    bookName={bookName}
                                    activeLayout={activeLayout}
                                    hideHeader={hideHeader}
                                    searchQuery={searchQuery}
                                    setSearchQuery={setSearchQuery}
                                    handleQuickSearch={handleQuickSearch}
                                    logoSettings={logoSettings}
                                    logoObjectFit={logoObjectFit}
                                    logoCropStyle={logoCropStyle}
                                    onPageClick={onPageClick}
                                    currentPage={((augmentedPages || bookRendererProps?.augmentedPages || pages || [])[currentPage]?.logicalPageIndex) ?? currentPage ?? 0}
                                    pages={pages}
                                    bookRef={bookRef}
                                    showSoundPopup={showSoundPopup}
                                    setShowSoundPopupMemo={setShowSoundPopupMemo}
                                    backgroundSettings={layoutBackgroundSettings}
                                    backgroundStyle={layoutBackgroundStyle}
                                    isMuted={isMuted}
                                    onToggleAudio={handleToggleAudio}
                                    setShowGalleryPopupMemo={setShowGalleryPopupMemo}
                                    showGalleryPopup={showGalleryPopup}
                                    showSharePopup={showSharePopup}
                                    showExportPopup={showExportPopup}
                                    isSidebarOpen={isSidebarOpen}
                                    isMobile={activeDevice === 'Mobile'}
                                    isLandscape={isLandscape}
                                    isMobileLandscape={isMobileLandscape}
                                    notes={notes}
                                    showBookmarkMenu={showBookmarkMenu}
                                    setShowBookmarkMenuMemo={setShowBookmarkMenuMemo}
                                    showMoreMenu={showMoreMenu}
                                    setShowMoreMenuMemo={setShowMoreMenuMemo}
                                    showThumbnailBar={showThumbnailBar}
                                    setShowThumbnailBarMemo={setShowThumbnailBarMemo}
                                    showTOC={showTOC}
                                    setShowTOCMemo={setShowTOCMemo}
                                    setShowAddNotesPopupMemo={setShowAddNotesPopupMemo}
                                    setShowNotesViewerMemo={setShowNotesViewerMemo}
                                    setShowNotesMenuMemo={setShowNotesMenuMemo}
                                    showNotesMenu={showNotesMenu}
                                    setShowAddBookmarkPopupMemo={setShowAddBookmarkPopupMemo}
                                    setShowViewBookmarkPopup={setShowViewBookmarkPopup}
                                    showViewBookmarkPopup={showViewBookmarkPopup}
                                    setShowProfilePopup={setShowProfilePopup}
                                    showProfilePopup={showProfilePopup}
                                    setIsPlaying={setIsPlaying}
                                    isAutoFlipping={isAutoFlipping}
                                    currentZoom={currentZoom}
                                    handleZoomIn={handleZoomIn}
                                    handleZoomOut={handleZoomOut}
                                    handleFullScreen={handleFullScreen}
                                    handleShare={handleShare}
                                    handleDownload={handleDownload}
                                    offset={isSinglePage ? 0 : offset}
                                    bookmarks={layout1Bookmarks}
                                    isFullscreen={isFullscreen}
                                    layoutColors={layoutColors}
                                >
                                    <TurnJsBookRenderer
                                        {...bookRendererProps}
                                        bookmarks={layout1Bookmarks}
                                        bookmarkSpacing={5}
                                    />
                                </Grid1Layout>
                            )}

                            {renderSharedOverlays()}

                        </div>
                    </div>
      )}
    </>
  );
};

export default DeviceLayoutRenderer;
