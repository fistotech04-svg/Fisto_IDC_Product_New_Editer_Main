// Utility functions for the template editor

// Reset properties to default values
export const resetProperties = (setProperties) => {
  setProperties({
    fontSize: 16,
    fontFamily: "Arial",
    fontWeight: 400,
    color: "#000000",
    backgroundColor: "#ffffff",
    textAlign: "left",
    lineHeight: 1.5,
    letterSpacing: 0,
    textDecoration: "none",
    textTransform: "none",
    borderRadius: 0,
    borderWidth: 0,
    borderColor: "#000000",
    borderStyle: "solid",
    boxShadow: "none",
    opacity: 1,
    width: 100,
    height: 50,
    x: 0,
    y: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    skewX: 0,
    skewY: 0,
    zIndex: 0,
    animation: "none",
    animationDuration: 0,
    animationDelay: 0,
    animationIterationCount: 1,
    animationDirection: "normal",
    animationFillMode: "none",
    animationTimingFunction: "ease",
    interaction: "none",
    link: "",
    tooltip: "",
    altText: "",
    src: "",
    videoSrc: "",
    autoplay: false,
    loop: false,
    muted: true,
    controls: true,
    poster: "",
  });
};

// Update properties from an object
export const updatePropertiesFromObject = (setProperties, obj) => {
  setProperties((prev) => ({ ...prev, ...obj }));
};

// Update a single property
export const updateProperty = (setProperties, key, value) => {
  setProperties((prev) => ({ ...prev, [key]: value }));
};

// History management functions
export const saveToHistory = (history, setHistory, currentState) => {
  setHistory([...history, currentState]);
};

export const undo = (history, setHistory, setCurrentState) => {
  if (history.length > 0) {
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setCurrentState(previousState);
  }
};

export const redo = (redoStack, setRedoStack, setCurrentState) => {
  if (redoStack.length > 0) {
    const nextState = redoStack[redoStack.length - 1];
    setRedoStack(redoStack.slice(0, -1));
    setCurrentState(nextState);
  }
};