import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Zap, Sparkles, Brain, Coffee, User as UserIcon, X, Target } from 'lucide-react';
import PlayerAura from './auras/PlayerAura';
import { EdgeAwareTooltip } from './EdgeAwareTooltip';

export interface OverlayPlayer {
    id: string;
    name: string;
    level: number;
    hp: number;
    maxHp: number;
    feeling: string;
    focusTask: string;
    isSelf: boolean;
    screenX: number;
    screenY: number;
    color: string;
}

interface PlayerTagOverlayProps {
    players: OverlayPlayer[];
    onReaction: (targetId: string, type: 'heart' | 'spell', clientX: number, clientY: number) => void;
    zoom?: number;
}

// Emoji mapping keyword rules helper
const getFeelingEmoji = (feelingText: string) => {
    const t = feelingText.toLowerCase();
    if (t.includes('เหนร่ย') || t.includes('เหนื่อย') || t.includes('เพลีย') || t.includes('ไม่ไหว')) return '💤';
    if (t.includes('สู้') || t.includes('ลุย') || t.includes('งาน') || t.includes('ไฟท์') || t.includes('ทำ')) return '🔥';
    if (t.includes('แฮปปี้') || t.includes('สุข') || t.includes('ดีใจ') || t.includes('ยิ้ม') || t.includes('ฟิต')) return '✨';
    if (t.includes('เครียด') || t.includes('กังวล') || t.includes('เกร็ง') || t.includes('เศร้า')) return '😰';
    if (t.includes('สมาธิ') || t.includes('โฟกัส') || t.includes('เพ่ง') || t.includes('เงียบ')) return '🧠';
    if (t.includes('ง่วง') || t.includes('นอน') || t.includes('ดึก')) return '🥱';
    if (t.includes('พัก') || t.includes('ชา') || t.includes('กาแฟ') || t.includes('ว่าง')) return '☕';
    if (t.includes('รัก') || t.includes('เลิฟ') || t.includes('แฟน') || t.includes('หัวใจ')) return '❤️';
    if (t.includes('สำเร็จ') || t.includes('เสร็จ') || t.includes('จบ') || t.includes('วิน')) return '🎉';
    if (t.includes('หิว') || t.includes('อร่อย') || t.includes('กิน') || t.includes('ข้าว') || t.includes('ชาบู')) return '🍕';
    if (t.includes('ชิว') || t.includes('สบาย') || t.includes('ลม')) return '🍃';
    if (t.includes('เบื่อ') || t.includes('เซ็ง') || t.includes('เซง')) return '😑';
    if (t.includes('โกรธ') || t.includes('โมโห')) return '💢';

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{1F600}-\u{1F64F}\u{2700}-\u{27BF}]/u;
    if (emojiRegex.test(feelingText)) return ''; // String already contains emoji
    return '🔮'; // Default magic crystal
};

export const PlayerTagOverlay: React.FC<PlayerTagOverlayProps> = ({ players, onReaction, zoom = 1.0 }) => {
    const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu when tapping outside of it
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (selectedPlayerId && menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setSelectedPlayerId(null);
            }
        };
        window.addEventListener('mousedown', handleOutsideClick);
        return () => window.removeEventListener('mousedown', handleOutsideClick);
    }, [selectedPlayerId]);

    const activeMenuPlayer = players.find(p => p.id === selectedPlayerId);

    return (
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden z-10 select-none">
            {/* 1. BACKGROUND AURAS (Render super saiyan levels behind nameplates & bubbles) */}
            {players.map(player => (
                <PlayerAura 
                    key={`aura-${player.id}`} 
                    level={player.level} 
                    x={player.screenX} 
                    y={player.screenY} 
                />
            ))}

            {players.map(player => {
                const hpPercent = Math.max(0, Math.min(100, (player.hp / player.maxHp) * 100));
                const isLowHp = hpPercent <= 30;

                const emojiIcon = getFeelingEmoji(player.feeling);

                // Zoom responsive coordinate offsets (character feet is screenY, height is approx 24 pixel units * pixelSize of 3.5 * zoom)
                const charHeadX = player.screenX;
                const charHeadY = player.screenY - (24 * 3.5 * zoom) - 12;

                // Zoom responsive scale with protective boundaries to keep text legible at extreme zoom
                const scaleFactor = Math.max(0.65, Math.min(1.25, zoom));

                return (
                    <div 
                        key={player.id}
                        id={`player-tag-${player.id}`}
                        className="absolute flex flex-col items-center justify-end"
                        style={{
                            left: `${charHeadX}px`,
                            top: `${charHeadY}px`,
                            transform: `translate(-50%, -100%) scale(${scaleFactor})`,
                        }}
                    >
                        {/* 1. FEELING SPEECH BUBBLE (Glassmorphism floating clouds) */}
                        <AnimatePresence>
                            {player.feeling && (
                                <EdgeAwareTooltip
                                    content={
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-extrabold text-[#3b82f6]">กระแสจิตความรู้สึก 💭</span>
                                            <span className="text-[10px] text-slate-300">ของ {player.name}: "{player.feeling}"</span>
                                        </div>
                                    }
                                    placement="top"
                                    delay={125}
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.85 }}
                                        animate={{ 
                                            opacity: 1, 
                                            y: [0, -6, 0], 
                                            scale: 1 
                                        }}
                                        transition={{
                                            duration: 0.3,
                                            y: { repeat: Infinity, duration: 4, ease: "easeInOut" }
                                        }}
                                        className="mb-3 max-w-[170px] bg-slate-900/85 backdrop-blur-md border border-white/10 rounded-2xl px-3 py-1.5 shadow-xl flex items-center gap-1.5 whitespace-normal break-words pointer-events-auto cursor-help"
                                    >
                                        <span className="text-base select-none shrink-0">{emojiIcon}</span>
                                        <span className="text-[10px] font-medium text-slate-100 line-clamp-2">
                                            {player.feeling}
                                        </span>
                                        {/* Speech bubble tail pointer */}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-4 border-transparent border-t-slate-900/90" />
                                    </motion.div>
                                </EdgeAwareTooltip>
                            )}
                        </AnimatePresence>

                        {/* 2. STATS & NAME PLATE ACTION CONTAINER (Clickable Floating HUD Area) */}
                        <EdgeAwareTooltip
                            content={
                                <div className="flex flex-col gap-0.5">
                                    <span className="font-extrabold text-indigo-300">{player.name} (Lv.{player.level})</span>
                                    <span className="text-[10px] text-slate-400">
                                        {player.isSelf 
                                            ? 'บอทเวทมนตร์และพาสปอร์ตส่วนตัวของท่าน' 
                                            : 'เปิดเวทย์อัญเชิญ เพื่อส่งสัญญาณโต้ตอบ ปรานรักษาสมาธิร่วมกัน ❤️⚡'}
                                    </span>
                                </div>
                            }
                            placement="bottom"
                            delay={100}
                        >
                            <div 
                                className="flex flex-col items-center gap-1.5 pointer-events-auto cursor-pointer active:scale-95 transition-all text-center min-w-[124px]"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedPlayerId(player.id);
                                }}
                            >
                                {/* Floating level tag and player name */}
                                <div className="flex items-center justify-center gap-1.5 drop-shadow-[0_2px_3px_rgba(0,0,0,1.0)]">
                                    <span className={`text-[9px] font-bold font-mono px-1.5 py-0.5 rounded ${
                                        player.level >= 15 ? 'bg-purple-600/90 text-purple-100 ring-1 ring-purple-400/55' :
                                        player.level >= 8  ? 'bg-yellow-500/90 text-yellow-950 font-black' :
                                        player.level >= 3  ? 'bg-slate-400/95 text-slate-900 font-bold' :
                                        'bg-slate-700/90 text-slate-200'
                                    }`}>
                                        Lv.{player.level}
                                    </span>
                                    <span className={`text-[11px] font-black ${player.isSelf ? 'text-pink-400' : 'text-emerald-400'} tracking-wide truncate max-w-[95px]`}>
                                        {player.name}
                                        {player.isSelf && ' (คุณ)'}
                                    </span>
                                    {player.isSelf && <span className="w-1.5 h-1.5 bg-pink-400 rounded-full animate-ping" />}
                                </div>

                                {/* Floating Combat RPG Health Bar without frame or background panel */}
                                <div className="w-[84px] flex flex-col gap-0.5 mt-0.5">
                                    <div 
                                        className={`relative w-full h-1.5 bg-black/50 rounded-full overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.8)] border border-black/20 ${
                                            isLowHp ? 'ring-1 ring-red-500/60 animate-pulse' : ''
                                        }`}
                                    >
                                        {/* Slower ambient trailing catch-up bar (Amber) */}
                                        <div 
                                            style={{ width: `${hpPercent}%` }} 
                                            className="h-full bg-amber-500/80 absolute left-0 top-0 transition-[width] duration-1000 ease-in-out z-0"
                                        />
                                        {/* Actual current health level indicator (Emerald/Green/Red) */}
                                        <div 
                                            style={{ width: `${hpPercent}%` }} 
                                            className={`h-full absolute left-0 top-0 transition-[width] duration-300 ease-out z-10 ${
                                                isLowHp ? 'bg-gradient-to-r from-red-500 to-rose-600' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                            }`}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[7.5px] font-black font-mono text-slate-200 drop-shadow-[0_1.5px_2px_rgba(0,0,0,1.0)] px-0.5 leading-none">
                                        <span>HP</span>
                                        <span>{player.hp}/{player.maxHp}</span>
                                    </div>
                                </div>
                            </div>
                        </EdgeAwareTooltip>

                        {/* Interactive focus status tag */}
                        {player.focusTask ? (
                            <div className="mt-1 flex items-center gap-1 px-1.5 py-0.5 bg-indigo-950/70 border border-indigo-500/20 text-indigo-300 rounded text-[7.5px] font-semibold max-w-[130px] truncate">
                                <Brain className="w-2.5 h-2.5 text-indigo-400 inline shrink-0" />
                                <span className="truncate">{player.focusTask}</span>
                            </div>
                        ) : null}
                    </div>
                );
            })}

            {/* 3. INTERACTIVE CORNER POPUP MENU (PlayerInteractMenu) */}
            <AnimatePresence>
                {selectedPlayerId && activeMenuPlayer && (
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[0.5px] z-50 pointer-events-auto flex items-center justify-center p-4">
                        <motion.div
                            ref={menuRef}
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                            className="bg-[#121424] border border-slate-700/60 p-5 rounded-2xl shadow-2xl w-full max-w-[340px] text-slate-100 flex flex-col gap-4"
                        >
                            {/* Menu Header Area */}
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2.5">
                                    <div 
                                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                                        style={{ backgroundColor: activeMenuPlayer.color || '#3b82f6' }}
                                    >
                                        {activeMenuPlayer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                                            {activeMenuPlayer.name}
                                            {activeMenuPlayer.isSelf && <span className="text-[10px] text-pink-400">(คุณ)</span>}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 font-mono">
                                            คลาสจอมเวท • เลเวล {activeMenuPlayer.level}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setSelectedPlayerId(null)}
                                    className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>

                            <div className="w-full h-px bg-slate-800" />

                            {/* Focus / Working State section */}
                            <div className="flex flex-col gap-1.5">
                                <span className="text-[10px] font-semibold text-slate-440 uppercase tracking-wider block font-mono">
                                    สถานะเวทมนตร์ขณะนี้
                                </span>
                                {activeMenuPlayer.focusTask ? (
                                    <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-3 flex items-start gap-2.5">
                                        <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">
                                                กำลังโฟกัสเควส
                                            </p>
                                            <p className="text-xs font-bold text-indigo-200 line-clamp-2">
                                                {activeMenuPlayer.focusTask}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-3 flex items-start gap-2.5">
                                        <Coffee className="w-5 h-5 text-amber-405 shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[10px] font-semibold text-slate-400 leading-none mb-1">
                                                สถานะ
                                            </p>
                                            <p className="text-xs font-medium text-slate-300">
                                                กำลังพักผ่อนรวบรวมเวทมนตร์ 🍃
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Feeling Display inside menu */}
                            {activeMenuPlayer.feeling && (
                                <div className="bg-slate-900/30 p-2.5 rounded-xl border border-white/5 text-[11px] text-slate-300 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-yellow-450 shrink-0" />
                                    <span>อารมณ์ในจิตใจ: "{activeMenuPlayer.feeling}"</span>
                                </div>
                            )}

                            {/* Interaction action buttons layout */}
                            {!activeMenuPlayer.isSelf && (
                                <div className="flex flex-col gap-2 mt-1">
                                    <span className="text-[10px] font-semibold text-slate-440 uppercase tracking-wider block font-mono">
                                        ส่งสัญญาณโต้ตอบเรียลไทม์
                                    </span>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onReaction(activeMenuPlayer.id, 'heart', activeMenuPlayer.screenX, activeMenuPlayer.screenY);
                                                setSelectedPlayerId(null);
                                            }}
                                            className="py-2.5 px-3 rounded-xl bg-pink-500/10 border border-pink-500/20 text-pink-300 hover:bg-pink-500/20 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Heart className="w-3.5 h-3.5 text-pink-400 fill-pink-400/20" />
                                            <span>ส่งหัวใจ ❤️</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onReaction(activeMenuPlayer.id, 'spell', activeMenuPlayer.screenX, activeMenuPlayer.screenY);
                                                setSelectedPlayerId(null);
                                            }}
                                            className="py-2.5 px-3 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 hover:bg-purple-500/20 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Zap className="w-3.5 h-3.5 text-purple-400" />
                                            <span>ร่ายคาถา ⚡</span>
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PlayerTagOverlay;
