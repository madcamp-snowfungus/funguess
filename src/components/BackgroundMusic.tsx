// src/components/BackgroundMusic.tsx
'use client'

import React, { useEffect, useRef } from 'react';

const BackgroundMusic = () => {
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;

        if (audio) {
            const playAudio = () => {
                audio.play().catch(() => {
                    console.log('AutoPlay blocked. Wait.');
                });
            };

            playAudio();

            document.addEventListener('click', playAudio, { once: true });

            return () => {
                document.removeEventListener('click', playAudio);
            };
        }
    }, []);

    return (
        <audio ref={audioRef} loop>
            <source src="/hall-of-the-mountain-king.mp3" type="audio/mpeg" />
            브라우저가 audio를 지원하지 않습니다.
        </audio>
    );
};

export default BackgroundMusic;