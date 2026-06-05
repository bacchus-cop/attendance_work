import React, { useEffect, useRef, useState } from 'react';
import { drawPixelFurniture, drawWizardCharacter } from './ultimate/utils/pixelRenderer';
import { ZoomIn, ZoomOut, Maximize2, Navigation } from 'lucide-react';
import { 
    SyncedPlayer, 
    FURNITURE_MAP, 
    MIN_BOUND, 
    MAX_BOUND, 
    getIsometricPos, 
    getFlatPosFromScreen 
} from './ultimate/utils/isometric';
import { drawDetailedRoomBackground } from './ultimate/utils/drawers/roomBackground';
import { PlayerTagOverlay, OverlayPlayer } from './ultimate/PlayerTagOverlay';
import { CameraControls } from './ultimate/CameraControls';
import { EdgeAwareTooltip } from './ultimate/EdgeAwareTooltip';
import { usePixelInteractions } from './ultimate/hooks/usePixelInteractions';
import { User } from '../../../types';

interface PixelHeroFollowerProps {
    currentUser: User;
    activeFocusTaskName?: string;
    otherPlayers?: SyncedPlayer[];
    onPositionChange?: (x: number, y: number, isIdle: boolean) => void;
    onFurnitureClick?: (key: string) => void;
    onViewportChange?: (zoom: number, pan: { x: number, y: number }) => void;
    onSendReaction?: (targetId: string, type: 'heart' | 'spell', cx: number, cy: number) => void;
}

export { FURNITURE_MAP, getIsometricPos };

export const PixelHeroFollower: React.FC<PixelHeroFollowerProps> = ({ 
    currentUser,
    activeFocusTaskName = '',
    otherPlayers = [], 
    onPositionChange,
    onFurnitureClick,
    onViewportChange,
    onSendReaction
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    
    // Viewport interactive state refs & state (Internal state for UI overlay rendering)
    const [zoom, setZoomState] = useState(1.0);
    const [pan, setPanState] = useState({ x: 0, y: 0 });
    const [overlayPlayers, setOverlayPlayers] = useState<OverlayPlayer[]>([]);
    
    const zoomRef = useRef(1.0);
    const panRef = useRef({ x: 0, y: 0 });

    const updateViewport = (newZoom: number, newPan: { x: number, y: number }) => {
        zoomRef.current = newZoom;
        panRef.current = newPan;
        setZoomState(newZoom);
        setPanState(newPan);
        if (onViewportChange) {
            onViewportChange(newZoom, newPan);
        }
    };

    // Track mouse, clicks and hero coordinates in mathematical flat space [-0.5..0.5]
    const mouseFlat = useRef({ fx: 0, fy: 0 });
    const heroFlat = useRef({ fx: 0, fy: 0 });
    const targetFlat = useRef({ fx: 0, fy: 0 });
    const isMovingToTarget = useRef<boolean>(false);
    
    // Mouse dragging and panning tracker states
    const isDraggingMap = useRef<boolean>(false);
    const dragStartMouse = useRef({ x: 0, y: 0 });
    const dragStartPan = useRef({ x: 0, y: 0 });
    
    // Inactivity timers and state
    const lastActiveTime = useRef<number>(Date.now());
    const isIdleRef = useRef<boolean>(false);
    const [isHoveringClickable, setIsHoveringClickable] = useState(false);
    const [selectedIdleFurniture, setSelectedIdleFurniture] = useState<keyof typeof FURNITURE_MAP>('DESK');

    // Sync online multiplayers internally for canvas animation
    const otherPlayersRef = useRef<SyncedPlayer[]>([]);
    const otherPlayersFlatsRef = useRef<Record<string, { fx: number, fy: number, tick: number }>>({});

    useEffect(() => {
        otherPlayersRef.current = otherPlayers;
        
        // Purge idle left players
        const activeIds = new Set(otherPlayers.map(p => p.id));
        Object.keys(otherPlayersFlatsRef.current).forEach(id => {
            if (!activeIds.has(id)) {
                delete otherPlayersFlatsRef.current[id];
            }
        });
    }, [otherPlayers]);

    // Handle initial sizing and dynamic syncing on load
    const isInitialViewportSync = useRef(true);
    useEffect(() => {
        if (isInitialViewportSync.current && onViewportChange) {
            isInitialViewportSync.current = false;
            onViewportChange(zoomRef.current, panRef.current);
        }
    }, [onViewportChange]);

    usePixelInteractions({
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
    });

    // Canvas main animation thread
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.imageSmoothingEnabled = false;

        let animationFrameId: number;
        let width = (canvas.width = window.innerWidth);
        let height = (canvas.height = window.innerHeight);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        let tick = 0;
        const lerpFactor = 0.003; // Slower, elegant smooth path walk following
        const pixelSize = 3.5; // Crispy retro pixels

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            tick++;

            // Retrive interactive values safely from react refs to avoid canvas context re-bind glitches
            const currentZoom = zoomRef.current;
            const currentPan = panRef.current;

            // --- 1. Draw 3D Isometric Detailed Room Atmosphere Background ---
            drawDetailedRoomBackground(ctx, width, height, currentPan.x, currentPan.y, currentZoom, tick);

            // --- 2. Determine targets and update local character coordinates ---
            const timeSinceActive = Date.now() - lastActiveTime.current;
            if (timeSinceActive > 8000) {
                isIdleRef.current = true;
            }

            // Target coordinates: Either destination target click, or mouse hover, or cozy furniture seat
            let targetFlatFx = heroFlat.current.fx;
            let targetFlatFy = heroFlat.current.fy;

            if (isMovingToTarget.current) {
                targetFlatFx = targetFlat.current.fx;
                targetFlatFy = targetFlat.current.fy;
            } else if (isIdleRef.current) {
                const mapKey = selectedIdleFurniture;
                const furniture = FURNITURE_MAP[mapKey];
                if (furniture) {
                    if (mapKey === 'DESK') {
                        targetFlatFx = furniture.fx - 0.04;
                        targetFlatFy = furniture.fy + 0.11;
                    } else if (mapKey === 'SOFA') {
                        targetFlatFx = furniture.fx - 0.02;
                        targetFlatFy = furniture.fy + 0.03;
                    } else {
                        targetFlatFx = furniture.fx + 0.05;
                        targetFlatFy = furniture.fy + 0.12;
                    }
                }
            }

            // Interpolate coordinates smoothly
            const dfx = targetFlatFx - heroFlat.current.fx;
            const dfy = targetFlatFy - heroFlat.current.fy;
            const distFlat = Math.sqrt(dfx * dfx + dfy * dfy);
            const isWalking = distFlat > 0.01;

            if (isWalking) {
                heroFlat.current.fx += dfx * lerpFactor;
                heroFlat.current.fy += dfy * lerpFactor;
            } else {
                isMovingToTarget.current = false; // Reset lock upon completion
            }

            // Sync with Supabase Multiplayers (scale [-0.5..0.5] range up to transportable [0..1] range)
            if (tick % 10 === 0 && onPositionChange) {
                onPositionChange(
                    heroFlat.current.fx + 0.5,
                    heroFlat.current.fy + 0.5,
                    !isWalking
                );
            }

            // --- 4. Prepare Y-Sorted list of actors / items rendering sequence ---
            interface Renderable {
                screenY: number;
                draw: () => void;
            }
            const renderQueue: Renderable[] = [];

            // Add furniture landmarks to the queue
            Object.entries(FURNITURE_MAP).forEach(([key, f]) => {
                const pos = getIsometricPos(f.fx, f.fy, width, height, currentPan.x, currentPan.y, currentZoom);
                renderQueue.push({
                    screenY: pos.y,
                    draw: () => drawPixelFurniture(ctx, key as any, pos.x, pos.y, pixelSize * currentZoom, tick)
                });
            });

            // Add local character
            const localPos = getIsometricPos(heroFlat.current.fx, heroFlat.current.fy, width, height, currentPan.x, currentPan.y, currentZoom);
            renderQueue.push({
                screenY: localPos.y,
                draw: () => drawWizardCharacter(
                    ctx,
                    localPos.x,
                    localPos.y,
                    currentUser.level,
                    'คุณ',
                    !isWalking,
                    tick,
                    dfx < 0,
                    isHoveringClickable,
                    '#db2777', // Premium magenta robe
                    true,
                    pixelSize * currentZoom
                )
            });

            // Add other online multiplayer wizards
            otherPlayersRef.current.forEach(play => {
                const otherFlatFx = play.x - 0.5;
                const otherFlatFy = play.y - 0.5;

                if (!otherPlayersFlatsRef.current[play.id]) {
                    otherPlayersFlatsRef.current[play.id] = {
                        fx: otherFlatFx,
                        fy: otherFlatFy,
                        tick: Math.floor(Math.random() * 100)
                    };
                }

                const oflat = otherPlayersFlatsRef.current[play.id];
                oflat.tick++;

                const odfx = otherFlatFx - oflat.fx;
                const odfy = otherFlatFy - oflat.fy;
                oflat.fx += odfx * 0.04;
                oflat.fy += odfy * 0.04;

                const otherWalking = Math.sqrt(odfx * odfx + odfy * odfy) > 0.005;
                const syncedScreenPos = getIsometricPos(oflat.fx, oflat.fy, width, height, currentPan.x, currentPan.y, currentZoom);

                renderQueue.push({
                    screenY: syncedScreenPos.y,
                    draw: () => drawWizardCharacter(
                        ctx,
                        syncedScreenPos.x,
                        syncedScreenPos.y,
                        play.level,
                        play.name,
                        play.idle || !otherWalking,
                        oflat.tick,
                        odfx < 0,
                        false,
                        play.color || '#3b82f6',
                        false,
                        pixelSize * currentZoom
                    )
                });
            });

            // --- Y-SORTING EXECUTION ---
            // Render everything sorted ascending by height coordinate (Y) to guarantee beautiful layered overlapping!
            renderQueue.sort((a, b) => a.screenY - b.screenY);
            renderQueue.forEach(item => item.draw());

            // --- 5. Draw Celestial Atmosphere Light Rays ---
            const rayGradient = ctx.createLinearGradient(width, 0, 0, height);
            rayGradient.addColorStop(0, 'rgba(129, 140, 248, 0.06)'); // Soft cosmic indigo flare
            rayGradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.02)');
            rayGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = rayGradient;
            ctx.beginPath();
            ctx.moveTo(width * 0.35, 0);
            ctx.lineTo(width, 0);
            ctx.lineTo(width, height * 0.7);
            ctx.lineTo(0, height);
            ctx.closePath();
            ctx.fill();

            // --- 6. Prepare list of players' screen coordinates for HTML RPG overlays ---
            const overlayList: OverlayPlayer[] = [];
            
            // Add local self player details
            overlayList.push({
                id: currentUser.id,
                name: currentUser.name || 'Wizard',
                level: currentUser.level || 1,
                hp: currentUser.hp ?? 100,
                maxHp: currentUser.maxHp ?? 100,
                feeling: currentUser.feeling || 'พร้อมสมาธิร่ายเวทมนตร์ ✨',
                focusTask: activeFocusTaskName || '',
                isSelf: true,
                screenX: localPos.x,
                screenY: localPos.y,
                color: '#db2777'
            });

            // Add other online multiplayers
            otherPlayersRef.current.forEach(play => {
                const oflat = otherPlayersFlatsRef.current[play.id];
                if (oflat) {
                    const syncedScreenPos = getIsometricPos(oflat.fx, oflat.fy, width, height, currentPan.x, currentPan.y, currentZoom);
                    overlayList.push({
                        id: play.id,
                        name: play.name,
                        level: play.level,
                        hp: play.hp ?? 100,
                        maxHp: play.maxHp ?? 100,
                        feeling: play.feeling || '',
                        focusTask: play.focusTask || '',
                        isSelf: false,
                        screenX: syncedScreenPos.x,
                        screenY: syncedScreenPos.y,
                        color: play.color || '#3b82f6'
                    });
                }
            });

            // Save to React state throttled to every 2 ticks (approx 30fps) for top rendering speed
            if (tick % 2 === 0) {
                setOverlayPlayers(overlayList);
            }

            animationFrameId = requestAnimationFrame(animate);
        };

        animate();

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
        };
    }, [currentUser, activeFocusTaskName, isHoveringClickable, selectedIdleFurniture, onPositionChange, onFurnitureClick]);

    // Fast viewport HUD click controls
    const triggerZoomIn = () => {
        const nextZoom = Math.min(2.2, zoomRef.current + 0.15);
        updateViewport(nextZoom, panRef.current);
    };

    const triggerZoomOut = () => {
        const nextZoom = Math.max(0.45, zoomRef.current - 0.15);
        updateViewport(nextZoom, panRef.current);
    };

    const triggerRecenter = () => {
        updateViewport(1.0, { x: 0, y: 0 });
    };

    return (
        <div 
            id="pixel-hero-canvas-container" 
            ref={containerRef}
            className="fixed inset-0 pointer-events-auto overflow-hidden select-none z-0 cursor-grab active:cursor-grabbing"
        >
            {/* Dark cozy room atmosphere vignette */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#06070a] via-[#0b0c14]/95 to-[#10111d]/98 pointer-events-none z-0" />
            
            {/* Main Interactive drawing Canvas */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-90 z-0" />

            {/* Real-time RPG HUD Name, Level and health overlay */}
            <PlayerTagOverlay 
                players={overlayPlayers} 
                onReaction={onSendReaction || (() => {})} 
                zoom={zoom}
            />

            {/* FLOATING CAMERA CONTROL DECK HUD (Bottom Right) */}
            <CameraControls 
                zoom={zoom}
                onZoomIn={triggerZoomIn}
                onZoomOut={triggerZoomOut}
                onRecenter={triggerRecenter}
            />

            {/* QUICK CAMERA SCROLL/PAN HINT (Bottom Left) */}
            <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-[#121424]/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/5 shadow-xs text-slate-400 text-[10px] font-medium z-10 pointer-events-none">
                <Navigation className="w-3.5 h-3.5 rotate-45 text-pink-400" />
                <span>คลิกลากเมาส์ หรือ สองนิ้วเลื่อน เพื่อแพนกล้องแผนที่ 🗺️</span>
            </div>
        </div>
    );
};

export default PixelHeroFollower;
