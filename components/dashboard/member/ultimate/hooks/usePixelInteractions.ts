import { useState, useRef, useEffect } from 'react';
import { SyncedPlayer, FURNITURE_MAP, getFlatPosFromScreen } from '../utils/isometric';

interface UsePixelInteractionsProps {
    containerRef: React.RefObject<HTMLDivElement>;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    zoomRef: React.MutableRefObject<number>;
    panRef: React.MutableRefObject<{ x: number; y: number }>;
    targetFlat: React.MutableRefObject<{ fx: number; fy: number }>;
    isMovingToTarget: React.MutableRefObject<boolean>;
    isIdleRef: React.MutableRefObject<boolean>;
    lastActiveTime: React.MutableRefObject<number>;
    updateViewport: (zoom: number, pan: { x: number; y: number }) => void;
    onFurnitureClick?: (key: string) => void;
    setSelectedIdleFurniture: (key: keyof typeof FURNITURE_MAP) => void;
    setIsHoveringClickable: (val: boolean) => void;
}

export const usePixelInteractions = ({
    containerRef,
    canvasRef,
    zoomRef,
    panRef,
    targetFlat,
    isMovingToTarget,
    isIdleRef,
    lastActiveTime,
    updateViewport,
    onFurnitureClick,
    setSelectedIdleFurniture,
    setIsHoveringClickable
}: UsePixelInteractionsProps) => {
    const isDraggingMap = useRef<boolean>(false);
    const dragStartMouse = useRef({ x: 0, y: 0 });
    const dragStartPan = useRef({ x: 0, y: 0 });

    const callbacksRef = useRef({
        updateViewport,
        onFurnitureClick,
        setSelectedIdleFurniture,
        setIsHoveringClickable
    });

    useEffect(() => {
        callbacksRef.current = {
            updateViewport,
            onFurnitureClick,
            setSelectedIdleFurniture,
            setIsHoveringClickable
        };
    }, [updateViewport, onFurnitureClick, setSelectedIdleFurniture, setIsHoveringClickable]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const SAFE_WALK_MIN = -1.15;
        const SAFE_WALK_MAX = 1.15;
        const clampToWalkable = (val: number) => Math.max(SAFE_WALK_MIN, Math.min(SAFE_WALK_MAX, val));

        const handleWheel = (e: WheelEvent) => {
            e.preventDefault();
            const nextZoom = Math.max(0.45, Math.min(2.2, zoomRef.current + e.deltaY * -0.0016));
            callbacksRef.current.updateViewport(nextZoom, panRef.current);
        };

        const handleMouseDown = (e: MouseEvent) => {
            if ((e.target as HTMLElement).closest('.hud-button')) return;

            isDraggingMap.current = false;
            dragStartMouse.current = { x: e.clientX, y: e.clientY };
            dragStartPan.current = { ...panRef.current };
            
            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }

            window.addEventListener('mousemove', handleMouseMoveGlobal);
            window.addEventListener('mouseup', handleMouseUpGlobal);
        };

        const handleMouseMoveGlobal = (e: MouseEvent) => {
            const dx = e.clientX - dragStartMouse.current.x;
            const dy = e.clientY - dragStartMouse.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDraggingMap.current = true;
                const nextPan = {
                    x: dragStartPan.current.x + dx,
                    y: dragStartPan.current.y + dy
                };
                callbacksRef.current.updateViewport(zoomRef.current, nextPan);
            }
        };

        const handleMouseMoveOnCanvas = (e: MouseEvent) => {
            if (isDraggingMap.current) return;

            const canvas = canvasRef.current;
            if (!canvas) return;

            if ((e.target as HTMLElement).closest('.hud-button')) return;

            const { fx, fy } = getFlatPosFromScreen(
                e.clientX,
                e.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            targetFlat.current.fx = clampToWalkable(fx);
            targetFlat.current.fy = clampToWalkable(fy);
            isMovingToTarget.current = true;

            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }

            let isNearFurniture = false;
            let closestDist = 0.095;
            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_BROOM', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL', 'WHITEBOARD', 'MEETING_TABLE'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    isNearFurniture = true;
                }
            });
            callbacksRef.current.setIsHoveringClickable(isNearFurniture);
        };

        const handleMouseUpGlobal = (e: MouseEvent) => {
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('mouseup', handleMouseUpGlobal);

            if (isDraggingMap.current) {
                isDraggingMap.current = false;
                return;
            }

            const canvas = canvasRef.current;
            if (!canvas) return;

            const { fx, fy } = getFlatPosFromScreen(
                e.clientX,
                e.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            let clickedFurnitureKey: string | null = null;
            let closestDist = 0.095;

            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_BROOM', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL', 'WHITEBOARD', 'MEETING_TABLE'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    clickedFurnitureKey = key;
                }
            });

            if (clickedFurnitureKey && callbacksRef.current.onFurnitureClick) {
                const targetFurniture = FURNITURE_MAP[clickedFurnitureKey as keyof typeof FURNITURE_MAP];
                targetFlat.current.fx = targetFurniture.fx + (clickedFurnitureKey === 'DESK' ? -0.04 : clickedFurnitureKey === 'SOFA' ? -0.02 : 0.05);
                targetFlat.current.fy = targetFurniture.fy + (clickedFurnitureKey === 'DESK' ? 0.08 : clickedFurnitureKey === 'SOFA' ? 0.04 : 0.06);
                isMovingToTarget.current = true;
                
                callbacksRef.current.onFurnitureClick(clickedFurnitureKey);
            } else {
                targetFlat.current.fx = clampToWalkable(fx);
                targetFlat.current.fy = clampToWalkable(fy);
                isMovingToTarget.current = true;
            }
        };

        const handleTouchStart = (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            dragStartMouse.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
            dragStartPan.current = { ...panRef.current };
            isDraggingMap.current = false;

            lastActiveTime.current = Date.now();
            if (isIdleRef.current) {
                isIdleRef.current = false;
            }
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length === 0) return;
            const dx = e.touches[0].clientX - dragStartMouse.current.x;
            const dy = e.touches[0].clientY - dragStartMouse.current.y;

            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
                isDraggingMap.current = true;
                const nextPan = {
                    x: dragStartPan.current.x + dx,
                    y: dragStartPan.current.y + dy
                };
                callbacksRef.current.updateViewport(zoomRef.current, nextPan);
            }
        };

        const handleTouchEnd = (e: TouchEvent) => {
            if (isDraggingMap.current) {
                isDraggingMap.current = false;
                return;
            }

            if (e.changedTouches.length === 0) return;
            const touch = e.changedTouches[0];
            const canvas = canvasRef.current;
            if (!canvas) return;

            const { fx, fy } = getFlatPosFromScreen(
                touch.clientX,
                touch.clientY,
                canvas.width,
                canvas.height,
                panRef.current.x,
                panRef.current.y,
                zoomRef.current
            );

            let clickedFurnitureKey: string | null = null;
            let closestDist = 0.095;

            Object.entries(FURNITURE_MAP).forEach(([key, item]) => {
                const isInteractable = [
                    'BOOKSHELF', 'DESK', 'SOFA', 'QUEST_BOARD', 'DUTY_BROOM', 'DUTY_SIGN',
                    'GOAL_BEACON', 'LEADERBOARD_ALTAR', 'VAULT_BOX', 'CHAT_BALL', 'WIKI_PORTAL', 'WHITEBOARD', 'MEETING_TABLE'
                ].includes(key);
                if (!isInteractable) return;

                const dist = Math.sqrt(Math.pow(fx - item.fx, 2) + Math.pow(fy - item.fy, 2));
                if (dist < closestDist) {
                    closestDist = dist;
                    clickedFurnitureKey = key;
                }
            });

            if (clickedFurnitureKey && callbacksRef.current.onFurnitureClick) {
                const targetFurniture = FURNITURE_MAP[clickedFurnitureKey as keyof typeof FURNITURE_MAP];
                targetFlat.current.fx = targetFurniture.fx;
                targetFlat.current.fy = targetFurniture.fy + 0.05;
                isMovingToTarget.current = true;
                callbacksRef.current.onFurnitureClick(clickedFurnitureKey);
            } else {
                targetFlat.current.fx = clampToWalkable(fx);
                targetFlat.current.fy = clampToWalkable(fy);
                isMovingToTarget.current = true;
            }
        };

        container.addEventListener('wheel', handleWheel, { passive: false });
        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove);
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('mousemove', handleMouseMoveOnCanvas);

        const idleCycle = setInterval(() => {
            if (isIdleRef.current) {
                const items: Array<keyof typeof FURNITURE_MAP> = ['DESK', 'SOFA', 'BOOKSHELF'];
                const nextItem = items[Math.floor(Math.random() * items.length)];
                callbacksRef.current.setSelectedIdleFurniture(nextItem);
            }
        }, 11000);

        return () => {
            container.removeEventListener('wheel', handleWheel);
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('mousemove', handleMouseMoveOnCanvas);
            window.removeEventListener('mousemove', handleMouseMoveGlobal);
            window.removeEventListener('mouseup', handleMouseUpGlobal);
            clearInterval(idleCycle);
        };
    }, []);
};
