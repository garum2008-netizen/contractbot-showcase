const SOUND_KEY = 'contractbot-showcase-sound';
const ACTIVE_KEY = 'contractbot-showcase-active-video';
const players = Array.from(document.querySelectorAll('[data-video-player]'));
const volumeAnimations = new WeakMap();

const prefersSound = () => {
  try {
    return window.localStorage.getItem(SOUND_KEY) === 'on';
  } catch (_) {
    return false;
  }
};

const saveSoundPreference = (enabled) => {
  try {
    window.localStorage.setItem(SOUND_KEY, enabled ? 'on' : 'off');
  } catch (_) {
    // Private browsing can reject localStorage; the controls still work for this session.
  }
};

const saveActiveVideo = (player) => {
  try {
    window.localStorage.setItem(ACTIVE_KEY, player.dataset.title || '');
  } catch (_) {
    // Non-essential preference only.
  }
};

const setButtonState = (button, enabled) => {
  if (!button) return;
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? 'Disable sound' : 'Enable sound');
  button.querySelector('.sound-toggle__icon').textContent = enabled ? 'Sound On' : 'Sound Off';
  button.querySelector('.sound-toggle__label').textContent = enabled ? 'Sound on' : 'Enable sound';
};

const setPlayerState = (player, state) => {
  player.dataset.audioState = state;
  player.classList.toggle('is-audible', state === 'audible');
  player.classList.toggle('is-blocked', state === 'blocked');
};

const fadeVolume = (video, targetVolume, duration = 420) => {
  if (volumeAnimations.has(video)) {
    cancelAnimationFrame(volumeAnimations.get(video));
  }

  const startVolume = video.volume || 0;
  const startTime = performance.now();

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    video.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) {
      volumeAnimations.set(video, requestAnimationFrame(step));
    } else {
      video.volume = targetVolume;
      volumeAnimations.delete(video);
    }
  };

  volumeAnimations.set(video, requestAnimationFrame(step));
};

const prepareInlinePlayback = (video) => {
  video.controls = false;
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
};

const playVideo = async (video) => {
  prepareInlinePlayback(video);
  const playPromise = video.play();
  if (playPromise && typeof playPromise.then === 'function') {
    await playPromise;
  }
};

const mutePlayer = (player, persist = false) => {
  const video = player.querySelector('video');
  const button = player.querySelector('.sound-toggle');
  if (!video) return;

  if (volumeAnimations.has(video)) {
    cancelAnimationFrame(volumeAnimations.get(video));
    volumeAnimations.delete(video);
  }

  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.volume = 0;
  setPlayerState(player, 'muted');
  setButtonState(button, false);
  if (persist) saveSoundPreference(false);
};

const unmutePlayer = async (player) => {
  const video = player.querySelector('video');
  const button = player.querySelector('.sound-toggle');
  if (!video) return;

  players.forEach((otherPlayer) => {
    if (otherPlayer !== player) mutePlayer(otherPlayer);
  });

  setPlayerState(player, 'pending');
  prepareInlinePlayback(video);
  video.removeAttribute('muted');
  video.defaultMuted = false;
  video.muted = false;
  video.volume = 0;

  try {
    await playVideo(video);
    if (video.muted) video.muted = false;
    fadeVolume(video, 0.86);
    setPlayerState(player, 'audible');
    setButtonState(button, true);
    saveSoundPreference(true);
    saveActiveVideo(player);
  } catch (_) {
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.volume = 0;
    setPlayerState(player, 'blocked');
    setButtonState(button, false);
    button.querySelector('.sound-toggle__label').textContent = 'Tap again';
    saveSoundPreference(false);
  }
};

players.forEach((player) => {
  const video = player.querySelector('video');
  const button = player.querySelector('.sound-toggle');
  const progress = player.querySelector('.player-progress span');

  if (!video || !button) return;

  prepareInlinePlayback(video);
  video.muted = true;
  video.defaultMuted = true;
  video.volume = 0;
  video.setAttribute('muted', '');
  setButtonState(button, false);
  setPlayerState(player, prefersSound() ? 'preferred' : 'muted');

  button.addEventListener('click', () => {
    if (video.muted || video.volume === 0) {
      unmutePlayer(player);
    } else {
      mutePlayer(player, true);
    }
  });

  video.addEventListener('volumechange', () => {
    const enabled = !video.muted && video.volume > 0;
    setButtonState(button, enabled);
    setPlayerState(player, enabled ? 'audible' : 'muted');
  });

  video.addEventListener('pause', () => {
    if (!video.muted && player.dataset.inViewport === 'true') {
      playVideo(video).catch(() => mutePlayer(player, true));
    }
  });

  video.addEventListener('timeupdate', () => {
    if (!progress || !video.duration) return;
    progress.style.transform = `scaleX(${video.currentTime / video.duration})`;
  });

  video.addEventListener('ended', () => {
    if (progress) progress.style.transform = 'scaleX(0)';
  });
});

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.dataset.inViewport = String(entry.isIntersecting);
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting) {
          playVideo(video).catch(() => {});
        } else {
          if (!video.muted) mutePlayer(entry.target);
          video.pause();
        }
      });
    },
    { threshold: 0.28 }
  );

  players.forEach((player) => observer.observe(player));
}

window.addEventListener('pageshow', () => {
  players.forEach((player) => {
    player.classList.toggle('sound-preferred', prefersSound());
  });
});
