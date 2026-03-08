import React, { useState, useCallback, RefObject } from 'react';

export const useMapEngine = (mapRef: RefObject<HTMLDivElement>) => {
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const zoom = useCallback((delta: number) => {
    setViewState((prev) => ({ ...prev, scale: Math.max(0.2, Math.min(3, prev.scale + delta)) }));
  }, []);

  const resetView = useCallback(() => {
    setViewState({ x: 0, y: 0, scale: 1 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent, onSelectNone: () => void) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest('button') || 
                         target.closest('input') || 
                         target.closest('select') ||
                         target.closest('.ring-component') ||
                         target.closest('.domain-area') ||
                         target.closest('.side-panel') ||
                         target.closest('.hud-panel');

    if (!isInteractive) {
      onSelectNone();
      setIsPanning(true);
      setPanStart({ x: e.clientX - viewState.x, y: e.clientY - viewState.y });
    }
  }, [viewState.x, viewState.y]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setViewState(prev => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      }));
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const screenToMap = useCallback((screenX: number, screenY: number) => {
    const rect = mapRef.current?.getBoundingClientRect();
    const centerX = rect ? rect.width / 2 : window.innerWidth / 2;
    const centerY = rect ? rect.height / 2 : window.innerHeight / 2;
    
    // Transform screen coordinates to map coordinates
    const mapX = (screenX - viewState.x) / viewState.scale;
    const mapY = (screenY - viewState.y) / viewState.scale;
    
    return { x: mapX, y: mapY };
  }, [viewState, mapRef]);

  return {
    viewState,
    setViewState,
    isPanning,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    zoom,
    resetView,
    screenToMap
  };
};
