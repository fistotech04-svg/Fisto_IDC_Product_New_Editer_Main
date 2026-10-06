export const getVideoControlsScript = () => `  <script>
    (function() {
      // Inject global styles for the progress bar thumb
      const thumbStyleId = 'global-custom-video-progress-style';
      if (!document.getElementById(thumbStyleId)) {
        const ts = document.createElement('style');
        ts.id = thumbStyleId;
        ts.textContent = \`
          input.custom-video-progress {
            -webkit-appearance: none !important;
            appearance: none !important;
            accent-color: transparent !important;
          }
          input.custom-video-progress::-webkit-slider-thumb {
            -webkit-appearance: none !important;
            appearance: none !important;
            width: 6px !important;
            height: 6px !important;
            border-radius: 50% !important;
            background: #ffffff !important;
            cursor: pointer !important;
            box-shadow: none !important;
            border: none !important;
            margin-top: -2.5px !important;
          }
          input.custom-video-progress::-moz-range-thumb {
            width: 6px !important;
            height: 6px !important;
            border-radius: 50% !important;
            background: #ffffff !important;
            cursor: pointer !important;
            border: none !important;
            box-shadow: none !important;
          }
          input.custom-video-progress::-webkit-slider-runnable-track {
            height: 1px !important;
            background: rgba(255,255,255,0.4) !important;
            border-radius: 1px !important;
          }
          .custom-video-overlay button {
            font-size: inherit !important;
          }
          .custom-video-overlay {
            opacity: 0;
            background: transparent;
            transition: opacity 0.3s ease, background 0.3s ease !important;
          }
          .custom-video-overlay.is-paused,
          .custom-video-overlay.video-is-hovered,
          [id]:hover > .custom-video-overlay,
          [id]:hover > foreignObject > .custom-video-overlay,
          foreignObject:hover > .custom-video-overlay,
          .custom-video-overlay:hover {
            opacity: 1 !important;
            background: linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%) !important;
          }
        \`;
        document.head.appendChild(ts);
      }

      const renderVideoControls = () => {
        document.querySelectorAll('video').forEach(v => {
          if (!v.hasAttribute('data-custom-ctrl-active')) {
            v.controls = false;
            v.removeAttribute('controls');
          }
        });

        const videos = document.querySelectorAll('video');
        videos.forEach(video => {
          const fo = video.closest('foreignObject');
          const liveEl = fo ? (fo.closest('[id]') || fo) : (video.closest('[id]') || video);
          const layerId = liveEl.id;
          if (!layerId) return;

          const showControls = video.getAttribute('data-show-controls') !== 'false';
          
          const pbSpeedStr = video.getAttribute('data-playback-speed');
          if (pbSpeedStr) {
             const pbSpeed = parseFloat(pbSpeedStr.replace('x', ''));
             if (!isNaN(pbSpeed)) video.playbackRate = pbSpeed;
          }

          if (!video.hasAttribute('data-video-props-applied')) {
              video.setAttribute('data-video-props-applied', 'true');
              const defVolStr = video.getAttribute('data-default-volume');
              if (defVolStr) {
                  video.volume = parseInt(defVolStr) / 100;
              }

              const startTimeAttr = video.getAttribute('data-start-time');
              let sTime = 0;
              if (startTimeAttr) {
                const parts = startTimeAttr.split(':').map(Number);
                if (parts.length === 3) sTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) sTime = parts[0] * 60 + parts[1];
              }
              const endTimeAttr = video.getAttribute('data-end-time');
              let eTime = Infinity;
              if (endTimeAttr) {
                const parts = endTimeAttr.split(':').map(Number);
                if (parts.length === 3) eTime = parts[0] * 3600 + parts[1] * 60 + parts[2];
                else if (parts.length === 2) eTime = parts[0] * 60 + parts[1];
              }
              video._startTime = sTime;
              video._endTime = eTime;
              
              if (sTime > 0) video.currentTime = sTime;

              video.addEventListener('timeupdate', () => {
                 if (video._startTime > 0 && video.currentTime < video._startTime - 0.5) video.currentTime = video._startTime;
                 if (video._endTime < Infinity && video.currentTime >= video._endTime) {
                     if (video.loop) video.currentTime = video._startTime;
                     else video.pause();
                 }
              });
              
              const resumeBehavior = video.getAttribute('data-resume-behavior');
              if (resumeBehavior === "Start from Beginning") {
                  video.addEventListener('play', () => {
                      if (video._wasPaused) video.currentTime = video._startTime || 0;
                      video._wasPaused = false;
                  });
                  video.addEventListener('pause', () => { video._wasPaused = true; });
              }

              const playVideoWhile = video.getAttribute('data-play-video-while');
              if (video._prevPlayVideoWhile !== playVideoWhile) {
                  video._prevPlayVideoWhile = playVideoWhile;
                  if (playVideoWhile === "Auto Play While on Page" || playVideoWhile === "Auto Play on Page Open") {
                      video.play().catch(()=>{});
                  } else if (playVideoWhile === "Click to Play" || playVideoWhile === "Manual (Click to Play)") {
                      video.pause();
                  }
              }
          }

          const ctrlId = \`custom-ctrl-\${layerId}\`;
          let bar = document.getElementById(ctrlId);

          const mountPoint = video.parentElement || fo || liveEl;
          if (!mountPoint) return;

          if (bar && bar._video !== video) {
            if (bar._cleanup) bar._cleanup();
            bar.remove();
            bar = null;
          }

          if (bar) {
            const repBtn = bar.querySelector('.custom-repeat-btn');
            if (repBtn) repBtn.style.opacity = video.loop ? '1' : '0.5';
            
            const volBtn = bar.querySelector('.custom-vol-btn');
            const rewindBtn = bar.querySelector('.custom-rewind-btn');
            const forwardBtn = bar.querySelector('.custom-forward-btn');
            const playBtn = bar.querySelector('.custom-play-btn');
            const fsBtn = bar.querySelector('.custom-fs-btn');
            const dlBtn = bar.querySelector('.custom-download-btn');
            const progC = bar.querySelector('.custom-prog-container');

            const showPlayPause = video.getAttribute('data-show-play-pause') !== 'false';
            const showSkipButton = video.getAttribute('data-show-skip-button') !== 'false';
            const showProgressBar = video.getAttribute('data-show-progress-bar') !== 'false';
            const showLoopButton = video.getAttribute('data-show-loop-button') !== 'false';
            const showFullscreenButton = video.getAttribute('data-show-fullscreen-button') !== 'false';
            const showVolumeControl = video.getAttribute('data-show-volume-control') !== 'false';
            const showDownloadButton = video.getAttribute('data-show-download-button') !== 'false';

            if (volBtn) volBtn.style.display = showVolumeControl ? '' : 'none';
            if (rewindBtn) rewindBtn.style.display = showSkipButton ? 'flex' : 'none';
            if (forwardBtn) forwardBtn.style.display = showSkipButton ? 'flex' : 'none';
            if (playBtn) playBtn.style.display = showPlayPause ? '' : 'none';
            if (repBtn) repBtn.style.display = showLoopButton ? '' : 'none';
            if (fsBtn) fsBtn.style.display = showFullscreenButton ? '' : 'none';
            if (dlBtn) dlBtn.style.display = showDownloadButton ? '' : 'none';
            if (progC) progC.style.display = showProgressBar ? '' : 'none';
            
            const showControls = video.getAttribute('data-show-controls') !== 'false';
            bar.style.display = (showControls || showPlayPause || showFullscreenButton || showDownloadButton) ? 'flex' : 'none';
          }

          if (!bar) {
            video.controls = false;
            video.removeAttribute('controls');
            video.setAttribute('data-custom-ctrl-active', 'true');

            if (mountPoint.style) {
              mountPoint.style.position = 'relative';
              if (!mountPoint._prevPointerEvents) mountPoint._prevPointerEvents = mountPoint.style.pointerEvents || '';
              mountPoint.style.pointerEvents = 'none';
            }

            if (!window._videoHoverTrackerAdded) {
              window._videoHoverTrackerAdded = true;
              window.addEventListener('pointermove', (e) => {
                document.querySelectorAll('.custom-video-overlay').forEach(b => {
                  const rect = b.getBoundingClientRect();
                  const isInside = e.clientX >= rect.left && e.clientX <= rect.right &&
                    e.clientY >= rect.top && e.clientY <= rect.bottom;
                  if (isInside) b.classList.add('video-is-hovered');
                  else b.classList.remove('video-is-hovered');
                });
              });
            }

            bar = document.createElement('div');
            bar.id = ctrlId;
            bar._video = video;
            bar.className = 'custom-video-overlay' + (video.paused ? ' is-paused' : '');
            Object.assign(bar.style, {
              position: 'absolute', top: '0', bottom: '0', left: '0', right: '0', display: 'flex', flexDirection: 'column',
              justifyContent: 'space-between', padding: '2% 3%', boxSizing: 'border-box', zIndex: '9999',
              pointerEvents: 'none', background: 'linear-gradient(180deg, rgba(0,0,0,0.9) 100%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.9) 100%)'
            });

            // Calculate base width in SVG user units
            let baseW = 500; // safe fallback
            if (fo && fo.width && fo.width.baseVal) {
               baseW = fo.width.baseVal.value;
            } else if (fo && fo.hasAttribute('width')) {
               baseW = parseFloat(fo.getAttribute('width'));
            } else if (video.hasAttribute('width')) {
               baseW = parseFloat(video.getAttribute('width'));
            } else if (fo && fo.style && fo.style.width && fo.style.width.endsWith('px')) {
               baseW = parseFloat(fo.style.width);
            }
            
            if (baseW > 0) {
              bar.style.fontSize = (baseW * 0.01) + 'px';
            }

            const topContainer = document.createElement('div');
            topContainer.className = 'custom-top-container';
            Object.assign(topContainer.style, { display: 'flex', justifyContent: 'flex-end', width: '100%', pointerEvents: 'none' });

            const volumeBtn = document.createElement('button');
            volumeBtn.className = 'custom-vol-btn';
            Object.assign(volumeBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '7em', height: '7em', pointerEvents: 'auto', opacity: '0.8' });

            const VOL_ON_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path><path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>\`;
            const VOL_OFF_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>\`;

            const updateVolumeIcon = () => { volumeBtn.innerHTML = (video.muted || video.volume === 0) ? VOL_OFF_SVG : VOL_ON_SVG; };
            updateVolumeIcon();
            volumeBtn.onclick = (e) => { e.stopPropagation(); video.muted = !video.muted; updateVolumeIcon(); };
            video.addEventListener('volumechange', updateVolumeIcon);
            topContainer.appendChild(volumeBtn);

            const centerContainer = document.createElement('div');
            centerContainer.className = 'custom-center-container';
            Object.assign(centerContainer.style, { display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', padding: '0 2%', flexGrow: '1', pointerEvents: 'none', boxSizing: 'border-box' });

            const REWIND_ICON = \`<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="11 17 6 12 11 7"></polyline><polyline points="18 17 13 12 18 7"></polyline></svg>\`;
            const FORWARD_ICON = \`<svg width="5em" height="5em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink: 0;"><polyline points="13 17 18 12 13 7"></polyline><polyline points="6 17 11 12 6 7"></polyline></svg>\`;

            const rewindBtn = document.createElement('button');
            rewindBtn.className = 'custom-rewind-btn';
            Object.assign(rewindBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative' });
            const rewindTextWrapper = document.createElement('div');
            Object.assign(rewindTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginLeft: '0.5em' });
            const rewindText = document.createElement('div');
            rewindText.textContent = "3s";
            Object.assign(rewindText.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            rewindTextWrapper.appendChild(rewindText);
            rewindBtn.innerHTML = REWIND_ICON;
            rewindBtn.appendChild(rewindTextWrapper);
            rewindBtn.onclick = (e) => { e.stopPropagation(); video.currentTime -= 3; };

            const forwardBtn = document.createElement('button');
            forwardBtn.className = 'custom-forward-btn';
            Object.assign(forwardBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', display: 'flex', alignItems: 'center', pointerEvents: 'auto', opacity: '0.9', whiteSpace: 'nowrap', position: 'relative' });
            const forwardTextWrapper = document.createElement('div');
            Object.assign(forwardTextWrapper.style, { width: '2.5em', height: '5em', position: 'relative', flexShrink: '0', marginRight: '0.5em' });
            const forwardText = document.createElement('div');
            forwardText.textContent = "3s";
            Object.assign(forwardText.style, { position: 'absolute', top: '50%', left: '50%', width: 'max-content', fontSize: '10em', transform: 'translate(-50%, -50%) scale(0.35)', transformOrigin: 'center center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            forwardTextWrapper.appendChild(forwardText);
            forwardBtn.appendChild(forwardTextWrapper);
            forwardBtn.insertAdjacentHTML('beforeend', FORWARD_ICON);
            forwardBtn.onclick = (e) => { e.stopPropagation(); video.currentTime += 3; };

            centerContainer.appendChild(rewindBtn);
            centerContainer.appendChild(forwardBtn);

            const bottomContainer = document.createElement('div');
            Object.assign(bottomContainer.style, { display: 'flex', alignItems: 'center', width: '100%', gap: '2em', pointerEvents: 'none', paddingBottom: '2%', paddingLeft: '2%', paddingRight: '2%', boxSizing: 'border-box' });

            const PLAY_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>\`;
            const PAUSE_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>\`;

            const playBtn = document.createElement('button');
            playBtn.className = 'custom-play-btn';
            Object.assign(playBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: "8em", height: "8em", pointerEvents: 'auto', flexShrink: '0' });

            const onPlay = () => { playBtn.innerHTML = PAUSE_SVG; bar.classList.remove('is-paused'); };
            const onPause = () => { playBtn.innerHTML = PLAY_SVG; bar.classList.add('is-paused'); };
            playBtn.innerHTML = video.paused ? PLAY_SVG : PAUSE_SVG;
            video.addEventListener('play', onPlay);
            video.addEventListener('pause', onPause);
            playBtn.onclick = (e) => { e.stopPropagation(); video.paused ? video.play() : video.pause(); };

            const progContainer = document.createElement('div');
            progContainer.className = 'custom-prog-container';
            Object.assign(progContainer.style, { flexGrow: '1', height: '1.2em', background: 'rgba(255,255,255,0.3)', position: 'relative', cursor: 'pointer', pointerEvents: 'auto', borderRadius: '0.2em' });

            const timeWrapper = document.createElement('div');
            timeWrapper.className = 'custom-time-wrapper';
            Object.assign(timeWrapper.style, { position: 'relative', width: '23em', height: '8em', flexShrink: '0', marginLeft: '1em' });

            const timeDisplay = document.createElement('div');
            Object.assign(timeDisplay.style, { position: 'absolute', top: '50%', left: '0', width: 'max-content', fontSize: '10em', transform: 'translateY(-50%) scale(0.35)', transformOrigin: 'left center', fontFamily: 'Inter, sans-serif', color: 'white', whiteSpace: 'nowrap', pointerEvents: 'none' });
            timeDisplay.textContent = "00:00 / 00:00";
            timeWrapper.appendChild(timeDisplay);

            const progFill = document.createElement('div');
            Object.assign(progFill.style, { position: 'absolute', top: '0', left: '0', bottom: '0', width: '0%', background: 'white', pointerEvents: 'none', borderRadius: '0.2em' });
            progContainer.appendChild(progFill);

            const formatTime = (sec) => {
              if (isNaN(sec)) return "00:00";
              const m = Math.floor(sec / 60).toString().padStart(2, '0');
              const s = Math.floor(sec % 60).toString().padStart(2, '0');
              return \`\${m}:\${s}\`;
            };

            const onTimeUpdate = () => {
              if (video.duration) {
                const pct = (video.currentTime / video.duration) * 100;
                progFill.style.width = \`\${pct}%\`;
                timeDisplay.textContent = \`\${formatTime(video.currentTime)} / \${formatTime(video.duration)}\`;
              }
            };
            video.addEventListener('timeupdate', onTimeUpdate);
            video.addEventListener('loadedmetadata', onTimeUpdate);
            onTimeUpdate();

            progContainer.onpointerdown = (e) => {
              e.stopPropagation();
              const rect = progContainer.getBoundingClientRect();
              const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
              if (video.duration) video.currentTime = pct * video.duration;

              const onMove = (me) => {
                const p = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
                if (video.duration) video.currentTime = p * video.duration;
              };
              const onUp = () => {
                document.removeEventListener('pointermove', onMove);
                document.removeEventListener('pointerup', onUp);
              };
              document.addEventListener('pointermove', onMove);
              document.addEventListener('pointerup', onUp);
            };

            const REPEAT_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"></polyline><path d="M3 11V9a4 4 0 0 1 4-4h14"></path><polyline points="7 23 3 19 7 15"></polyline><path d="M21 13v2a4 4 0 0 1-4 4H3"></path></svg>\`;
            const repeatBtn = document.createElement('button');
            repeatBtn.className = 'custom-repeat-btn';
            Object.assign(repeatBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0', opacity: video.loop ? '1' : '0.5' });
            repeatBtn.innerHTML = REPEAT_SVG;
            repeatBtn.onclick = (e) => {
              e.stopPropagation();
              video.loop = !video.loop;
              if (video.loop) video.setAttribute('loop', ''); else video.removeAttribute('loop');
              repeatBtn.style.opacity = video.loop ? '1' : '0.5';
            };

            const FS_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path></svg>\`;
            const EXIT_FS_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path></svg>\`;
            const DOWNLOAD_SVG = \`<svg width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="0.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>\`;

            const dlBtn = document.createElement('button');
            dlBtn.className = 'custom-download-btn';
            Object.assign(dlBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });
            dlBtn.innerHTML = DOWNLOAD_SVG;
            dlBtn.onclick = async (e) => {
              e.stopPropagation();
              const sourceUrl = video.src || video.querySelector('source')?.src;
              if (sourceUrl) {
                try {
                  dlBtn.style.opacity = '0.5';
                  dlBtn.style.pointerEvents = 'none';
                  const response = await fetch(sourceUrl);
                  const blob = await response.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = blobUrl;
                  a.download = sourceUrl.split('/').pop() || 'video.mp4';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(blobUrl);
                } catch (err) {
                  const a = document.createElement('a');
                  a.href = sourceUrl;
                  a.download = sourceUrl.split('/').pop() || 'video.mp4';
                  a.target = '_blank';
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                } finally {
                  dlBtn.style.opacity = '1';
                  dlBtn.style.pointerEvents = 'auto';
                }
              }
            };

            const fsBtn = document.createElement('button');
            fsBtn.className = 'custom-fs-btn';
            Object.assign(fsBtn.style, { background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0', width: '5em', height: '5em', pointerEvents: 'auto', flexShrink: '0' });

            const updateFsIcon = () => { fsBtn.innerHTML = document.fullscreenElement ? EXIT_FS_SVG : FS_SVG; };
            updateFsIcon();
            document.addEventListener('fullscreenchange', updateFsIcon);

            const fsStyleId = 'custom-fs-style';
            if (!document.getElementById(fsStyleId)) {
              const style = document.createElement('style');
              style.id = fsStyleId;
              style.innerHTML = \`
                foreignObject:fullscreen, foreignObject:-webkit-full-screen, foreignObject:-moz-full-screen { width: 100vw !important; height: 100vh !important; background: black !important; transform: none !important; }
                foreignObject:fullscreen video, foreignObject:-webkit-full-screen video, foreignObject:-moz-full-screen video { width: 100% !important; height: 100% !important; object-fit: contain !important; }
                #temp-fs-wrapper .custom-video-overlay { font-size: 0.3vw !important; }
                #temp-fs-wrapper .custom-video-overlay svg { stroke-width: 2.5 !important; }
                #temp-fs-wrapper .custom-video-overlay .time-display { margin-right: 0 !important; }
              \`;
              document.head.appendChild(style);
            }

            fsBtn.onclick = (e) => {
              e.stopPropagation();
              if (!document.fullscreenElement) {
                const fsWrapper = document.createElement('div');
                fsWrapper.id = 'temp-fs-wrapper';
                Object.assign(fsWrapper.style, { position: 'fixed', top: '0', left: '0', width: '100vw', height: '100vh', background: 'black', zIndex: '999999', display: 'flex', alignItems: 'center', justifyContent: 'center' });

                const vPlaceholder = document.createComment('video-placeholder');
                const bPlaceholder = document.createComment('bar-placeholder');

                video.parentElement.insertBefore(vPlaceholder, video);
                bar.parentElement.insertBefore(bPlaceholder, bar);

                const wasPlaying = !video.paused;

                fsWrapper.appendChild(video);
                fsWrapper.appendChild(bar);
                document.body.appendChild(fsWrapper);

                fsWrapper._vPlaceholder = vPlaceholder;
                fsWrapper._bPlaceholder = bPlaceholder;

                const reqFs = fsWrapper.requestFullscreen || fsWrapper.webkitRequestFullscreen;
                if (reqFs) {
                  reqFs.call(fsWrapper).then(() => {
                    if (wasPlaying) video.play().catch(() => {});
                  }).catch(err => {
                    if (vPlaceholder.parentNode) vPlaceholder.parentNode.insertBefore(video, vPlaceholder);
                    if (bPlaceholder.parentNode) bPlaceholder.parentNode.insertBefore(bar, bPlaceholder);
                    vPlaceholder.remove();
                    bPlaceholder.remove();
                    fsWrapper.remove();
                  });
                }
              } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              }
            };

            const handleFsChange = () => {
              const isFs = !!document.fullscreenElement;
              fsBtn.innerHTML = isFs ? EXIT_FS_SVG : FS_SVG;
              if (!isFs) {
                const fsWrapper = document.getElementById('temp-fs-wrapper');
                if (fsWrapper) {
                  const wasPlaying = !video.paused;
                  const vp = fsWrapper._vPlaceholder;
                  const bp = fsWrapper._bPlaceholder;
                  if (vp && vp.parentNode) { vp.parentNode.insertBefore(video, vp); vp.remove(); }
                  if (bp && bp.parentNode) { bp.parentNode.insertBefore(bar, bp); bp.remove(); }
                  fsWrapper.remove();
                  if (wasPlaying) video.play().catch(() => {});
                }
              }
            };
            handleFsChange();
            document.addEventListener('fullscreenchange', handleFsChange);
            document.addEventListener('webkitfullscreenchange', handleFsChange);

            const disableFullScreen = video.getAttribute('data-disable-fullscreen') === 'true';

            bottomContainer.appendChild(playBtn);
            bottomContainer.appendChild(progContainer);
            bottomContainer.appendChild(timeWrapper);
            bottomContainer.appendChild(repeatBtn);
            bottomContainer.appendChild(dlBtn);
            if (!disableFullScreen) bottomContainer.appendChild(fsBtn);

            bar.appendChild(topContainer);
            bar.appendChild(centerContainer);
            bar.appendChild(bottomContainer);
            mountPoint.appendChild(bar);

            bar._cleanup = () => {
              document.removeEventListener('fullscreenchange', handleFsChange);
              document.removeEventListener('webkitfullscreenchange', handleFsChange);
              if (ro) ro.disconnect();
              video.removeEventListener('play', onPlay);
              video.removeEventListener('pause', onPause);
              video.removeEventListener('timeupdate', onTimeUpdate);
              video.removeEventListener('loadedmetadata', onTimeUpdate);
              video.removeEventListener('volumechange', updateVolumeIcon);
              video.removeAttribute('data-custom-ctrl-active');
              if (mountPoint.style && mountPoint._prevPointerEvents !== undefined) {
                mountPoint.style.pointerEvents = mountPoint._prevPointerEvents;
                delete mountPoint._prevPointerEvents;
              }
            };
          }
        });

        document.querySelectorAll('[id^="custom-ctrl-"]').forEach(bar => {
          const layerId = bar.id.replace('custom-ctrl-', '');
          try {
            const video = document.getElementById(layerId)?.querySelector('video') || document.querySelector(\`[id="\${layerId}"] video\`);
            if (!video || !document.body.contains(video)) {
              if (bar._cleanup) bar._cleanup();
              bar.remove();
            }
          } catch (e) {
            if (bar._cleanup) bar._cleanup();
            bar.remove();
          }
        });
      };

      setInterval(renderVideoControls, 500);
    })();
  </script>
`;
;
export default getVideoControlsScript;
