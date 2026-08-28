import { useState, useCallback, useRef } from 'react';

export default function useModalHistory(initialState) {
    const [index, setIndex] = useState(0);
    const [history, setHistory] = useState([initialState]);
    
    const historyRef = useRef([initialState]);
    const indexRef = useRef(0);

    const setState = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        const nextHistory = [...curHistory.slice(0, curIndex + 1), newState];
        const nextIndex = nextHistory.length - 1;

        historyRef.current = nextHistory;
        indexRef.current = nextIndex;

        setHistory(nextHistory);
        setIndex(nextIndex);
    }, []);

    const undo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex > 0) {
            const prevIndex = curIndex - 1;
            indexRef.current = prevIndex;
            setIndex(prevIndex);
            return curHistory[prevIndex];
        }
        return null;
    }, []);

    const redo = useCallback(() => {
        const curIndex = indexRef.current;
        const curHistory = historyRef.current;
        if (curIndex < curHistory.length - 1) {
            const nextIndex = curIndex + 1;
            indexRef.current = nextIndex;
            setIndex(nextIndex);
            return curHistory[nextIndex];
        }
        return null;
    }, []);

    const resetHistory = useCallback((newState) => {
        historyRef.current = [newState];
        indexRef.current = 0;
        setHistory([newState]);
        setIndex(0);
    }, []);

    const update = useCallback((newState) => {
        const curIndex = indexRef.current;
        const curHistory = [...historyRef.current];
        curHistory[curIndex] = newState;
        historyRef.current = curHistory;
        setHistory(curHistory);
    }, []);

    const currentState = history[index] || historyRef.current[indexRef.current];

    return {
        state: currentState,
        past: history.slice(0, index),
        future: history.slice(index + 1),
        set: setState,
        update,
        undo,
        redo,
        canUndo: index > 0,
        canRedo: index < history.length - 1,
        resetHistory
    };
}
