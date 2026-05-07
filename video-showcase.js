const STORAGE_KEY = 'contractbot-showcase-sound';
const players = Array.from(document.querySelectorAll('[data-video-player]'));

const prefersSound = () => {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'on';
  } catch (_) {
    return false;
  }
};

const saveSoundPreference = (enabled) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'on' : 'off');
  } catch (_) {
    // Private browsing can reject localStorage; the controls still work for this session.
  }
};

const setButtonState = (button, enabled) => {
  if (!button) return;
  button.setAttribute('aria-pressed', String(enabled));
  button.setAttribute('aria-label', enabled ? 'Disable sound' : 'Enable sound');
  button.querySelector('.sound-toggle__icon').textContent = enabled ? 'Sound On' : 'Sound Off';
  button.querySelector('.sound-toggle__label').textContent = enabled ? 'Sound on' : 'Enable sound';
};

const fadeVolume = (video, targetVolume) => {
  const startVolume = video.volume || 0;
  const startTime = performance.now();
  const duration = 420;

  const step = (now) => {
    const progress = Math.min((now - startTime) / duration, 1);
    video.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress < 1) requestAnimationFrame(step);
  };

  requestAnimationFrame(step);
};

const mutePlayer = (player, persist = false) => {
  const video = player.querySelector('video');
  const button = player.querySelector('.sound-toggle');
  if (!video) return;

  video.muted = true;
  fadeVolume(video, 0);
  player.classList.remove('is-audible');
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

  video.muted = false;
  video.volume = 0;

  try {
    await video.play();
    fadeVolume(video, 0.86);
    player.classList.add('is-audible');
    setButtonState(button, true);
    saveSoundPreference(true);
  } catch (_) {
    mutePlayer(player, true);
  }
};

players.forEach((player) => {
  const video = player.querySelector('video');
  const button = player.querySelector('.sound-toggle');
  const progress = player.querySelector('.player-progress span');

  if (!video || !button) return;

  video.controls = false;
  video.muted = true;
  video.volume = 0;
  setButtonState(button, false);

  button.addEventListener('click', () => {
    if (video.muted || video.volume === 0) {
      unmutePlayer(player);
    } else {
      mutePlayer(player, true);
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
        const video = entry.target.querySelector('video');
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.28 }
  );

  players.forEach((player) => observer.observe(player));
}

window.addEventListener('pageshow', () => {
  if (!prefersSound()) return;
  players.forEach((player) => player.classList.add('sound-available'));
});
