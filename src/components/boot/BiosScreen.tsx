import { useEffect, useRef, useState } from 'react';
import { useOSStore } from '@/store/useOSStore';

const biosLines = [
  'Award Modular BIOS v4.51PG, An Energy Star Ally',
  'Copyright (C) 1984-98, Award Software, Inc.',
  '',
  'Intel Pentium MMX CPU at 233MHz',
  'Memory Test : 65536K OK',
  '',
  'Award Plug and Play BIOS Extension v1.0A',
  'Copyright (C) 1996, Award Software, Inc.',
  '',
  'Detecting IDE drives ...',
  'Primary Master : ST32140A 2.1GB',
  'Primary Slave  : None',
  'Secondary Master: CREATIVE CD5230E',
  'Secondary Slave : None',
  '',
  'Floppy Disk(s) : 1.44M',
  'Serial Port(s) : 3F8 2F8',
  'Parallel Port(s) : 378',
  '',
  'UMB PCI Bus Info',
  '  PCI IRQ Mapping Enabled',
  '  Slot 1 : VGA           IRQ 11',
  '  Slot 2 : Sound Blaster  IRQ 5',
  '  Slot 3 : Network Card  IRQ 10',
  '',
  'Detecting DMI Pool Data .............. Update Success',
  '',
  'Verifying DMI Pool Data ..............',
  'Boot from ATAPI CD-ROM :',
  'DISK BOOT SUCCESS, SYSTEM STARTING...',
];

export default function BiosScreen() {
  const { bootProgress, setBootProgress, setBootPhase } = useOSStore();
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);
  const isComplete = currentLineIndex >= biosLines.length;

  useEffect(() => {
    if (isComplete) {
      const timer = window.setTimeout(() => {
        setBootPhase('loading');
      }, 1500);
      return () => window.clearTimeout(timer);
    }

    const currentLine = biosLines[currentLineIndex];
    
    if (currentCharIndex < currentLine.length) {
      timeoutRef.current = window.setTimeout(() => {
        setCurrentCharIndex((prev) => prev + 1);
      }, 15);
    } else {
      timeoutRef.current = window.setTimeout(() => {
        setDisplayedLines((prev) => [...prev, currentLine]);
        setCurrentLineIndex((prev) => prev + 1);
        setCurrentCharIndex(0);
        
        const progress = Math.min(
          50,
          Math.floor(((currentLineIndex + 1) / biosLines.length) * 50)
        );
        setBootProgress(progress);
      }, 80);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [currentLineIndex, currentCharIndex, isComplete, setBootProgress, setBootPhase]);

  const currentLine = biosLines[currentLineIndex] || '';
  const currentTypingText = currentLine.slice(0, currentCharIndex);

  return (
    <div
      className="flex flex-col h-full w-full p-6 font-mono text-sm overflow-hidden"
      style={{
        backgroundColor: '#000000',
        color: '#ffffff',
      }}
    >
      <div className="flex-1 flex flex-col gap-0.5">
        {displayedLines.map((line, index) => (
          <div key={index} className="whitespace-pre">
            {line || '\u00A0'}
          </div>
        ))}
        {!isComplete && (
          <div className="whitespace-pre flex items-start">
            <span>{currentTypingText}</span>
            <span
              className="inline-block w-2 h-4 ml-0.5 animate-pulse"
              style={{
                backgroundColor: '#ffffff',
              }}
            />
          </div>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between mb-1 text-xs">
          <span>System Boot Progress</span>
          <span>{bootProgress}%</span>
        </div>
        <div
          className="w-full h-4 border-2"
          style={{
            borderColor: 'var(--os-buttonHighlight, #ffffff)',
            backgroundColor: '#000000',
          }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${bootProgress}%`,
              backgroundColor: 'var(--os-accent, #000080)',
            }}
          />
        </div>
      </div>
    </div>
  );
}
