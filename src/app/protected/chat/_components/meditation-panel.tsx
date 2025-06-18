"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { 
  Clock, 
  User, 
  Target, 
  Volume2, 
  GraduationCap,
  Play,
  Sunrise,
  Focus,
  Moon,
  Waves,
  ChevronsDown,
  ChevronsUp
} from "lucide-react";
import { cn } from "~/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

export interface MeditationParams {
  duration: number;
  gender: 'male' | 'female';
  guidance: 'beginner' | 'confirmed' | 'expert';
  background: 'silence' | 'waves' | 'rain' | 'focus' | 'relax';
  goal: 'morning' | 'focus' | 'calm' | 'sleep';
}

interface MeditationPanelProps {
  onGenerate: (params: MeditationParams) => void;
  isGenerating: boolean;
  isExpanded: boolean;
  toggleExpand: () => void;
}

const DURATION_OPTIONS = [2, 3, 5, 7, 10];
const GENDER_OPTIONS = [
  { value: 'female' as const, label: 'Female', voiceId: 'g6xIsTj2HwM6VR4iXFCw' },
  { value: 'male' as const, label: 'Male', voiceId: 'GUDYcgRAONiI1nXDcNQQ' }
];
const GUIDANCE_OPTIONS = [
  { value: 'beginner' as const, label: 'Beginner', description: 'Detailed guidance' },
  { value: 'confirmed' as const, label: 'Confirmed', description: 'Balanced guidance' },
  { value: 'expert' as const, label: 'Expert', description: 'Minimal guidance' }
];
const BACKGROUND_OPTIONS = [
  { value: 'silence' as const, label: 'Silence', icon: Volume2 },
  { value: 'waves' as const, label: 'Ocean Waves', icon: Waves },
  { value: 'rain' as const, label: 'Rain', icon: Volume2 },
  { value: 'focus' as const, label: 'Focus', icon: Focus },
  { value: 'relax' as const, label: 'Relax', icon: Volume2 }
];
const GOAL_OPTIONS = [
  { value: 'morning' as const, label: 'Morning', icon: Sunrise, color: 'bg-yellow-100 text-yellow-800' },
  { value: 'focus' as const, label: 'Focus', icon: Focus, color: 'bg-blue-100 text-blue-800' },
  { value: 'calm' as const, label: 'Calm', icon: Target, color: 'bg-green-100 text-green-800' },
  { value: 'sleep' as const, label: 'Sleep', icon: Moon, color: 'bg-purple-100 text-purple-800' }
];


export function MeditationPanel({ onGenerate, isGenerating, isExpanded, toggleExpand }: MeditationPanelProps) {
  const [params, setParams] = useState<MeditationParams>({
    duration: 5,
    gender: 'female',
    guidance: 'confirmed',
    background: 'silence',
    goal: 'calm'
  });

  const handleGenerate = () => {
    onGenerate(params);
  };

  const CompactView = () => (
    <div className="p-3 space-y-3">
      {/* Quick Actions: Duration & Goal */}
      <div className="flex gap-2">
        <div className="flex-1 grid grid-cols-3 gap-1.5">
          {DURATION_OPTIONS.slice(0,3).map((duration) => (
            <Tooltip key={duration} delayDuration={0}>
              <TooltipTrigger asChild>
                <Button
                  key={duration}
                  variant={params.duration === duration ? "default" : "outline"}
                  size="sm"
                  onClick={() => setParams(prev => ({ ...prev, duration }))}
                  className={cn("min-w-[40px] h-9 text-xs", params.duration === duration ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}
                >
                  {duration}m
                </Button>
              </TooltipTrigger>
              <TooltipContent><p>{duration} minutes</p></TooltipContent>
            </Tooltip>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-2 gap-1.5">
           {GENDER_OPTIONS.map((gender) => (
              <Tooltip key={gender.value} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={params.gender === gender.value ? "default" : "outline"}
                    size="icon"
                    onClick={() => setParams(prev => ({ ...prev, gender: gender.value }))}
                    className={cn("h-9 w-full", params.gender === gender.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}
                  >
                    <User className="size-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{gender.label} Voice</p></TooltipContent>
              </Tooltip>
            ))}
        </div>
      </div>
       <div className="flex-1 grid grid-cols-4 gap-1.5">
          {GOAL_OPTIONS.map((goal) => {
            const Icon = goal.icon;
            return (
               <Tooltip key={goal.value} delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    variant={params.goal === goal.value ? "default" : "outline"}
                    size="icon"
                    onClick={() => setParams(prev => ({ ...prev, goal: goal.value }))}
                    className={cn("h-9 w-full", params.goal === goal.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}
                  >
                    <Icon className="size-4"/>
                  </Button>
                </TooltipTrigger>
                <TooltipContent><p>{goal.label}</p></TooltipContent>
              </Tooltip>
            )
          })}
        </div>
    </div>
  );

  const ExpandedView = () => (
    <div className="p-6 space-y-6">
      {/* Duration Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-800 font-medium">
          <Clock className="size-4" />
          Duration
        </div>
        <div className="flex gap-2 flex-wrap">
          {DURATION_OPTIONS.map((duration) => (
            <Button key={duration} variant={params.duration === duration ? "default" : "outline"} size="sm" onClick={() => setParams(prev => ({ ...prev, duration }))} className={cn("min-w-[60px]", params.duration === duration ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}>
              {duration}min
            </Button>
          ))}
        </div>
      </div>

      {/* Gender Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-800 font-medium">
          <User className="size-4" />
          Voice Gender
        </div>
        <div className="flex gap-2">
          {GENDER_OPTIONS.map((gender) => (
            <Button key={gender.value} variant={params.gender === gender.value ? "default" : "outline"} size="sm" onClick={() => setParams(prev => ({ ...prev, gender: gender.value }))} className={cn("flex-1", params.gender === gender.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}>
              {gender.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Guidance Level */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-800 font-medium">
          <GraduationCap className="size-4" />
          Guidance Level
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {GUIDANCE_OPTIONS.map((guidance) => (
            <Button key={guidance.value} variant={params.guidance === guidance.value ? "default" : "outline"} size="sm" onClick={() => setParams(prev => ({ ...prev, guidance: guidance.value }))} className={cn("h-auto p-3 flex flex-col items-center text-center", params.guidance === guidance.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}>
              <span className="font-medium">{guidance.label}</span>
              <span className="text-xs opacity-80">{guidance.description}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Background Sound */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-800 font-medium">
          <Volume2 className="size-4" />
          Background Sound
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BACKGROUND_OPTIONS.map((background) => {
            const Icon = background.icon;
            return (
              <Button key={background.value} variant={params.background === background.value ? "default" : "outline"} size="sm" onClick={() => setParams(prev => ({ ...prev, background: background.value }))} className={cn("h-auto p-3 flex flex-col items-center gap-1", params.background === background.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}>
                <Icon className="size-4" />
                <span className="text-xs">{background.label}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* Goal Selection */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-orange-800 font-medium">
          <Target className="size-4" />
          Meditation Goal
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GOAL_OPTIONS.map((goal) => {
            const Icon = goal.icon;
            return (
              <Button key={goal.value} variant={params.goal === goal.value ? "default" : "outline"} size="sm" onClick={() => setParams(prev => ({ ...prev, goal: goal.value }))} className={cn("h-auto p-3 flex items-center gap-2 justify-start", params.goal === goal.value ? "bg-orange-500 text-white" : "border-orange-300 text-orange-700")}>
                <Icon className="size-4" />
                <span className="text-sm">{goal.label}</span>
              </Button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl mx-auto bg-gradient-to-br from-orange-50/95 to-orange-100/95 border border-orange-200 rounded-lg shadow-lg backdrop-blur-md">
        {/* Header */}
        <div className="text-center p-3 border-b border-orange-200 flex justify-between items-center">
          <div/>
          <h2 className="text-lg font-bold text-orange-800 flex items-center justify-center gap-2">
            <Target className="size-5" />
            Meditation Mode
          </h2>
          <Button size="icon" variant="ghost" onClick={toggleExpand} className="text-orange-600 hover:bg-orange-200">
            {isExpanded ? <ChevronsDown className="size-4"/> : <ChevronsUp className="size-4"/>}
          </Button>
        </div>
        
        {isExpanded ? <ExpandedView /> : <CompactView />}

        {/* Generate Button */}
        <div className="p-3 border-t border-orange-200">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 text-base font-medium"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Play className="size-4 mr-2" />
                Generate Meditation
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
} 