import React, { useEffect, useRef, useState } from 'react';
import { TourGuideClient } from '@sjmc11/tourguidejs';
import '@sjmc11/tourguidejs/dist/css/tour.min.css';
import './DashboardTour.css';

const steps = [
    {
        title: "Welcome to Flipbook",
        content: "Welcome to your Flipbook workspace. From here, you can create, upload, and manage your flipbooks.",
        target: "[data-tour='welcome']",
        order: 1,
    },
    {
        title: "Upload a PDF",
        content: "Upload your PDF directly by dragging it here or selecting a file from your device. Your PDF can then be converted into a flipbook.",
        target: "[data-tour='upload']",
        order: 2,
    },
    {
        title: "Create From Scratch",
        content: "Start with a blank canvas and create your flipbook from scratch.",
        target: "[data-tour='create-from-scratch']",
        order: 3,
    },
    {
        title: "Use a Template",
        content: "Choose from ready-made professional templates to quickly create your flipbook.",
        target: "[data-tour='template']",
        order: 4,
    },
    {
        title: "Your Flipbooks",
        content: "This section displays the flipbooks available in your workspace.",
        target: "[data-tour='all-flipbooks']",
        order: 5,
    },
    {
        title: "Search Flipbooks",
        content: "Quickly find a flipbook by searching for its name.",
        target: "[data-tour='search']",
        order: 6,
    },
    {
        title: "Filter by Folder",
        content: "Use this filter to view flipbooks from a specific folder.",
        target: "[data-tour='folder-filter']",
        order: 7,
    },
    {
        title: "Filter by Status",
        content: "Filter your flipbooks based on their current status.",
        target: "[data-tour='status-filter']",
        order: 8,
    },
    {
        title: "Sort Your Flipbooks",
        content: "Change the sorting order to quickly organize and find your flipbooks.",
        target: "[data-tour='sort']",
        order: 9,
    },
    {
        title: "Select Multiple",
        content: "Enable multiple selection when you need to manage more than one flipbook at a time.",
        target: "[data-tour='multiple-selection']",
        order: 10,
    },
    {
        title: "Create Your First Flipbook",
        content: "If you don't have any flipbooks yet, you can start by uploading a PDF or creating one from a template.",
        target: "[data-tour='empty-state']",
        order: 11,
    },
    {
        title: "All Flipbooks",
        content: "Use the sidebar to quickly access and manage all your flipbooks.",
        target: "[data-tour='all-flipbooks-nav']",
        order: 12,
    },
    {
        title: "Recent",
        content: "View your recently accessed flipbooks from here.",
        target: "[data-tour='recent']",
        order: 13,
    },
    {
        title: "Favorites",
        content: "Your favorite flipbooks can be accessed quickly from this section.",
        target: "[data-tour='favorites']",
        order: 14,
    },
    {
        title: "Trash",
        content: "Deleted flipbooks can be found and managed here.",
        target: "[data-tour='trash']",
        order: 15,
    },
    {
        title: "My Flipbooks",
        content: "Your personal flipbooks can be organized inside your folders for easier management.",
        target: "[data-tour='my-flipbooks']",
        order: 16,
    },
    {
        title: "Storage",
        content: "Monitor how much storage you have used and how much space is available.",
        target: "[data-tour='storage']",
        order: 17,
    },
    {
        title: "You're All Set!",
        content: "That's a quick tour of your Flipbook workspace. You can now start creating and managing your flipbooks.",
        target: "body", // Central area
        order: 18,
    },
];

const DashboardTour = () => {
    const tourRef = useRef(null);
    const [isTourRunning, setIsTourRunning] = useState(false);

    // Safely and aggressively clean up ANY leftover TourGuide state, DOM elements, or CSS classes
    const cleanupTourElements = () => {
        // 1. Remove the global pointer-events lockdown class
        document.body.classList.remove('tg-no-interaction');
        
        // 2. Remove the active highlight class from any elements that might have gotten stuck
        document.querySelectorAll('.tg-active-element').forEach(el => {
            el.classList.remove('tg-active-element');
        });

        // 3. Remove all TourGuide injected DOM elements (dialogs, backdrops)
        document.querySelectorAll('.tg-dialog, .tg-backdrop, .flipbook-tour-backdrop, .flipbook-tour-dialog').forEach(el => el.remove());
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (tourRef.current) {
                try { tourRef.current.exit(); } catch (e) {}
            }
            cleanupTourElements();
        };
    }, []);

    const startTour = () => {
        // Aggressively clean up any stale DOM elements BEFORE creating the new instance.
        cleanupTourElements();

        // Initialize fresh instance so target string selectors are re-evaluated against the current DOM
        // Deep clone steps because TourGuideJS mutates the 'target' property into an HTMLElement!
        const clonedSteps = JSON.parse(JSON.stringify(steps));
        
        const newTour = new TourGuideClient({
            steps: clonedSteps,
            debug: false,
            backdropClass: 'flipbook-tour-backdrop',
            dialogClass: 'flipbook-tour-dialog',
            keyboardControls: true,
            closeButton: true,
            exitOnClickOutside: false, // Prevent closing on backdrop click
            progressBar: false, // We'll use dots
            showStepDots: false,
            showStepProgress: true,
            rememberStep: false, // Don't persist yet as per requirements
            autoScroll: true,
            autoScrollOffset: Math.round(window.innerWidth * 0.07), // 100px ~ 7vw
            nextLabel: 'Next',
            prevLabel: 'Back',
            finishLabel: 'Finish'
        });

        tourRef.current = newTour;

        // Safely clean up on exit, but ONLY if this instance is still the active one!
        // This prevents the async race condition where an old closing tour deletes a new starting tour's DOM.
        newTour.onAfterExit(() => {
            setIsTourRunning(false);
            if (tourRef.current === newTour) {
                cleanupTourElements();
            }
        });
        
        newTour.onFinish(() => {
            setIsTourRunning(false);
            if (tourRef.current === newTour) {
                cleanupTourElements();
            }
        });

        // Use requestAnimationFrame to ensure React has painted before TourGuide starts querying selectors
        requestAnimationFrame(() => {
            setIsTourRunning(true);
            newTour.start();
        });
    };

    return (
        <>
            {/* TEMPORARY TEST BUTTON - TO BE REMOVED LATER */}
            <button
                onClick={startTour}
                className="fixed z-[99] bg-[#ea543a] text-white font-semibold hover:bg-[#d4452d] transition-colors shadow-[0_0.2vw_0.5vw_rgba(0,0,0,0.1)] cursor-pointer"
                style={{ top: '0.7vw', right: '9vw', padding: '0.5vw 1vw', borderRadius: '0.4vw', fontSize: '0.85vw' }}
            >
                Start Tour
            </button>
        </>
    );
};

export default DashboardTour;
