/**
 * Renders the floating interaction / animation badge directly above selected elements
 * in Interaction and Animation modes.
 */
export const createInteractionBadgeOverlay = ({
  activeTopToolRef,
  activePageIndex,
  setActiveTopTool,
  updateElementAttribute
}) => {
  const drawInteractionBadge = (el, mapped, htmlOverlay, zoomScale, bbox) => {
    const isInteraction = activeTopToolRef.current === 'interaction';
    const isAnimation = activeTopToolRef.current === 'animation';
    if (!isInteraction && !isAnimation) return;
    if (!htmlOverlay) return;
    if (isAnimation && el.getAttribute('data-name') === 'Free Frame') return;

    const badgeId = `interaction-badge-${el.id}`;
    let badge = htmlOverlay.querySelector(`[id="${badgeId}"]`);

    const currentTool = activeTopToolRef.current;
    if (badge && badge.getAttribute('data-tool') !== currentTool) {
      badge.remove();
      badge = null;
    }

    const hasInteract = (el.getAttribute('data-interaction') && el.getAttribute('data-interaction') !== 'none') || el.getAttribute('data-interaction-intent') === 'true';
    const animType = el.getAttribute('data-animation-open-type');
    const interactType = el.getAttribute('data-animation-interact-type');
    const hasAnim = (animType && animType !== 'none') || (interactType && interactType !== 'none') || el.getAttribute('data-animation-intent') === 'true';

    const isAssigned = isInteraction ? hasInteract : hasAnim;

    if (!badge) {
      badge = document.createElement('div');
      badge.id = badgeId;
      badge.setAttribute('data-tool', currentTool);
      badge.className = 'absolute z-[2000] cursor-pointer flex flex-col items-center group/badge pointer-events-auto';

      const mainBox = document.createElement('div');
      mainBox.setAttribute('data-badge-mainbox', 'true');
      mainBox.className = 'relative bg-[#3F3F46] rounded-[0.3vw] p-[0.2vw] shadow-lg flex items-center justify-center transition-transform hover:scale-105 active:scale-95 border border-dashed border-black';
      mainBox.style.width = '1.6vw';
      mainBox.style.height = '1.6vw';

      if (isAnimation) {
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L14.85 8.62L22 9.24L16.54 13.97L18.18 21L12 17.27L5.82 21L7.46 13.97L2 9.24L9.15 8.62L12 2Z" fill="white"/>
          </svg>
        `;
      } else {
        mainBox.innerHTML = `
          <svg width="1vw" height="1vw" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 7.99791H6.176C4.679 7.99791 3.93 7.99791 3.466 7.55791C3 7.12091 3 6.41391 3 5.00091C3 3.58791 3 2.88091 3.465 2.44291C3.93 2.00391 4.679 2.00391 6.176 2.00391H17.823C19.321 2.00391 20.07 2.00391 20.535 2.44291C21 2.88191 21 3.58691 21 4.99991C21 6.41291 21 7.11991 20.535 7.55891C20.07 7.99791 19.321 7.99791 17.823 7.99791H16.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M7.42375 17.5184L6.54475 16.3864L5.42475 14.9414C4.98275 14.3964 4.90275 13.7304 5.18275 13.1414C5.28206 12.9339 5.43587 12.7573 5.62775 12.6304C6.24475 12.2234 7.09575 12.1744 7.62775 12.7114L9.59875 14.3894V6.63744C9.59875 5.77444 10.4187 5.02344 11.3447 5.02344C12.2707 5.02344 13.0967 5.77444 13.0967 6.63744V10.7274C14.6217 10.6054 17.0677 11.1684 18.5117 12.2754C19.7727 13.2404 20.5777 13.7774 19.5257 16.9554C19.1997 17.9384 18.3847 19.2914 18.2527 19.6734C18.1217 20.0534 17.9817 20.2804 18.0317 21.9934M6.54475 16.3864C6.81275 16.7104 7.08375 17.0884 7.42375 17.5184M9.52975 21.9994V21.0534C9.60275 19.8904 8.54675 18.9574 7.42375 17.5184M7.42375 17.5184C7.34275 17.4144 7.49975 17.6154 7.42375 17.5184ZM7.42375 17.5184L8.53075 18.8724" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      }

      const plusBadge = document.createElement('div');
      plusBadge.setAttribute('data-badge-plus', 'true');
      plusBadge.className = 'absolute -top-1 -right-1 flex items-center justify-center';
      plusBadge.style.width = '0.75vw';
      plusBadge.style.height = '0.75vw';
      if (isAssigned) {
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
            <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        `;
      } else {
        plusBadge.innerHTML = `
          <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
            <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
            <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
          </svg>
        `;
      }
      mainBox.appendChild(plusBadge);

      const label = document.createElement('div');
      label.setAttribute('data-badge-label', 'true');
      label.className = 'absolute top-1/2 -translate-y-1/2 bg-gray-900/90 text-white text-[0.65vw] font-medium px-[0.5vw] py-[0.2vw] rounded-[0.3vw] shadow-md backdrop-blur-xs whitespace-nowrap flex items-center opacity-0 group-hover/badge:opacity-100 transition-opacity duration-150 pointer-events-none z-50';
      label.style.left = '100%';
      label.style.marginLeft = '0.5vw';

      const arrow = document.createElement('div');
      arrow.setAttribute('data-badge-arrow', 'true');
      arrow.className = 'absolute w-0 h-0 pointer-events-none';
      arrow.style.cssText = 'position:absolute; left:-0.22vw; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-right:0.3vw solid rgba(17, 24, 39, 0.9); border-left:none;';

      const textSpan = document.createElement('span');
      textSpan.setAttribute('data-badge-text', 'true');
      textSpan.textContent = isAnimation
        ? (isAssigned ? 'Animation Added' : 'Click To Add Animation')
        : (isAssigned ? 'Interaction Added' : 'Click To Add Interaction');

      label.appendChild(arrow);
      label.appendChild(textSpan);
      badge.appendChild(mainBox);
      badge.appendChild(label);

      htmlOverlay.appendChild(badge);
    }

    if (badge) {
      let clickProcessed = false;
      const handleBadgeAction = (e) => {
        if (e) {
          e.preventDefault();
          e.stopPropagation();
        }
        if (clickProcessed) return;
        clickProcessed = true;
        setTimeout(() => { clickProcessed = false; }, 200);

        const targetId = el.id || el.getAttribute('data-name');
        if (!targetId) return;

        if (isAnimation) {
          el.setAttribute('data-animation-open-type', el.getAttribute('data-animation-open-type') || 'fade-in');
          el.setAttribute('data-animation-open-duration', el.getAttribute('data-animation-open-duration') || '1');
          el.setAttribute('data-animation-open-delay', el.getAttribute('data-animation-open-delay') || '0');
          el.setAttribute('data-animation-open-easing', el.getAttribute('data-animation-open-easing') || 'ease');
          el.setAttribute('data-animation-intent', 'true');

          if (typeof updateElementAttribute === 'function') {
            updateElementAttribute(activePageIndex, targetId, {
              'data-animation-open-type': el.getAttribute('data-animation-open-type') || 'fade-in',
              'data-animation-open-duration': el.getAttribute('data-animation-open-duration') || '1',
              'data-animation-open-delay': el.getAttribute('data-animation-open-delay') || '0',
              'data-animation-open-easing': el.getAttribute('data-animation-open-easing') || 'ease',
              'data-animation-intent': 'true'
            });
          }

          const plusBox = badge.querySelector('[data-badge-plus]');
          if (plusBox) {
            plusBox.innerHTML = `
              <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
                <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            `;
          }
          const textBox = badge.querySelector('[data-badge-text]');
          if (textBox) {
            textBox.textContent = 'Animation Added';
          }

          if (typeof setActiveTopTool === 'function') setActiveTopTool('animation');
          window.dispatchEvent(new CustomEvent('animation-force-add', { detail: targetId }));
        } else {
          const event = new CustomEvent('add-free-frame', {
            detail: {
              elementId: targetId,
              bbox: bbox
            }
          });
          window.dispatchEvent(event);
        }
      };

      badge.onpointerdown = handleBadgeAction;
      badge.onmousedown = handleBadgeAction;
      badge.onclick = handleBadgeAction;

      const plusBox = badge.querySelector('[data-badge-plus]');
      if (plusBox) {
        if (isAssigned) {
          plusBox.innerHTML = `
            <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="8" cy="8" r="7.5" fill="#22C55E" stroke="white"/>
              <path d="M5 8L7 10L11 6" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          `;
        } else {
          plusBox.innerHTML = `
            <svg width="0.75vw" height="0.75vw" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" fill="white"/>
              <path d="M8 0.5C12.1421 0.5 15.5 3.85786 15.5 8C15.5 12.1421 12.1421 15.5 8 15.5C3.85786 15.5 0.5 12.1421 0.5 8C0.5 3.85786 3.85786 0.5 8 0.5Z" stroke="#4A3AFF"/>
              <path d="M12.0007 8.66536H8.66732V11.9987C8.66732 12.3654 8.36732 12.6654 8.00065 12.6654C7.63398 12.6654 7.33398 12.3654 7.33398 11.9987V8.66536H4.00065C3.63398 8.66536 3.33398 8.36536 3.33398 7.9987C3.33398 7.63203 3.63398 7.33203 4.00065 7.33203H7.33398V3.9987C7.33398 3.63203 7.63398 3.33203 8.00065 3.33203C8.36732 3.33203 8.66732 3.63203 8.66732 3.9987V7.33203H12.0007C12.3673 7.33203 12.6673 7.63203 12.6673 7.9987C12.6673 8.36536 12.3673 8.66536 12.0007 8.66536Z" fill="#4A3AFF"/>
            </svg>
          `;
        }
      }

      const midN = { x: (mapped[0].x + mapped[1].x) / 2, y: (mapped[0].y + mapped[1].y) / 2 };
      const vwOffset = (window.innerWidth * 0.006) / zoomScale;
      badge.style.left = `${midN.x}px`;

      if (midN.y < 35 / zoomScale) {
        badge.style.top = `${midN.y + vwOffset}px`;
        badge.style.transformOrigin = 'top center';
        badge.style.transform = `translate(-50%, 0%) scale(${1 / zoomScale})`;
      } else {
        badge.style.top = `${midN.y - vwOffset}px`;
        badge.style.transformOrigin = 'bottom center';
        badge.style.transform = `translate(-50%, -100%) scale(${1 / zoomScale})`;
      }

      const containerWidth = htmlOverlay?.getBoundingClientRect?.()?.width || 9999;
      const labelEl = badge.querySelector('[data-badge-label]');
      const arrowEl = badge.querySelector('[data-badge-arrow]');
      const textEl = badge.querySelector('[data-badge-text]');
      if (textEl) {
        const textStr = isAnimation
          ? (isAssigned ? 'Animation Added' : 'Click To Add Animation')
          : (isAssigned ? 'Interaction Added' : 'Click To Add Interaction');
        textEl.textContent = textStr;
      }

      if (labelEl && arrowEl) {
        if (midN.x > containerWidth * 0.55) {
          labelEl.style.left = 'auto';
          labelEl.style.right = '100%';
          labelEl.style.marginLeft = '0';
          labelEl.style.marginRight = '0.5vw';
          arrowEl.style.cssText = 'position:absolute; right:-0.22vw; left:auto; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-left:0.3vw solid rgba(17, 24, 39, 0.9); border-right:none;';
        } else {
          labelEl.style.left = '100%';
          labelEl.style.right = 'auto';
          labelEl.style.marginLeft = '0.5vw';
          labelEl.style.marginRight = '0';
          arrowEl.style.cssText = 'position:absolute; left:-0.22vw; right:auto; top:50%; transform:translateY(-50%); width:0; height:0; border-top:0.25vw solid transparent; border-bottom:0.25vw solid transparent; border-right:0.3vw solid rgba(17, 24, 39, 0.9); border-left:none;';
        }
      }
    }
  };

  return { drawInteractionBadge };
};
