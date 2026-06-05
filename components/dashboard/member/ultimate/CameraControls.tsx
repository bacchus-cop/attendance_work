import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { EdgeAwareTooltip } from './EdgeAwareTooltip';

interface CameraControlsProps {
    zoom: number;
    onZoomIn: () => void;
    onZoomOut: () => void;
    onRecenter: () => void;
}

export const CameraControls: React.FC<CameraControlsProps> = ({
    zoom,
    onZoomIn,
    onZoomOut,
    onRecenter
}) => {
    return (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 bg-[#121424]/90 border border-slate-700/60 p-2 rounded-2xl shadow-2xl z-20 pointer-events-auto">
            <EdgeAwareTooltip
                content={
                    <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-indigo-300">ซูมเข้า (+15%)</span>
                        <span className="text-[10px] text-slate-400">เลื่อนดึงมุมมองเข้ามาใกล้ เพื่อรับชมนักรบพิกเซลรายละเอียดสูง</span>
                    </div>
                }
                placement="top"
                delay={100}
            >
                <button
                    type="button"
                    onClick={onZoomIn}
                    className="hud-button w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-indigo-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                    <ZoomIn className="w-5 h-5 pointer-events-none" />
                </button>
            </EdgeAwareTooltip>

            <div className="w-px h-6 bg-slate-800" />

            <EdgeAwareTooltip
                content={
                    <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-indigo-300">ซูมออก (-15%)</span>
                        <span className="text-[10px] text-slate-400">ขยายวิสัยทัศน์กว้างขึ้น เพื่อรับภาพรวมแผนที่ห้องทำงานมนตราทั้งหมด</span>
                    </div>
                }
                placement="top"
                delay={100}
            >
                <button
                    type="button"
                    onClick={onZoomOut}
                    className="hud-button w-9 h-9 flex items-center justify-center text-indigo-300 hover:text-indigo-100 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                    <ZoomOut className="w-5 h-5 pointer-events-none" />
                </button>
            </EdgeAwareTooltip>

            <div className="w-px h-6 bg-slate-800" />

            <EdgeAwareTooltip
                content={
                    <div className="flex flex-col gap-0.5">
                        <span className="font-extrabold text-pink-400">จัดตำแหน่งหน้าตรง 📌</span>
                        <span className="text-[10px] text-slate-400">รีเซ็ตพิกัดตำแหน่งกล้อง และขนาดการสเกลกลับสู่ค่ามาตรฐาน 100%</span>
                    </div>
                }
                placement="top"
                delay={100}
            >
                <button
                    type="button"
                    onClick={onRecenter}
                    className="hud-button w-9 h-9 flex items-center justify-center text-rose-450 hover:text-rose-300 hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
                >
                    <Maximize2 className="w-4 h-4 pointer-events-none" />
                </button>
            </EdgeAwareTooltip>

            <span className="text-[10px] font-mono text-slate-500 font-bold px-1.5 min-w-[32px] text-center">
                {Math.round(zoom * 100)}%
            </span>
        </div>
    );
};

export default CameraControls;
