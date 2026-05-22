const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'src', 'pages', 'MyFlipbooks.jsx');
let content = fs.readFileSync(targetPath, 'utf8');

const returnStart = content.indexOf('  return (\n    <div className="flex bg-[#eef0f8] h-full">');
const returnEnd = content.indexOf('  {/* Fixed Book Menu Portal */}'); // I'll replace everything up to this point

if (returnStart === -1 || returnEnd === -1) {
    console.error("Could not find start or end markers");
    process.exit(1);
}

const replacement = `  return (
    <div className="flex bg-gradient-to-br from-[#e2e5f5] to-[#f4f5fa] h-full font-sans">
      {/* Sidebar */}
      <aside className="w-[18vw] bg-white h-[92vh] fixed left-0 top-[8vh] border-r border-gray-100 flex flex-col p-[1.5vw] z-20 shadow-sm">
        
        {/* Top Action */}
        <Link to="/home" className="w-full flex items-center justify-center gap-[0.5vw] px-[1vw] py-[0.75vw] rounded-[0.5vw] border border-gray-300 text-gray-800 font-semibold hover:bg-gray-50 transition-colors text-[0.9vw] mb-[2vw]">
             <ArrowLeft size="1.1vw" />
             Back to Home
        </Link>

        {/* Folders Section */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-none mb-[1vw] flex items-center justify-between">
              <span className="text-[0.75vw] font-bold text-gray-400 tracking-wider">Your Folders</span>
              <button 
                onClick={handleAddFolderClick}
                className="flex items-center cursor-pointer gap-[0.25vw] px-[0.5vw] py-[0.25vw] rounded-[0.25vw] border border-blue-200 text-blue-600 font-medium text-[0.7vw] hover:bg-blue-50 transition-colors"
              >
                  <Plus size="0.8vw" /> Create
              </button>
          </div>

          {/* Scrollable Folder List */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-[0.25vw] pb-[1vw]" ref={folderListRef}>
            <div className="space-y-[0.5vw]">
              {folders.map(folder => {
                  const isEditing = editingId === folder.id;
                  const isActive = activeFolder === folder.name;
                  
                  // Mock count based on the image
                  const mockCounts = { 'All Flipbook': 8, 'Office Book': 4, 'Entertainment Book': 2, 'Catlougs': 2 };
                  const badgeCount = mockCounts[folder.name] || (folder.name === 'Recent Book' ? books.length : 0);

                  return isEditing ? (
                      <div key={folder.id} className="w-full px-[1vw] py-[0.75vw] rounded-[0.5vw] border border-[#3b4190] bg-white shadow-md">
                          <input 
                              autoFocus
                              type="text"
                              value={tempName}
                              onChange={(e) => setTempName(e.target.value)}
                              onBlur={saveEdit}
                              onKeyDown={handleKeyDown}
                              className="w-full text-[0.875vw] font-medium text-gray-900 focus:outline-none"
                          />
                      </div>
                  ) : (
                      <div 
                          key={folder.id}
                          onClick={() => setActiveFolder(folder.name)}
                          className={\`relative group w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.75vw] rounded-[0.5vw] transition-all text-[0.875vw] font-medium text-left cursor-pointer
                              \${isActive 
                                  ? 'bg-[#efeffd] text-[#4c5add]' 
                                  : 'bg-white text-gray-600 hover:bg-gray-50'
                              }
                          \`}
                      >
                          <Folder size="1.1vw" className={isActive ? "text-[#4c5add]" : "text-gray-400"} />
                          <span className="truncate flex-1">{folder.name}</span>
                          
                          {badgeCount > 0 && (
                              <span className={\`text-[0.75vw] font-semibold \${isActive ? 'text-[#4c5add]' : 'text-gray-400'}\`}>
                                  {badgeCount}
                              </span>
                          )}

                          {/* Options Menu Trigger */}
                          {folder.name !== 'Recent Book' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuId(activeMenuId === folder.id ? null : folder.id);
                                }}
                                className={\`p-[0.375vw] rounded-[0.5vw] transition-all rotate-90 absolute right-[2.5vw] bg-white/80 shadow-sm \${
                                    isActive 
                                        ? 'hover:bg-white text-[#4c5add]' 
                                        : 'hover:bg-gray-200 text-gray-500'
                                } \${activeMenuId === folder.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}\`}
                            >
                                <MoreVertical size="1vw" />
                            </button>
                          )}

                          {/* Dropdown Menu */}
                          {activeMenuId === folder.id && (
                              <>
                                  <div className="fixed inset-0 z-30" onClick={(e) => { e.stopPropagation(); setActiveMenuId(null); }}></div>
                                  <div className="absolute right-[0.5vw] top-[2.5vw] w-[10vw] bg-white rounded-[0.75vw] shadow-xl border border-gray-100 z-40 overflow-hidden py-[0.25vw] animate-in fade-in zoom-in-95 duration-100">
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              startEditing(folder);
                                              setActiveMenuId(null);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Edit2 size="0.9vw" />
                                          Rename
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDuplicateFolder(folder);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-gray-600 hover:bg-gray-50 transition-colors border-b border-gray-50"
                                      >
                                          <Copy size="0.9vw" />
                                          Duplicate
                                      </button>
                                      <button
                                          onClick={(e) => {
                                              e.stopPropagation();
                                              handleDeleteFolderClick(folder);
                                          }}
                                          className="w-full flex items-center gap-[0.5vw] px-[0.75vw] py-[0.625vw] text-[0.75vw] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                                      >
                                          <Trash2 size="0.9vw" />
                                          Delete
                                      </button>
                                  </div>
                              </>
                          )}
                      </div>
                  );
              })}
              
              {/* New Folder Input */}
              {isCreatingFolder && (
                   <div className="w-full px-4 py-3 rounded-xl border-2 border-[#3b4190] bg-white shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
                      <input 
                          autoFocus
                          type="text"
                          placeholder="Name..."
                          value={newFolderInputName}
                          onChange={(e) => setNewFolderInputName(e.target.value)}
                          onBlur={saveNewFolder}
                          onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                  e.preventDefault(); 
                                  saveNewFolder();
                              }
                              if (e.key === 'Escape') {
                                  setIsCreatingFolder(false);
                              }
                          }}
                          className="w-full text-sm font-medium text-gray-900 focus:outline-none placeholder-gray-400"
                      />
                   </div>
              )}
            </div>
            
            <div className="my-[1.5vw] h-[1px] bg-gray-100"></div>
            
            {/* Trash */}
            <div className="w-full flex items-center justify-between px-[1vw] py-[0.75vw] rounded-[0.5vw] hover:bg-red-50 text-red-500 font-medium text-[0.875vw] cursor-pointer transition-colors mb-[0.5vw]">
                <div className="flex items-center gap-[0.75vw]">
                    <Trash2 size="1.1vw" />
                    <span>Trash</span>
                </div>
                <span className="text-[0.75vw] font-semibold">2</span>
            </div>
            
            <div className="my-[1.5vw] h-[1px] bg-gray-100"></div>

            {/* My Shelf */}
            <div className="w-full flex items-center gap-[0.75vw] px-[1vw] py-[0.75vw] rounded-[0.5vw] bg-gray-100 text-gray-600 font-medium text-[0.875vw] cursor-pointer hover:bg-gray-200 transition-colors">
                <LayoutTemplate size="1.1vw" />
                <span>My Shelf</span>
            </div>
          </div>
        </div>

        {/* Upgrade to Pro */}
        <div className="mt-auto pt-[1vw]">
            <div className="bg-[#0f0f13] text-white rounded-[1vw] p-[1.5vw] relative overflow-hidden flex flex-col items-start shadow-xl border border-gray-800">
                <div className="absolute -top-[1vw] -right-[0.5vw] rotate-12 text-[#ffd700] opacity-90 drop-shadow-[0_0_15px_rgba(255,215,0,0.5)]">
                    <Crown size="4vw" fill="currentColor" strokeWidth={1} />
                </div>
                
                <h3 className="text-[1.2vw] font-bold mb-[0.5vw] z-10 text-white drop-shadow-md">Upgrade to Pro</h3>
                <p className="text-[0.75vw] text-gray-400 mb-[1.5vw] z-10 max-w-[85%] leading-relaxed">
                    Unlock more Storage, templates and Premium features.
                </p>
                <button className="w-full py-[0.6vw] bg-white text-black text-[0.8vw] font-bold rounded-[0.5vw] flex items-center justify-center gap-[0.5vw] hover:bg-gray-100 transition-colors z-10 shadow-lg">
                    Update Profile <ArrowRight size="0.9vw" />
                </button>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-[18vw] p-[2vw] relative overflow-y-auto custom-scrollbar flex flex-col z-10">
           <h1 className="text-[1.8vw] font-bold text-gray-900 mb-[1.5vw]">Quick Create your Flipbook</h1>

           {/* Top Sections */}
           <div className="flex gap-[1.5vw] mb-[2vw]">
                {/* Upload Section */}
                <div 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="w-[28vw] bg-white/70 backdrop-blur-sm border-2 border-dashed border-[#8b8be5] rounded-[1vw] flex flex-col items-center justify-center p-[2vw] cursor-pointer hover:bg-white transition-all shadow-sm group"
                >
                    <UploadCloud size="2.5vw" className="text-gray-400 mb-[0.5vw] group-hover:text-[#4c5add] transition-colors" />
                    <p className="text-[0.9vw] font-medium text-gray-500 mb-[1vw]">
                        Drag & Drop or <span className="text-[#4c5add] font-semibold underline decoration-2 underline-offset-4">Upload</span>
                    </p>
                    <div className="flex items-center gap-[0.5vw] text-[0.7vw] text-gray-400">
                        Supported File format - 
                        <div className="flex gap-[0.25vw] ml-[0.25vw]">
                            <span className="bg-red-50 border border-red-100 text-red-600 px-[0.4vw] py-[0.1vw] rounded-[0.2vw] font-bold">P</span>
                            <span className="bg-blue-50 border border-blue-100 text-blue-600 px-[0.4vw] py-[0.1vw] rounded-[0.2vw] font-bold">W</span>
                            <span className="bg-orange-50 border border-orange-100 text-orange-600 px-[0.4vw] py-[0.1vw] rounded-[0.2vw] font-bold">P</span>
                        </div>
                    </div>
                </div>

                {/* Templates Section */}
                <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-[1vw] p-[1.5vw] flex items-center shadow-sm border border-white">
                    <div className="flex-shrink-0 w-[14vw] mr-[1vw]">
                        <h2 className="text-[1.2vw] font-bold text-gray-800 mb-[0.25vw]">Create From Stratch</h2>
                        <p className="text-[0.75vw] text-gray-500 leading-relaxed pr-[1vw]">Begin with a blank canvas and design your flipbook your way.</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-between relative">
                        <button className="p-[0.5vw] text-gray-400 hover:text-gray-600 z-10"><ChevronLeft size="1.2vw"/></button>
                        
                        <div className="flex gap-[1.5vw] flex-1 justify-center items-end h-[7vw]">
                            {/* Template Thumbs */}
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleUseTemplate({ pageCount: 12 })}>
                                <div className="w-[3.2vw] h-[4.5vw] bg-[#a8a4d4] rounded-[0.2vw] shadow-sm mb-[0.5vw] group-hover:-translate-y-1 group-hover:shadow-md transition-all flex items-center justify-center text-white/50 text-[0.6vw] font-bold">A4</div>
                                <span className="text-[0.6vw] font-semibold text-[#4c5add] text-center leading-tight">Corporate Brochure<br/><span className="text-gray-400 font-normal">(29.7 X 42 Cm)</span></span>
                            </div>
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleUseTemplate({ pageCount: 12 })}>
                                <div className="w-[3.2vw] h-[4vw] bg-[#b8b4dc] rounded-[0.2vw] shadow-sm mb-[0.5vw] group-hover:-translate-y-1 group-hover:shadow-md transition-all flex items-center justify-center text-white/50 text-[0.6vw] font-bold">A4</div>
                                <span className="text-[0.6vw] font-semibold text-gray-600 text-center leading-tight">Product Catalogue<br/><span className="text-gray-400 font-normal">(21 X 29 Cm)</span></span>
                            </div>
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleUseTemplate({ pageCount: 12 })}>
                                <div className="w-[2.2vw] h-[3.2vw] bg-[#c8c4e4] rounded-[0.2vw] shadow-sm mb-[0.5vw] group-hover:-translate-y-1 group-hover:shadow-md transition-all flex items-center justify-center text-white/50 text-[0.6vw] font-bold">A5</div>
                                <span className="text-[0.6vw] font-semibold text-gray-600 text-center leading-tight">Mini Brochure<br/><span className="text-gray-400 font-normal">(14.8 X 21 Cm)</span></span>
                            </div>
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleUseTemplate({ pageCount: 12 })}>
                                <div className="w-[3.8vw] h-[3.8vw] bg-[#b8b4dc] rounded-[0.2vw] shadow-sm mb-[0.5vw] group-hover:-translate-y-1 group-hover:shadow-md transition-all flex items-center justify-center text-white/50 text-[0.6vw] font-bold">Square</div>
                                <span className="text-[0.6vw] font-semibold text-gray-600 text-center leading-tight">Square Lookbook<br/><span className="text-gray-400 font-normal">(25 X 25 Cm)</span></span>
                            </div>
                            <div className="flex flex-col items-center group cursor-pointer" onClick={() => handleUseTemplate({ pageCount: 12 })}>
                                <div className="w-[2.2vw] h-[4vw] bg-[#a8a4d4] rounded-[0.2vw] shadow-sm mb-[0.5vw] group-hover:-translate-y-1 group-hover:shadow-md transition-all flex items-center justify-center text-white/50 text-[0.6vw] font-bold">Mobile</div>
                                <span className="text-[0.6vw] font-semibold text-gray-600 text-center leading-tight">Mobile Flipbook<br/><span className="text-gray-400 font-normal">(12 X 21.3 Cm)</span></span>
                            </div>
                        </div>

                        <button className="p-[0.5vw] text-gray-400 hover:text-gray-600 z-10"><ChevronRight size="1.2vw"/></button>
                    </div>
                </div>
           </div>

           {/* Filter & Search Bar */}
           <div className="w-full bg-white/60 backdrop-blur-md border border-white rounded-[1vw] p-[1vw] flex items-center justify-between shadow-sm mb-[1.5vw]">
               <div className="flex items-center gap-[1vw]">
                   <div className="relative w-[18vw]">
                       <Search className="absolute left-[0.75vw] top-1/2 -translate-y-1/2 text-gray-400" size="1vw" />
                       <input 
                           type="text" 
                           placeholder="Search..." 
                           value={searchQuery}
                           onChange={(e) => setSearchQuery(e.target.value)}
                           className="w-full pl-[2.25vw] pr-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.8vw] focus:outline-none focus:border-blue-400 transition-colors shadow-sm"
                       />
                   </div>
                   
                   <div className="relative group">
                       <button className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:border-gray-300 shadow-sm">
                           All Folders <ChevronDown size="0.9vw" className="text-gray-400" />
                       </button>
                   </div>
                   
                   <div className="relative group">
                       <button className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:border-gray-300 shadow-sm">
                           All Status <ChevronDown size="0.9vw" className="text-gray-400" />
                       </button>
                   </div>
                   
                   <div className="relative group">
                       <button className="flex items-center gap-[0.5vw] px-[1vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.5vw] text-[0.8vw] font-medium text-gray-600 hover:border-gray-300 shadow-sm">
                           <SlidersHorizontal size="0.9vw" />
                           Sort by - Newest First <ChevronDown size="0.9vw" className="text-gray-400" />
                       </button>
                   </div>
               </div>

               <label className="flex items-center gap-[0.5vw] cursor-pointer mr-[1vw]">
                   <div className="w-[1vw] h-[1vw] rounded-[0.15vw] border border-gray-300 flex items-center justify-center bg-white shadow-sm">
                       {/* Checkbox mock */}
                   </div>
                   <span className="text-[0.875vw] font-medium text-gray-600">Multiple Selection</span>
               </label>
           </div>

           {/* Content Area */}
           {isLoading ? (
               <div className="flex-1 flex flex-col items-center justify-center">
                   <div className="animate-spin rounded-full h-[2.5vw] w-[2.5vw] border-[0.2vw] border-gray-300 border-t-blue-600"></div>
                   <p className="text-gray-500 mt-[1vw] font-medium text-[0.875vw]">Loading Flipbooks...</p>
               </div>
           ) : filteredBooks.length > 0 ? (
               <div 
                   className="flex-1 flex flex-col gap-[1vw] overflow-y-auto custom-scrollbar pb-[2vw]"
                   onScroll={() => setActiveBookMenu(null)} // Close menu on scroll
               >
                   {filteredBooks.map((book, index) => {
                        const isBookEditing = editingBookId === book.id;
                        const isSelected = selectedBooks.includes(book.id);
                        
                        // Resolve the actual folder location if in virtual 'Recent Book' folder
                        let actualFolder = book.folder;
                        if (actualFolder === 'Recent Book' || actualFolder === 'Recent book') {
                            const physicalBook = books.find(b => b.realName === book.realName && b.folder !== 'Recent Book' && b.folder !== 'Recent book');
                            if (physicalBook) actualFolder = physicalBook.folder;
                        }
                        
                        // Use actualFolder and book.realName (folder name on server) to generate the base path
                        const iframeBaseUrl = \`\${backendUrl}/uploads/\${user?.emailId?.replace(/[@.]/g, "_")}/My_Flipbooks/\${encodeURIComponent(actualFolder)}/\${encodeURIComponent(book.realName)}/\`;
                        
                        // Mocking badge type
                        const isPublic = Math.random() > 0.3; // mostly public
                        
                        return (
                            <div key={book.id} className="w-full bg-white rounded-[1vw] shadow-sm border border-white p-[1vw] flex gap-[1.5vw] relative transition-all hover:shadow-md hover:border-gray-100 group">
                                
                                {/* Thumbnail */}
                                <div className="w-[10vw] h-[6vw] bg-gray-50 rounded-[0.5vw] overflow-hidden flex-shrink-0 border border-gray-100 flex items-center justify-center relative shadow-sm">
                                    {book.firstPageHtml ? (
                                        <iframe
                                            title={\`Preview of \${book.title}\`}
                                            className="w-full h-full border-none pointer-events-none"
                                            srcDoc={\`
                                                <!DOCTYPE html>
                                                <html>
                                                <head>
                                                    <base href="\${iframeBaseUrl}">
                                                    <style>
                                                        html, body { margin: 0; padding: 0; width: 100%; height: 100%; overflow: hidden; display: flex; align-items: center; justify-content: center; background: transparent; }
                                                        svg { width: 100%; height: 100%; max-width: 100%; max-height: 100%; }
                                                    </style>
                                                </head>
                                                <body>
                                                    \${book.firstPageHtml.replace(/<svg/, '<svg preserveAspectRatio="xMidYMid meet"')}
                                                </body>
                                                </html>
                                            \`}
                                        />
                                    ) : book.image ? (
                                        <img src={\`\${backendUrl}\${book.image}\`} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center text-gray-300">
                                            <BookOpen size="1.5vw" strokeWidth={1.5} />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Info & Actions */}
                                <div className="flex-1 flex flex-col justify-between py-[0.2vw]">
                                    {/* Header Row */}
                                    <div className="flex justify-between items-start w-full">
                                        <div className="flex flex-col gap-[0.25vw]">
                                            <div className="flex items-center gap-[0.75vw]">
                                                {isBookEditing ? (
                                                    <input 
                                                        autoFocus
                                                        type="text" 
                                                        value={tempBookTitle} 
                                                        onChange={(e) => setTempBookTitle(e.target.value)}
                                                        onBlur={saveBookEdit}
                                                        onKeyDown={handleBookKeyDown}
                                                        className="text-[1.125vw] font-bold text-gray-900 border-b border-blue-500 focus:outline-none w-[16vw]"
                                                    />
                                                ) : (
                                                    <h3 className="text-[1.125vw] font-bold text-gray-900 tracking-tight">{book.title}</h3>
                                                )}
                                                <span className={\`px-[0.6vw] py-[0.15vw] rounded-full text-[0.6vw] font-bold flex items-center gap-[0.25vw] \${isPublic ? 'bg-[#ebf8ee] text-[#4caf50]' : 'bg-gray-100 text-gray-600'}\`}>
                                                    {isPublic ? <Shield size="0.6vw" /> : <Eye size="0.6vw" className="opacity-70" />} 
                                                    {isPublic ? 'Public' : 'Private'}
                                                </span>
                                            </div>
                                            <p className="text-[0.75vw] text-gray-500 font-medium">{book.pages} Pages</p>
                                        </div>
                                        <div className="flex gap-[2vw] text-[0.7vw] text-gray-400 font-medium pt-[0.2vw]">
                                            <span>Created on : {book.created}</span>
                                            <span>Views : {book.views}</span>
                                            <span>Size : {book.size}</span>
                                        </div>
                                    </div>
                                    
                                    {/* Divider */}
                                    <div className="w-full h-[1px] bg-gray-100 my-[0.5vw]"></div>
                                    
                                    {/* Action Row */}
                                    <div className="flex items-center justify-between w-full pr-[1vw]">
                                        <button className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-gray-600 hover:text-[#4c5add] transition-colors">
                                            <Eye size="0.9vw" /> View Book
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const identifier = book.v_id || encodeURIComponent(book.realName);
                                                navigate(\`/editor/customized_editor/\${encodeURIComponent(actualFolder)}/\${identifier}\`);
                                            }}
                                            className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-[#4c5add] hover:text-[#3f4bc0] transition-colors"
                                        >
                                            <Wrench size="0.9vw" /> Customize
                                        </button>
                                        <button 
                                            onClick={() => {
                                                const identifier = book.v_id || encodeURIComponent(book.realName);
                                                navigate(\`/editor/\${encodeURIComponent(actualFolder)}/\${identifier}\`);
                                            }}
                                            className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <PenTool size="0.9vw" /> Open in Editor
                                        </button>
                                        <button className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors">
                                            <BarChart2 size="0.9vw" /> Statistic
                                        </button>
                                        <button 
                                            onClick={() => handleShareClick(book)}
                                            className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <Share2 size="0.9vw" /> Share
                                        </button>
                                        <button 
                                            onClick={() => handleDownloadClick(book)}
                                            className="flex items-center gap-[0.4vw] text-[0.75vw] font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                                        >
                                            <Download size="0.9vw" /> Download
                                        </button>
                                        
                                        <div className="relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                    const screenHeight = window.innerHeight;
                                                    const spaceBelow = screenHeight - rect.bottom;
                                                    const menuHeight = 160; 
                                                    const showAbove = spaceBelow < menuHeight;
                                                    setMenuPosition({
                                                        top: showAbove ? (rect.top - 5) : (rect.bottom + 5),
                                                        left: rect.right,
                                                        isDropup: showAbove,
                                                        activeId: book.id
                                                    });
                                                    setActiveBookMenu(activeBookMenu === book.id ? null : book.id);
                                                }}
                                                className="flex items-center gap-[0.2vw] text-[0.75vw] font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                                            >
                                                <MoreVertical size="0.9vw" /> More
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                   })}
               </div>
           ) : (
               <div className="flex-1 flex flex-col items-center justify-center text-center">
                   <div className="w-[4vw] h-[4vw] rounded-full bg-white/50 flex items-center justify-center mb-[1vw] shadow-sm border border-white">
                       <Folder size="2vw" className="text-gray-400" />
                   </div>
                   <h3 className="text-[1.25vw] font-semibold text-gray-700 mb-[0.25vw]">No Flipbooks Found</h3>
                   <p className="text-gray-500 text-[0.875vw]">This folder is empty</p>
               </div>
           )}
      </main>

`;

const newContent = content.substring(0, returnStart) + replacement + content.substring(returnEnd);
fs.writeFileSync(targetPath, newContent);
console.log("Replaced successfully!");
