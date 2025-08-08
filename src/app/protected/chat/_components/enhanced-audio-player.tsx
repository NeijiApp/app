"use client";

import {
	Download,
	Pause,
	Play,
	RotateCcw,
	SkipBack,
	SkipForward,
	Volume2,
	VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";

interface EnhancedAudioPlayerProps {
	audioUrl: string;
	title?: string;
	className?: string;
}

export function EnhancedAudioPlayer({
	audioUrl,
	title = "Meditation Audio",
	className,
}: EnhancedAudioPlayerProps) {
	const [isPlaying, setIsPlaying] = useState(false);
	const [currentTime, setCurrentTime] = useState(0);
	const [duration, setDuration] = useState(0);
	const [volume, setVolume] = useState(1);
	const [isMuted, setIsMuted] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const audioRef = useRef<HTMLAudioElement | null>(null);

	useEffect(() => {
		const audio = new Audio(audioUrl);
		audioRef.current = audio;

		const handleLoadedMetadata = () => {
			setDuration(audio.duration);
			setIsLoading(false);
		};

		const handleTimeUpdate = () => {
			setCurrentTime(audio.currentTime);
		};

		const handleEnded = () => {
			setIsPlaying(false);
			setCurrentTime(0);
		};

		const handleError = () => {
			setIsLoading(false);
			console.error("Audio loading error");
		};

		audio.addEventListener("loadedmetadata", handleLoadedMetadata);
		audio.addEventListener("timeupdate", handleTimeUpdate);
		audio.addEventListener("ended", handleEnded);
		audio.addEventListener("error", handleError);

		return () => {
			audio.pause();
			audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
			audio.removeEventListener("timeupdate", handleTimeUpdate);
			audio.removeEventListener("ended", handleEnded);
			audio.removeEventListener("error", handleError);
		};
	}, [audioUrl]);

	const togglePlayback = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!audioRef.current) return;

		const rect = e.currentTarget.getBoundingClientRect();
		const clickX = e.clientX - rect.left;
		const newTime = (clickX / rect.width) * duration;

		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newVolume = Number.parseFloat(e.target.value);
		setVolume(newVolume);
		if (audioRef.current) {
			audioRef.current.volume = newVolume;
		}
		setIsMuted(newVolume === 0);
	};

	const toggleMute = () => {
		if (!audioRef.current) return;

		if (isMuted) {
			audioRef.current.volume = volume;
			setIsMuted(false);
		} else {
			audioRef.current.volume = 0;
			setIsMuted(true);
		}
	};

	const skipTime = (seconds: number) => {
		if (!audioRef.current) return;

		const newTime = Math.max(0, Math.min(duration, currentTime + seconds));
		audioRef.current.currentTime = newTime;
		setCurrentTime(newTime);
	};

	const restart = () => {
		if (!audioRef.current) return;

		audioRef.current.currentTime = 0;
		setCurrentTime(0);
	};

	const downloadAudio = () => {
		const link = document.createElement("a");
		link.href = audioUrl;
		link.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.mp3`;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const formatTime = (time: number) => {
		const minutes = Math.floor(time / 60);
		const seconds = Math.floor(time % 60);
		return `${minutes}:${seconds.toString().padStart(2, "0")}`;
	};

    const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

    if (isLoading) {
        return (
            <div className={cn("w-full bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl p-4 border border-orange-300", className)}>
                <div className="flex items-center justify-center gap-2 text-orange-700">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600" />
                    <span className="text-sm">Loading audio...</span>
                </div>
            </div>
        );
    }

	return (
        <div className={cn("w-full bg-gradient-to-r from-orange-100 to-orange-200 rounded-xl p-4 border border-orange-300 shadow-lg", className)}>
			{/* Title */}
            <div className="text-center mb-4">
                <h3 className="font-semibold text-orange-800 text-lg">{title}</h3>
                <p className="text-orange-600 text-sm">{formatTime(currentTime)} / {formatTime(duration)}</p>
            </div>

			{/* Progress Bar */}
			<div className="mb-4">
				<div
					className="relative h-2 w-full cursor-pointer overflow-hidden rounded-full bg-orange-200"
					onClick={handleSeek}
				>
					<div
						className="h-full rounded-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-150"
						style={{ width: `${progressPercentage}%` }}
					/>
					<div
						className="-translate-y-0.5 absolute top-0 h-3 w-3 transform rounded-full bg-orange-600 shadow-md transition-all duration-150"
						style={{ left: `calc(${progressPercentage}% - 6px)` }}
					/>
				</div>
			</div>

			{/* Controls */}
			<div className="mb-4 flex items-center justify-between">
				{/* Left Controls */}
				<div className="flex items-center gap-2">
					<Button
						onClick={restart}
						size="sm"
						variant="ghost"
						className="p-2 text-orange-700 hover:bg-orange-200"
					>
						<RotateCcw className="size-4" />
					</Button>

					<Button
						onClick={() => skipTime(-10)}
						size="sm"
						variant="ghost"
						className="p-2 text-orange-700 hover:bg-orange-200"
					>
						<SkipBack className="size-4" />
					</Button>
				</div>

				{/* Play/Pause Button */}
				<Button
					onClick={togglePlayback}
					size="lg"
					className="h-12 w-12 rounded-full bg-orange-500 p-0 text-white shadow-lg hover:bg-orange-600"
				>
					{isPlaying ? (
						<Pause className="size-6" />
					) : (
						<Play className="ml-0.5 size-6" />
					)}
				</Button>

				{/* Right Controls */}
				<div className="flex items-center gap-2">
					<Button
						onClick={() => skipTime(10)}
						size="sm"
						variant="ghost"
						className="p-2 text-orange-700 hover:bg-orange-200"
					>
						<SkipForward className="size-4" />
					</Button>

					<Button
						onClick={downloadAudio}
						size="sm"
						variant="ghost"
						className="p-2 text-orange-700 hover:bg-orange-200"
					>
						<Download className="size-4" />
					</Button>
				</div>
			</div>

			{/* Volume Control */}
			<div className="flex items-center gap-3">
				<Button
					onClick={toggleMute}
					size="sm"
					variant="ghost"
					className="p-2 text-orange-700 hover:bg-orange-200"
				>
					{isMuted ? (
						<VolumeX className="size-4" />
					) : (
						<Volume2 className="size-4" />
					)}
				</Button>

				<div className="flex-1">
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						value={isMuted ? 0 : volume}
						onChange={handleVolumeChange}
						className="slider h-1 w-full cursor-pointer appearance-none rounded-lg bg-orange-200"
						style={{
							background: `linear-gradient(to right, #f97316 0%, #f97316 ${(isMuted ? 0 : volume) * 100}%, #fed7aa ${(isMuted ? 0 : volume) * 100}%, #fed7aa 100%)`,
						}}
					/>
				</div>

				<span className="min-w-[30px] text-right text-orange-600 text-xs">
					{Math.round((isMuted ? 0 : volume) * 100)}%
				</span>
			</div>

			<style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
        
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #ea580c;
          cursor: pointer;
          border: none;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }
      `}</style>
		</div>
	);
}
