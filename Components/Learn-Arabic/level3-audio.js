(() => {
  'use strict';

  const audioDirectory = '../../audios/level-3-words/';
  const filenameOverrides = new Map([
    ['مُعَلِّمٌ', 'مُعَلِّمٌ.mp3'],
    ['كُرْسِيٌّ', 'كُرْسِيٌّ.mp3']
  ]);
  const filesByWord = new Map();
  let activeAudio = null;

  window.Level3Letters.forEach(letter => {
    [...letter.forms, letter.gameWord].forEach(word => {
      if (!filesByWord.has(word)) {
        filesByWord.set(word, filenameOverrides.get(word) || `${word}.mp3`);
      }
    });
  });

  function stop() {
    if (!activeAudio) return;
    activeAudio.pause();
    activeAudio.currentTime = 0;
    activeAudio = null;
  }

  function play(word) {
    stop();
    const filename = filesByWord.get(word);
    if (!filename) {
      const error = new Error(`No Level 3 audio mapping exists for "${word}"`);
      console.error(error.message);
      return Promise.reject(error);
    }

    const audio = new Audio(`${audioDirectory}${encodeURIComponent(filename)}`);
    audio.preload = 'auto';
    activeAudio = audio;
    audio.addEventListener('ended', () => {
      if (activeAudio === audio) activeAudio = null;
    });
    audio.addEventListener('error', () => {
      console.error(`Unable to load Level 3 word audio for "${word}":`, audio.src);
      if (activeAudio === audio) activeAudio = null;
    });

    return audio.play().catch(error => {
      console.error(`Unable to play Level 3 word audio for "${word}":`, error);
      if (activeAudio === audio) stop();
      throw error;
    });
  }

  window.Level3Audio = { play, stop };
})();
