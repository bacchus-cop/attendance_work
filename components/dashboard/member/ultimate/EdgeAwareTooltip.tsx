import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface EdgeAwareTooltipProps {
    content: React.ReactNode;
    children: React.ReactElement;
    placement?: 'top' | 'bottom';
    delay?: number;
    disabled?: boolean;
}

export const EdgeAwareTooltip: React.FC<EdgeAwareTooltipProps> = ({
    content,
    children,
    placement = 'top',
    delay = 100,
    disabled = false
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0, arrowX: 0, actualPlacement: placement });
    const triggerRef = useRef<HTMLElement | null>(null);
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Update position of tooltip dynamically
    const updatePosition = () => {
        if (!triggerRef.current) return;

        const triggerRect = triggerRef.current.getBoundingClientRect();
        const tooltipWidth = tooltipRef.current?.offsetWidth || 220;
        const tooltipHeight = tooltipRef.current?.offsetHeight || 80;

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Calculate center-x of trigger
        const cx = triggerRect.left + triggerRect.width / 2;

        // Ideal X position (centered)
        let tx = cx - tooltipWidth / 2;
        // Ideal Y position (top / bottom)
        let ty = 0;
        let finalPlacement = placement;

        // Vertical positioning
        if (placement === 'top') {
            ty = triggerRect.top - tooltipHeight - 8;
            // Edge checking: if overflows top of screen, flip to bottom
            if (ty < 12) {
                ty = triggerRect.bottom + 8;
                finalPlacement = 'bottom';
            }
        } else {
            ty = triggerRect.bottom + 8;
            // Edge checking: if overflows bottom of screen, flip to top
            if (ty + tooltipHeight > viewportHeight - 12) {
                ty = triggerRect.top - tooltipHeight - 8;
                finalPlacement = 'top';
            }
        }

        // Horizontal Edge checking: clamp within viewport
        const padding = 12;
        if (tx < padding) {
            tx = padding;
        } else if (tx + tooltipWidth > viewportWidth - padding) {
            tx = viewportWidth - tooltipWidth - padding;
        }

        // Calculate Arrow off-center shift for exact pointing to trigger's center
        const arrowRelativeX = cx - tx;

        setCoords({
            x: tx,
            y: ty,
            arrowX: arrowRelativeX,
            actualPlacement: finalPlacement
        });
    };

    const handleMouseEnter = () => {
        if (disabled || !content) return;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
        }, delay);
    };

    const handleMouseLeave = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    useEffect(() => {
        if (isVisible) {
            // Measure right after setting visible
            updatePosition();
            
            // Re-check during resizing or scrolling
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
        }
        return () => {
            window.removeEventListener('resize', updatePosition);
            window.removeEventListener('scroll', updatePosition, true);
        };
    }, [isVisible]);

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    // Clone element to inject refs and listeners
    const triggerElement = React.cloneElement(children, {
        ref: (node: HTMLElement) => {
            triggerRef.current = node;
            // Retain original ref if there was one
            const { ref } = children as any;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        },
        onMouseEnter: (e: React.MouseEvent) => {
            children.props.onMouseEnter?.(e);
            handleMouseEnter();
        },
        onMouseLeave: (e: React.MouseEvent) => {
            children.props.onMouseLeave?.(e);
            handleMouseLeave();
        },
        onClick: (e: React.MouseEvent) => {
            children.props.onClick?.(e);
            handleMouseLeave(); // Auto hide on clicking the trigger
        }
    });

    return (
        <>
            {triggerElement}
            <AnimatePresence>
                {isVisible && !disabled && (
                    <div 
                        style={{
                            position: 'fixed',
                            left: 0,
                            top: 0,
                            transform: `translate3d(${coords.x}px, ${coords.y}px, 0)`,
                            zIndex: 99999,
                            pointerEvents: 'none'
                        }}
                    >
                        <motion.div
                            ref={tooltipRef}
                            initial={{ 
                                opacity: 0, 
                                scale: 0.9, 
                                y: coords.actualPlacement === 'top' ? 8 : -8 
                            }}
                            animate={{ 
                                opacity: 1, 
                                scale: 1, 
                                y: 0 
                            }}
                            exit={{ 
                                opacity: 0, 
                                scale: 0.9, 
                                y: coords.actualPlacement === 'top' ? 4 : -4 
                            }}
                            transition={{ 
                                type: 'spring', 
                                damping: 18, 
                                stiffness: 220 
                            }}
                            onUpdate={updatePosition}
                            className="bg-[#0b0c16]/96 border border-indigo-500/25 ring-1 ring-white/5 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 shadow-[0_12px_40px_rgba(99,102,241,0.22)] backdrop-blur-lg flex flex-col gap-1 w-max max-w-[260px] cursor-default pointer-events-auto select-none"
                        >
                            {content}

                            {/* Neon pointing arrow/pointer */}
                            <div 
                                className={`absolute w-2 h-2 rotate-45 border-indigo-500/25 bg-[#0b0c16] ${
                                    coords.actualPlacement === 'top' 
                                        ? 'border-r border-b top-full -mt-[5px]' 
                                        : 'border-l border-t bottom-full -mb-[5px]'
                                }`}
                                style={{ left: `${coords.arrowX - 4}px` }}
                            />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};

export default EdgeAwareTooltip;
