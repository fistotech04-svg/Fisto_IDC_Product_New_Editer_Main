// VideoEditor.jsx - Context-sensitive video editing panel
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";

import {
  Video as VideoIcon,
  Upload,
  RefreshCw,
  Trash2,
  Sliders,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Replace,
  ChevronUp,
  ChevronDown,
  Edit3,
  Video,
} from "lucide-react";
import VideoGalleryModal from "./VideoGalleryModal";
import InteractionPanel from "./InteractionPanel";

const debounce = (fn, delay = 150) => {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
};

const autoPickThumbnailFromVideo = (selectedElement, onUpdate) => {
  if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

  const video = selectedElement;
  const currentTime = video.currentTime;

  const capture = () => {
    requestAnimationFrame(() => {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailDataUrl = canvas.toDataURL("image/png");
      video.setAttribute("poster", thumbnailDataUrl);

      video.currentTime = currentTime;
      onUpdate?.();
    });
  };

  if (video.readyState >= 2) {
    video.currentTime = Math.min(1, video.duration / 10);
    capture();
  } else {
    video.addEventListener(
      "loadeddata",
      () => {
        video.currentTime = Math.min(1, video.duration / 10);
        capture();
      },
      { once: true },
    );
  }
};

const VideoEditor = ({
  selectedElement,
  onUpdate,
  onPopupPreviewUpdate,
  currentPageVId,
  flipbookVId,
  folderName,
  flipbookName,
  activePopupElement,
  onPopupUpdate,
  TextEditorComponent,
  ImageEditorComponent,
  VideoEditorComponent,
  GifEditorComponent,
  IconEditorComponent,
  showInteraction = true,
  pages
}) => {
  const { v_id: paramVId } = useParams();
  // Use either the prop or the URL param, with priority to the prop from MainEditor
  const activeVId = flipbookVId || paramVId;

  const fileInputRef = useRef(null);
  const [openGallery, setOpenGallery] = useState(false);
  const [tab, setTab] = useState("gallery");
  const coverInputRef = useRef(null);
  const [previewSrc, setPreviewSrc] = useState(null);
  const [posterSrc, setPosterSrc] = useState(null);
  const [videoType, setVideoType] = useState("fit");
  const [showVideoTypeDropdown, setShowVideoTypeDropdown] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [loop, setLoop] = useState(false);
  // Accordian State: 'main' or 'interaction' or null
  const [activeSection, setActiveSection] = useState('main');
  const isMainPanelOpen = activeSection === 'main';

  // Stabilize onUpdate with a ref to prevent infinite loops during parent re-renders
  const onUpdateRef = useRef(onUpdate);
  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  const toggleMainPanel = () => {
    setActiveSection(activeSection === 'main' ? null : 'main');
  };

  // Memoize the debounced update function
  const debouncedUpdate = useMemo(
    () => debounce((...args) => onUpdateRef.current?.(...args), 150),
    [],
  );

  // Memoize static gallery previews - this prevents re-creation on every render
  const galleryPreviews = useMemo(
    () => [
      "https://www.abcconsultants.in/wp-content/uploads/2023/07/Industrial.jpg",
      "https://www.shutterstock.com/image-photo/engineers-discussing-project-outdoors-industrial-260nw-2624485537.jpg",
      "https://thumbs.dreamstime.com/b/professional-people-workers-working-modern-technology-robotic-industry-automation-manufacturing-engineer-robot-arm-assembly-413769130.jpg",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSjnXGV5m5a_3qpSA5aZOiTI2cxP12fiECP7A&s",
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR2X_82Pzp2MyE0HXq_4QFvxUkjSlLByIkpdg&s",
      "https://7409217.fs1.hubspotusercontent-na1.net/hubfs/7409217/Imported_Blog_Media/10556694-scaled.jpg",
    ],
    [],
  );

  // Consolidate all element sync into one effect
  useEffect(() => {
    if (!selectedElement) {
      setPreviewSrc(null);
      setPosterSrc(null);
      return;
    }

    // Update preview source
    if (selectedElement.tagName === "VIDEO") {
      const src =
        selectedElement.currentSrc ||
        selectedElement.src ||
        selectedElement.querySelector("source")?.src ||
        null;
      setPreviewSrc(src);
      setPosterSrc(selectedElement.poster || null);

      // controls must be enabled for hover to work
      selectedElement.controls = true;
      // always hide by default
      selectedElement.classList.add("hide-controls");
      
      // Sync local state
      setAutoplay(selectedElement.autoplay);
      setLoop(selectedElement.loop);
      setVideoType(selectedElement.style.objectFit === 'fill' ? 'fill' : 'fit');
    } else if (selectedElement.tagName === "IFRAME") {
      setPreviewSrc(selectedElement.src || null);
      setPosterSrc(null);
    } else {
      setPreviewSrc(null);
      setPosterSrc(null);
    }
  }, [selectedElement]);

  // Memoize replaceTemplateWithUrl to prevent re-creation
  const replaceTemplateWithUrl = useCallback(
    (url) => {
      if (!selectedElement || !url) return;
      const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
      const isDirectVideo = url.match(/\.(mp4|webm|ogg)$/i);
      let newElement;

      if (isYouTube) {
        let embedUrl = url;
        if (url.includes("watch?v="))
          embedUrl = `https://www.youtube.com/embed/${url.split("v=")[1]}`;
        if (url.includes("youtu.be"))
          embedUrl = `https://www.youtube.com/embed/${url.split("/").pop()}`;
        newElement = document.createElement("iframe");
        newElement.src = embedUrl;
        newElement.allow =
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
        newElement.allowFullscreen = true;
      } else if (isDirectVideo) {
        newElement = document.createElement("video");
        newElement.src = url;
        newElement.controls = true;
      } else {
        newElement = document.createElement("iframe");
        newElement.src = url;
        newElement.allowFullscreen = true;
      }

      // Get computed styles and dimensions from original element
      const computedStyle = window.getComputedStyle(selectedElement);
      const width =
        selectedElement.getAttribute("width") ||
        selectedElement.style.width ||
        computedStyle.width ||
        "560px";
      const height =
        selectedElement.getAttribute("height") ||
        selectedElement.style.height ||
        computedStyle.height ||
        "315px";

      // Copy all inline styles from selectedElement to newElement
      newElement.style.cssText = selectedElement.style.cssText;
      // Set width and height as both HTML attributes and CSS styles
      newElement.setAttribute("width", width);
      newElement.setAttribute("height", height);
      newElement.style.width = width;
      newElement.style.height = height;
      newElement.style.display = computedStyle.display || "block";
      // Copy className for any CSS class styling
      newElement.className = selectedElement.className;
      // Copy data attributes
      Array.from(selectedElement.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-")) {
          newElement.setAttribute(attr.name, attr.value);
        }
      });
      selectedElement.replaceWith(newElement);
      debouncedUpdate({ newElement });
    },
    [selectedElement, debouncedUpdate],
  );

  // Memoize toggleAttribute to prevent re-creation
  const toggleAutoplay = useCallback(() => {
    setAutoplay((prev) => {
      const next = !prev;

      debouncedUpdate({
        autoplay: next,
        muted: next, // 🔥 important
      });

      if (!next) setLoop(false);
      return next;
    });
  }, [debouncedUpdate]);

  const toggleLoop = useCallback(() => {
    if (!autoplay) return;
    setLoop((prev) => {
        const next = !prev;
        debouncedUpdate({ loop: next });
        return next;
    });
  }, [autoplay, debouncedUpdate]);

  // Sync autoplay and loop attributes on the video element
  useEffect(() => {
    if (selectedElement?.tagName === "VIDEO") {
      selectedElement.autoplay = autoplay;
      selectedElement.loop = loop;

      if (autoplay) {
        selectedElement.muted = true; // 🔥 REQUIRED
        selectedElement.setAttribute("muted", "");
        selectedElement.play().catch(() => {});
      } else {
        selectedElement.pause();
      }

      // 🔥 persist attributes for preview page
      if (autoplay) selectedElement.setAttribute("autoplay", "");
      else selectedElement.removeAttribute("autoplay");

      if (loop) selectedElement.setAttribute("loop", "");
      else selectedElement.removeAttribute("loop");
    }
  }, [autoplay, loop, selectedElement]);

  // Handle video type change (fit, fill, crop)
  const handleVideoTypeChange = useCallback(
    (type) => {
      setVideoType(type);
      if (selectedElement?.tagName === "VIDEO") {
        const fitMap = {
          fit: "contain",
          fill: "fill"
        };
        selectedElement.style.objectFit = fitMap[type] || "contain";
        debouncedUpdate();
      }
    },
    [selectedElement, debouncedUpdate],
  );
  // Memoize hasAttribute to prevent re-creation
  const hasAttribute = useCallback(
    (attr) => selectedElement?.hasAttribute(attr),
    [selectedElement],
  );

  // Memoize handleVideoUpload to prevent re-creation
  const handleVideoUpload = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file || !selectedElement) return;

      // Use Object URL for better performance (immediate preview)
      const videoURL = URL.createObjectURL(file);

      if (selectedElement.tagName === "VIDEO") {
        const existingFileVid = selectedElement.dataset.fileVid;

        selectedElement.src = videoURL;
        selectedElement.setAttribute("data-filename", file.name);
        const source = selectedElement.querySelector("source");
        if (source) source.src = videoURL;
        selectedElement.load();

        // Update preview immediately
        setPreviewSrc(videoURL);
        debouncedUpdate({ newElement: selectedElement });

        // Upload to Backend
        const storedUser = localStorage.getItem('user');
        // Require either a v_id or the folder/name metadata to perform upload
        if (storedUser && (activeVId || (folderName && flipbookName))) {
            const user = JSON.parse(storedUser);
            const formData = new FormData();
            formData.append('emailId', user.emailId);
            if (activeVId) formData.append('v_id', activeVId);
            if (folderName) formData.append('folderName', folderName);
            if (flipbookName) formData.append('flipbookName', flipbookName);
            
            formData.append('type', 'video');
            formData.append('page_v_id', currentPageVId || 'global');
            
            if (existingFileVid) {
                formData.append('replacing_file_v_id', existingFileVid);
            }
            // Append file LAST
            formData.append('file', file);

            try {
                const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
                const res = await axios.post(`${backendUrl}/api/flipbook/upload-asset`, formData);

                if (res.data.url) {
                    const serverUrl = `${backendUrl}${res.data.url}`;
                    selectedElement.src = serverUrl;
                    selectedElement.dataset.fileVid = res.data.file_v_id;
                    if (source) source.src = serverUrl;
                    
                    // Update persistent state with the Permanent URL
                    debouncedUpdate({ newElement: selectedElement });
                    console.log("Video uploaded successfully:", serverUrl);
                }
            } catch (err) {
                console.error("Video upload failed detail:", err.response?.data || err);
                const msg = err.response?.data?.message || "Internal server error";
                alert(`Failed to upload video: ${msg}`);
            }
        } else {
            console.warn("Skipping backend upload: Missing project metadata (v_id or name/folder)");
        }
      }
    },
    [selectedElement, debouncedUpdate, activeVId, currentPageVId, folderName, flipbookName],
  );

  // Memoize handleCoverUpload to prevent re-creation
  const handleCoverUpload = useCallback(
    (e) => {
      const file = e.target.files?.[0];
      if (!file || !selectedElement) return;

      if (selectedElement.tagName !== "VIDEO") {
        alert("Cover image works only for video files");
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target.result;

        // set poster on video
        selectedElement.poster = result;

        // update UI preview
        setPosterSrc(result);

        // persist in editor state
        debouncedUpdate({
          poster: result,
        });
      };

      reader.readAsDataURL(file);
    },
    [selectedElement, debouncedUpdate],
  );

  // Memoize autoPickThumbnailFromVideo callback
  const handleAutoPickThumbnail = useCallback(() => {
    if (!selectedElement || selectedElement.tagName !== "VIDEO") return;

    // ensure metadata is loaded
    if (selectedElement.readyState < 2) {
      selectedElement.onloadeddata = () => handleAutoPickThumbnail();
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = selectedElement.videoWidth;
    canvas.height = selectedElement.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(selectedElement, 0, 0, canvas.width, canvas.height);

    const thumbnail = canvas.toDataURL("image/png");

    // 🔥 FIX poster on video
    selectedElement.poster = thumbnail;

    // 🔥 update UI preview box
    setPosterSrc(thumbnail);

    // 🔥 persist in editor/store
    debouncedUpdate({
      poster: thumbnail,
    });
  }, [selectedElement, debouncedUpdate]);

  // Early return if no element is selected
  if (!selectedElement) {
    return (
      <div className="border border-gray-200 rounded-[0.5vw] overflow-hidden bg-white shadow-sm p-[1vw] text-center text-gray-400 text-[0.75vw]">
        <VideoIcon className="mx-auto mb-[0.5vw]" size="0.9vw" />
        <p>Click on a video to edit</p>
      </div>
    );
  }

  return (
    <>
      <div className="border border-gray-200 rounded-[0.75vw] bg-white shadow-sm mb-[1vw]">
        {/* SECTION HEADER WITH TOGGLE */}
        <div
          className={`flex items-center justify-between px-[1vw] py-[1vw] border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors ${
            isMainPanelOpen ? "rounded-t-[0.75vw]" : "rounded-[0.75vw]"
          }`}
          onClick={toggleMainPanel}
        >
          <div className="flex items-center gap-[0.5vw]">
            <Video size="1vw" className="text-gray-600" />
            <span className="font-semibold text-gray-900 text-[0.85vw]">Video</span>
          </div>

          <ChevronUp
            size="1vw"
            className={`text-gray-500 transition-transform duration-200 ${
              isMainPanelOpen ? "" : "rotate-180"
            }`}
          />
        </div>

        {/* COLLAPSIBLE CONTENT */}
        {isMainPanelOpen && (
               <div className="space-y-[1.2vw] px-[1vw] mb-[1.5vw] pt-[1vw] ">
            <div className="space-y-[1vw]">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[0.85vw] text-gray-900 whitespace-nowrap">
                  Upload your Video 
                </span>
                <div className="h-px flex-grow bg-gradient-to-r from-gray-200 via-gray-100 to-transparent" />
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4"
                onChange={handleVideoUpload}
                className="hidden"
              />
              <input
                ref={coverInputRef}
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleCoverUpload}
              />

              {/* SELECT VIDEO TYPE DROPDOWN */}
              <div className="flex items-center justify-between relative z-20 mb-[1vw]">
                <span className="text-[0.75vw] font-bold text-gray-700">
                  Select the Video type :
                </span>
                <div className="relative">
                  <button
                    onClick={() =>
                      setShowVideoTypeDropdown(!showVideoTypeDropdown)
                    }
                    onBlur={() =>
                      setTimeout(() => setShowVideoTypeDropdown(false), 200)
                    }
                    className="flex items-center justify-between w-[7vw] px-[0.75vw] py-[0.5vw] bg-white border border-gray-200 rounded-[0.6vw] shadow-sm hover:bg-gray-50 transition-colors"
                  >
                    <span className="text-[0.75vw] font-bold text-gray-700 capitalize">
                      {videoType}
                    </span>
                    <ChevronDown size="0.75vw" className="text-gray-400" />
                  </button>

                  {showVideoTypeDropdown && (
                    <div className="absolute right-0 top-full mt-[0.5vw] w-[7vw] bg-white border border-gray-100 rounded-[0.6vw] shadow-xl overflow-hidden z-50 flex flex-col py-[0.25vw] animate-in fade-in zoom-in-95 duration-100">
                      {["Fit", "Fill"].map((type) => (
                        <button
                          key={type}
                          onClick={() => {
                            handleVideoTypeChange(type.toLowerCase());
                            setShowVideoTypeDropdown(false);
                          }}
                          className="px-[1vw] py-[0.5vw] text-[0.75vw] font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition-colors text-center"
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Area */}
              <div className="flex gap-[0.75vw] items-center">
                {/* Video Preview Thumbnail */}
                <div className="relative w-[5vw] h-[4vw] border-[0.1vw] border-gray-200 rounded-[0.5vw] overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
                  {previewSrc ? (
                    <>
                      <video
                        src={previewSrc}
                        className="w-full h-full object-cover"
                        muted
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="w-[2vw] h-[2vw] bg-white/90 rounded-full flex items-center justify-center">
                          <Play size="0.8vw" className="text-gray-800 ml-[0.1vw]" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-[0.7vw] text-gray-400">No Video</div>
                  )}
                </div>

                {/* Replace Icon */}
                <div className="text-gray-300">
                  <Replace size="1vw" />
                </div>

                {/* Upload Drop Zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 h-[4vw] border-[0.1vw] border-dashed border-gray-300 rounded-[0.5vw] cursor-pointer flex flex-col items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition bg-white"
                >
                  <Upload size="0.9vw" className="mb-[0.1vw]" />
                  <p className="text-[0.7vw]">
                    Drag &{" "}
                    <span className="text-indigo-600 font-medium">Upload</span>
                  </p>
                </div>
              </div>

              <p className="text-[0.7vw] text-gray-400 text-right">
                Supported File Format : MP4
              </p>
            </div>

            {/* OR Divider */}
            <div className="flex items-center gap-[0.75vw] py-[0.25vw]">
              <div className="flex-1 h-px bg-gray-200" />
              <span className="text-[0.7vw] text-gray-400 font-medium">OR</span>
              <div className="flex-1 h-px bg-gray-200" />
            </div>

            {/* URL Input */}
            <div className="flex items-center gap-[0.5vw]">
              <label className="text-[0.75vw] text-gray-700 font-medium whitespace-nowrap">
                URL :
              </label>
              <input
                type="text"
                placeholder="https://"
                className="flex-1 px-[0.75vw] py-[0.5vw] border border-gray-300 rounded-[0.5vw] text-[0.75vw] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                onBlur={(e) => replaceTemplateWithUrl(e.target.value)}
              />
            </div>

            {/* GALLERY PREVIEW BOX */}
            <div
              onClick={() => setOpenGallery(true)}
              className="relative w-full h-[7vw] border border-gray-200 rounded-[0.5vw] cursor-pointer overflow-hidden bg-gray-100 mt-[0.5vw]"
            >
              {/* Preview thumbnails */}
              <div className="absolute inset-0 grid grid-cols-3 gap-[0.1vw] p-[0.25vw]">
                {galleryPreviews.slice(0, 3).map((src, i) => (
                  <div key={i} className="relative overflow-hidden rounded-[0.3vw]">
                    <img
                      src={src}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40" />
                    <div className="absolute bottom-[0.25vw] left-[0.25vw] right-[0.25vw] text-[0.5vw] text-white text-center truncate">
                      {i === 0
                        ? "Gaming Monster"
                        : i === 1
                          ? "Letter Mockup"
                          : "Outdoor"}
                    </div>
                  </div>
                ))}
              </div>

              {/* Overlay content */}
              <div className="relative z-10 flex flex-col items-center justify-center h-full bg-gradient-to-t from-black/70 to-black/30">
                <div className="flex items-center gap-[0.5vw] text-white bg-black/40 px-[1vw] py-[0.5vw] rounded-[0.5vw] backdrop-blur-sm">
                  <VideoIcon size="0.9vw" />
                  <p className="text-[0.8vw] font-semibold">Video Gallery</p>
                </div>
              </div>
            </div>

            {/* Video Playback Settings */}
            <div className="pt-[1vw] space-y-[0.75vw]">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[0.85vw] text-gray-900 whitespace-nowrap">
                  Video Playback Settings
                </span>
                <div className="h-px flex-grow bg-gradient-to-r from-gray-200 via-gray-100 to-transparent" />
              </div>

              <div className="space-y-[0.75vw]">
                <div className="flex items-center justify-between">
                  <p className="text-[0.75vw] text-gray-700">
                    AutoPlay (Play video automatically)
                  </p>
                  <button
                    onClick={toggleAutoplay}
                    className={`w-[2.5vw] h-[1.25vw] flex items-center rounded-full p-[0.25vw] transition ${
                      autoplay ? "bg-indigo-600" : "bg-gray-300"
                    }`}
                  >
                    <div
                      className={`w-[1vw] h-[1vw] bg-white rounded-full shadow-sm transition-transform ${
                        autoplay ? "translate-x-[1vw]" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-[0.75vw] text-gray-700">
                    Loop (Repeat video continuously)
                  </p>
                  <button
                    onClick={toggleLoop}
                    disabled={!autoplay}
                    className={`w-[2.5vw] h-[1.25vw] flex items-center rounded-full p-[0.25vw] transition ${
                      loop ? "bg-indigo-600" : "bg-gray-300"
                    } ${!autoplay && "opacity-50 cursor-not-allowed"}`}
                  >
                    <div
                      className={`w-[1vw] h-[1vw] bg-white rounded-full transition-transform ${
                        loop ? "translate-x-[1vw]" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* Cover Image Upload Options */}
            <div className="pt-[1vw] space-y-[0.75vw]">
              <div className="flex items-center gap-2.5">
                <span className="font-semibold text-[0.85vw] text-gray-900 whitespace-nowrap">
                  Cover Image Upload Options
                </span>
                <div className="h-px flex-grow bg-gradient-to-r from-gray-200 via-gray-100 to-transparent" />
              </div>

              <div className="flex items-start justify-between gap-[1vw]">
                {/* Radio Options */}
                <div className="space-y-[0.75vw] flex-1">
                  <label className="flex items-center gap-[0.5vw] cursor-pointer group">
                    <input
                      type="radio"
                      name="cover"
                      onChange={() => coverInputRef.current?.click()}
                      className="w-[1vw] h-[1vw] text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-[0.75vw] text-gray-700 group-hover:text-gray-900">
                      Upload from your File
                    </span>
                  </label>

                  <label className="flex items-center gap-[0.5vw] cursor-pointer group">
                    <input
                      type="radio"
                      name="cover"
                      defaultChecked
                      onChange={handleAutoPickThumbnail}
                      className="w-[1vw] h-[1vw] text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="text-[0.75vw] text-gray-700 group-hover:text-gray-900">
                      Auto Pick from video
                    </span>
                  </label>
                </div>

                {/* Upload Box */}
                <div
                  onClick={() => coverInputRef.current?.click()}
                  className="w-[7vw] h-[5vw] border-[0.1vw] border-dashed border-gray-300 rounded-[0.5vw] flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 transition overflow-hidden bg-white"
                >
                  {posterSrc ? (
                    <img
                      src={posterSrc}
                      alt="Video Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-gray-400 hover:text-indigo-500">
                      <Upload size="0.8vw" className="mb-[0.25vw]" />
                      <p className="text-[0.6vw] text-center px-[0.5vw]">
                        File Format : JPG, PNG
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* GALLERY MODAL */}
        {openGallery && (
          <VideoGalleryModal
            tab={tab}
            setTab={setTab}
            selectedElement={selectedElement}
            onUpdate={onUpdate}
            onClose={() => setOpenGallery(false)}
            currentPageVId={currentPageVId}
            flipbookVId={activeVId}
            folderName={folderName}
            flipbookName={flipbookName}
          />
        )}
      </div>

      {/* INTERACTION PANEL */}
      {showInteraction && (
        <InteractionPanel
          selectedElement={selectedElement}
          onUpdate={onUpdate}
          onPopupPreviewUpdate={onPopupPreviewUpdate}
          pages={pages}
          activePopupElement={activePopupElement}
          onPopupUpdate={onPopupUpdate}
          TextEditorComponent={TextEditorComponent}
          ImageEditorComponent={ImageEditorComponent}
          VideoEditorComponent={VideoEditorComponent || VideoEditor}
          GifEditorComponent={GifEditorComponent}
          IconEditorComponent={IconEditorComponent}
          isOpen={activeSection === 'interaction'}
          onToggle={() => setActiveSection(activeSection === 'interaction' ? null : 'interaction')}
        />
      )}
    </>
  );
};

export default VideoEditor;