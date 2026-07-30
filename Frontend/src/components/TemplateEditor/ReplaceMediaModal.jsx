import React, { useState, useEffect, useRef } from 'react';
import { Icon } from '@iconify/react';
import axios from 'axios';
import { resolveUploadsPath } from '../../utils/supabaseUtils';

const ReplaceMediaModal = ({ show, onClose, onReplace, mediaType = 'image' }) => {
  const [replaceModalTab, setReplaceModalTab] = useState('Upload');
  const [replaceModalFile, setReplaceModalFile] = useState(null);
  const [galleryAssets, setGalleryAssets] = useState([]);
  const [importUrl, setImportUrl] = useState('');
  const [importUrlError, setImportUrlError] = useState('');
  const [replaceModalFileDim, setReplaceModalFileDim] = useState('');
  const [activeGalleryDropdown, setActiveGalleryDropdown] = useState(null);

  const fileInputRefUpload = useRef(null);
  const fileInputRefGallery = useRef(null);
  const fileInputRefReplaceItem = useRef(null);
  const [itemToReplaceId, setItemToReplaceId] = useState(null);

  useEffect(() => {
    if (replaceModalFile) {
      const src = replaceModalFile.url || URL.createObjectURL(replaceModalFile);
      const img = new Image();
      img.onload = () => {
        setReplaceModalFileDim(`${img.width} x ${img.height}`);
        if (!replaceModalFile.url) URL.revokeObjectURL(src);
      };
      img.onerror = () => {
        setReplaceModalFileDim('Unknown');
        if (!replaceModalFile.url) URL.revokeObjectURL(src);
      };
      img.src = src;
    } else {
      setReplaceModalFileDim('');
    }
  }, [replaceModalFile]);

  useEffect(() => {
    const galleryTabName = mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery';
    if (show && replaceModalTab === galleryTabName && galleryAssets.length === 0) {
      const fetchAssets = async () => {
        const storedUser = localStorage.getItem('user');
        if (!storedUser) return;
        const user = JSON.parse(storedUser);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        try {
          const res = await axios.get(`${backendUrl}/api/flipbook/get-gallery-assets`, {
            params: { emailId: user.emailId, type: mediaType }
          });
          if (res.data.assets) {
            setGalleryAssets(res.data.assets.map(asset => ({
              id: asset.name,
              name: asset.name.replace(/\.[^/.]+$/, ''),
              url: resolveUploadsPath(asset.url)
            })));
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchAssets();
    }
  }, [show, replaceModalTab, galleryAssets.length]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-[2vw]" onClick={onClose}>
      <div className="bg-white rounded-[0.8vw] w-[400px] shadow-xl flex flex-col font-sans relative" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-[1.5vw] pb-[0.5vw]">
          <h2 className="text-[1.1vw] font-bold text-gray-900 mr-[1vw]">
            {mediaType === 'video' ? 'Replace Video' : mediaType === 'gif' ? 'Replace Gif' : 'Replace Image'}
          </h2>
          <div className="flex-1 h-px bg-gray-200 mx-[0.5vw]"></div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <Icon icon="lucide:x" className="w-[1vw] h-[1vw]" />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex w-full px-[1.5vw] border-b border-gray-100">
          {['Upload', mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery', 'Import via URL'].map(tab => (
            <button 
              key={tab} 
              onClick={() => setReplaceModalTab(tab)}
              className={`flex-1 text-center py-[0.5vw] text-[0.8vw] font-medium border-b-[0.15vw] transition-colors ${replaceModalTab === tab ? 'border-gray-800 text-gray-800' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="px-[1.5vw] pb-[1.5vw] pt-[0.5vw] h-[20vw] flex flex-col">
          {replaceModalTab === 'Upload' && (
            <>
              {(replaceModalFile && !replaceModalFile.isUrl && !replaceModalFile.isGalleryItem) ? (
                <div className="flex-1 flex flex-col min-h-0 w-[95%] mx-auto mt-[0.5vw]">
                  <div className="w-full aspect-video relative overflow-hidden bg-gray-100 group flex items-center justify-center shrink-0">
                    {mediaType === 'video' ? (
                      <video src={replaceModalFile.url || URL.createObjectURL(replaceModalFile)} className="w-full h-full object-contain" controls />
                    ) : (
                      <img src={replaceModalFile.url || URL.createObjectURL(replaceModalFile)} alt="Preview" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                    )}
                    <span className="absolute top-[0.5vw] left-[0.5vw] text-white text-[0.75vw] font-medium drop-shadow-md">Preview</span>
                    <button onClick={() => setReplaceModalFile(null)} className="absolute top-[0.5vw] right-[0.5vw] text-white p-[0.3vw] rounded-[0.3vw] transition-colors drop-shadow-md hover:bg-black/20">
                      <Icon icon="lucide:trash-2" className="w-[1vw] h-[1vw]" />
                    </button>
                  </div>
                  <div className="mt-[0.5vw] mb-[0.2vw] flex flex-col gap-[0.2vw] text-[0.7vw] text-gray-500 shrink-0">
                    <p>File Name : {replaceModalFile.name || 'Sample file.jpg'}</p>
                    <p>Dimension : {replaceModalFileDim || 'Loading...'}</p>
                    <p>File size : {replaceModalFile.size ? (replaceModalFile.size / 1024).toFixed(0) + 'KB' : 'Unknown'}</p>
                  </div>
                </div>
              ) : (
                <>
                  <div 
                    className="flex-1 mt-[1vw] w-[92%] mx-auto border-2 border-dashed border-gray-400/70 rounded-[1vw] bg-[#F8F9FA] flex flex-col items-center justify-center py-[1vw] px-[2vw] text-center cursor-pointer transition-colors hover:bg-gray-100"
                    onClick={() => fileInputRefUpload.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      if (e.dataTransfer.files?.length) {
                        setReplaceModalFile(e.dataTransfer.files[0]);
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center w-full">
                      <Icon icon="lucide:upload" className="w-[2vw] h-[2vw] text-gray-400 mb-[0.3vw] stroke-[1.5]" />
                      <span className="text-[0.9vw] text-gray-400 font-medium mb-[0.1vw]">Drag & Drop File here</span>
                      <span className="text-[0.75vw] text-gray-400 mb-[0.3vw]">or</span>
                      <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.1vw] shadow-sm transition-colors cursor-pointer inline-block">
                        <div 
                          className="flex items-center justify-center gap-[0.3vw] cursor-pointer text-white text-[0.7vw] font-medium px-[0.6vw] py-[0.3vw] rounded-[0.3vw]"
                          onClick={(e) => { e.stopPropagation(); fileInputRefUpload.current?.click(); }}
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (e.dataTransfer.files?.length) {
                              setReplaceModalFile(e.dataTransfer.files[0]);
                            }
                          }}
                        >
                          <Icon icon="lucide:upload" className="w-[0.8vw] h-[0.8vw] stroke-[2]" />
                          Browse Files
                          <input type="file" ref={fileInputRefUpload} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} onChange={e => {
                            if (e.target.files?.length) setReplaceModalFile(e.target.files[0]);
                          }} onClick={(e) => { e.target.value = null; }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-[1.5vw] text-[0.7vw] text-gray-500 space-y-[0.2vw] shrink-0">
                    <p>Supported File : {mediaType === 'video' ? 'MP4, MKV, WEBM' : mediaType === 'gif' ? 'GIF' : 'JPG, PNG, WEBP, SVG'}</p>
                    <p>Max file size : 50MB</p>
                  </div>
                </>
              )}
            </>
          )}
          {replaceModalTab === (mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery') && (
            <div className="flex flex-col flex-1 min-h-0" onClick={() => setActiveGalleryDropdown(null)}>
              {/* Toolbar */}
              <div className="flex items-center justify-between mt-[1vw] mb-[1vw] shrink-0">
                <h3 className="text-[0.85vw] font-semibold text-gray-800">{mediaType === 'video' ? 'Video Gallery' : mediaType === 'gif' ? 'GIF Gallery' : 'Image Gallery'}</h3>
                <div className="bg-[#4D47FF] hover:bg-[#3D38CC] rounded-[0.4vw] p-[0.15vw] shadow-sm transition-colors cursor-pointer inline-block">
                  <div 
                    className="flex items-center justify-center gap-[0.5vw] cursor-pointer text-white px-[0.85vw] py-[0.25vw] rounded-[0.3vw] border-[1.5px] border-dashed border-white"
                    onClick={() => fileInputRefGallery.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files?.length) {
                        const newAssets = Array.from(e.dataTransfer.files).map(newFile => ({
                          id: URL.createObjectURL(newFile),
                          name: newFile.name.replace(/\.[^/.]+$/, ''),
                          url: URL.createObjectURL(newFile),
                          isLocal: true,
                          file: newFile
                        }));
                        setGalleryAssets(prev => [...newAssets, ...prev]);
                        setReplaceModalFile({ ...newAssets[0], isGalleryItem: true });
                      }
                    }}
                  >
                    <Icon icon="lucide:upload" className="w-[1vw] h-[1vw] stroke-[2]" />
                    <span className="text-[0.85vw] font-medium">Browse Files</span>
                    <input type="file" ref={fileInputRefGallery} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} multiple onChange={e => {
                      if (e.target.files?.length) {
                        const newAssets = Array.from(e.target.files).map(newFile => {
                          const objectUrl = URL.createObjectURL(newFile);
                          return {
                            id: objectUrl,
                            name: newFile.name.replace(/\.[^/.]+$/, ''),
                            url: objectUrl,
                            isLocal: true,
                            file: newFile
                          };
                        });
                        setGalleryAssets(prev => [...newAssets, ...prev]);
                        setReplaceModalFile({ ...newAssets[0], isGalleryItem: true });
                      }
                    }} onClick={(e) => { e.target.value = null; }} />
                  </div>
                </div>
              </div>
              <input type="file" ref={fileInputRefReplaceItem} className="hidden" accept={mediaType === 'video' ? 'video/mp4' : 'image/*'} onChange={e => {
                if (e.target.files?.length && itemToReplaceId) {
                  const newFile = e.target.files[0];
                  const newUrl = URL.createObjectURL(newFile);
                  const updatedAsset = {
                    id: newUrl,
                    name: newFile.name.replace(/\.[^/.]+$/, ''),
                    url: newUrl,
                    isLocal: true,
                    file: newFile
                  };
                  
                  setGalleryAssets(prev => prev.map(g => g.id === itemToReplaceId ? updatedAsset : g));

                  if (replaceModalFile?.id === itemToReplaceId) {
                    setReplaceModalFile({ ...updatedAsset, isGalleryItem: true });
                  }
                  setItemToReplaceId(null);
                }
              }} onClick={(e) => { e.target.value = null; }} />

              {/* Grid */}
              <div className="flex-1 grid grid-cols-4 gap-[1vw] overflow-y-auto min-h-0 pr-[0.5vw]">
                {galleryAssets.length > 0 ? galleryAssets.map((item, idx) => (
                  <div key={item.id || idx} className="flex flex-col gap-[0.4vw] cursor-pointer group relative" onClick={() => { setReplaceModalFile({ ...item, isGalleryItem: true }); setActiveGalleryDropdown(null); }}>
                    <div className={`w-full aspect-square rounded-[0.4vw] overflow-hidden bg-gray-100 relative shadow-sm ${replaceModalFile?.id === item.id ? 'border-[0.15vw] border-[#4D47FF]' : 'border border-gray-200 group-hover:shadow-md'}`}>
                      {mediaType === 'video' ? (
                        <video src={item.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      )}
                      <div className={`absolute inset-0 ${replaceModalFile?.id === item.id ? 'bg-[#4D47FF]/10' : 'bg-black/0 group-hover:bg-black/5'}`} />
                      
                      {/* Hover Three Dots */}
                      <div 
                        className={`absolute top-[0.3vw] right-[0.3vw] bg-white/90 rounded-[0.2vw] p-[0.2vw] shadow-sm hover:bg-white z-10 ${activeGalleryDropdown === item.id ? 'block' : 'hidden group-hover:block'}`}
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          setActiveGalleryDropdown(activeGalleryDropdown === item.id ? null : item.id); 
                        }}
                      >
                        <Icon icon="lucide:more-vertical" className="w-[0.9vw] h-[0.9vw] text-gray-700" />
                      </div>
                    </div>

                    {/* Dropdown Menu */}
                    {activeGalleryDropdown === item.id && (
                      <div className={`absolute top-[1.5vw] ${idx % 4 < 2 ? 'left-0' : 'right-0'} bg-white rounded-[0.3vw] shadow-lg border border-gray-200 py-[0.2vw] w-[6.5vw] z-20 flex flex-col overflow-hidden`}>
                        <button 
                          className="text-[0.7vw] font-medium text-gray-700 hover:bg-gray-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setItemToReplaceId(item.id);
                            fileInputRefReplaceItem.current?.click();
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Replace {mediaType === 'video' ? 'Video' : mediaType === 'gif' ? 'Gif' : 'Image'}
                        </button>
                        <button 
                          className="text-[0.7vw] font-medium text-red-600 hover:bg-red-50 text-left px-[0.5vw] py-[0.3vw]"
                          onClick={(e) => {
                            e.stopPropagation();
                            setGalleryAssets(prev => prev.filter(g => g.id !== item.id));
                            if (replaceModalFile?.id === item.id) {
                              setReplaceModalFile(null);
                            }
                            setActiveGalleryDropdown(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                    <span className="text-center text-[0.7vw] font-medium text-gray-500 truncate w-full px-[0.2vw]">{item.name}</span>
                  </div>
                )) : (
                  <div className="col-span-4 flex items-center justify-center text-center text-gray-400 py-[2vw] text-[0.8vw]">
                    No {mediaType === 'video' ? 'videos' : mediaType === 'gif' ? 'gifs' : 'images'} found in your gallery.
                  </div>
                )}
              </div>
            </div>
          )}
          {replaceModalTab === 'Import via URL' && (
            <div className="flex-1 flex flex-col min-h-0 w-[95%] mx-auto mt-[0.5vw]">
                  <div className="w-full aspect-video relative overflow-hidden bg-gray-100 group flex items-center justify-center shrink-0">
                    {replaceModalFile?.url ? (
                      mediaType === 'video' ? (
                        replaceModalFile.isYouTube ? (
                          <iframe 
                            src={replaceModalFile.ytVideoId ? `https://www.youtube.com/embed/${replaceModalFile.ytVideoId}` : (replaceModalFile.url.includes('watch?v=') ? replaceModalFile.url.replace('watch?v=', 'embed/') : replaceModalFile.url)} 
                            className="w-full h-full object-contain" 
                            style={{ display: 'none' }}
                            frameBorder="0" 
                            allowFullScreen
                            onLoad={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                          />
                        ) : (
                          <video 
                            src={replaceModalFile.url} 
                            className="w-full h-full object-contain" 
                            style={{ display: 'none' }}
                            controls
                            onLoadedData={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                            onError={(e) => { e.target.style.display = 'none'; if (e.target.nextSibling) { e.target.nextSibling.style.display = 'block'; e.target.nextSibling.innerText = 'Failed to load preview'; e.target.nextSibling.classList.remove('animate-pulse'); } }}
                          />
                        )
                      ) : (
                        <img 
                          src={replaceModalFile.url} 
                          alt="Preview" 
                          className="w-full h-full object-contain" 
                          style={{ display: 'none' }}
                          onLoad={(e) => { e.target.style.display = 'block'; if (e.target.nextSibling) e.target.nextSibling.style.display = 'none'; }}
                          onError={(e) => { 
                            if (e.target.src.includes('maxresdefault.jpg')) {
                              e.target.src = e.target.src.replace('maxresdefault.jpg', 'hqdefault.jpg');
                              if (replaceModalFile) replaceModalFile.url = e.target.src;
                            } else {
                              e.target.style.display = 'none'; 
                              if (e.target.nextSibling) {
                                e.target.nextSibling.style.display = 'block'; 
                                e.target.nextSibling.innerText = 'Failed to load preview';
                                e.target.nextSibling.classList.remove('animate-pulse');
                              }
                            }
                          }} 
                        />
                      )
                    ) : null}
                    <span className={`text-[0.85vw] text-gray-400 font-medium ${replaceModalFile?.url ? 'animate-pulse block' : 'block'}`}>{replaceModalFile?.url ? 'Loading preview...' : 'Preview'}</span>
                  </div>
              <div className="mt-[0.5vw] flex flex-col gap-[0.4vw] shrink-0">
                <label className="text-[0.85vw] font-semibold text-gray-900">{mediaType === 'video' ? 'Paste Video URL' : mediaType === 'gif' ? 'Paste Gif URL' : 'Paste Image URL'}</label>
                <div className="flex items-center gap-[0.5vw] border border-gray-200 rounded-[0.5vw] px-[0.75vw] py-[0.5vw] bg-white">
                  <Icon icon="lucide:link" className="w-[1vw] h-[1vw] text-[#4D47FF]" />
                  <input 
                    type="text" 
                    placeholder="https://" 
                    className="flex-1 bg-transparent outline-none text-[0.85vw] text-gray-700 placeholder-gray-400"
                    value={importUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setImportUrl(val);
                      if (val.trim()) {
                        let finalUrl = val.trim();
                        const ytMatch = finalUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
                        const isImage = /\.(jpeg|jpg|gif|png|webp|svg)(\?.*)?$/i.test(finalUrl);
                        const isVideo = ytMatch || /\.(mp4|webm|ogg|mkv)(\?.*)?$/i.test(finalUrl);

                        if (mediaType === 'video') {
                          if (ytMatch || isVideo) {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_video', isUrl: true, isYouTube: !!ytMatch, ytVideoId: ytMatch ? ytMatch[1] : null });
                          } else {
                            setImportUrlError('Please enter a valid video URL or YouTube link.');
                            setReplaceModalFile(null);
                          }
                        } else if (mediaType === 'gif') {
                          const isGif = /\.gif(\?.*)?$/i.test(finalUrl);
                          if (!isGif) {
                            setImportUrlError('Please enter a valid GIF URL.');
                            setReplaceModalFile(null);
                          } else {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_gif', isUrl: true });
                          }
                        } else {
                          if (ytMatch || isVideo) {
                            setImportUrlError('Video links are not supported here. Please enter an image URL.');
                            setReplaceModalFile(null);
                          } else {
                            setImportUrlError('');
                            setReplaceModalFile({ url: finalUrl, name: 'url_image', isUrl: true });
                          }
                        }
                      } else {
                        setImportUrlError('');
                        setReplaceModalFile(null);
                      }
                    }}
                  />
                </div>
                {importUrlError ? (
                  <span className="text-[0.7vw] text-red-500">{importUrlError}</span>
                ) : (
                  <span className="text-[0.7vw] text-gray-400">Make sure the link is direct and publicly accessible.</span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-[0.75vw] p-[1.5vw] border-t border-gray-100">
          <button 
            onClick={() => { onClose(); setReplaceModalFile(null); setImportUrl(''); setImportUrlError(''); }}
            className="flex-1 py-[0.5vw] rounded-[0.3vw] border border-gray-200 text-gray-700 text-[0.8vw] font-medium hover:bg-gray-50 flex items-center justify-center gap-[0.5vw]"
          >
            <Icon icon="lucide:x" className="w-[0.8vw] h-[0.8vw]" /> Cancel
          </button>
          <button 
            disabled={!replaceModalFile}
            onClick={async () => {
              if (replaceModalFile) {
                if (replaceModalFile.isGalleryItem || replaceModalFile.isUrl) {
                  try {
                    if (mediaType === 'video' && replaceModalFile.isUrl) {
                      const mockFile = new File([""], replaceModalFile.name + '.mp4', { type: 'video/mp4' });
                      mockFile.url = replaceModalFile.url;
                      mockFile.isUrl = true;
                      mockFile.isYouTube = replaceModalFile.isYouTube;
                      onReplace(mockFile);
                    } else {
                      const response = await fetch(replaceModalFile.url);
                      const blob = await response.blob();
                      const file = new File([blob], replaceModalFile.name + (mediaType === 'video' ? '.mp4' : mediaType === 'gif' ? '.gif' : '.png'), { type: blob.type || (mediaType === 'video' ? 'video/mp4' : mediaType === 'gif' ? 'image/gif' : 'image/png') });
                      onReplace(file);
                    }
                  } catch (e) {
                    console.error("Failed to fetch media", e);
                    if (replaceModalFile.isUrl) {
                      alert(`Could not load ${mediaType} from this URL. Make sure it's a direct link and allows cross-origin access.`);
                    }
                  }
                } else {
                  onReplace(replaceModalFile);
                }
                onClose();
                setReplaceModalFile(null);
                setImportUrl('');
                setImportUrlError('');
              }
            }}
            className={`flex-1 py-[0.5vw] rounded-[0.3vw] text-white text-[0.8vw] font-medium transition-colors ${replaceModalFile ? 'bg-black hover:bg-gray-800' : 'bg-[#B1B1B1] cursor-not-allowed'}`}
          >
            Replace {mediaType === 'video' ? 'Video' : mediaType === 'gif' ? 'Gif' : 'Image'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReplaceMediaModal;
