import React, { useState, useCallback, RefObject } from 'react';

export const useMapEngine = (mapRef: RefObject<HTMLDivElement>) => {
  const [viewState, setViewState] = useState({ x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent, onBgClick?: () => void) => {
    if ((e.target as HTMLElement).getAttribute('data-map-bg')) {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
      onBgClick?.();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isPanning) return;
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    setViewState(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const zoom = (delta: number) => {
    setViewState(prev => ({
      ...prev,
      scale: Math.max(0.2, Math.min(3, prev.scale + delta))
    }));
  };

  const resetView = () => {
    setViewState({ x: 0, y: 0, scale: 1 });
  };

  const screenToMap = (screenX: number, screenY: number) => {
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return { x: screenX, y: screenY };
    return {
      x: (screenX - rect.left - viewState.x) / viewState.scale,
      y: (screenY - rect.top - viewState.y) / viewState.scale
    };
  };

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
