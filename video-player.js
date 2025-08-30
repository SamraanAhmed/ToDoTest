// Video Player JavaScript

// TMDB API configuration
const TMDB_API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const loadingContainer = document.getElementById('loading');
const videoContainer = document.getElementById('video-container');
const errorState = document.getElementById('error-state');
const backBtn = document.querySelector('.back-btn');

// Video Elements
const mainVideo = document.getElementById('main-video');
const videoSource = document.getElementById('video-source');
const videoControls = document.getElementById('video-controls');

// Control Elements
const backVideoBtn = document.getElementById('back-video');
const playPauseBtn = document.getElementById('play-pause-btn');
const playPauseSmallBtn = document.getElementById('play-pause-small');
const rewindBtn = document.getElementById('rewind-btn');
const forwardBtn = document.getElementById('forward-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const volumeBtn = document.getElementById('volume-btn');
const settingsBtn = document.getElementById('settings-btn');
const subtitlesBtn = document.getElementById('subtitles-btn');

// Progress Elements
const progressBar = document.getElementById('progress-bar');
const progressFilled = document.getElementById('progress-filled');
const progressHandle = document.getElementById('progress-handle');
const currentTimeDisplay = document.getElementById('current-time');
const totalTimeDisplay = document.getElementById('total-time');

// Volume Elements
const volumeSlider = document.getElementById('volume-slider');
const volumeFilled = document.getElementById('volume-filled');
const volumeHandle = document.getElementById('volume-handle');

// Icon Elements
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const playIconSmall = document.getElementById('play-icon-small');
const pauseIconSmall = document.getElementById('pause-icon-small');
const fullscreenIcon = document.getElementById('fullscreen-icon');
const fullscreenExitIcon = document.getElementById('fullscreen-exit-icon');
const volumeIcon = document.getElementById('volume-icon');

// Info Elements
const videoTitle = document.getElementById('video-title');
const videoTitleCompact = document.getElementById('video-title-compact');
const videoYear = document.getElementById('video-year');
const videoDuration = document.getElementById('video-duration');
const videoRating = document.getElementById('video-rating');

// Video State
let isPlaying = false;
let currentVolume = 1;
let isMuted = false;
let isFullscreen = false;
let controlsTimeout;
let currentMovieData = null;

// Sample video URLs for demo (you can replace with actual trailer URLs)
const sampleVideos = {
  trailer: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  movie: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
  default: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
};

// Initialize the video player
document.addEventListener('DOMContentLoaded', initializeVideoPlayer);

function initializeVideoPlayer() {
  setupEventListeners();
  
  // Get video parameters from URL
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');
  const mediaType = urlParams.get('type') || 'movie';
  const videoType = urlParams.get('video') || 'trailer'; // 'trailer' or 'movie'
  
  if (movieId) {
    loadVideoContent(movieId, mediaType, videoType);
  } else {
    showError();
  }
}

async function loadVideoContent(movieId, mediaType, videoType) {
  try {
    showLoading();
    
    // Fetch movie/TV show details
    const detailsResponse = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}?api_key=${TMDB_API_KEY}`);
    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch movie details');
    }
    const movieDetails = await detailsResponse.json();
    currentMovieData = movieDetails;
    
    // Fetch videos (trailers, etc.)
    const videosResponse = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    const videosData = videosResponse.ok ? await videosResponse.json() : null;
    
    // Try to find appropriate video
    let videoUrl = null;
    let hasTrailer = false;
    
    if (videosData && videosData.results && videosData.results.length > 0) {
      // Look for trailers and teasers
      const availableVideos = videosData.results.filter(video => 
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      );
      
      if (availableVideos.length > 0) {
        hasTrailer = true;
        const preferredVideo = availableVideos.find(video => video.type === 'Trailer') || availableVideos[0];
        
        if (videoType === 'trailer' || videoType === 'movie') {
          // For both trailer and movie requests, show the available trailer
          // In a real implementation, you'd embed YouTube player or convert URL
          videoUrl = `https://www.youtube.com/embed/${preferredVideo.key}?autoplay=1&controls=0&modestbranding=1&rel=0`;
        }
      }
    }
    
    // If no video found from TMDB, use sample videos
    if (!videoUrl) {
      if (videoType === 'trailer' && hasTrailer === false) {
        showNotification('No trailer available. Loading sample content...');
      }
      
      // Use sample videos as fallback
      const sampleUrls = [
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
      ];
      
      // Pick a random sample video
      videoUrl = sampleUrls[Math.floor(Math.random() * sampleUrls.length)];
    }
    
    // Load video and display content
    await loadVideo(videoUrl, movieDetails, mediaType, videoType);
    
  } catch (error) {
    console.error('Error loading video content:', error);
    showError();
  }
}

async function loadVideo(videoUrl, movieDetails, mediaType, videoType) {
  try {
    // Update video info
    updateVideoInfo(movieDetails, mediaType, videoType);
    
    // Check if we have a valid video URL
    if (!videoUrl || videoUrl === 'null') {
      throw new Error('No video available');
    }
    
    // Load video
    videoSource.src = videoUrl;
    mainVideo.load();
    
    // Wait for video to be ready
    const loadPromise = new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Video loading timeout'));
      }, 10000); // 10 second timeout
      
      mainVideo.addEventListener('loadedmetadata', () => {
        clearTimeout(timeoutId);
        resolve();
      }, { once: true });
      
      mainVideo.addEventListener('error', () => {
        clearTimeout(timeoutId);
        reject(new Error('Video failed to load'));
      }, { once: true });
    });
    
    await loadPromise;
    hideLoading();
    updateTimeDisplays();
    loadRelatedContent(movieDetails.id, mediaType);
    
  } catch (error) {
    console.error('Error loading video:', error);
    handleVideoError(movieDetails, mediaType, videoType);
  }
}

function handleVideoError(movieDetails, mediaType, videoType) {
  // If original video failed and it wasn't a trailer, try to load trailer
  if (videoType !== 'trailer') {
    showNotification('Movie not available. Trying to load trailer...');
    setTimeout(() => {
      const movieId = movieDetails.id;
      window.location.href = `video-player.html?id=${movieId}&type=${mediaType}&video=trailer`;
    }, 2000);
  } else {
    // Show error state with options
    showError();
  }
}

function updateVideoInfo(movie, mediaType, videoType) {
  const title = movie.title || movie.name;
  const videoTypeText = videoType === 'movie' ? '' : ' (Trailer)';
  
  videoTitle.textContent = title + videoTypeText;
  videoTitleCompact.textContent = title;
  
  // Update metadata
  const releaseDate = movie.release_date || movie.first_air_date;
  if (releaseDate) {
    videoYear.textContent = new Date(releaseDate).getFullYear();
  }
  
  const runtime = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]);
  if (runtime) {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    videoDuration.textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  
  if (movie.vote_average) {
    videoRating.textContent = `★ ${movie.vote_average.toFixed(1)}`;
  }
  
  // Update page title
  document.title = `${title} - Netflix Clone`;
}

async function loadRelatedContent(movieId, mediaType) {
  try {
    // Fetch similar movies/shows
    const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}/similar?api_key=${TMDB_API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      displayRelatedContent(data.results.slice(0, 8));
    }
  } catch (error) {
    console.warn('Failed to load related content:', error);
  }
}

function displayRelatedContent(items) {
  const relatedGrid = document.getElementById('related-grid');
  relatedGrid.innerHTML = '';
  
  items.forEach(item => {
    const card = createRelatedCard(item);
    relatedGrid.appendChild(card);
  });
}

function createRelatedCard(item) {
  const card = document.createElement('div');
  card.className = 'related-card';
  
  const title = item.title || item.name;
  const imageUrl = item.poster_path ? `${TMDB_IMAGE_BASE_URL}${item.poster_path}` : '';
  const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
  
  card.innerHTML = `
    ${imageUrl ? 
      `<img src="${imageUrl}" alt="${title}" class="related-poster" loading="lazy">` :
      `<div class="related-poster" style="background: linear-gradient(135deg, #333, #666); display: flex; align-items: center; justify-content: center; color: #fff; font-weight: bold;">${title}</div>`
    }
    <div class="related-info">
      <div class="related-title">${title}</div>
      ${rating ? `<div class="related-rating">★ ${rating}</div>` : ''}
    </div>
  `;
  
  card.addEventListener('click', () => {
    const mediaType = item.title ? 'movie' : 'tv';
    window.location.href = `movie-details.html?id=${item.id}&type=${mediaType}`;
  });
  
  return card;
}

function setupEventListeners() {
  // Back button
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
  });
  
  backVideoBtn.addEventListener('click', () => {
    window.history.back();
  });
  
  // Video events
  mainVideo.addEventListener('click', togglePlayPause);
  mainVideo.addEventListener('timeupdate', updateProgress);
  mainVideo.addEventListener('loadedmetadata', updateTimeDisplays);
  mainVideo.addEventListener('play', onVideoPlay);
  mainVideo.addEventListener('pause', onVideoPause);
  mainVideo.addEventListener('ended', onVideoEnded);
  
  // Play/Pause buttons
  playPauseBtn.addEventListener('click', togglePlayPause);
  playPauseSmallBtn.addEventListener('click', togglePlayPause);
  
  // Seek buttons
  rewindBtn.addEventListener('click', () => seekVideo(-10));
  forwardBtn.addEventListener('click', () => seekVideo(10));
  
  // Progress bar
  progressBar.addEventListener('click', handleProgressClick);
  progressBar.addEventListener('mousedown', startProgressDrag);
  
  // Volume controls
  volumeBtn.addEventListener('click', toggleMute);
  volumeSlider.addEventListener('click', handleVolumeClick);
  volumeSlider.addEventListener('mousedown', startVolumeDrag);
  
  // Fullscreen
  fullscreenBtn.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', onFullscreenChange);
  
  // Keyboard controls
  document.addEventListener('keydown', handleKeyboard);
  
  // Mouse movement for controls
  videoContainer.addEventListener('mousemove', showControls);
  videoContainer.addEventListener('mouseleave', hideControlsDelayed);
  
  // Touch events for mobile
  videoContainer.addEventListener('touchstart', showControls);
  videoContainer.addEventListener('touchend', hideControlsDelayed);
  
  // Try trailer button in error state
  document.getElementById('try-trailer').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const mediaType = urlParams.get('type') || 'movie';
    
    if (movieId) {
      // Reload with trailer
      window.location.href = `video-player.html?id=${movieId}&type=${mediaType}&video=trailer`;
    }
  });
  
  // Browse similar content button
  document.getElementById('browse-similar').addEventListener('click', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const movieId = urlParams.get('id');
    const mediaType = urlParams.get('type') || 'movie';
    
    if (movieId) {
      // Go back to movie details page
      window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`;
    } else {
      // Go to home page
      window.location.href = 'index.html';
    }
  });
}

function togglePlayPause() {
  if (isPlaying) {
    pauseVideo();
  } else {
    playVideo();
  }
}

function playVideo() {
  mainVideo.play();
}

function pauseVideo() {
  mainVideo.pause();
}

function onVideoPlay() {
  isPlaying = true;
  updatePlayPauseButtons();
}

function onVideoPause() {
  isPlaying = false;
  updatePlayPauseButtons();
}

function onVideoEnded() {
  isPlaying = false;
  updatePlayPauseButtons();
  // Show related content or replay options
  showNotification('Video ended. Check out related content below!');
}

function updatePlayPauseButtons() {
  if (isPlaying) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    playIconSmall.style.display = 'none';
    pauseIconSmall.style.display = 'block';
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    playIconSmall.style.display = 'block';
    pauseIconSmall.style.display = 'none';
  }
}

function seekVideo(seconds) {
  const newTime = mainVideo.currentTime + seconds;
  mainVideo.currentTime = Math.max(0, Math.min(newTime, mainVideo.duration));
  showNotification(`${seconds > 0 ? 'Forward' : 'Rewind'} ${Math.abs(seconds)}s`);
}

function updateProgress() {
  if (mainVideo.duration) {
    const progress = (mainVideo.currentTime / mainVideo.duration) * 100;
    progressFilled.style.width = `${progress}%`;
    progressHandle.style.left = `${progress}%`;
  }
  updateTimeDisplays();
}

function updateTimeDisplays() {
  currentTimeDisplay.textContent = formatTime(mainVideo.currentTime);
  totalTimeDisplay.textContent = formatTime(mainVideo.duration || 0);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function handleProgressClick(e) {
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const progress = clickX / rect.width;
  mainVideo.currentTime = progress * mainVideo.duration;
}

function startProgressDrag(e) {
  e.preventDefault();
  document.addEventListener('mousemove', dragProgress);
  document.addEventListener('mouseup', stopProgressDrag);
}

function dragProgress(e) {
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const progress = Math.max(0, Math.min(1, clickX / rect.width));
  mainVideo.currentTime = progress * mainVideo.duration;
}

function stopProgressDrag() {
  document.removeEventListener('mousemove', dragProgress);
  document.removeEventListener('mouseup', stopProgressDrag);
}

function toggleMute() {
  if (isMuted) {
    mainVideo.volume = currentVolume;
    isMuted = false;
    updateVolumeIcon();
  } else {
    currentVolume = mainVideo.volume;
    mainVideo.volume = 0;
    isMuted = true;
    updateVolumeIcon();
  }
}

function updateVolumeIcon() {
  // Update volume icon based on current state
  if (isMuted || mainVideo.volume === 0) {
    volumeIcon.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
  } else if (mainVideo.volume < 0.5) {
    volumeIcon.innerHTML = '<path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/>';
  } else {
    volumeIcon.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
  }
}

function handleVolumeClick(e) {
  const rect = volumeSlider.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const volume = clickX / rect.width;
  mainVideo.volume = Math.max(0, Math.min(1, volume));
  isMuted = false;
  updateVolumeDisplay();
  updateVolumeIcon();
}

function startVolumeDrag(e) {
  e.preventDefault();
  document.addEventListener('mousemove', dragVolume);
  document.addEventListener('mouseup', stopVolumeDrag);
}

function dragVolume(e) {
  const rect = volumeSlider.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const volume = Math.max(0, Math.min(1, clickX / rect.width));
  mainVideo.volume = volume;
  isMuted = false;
  updateVolumeDisplay();
  updateVolumeIcon();
}

function stopVolumeDrag() {
  document.removeEventListener('mousemove', dragVolume);
  document.removeEventListener('mouseup', stopVolumeDrag);
}

function updateVolumeDisplay() {
  const volumePercent = mainVideo.volume * 100;
  volumeFilled.style.width = `${volumePercent}%`;
  volumeHandle.style.left = `${volumePercent}%`;
}

function toggleFullscreen() {
  if (!isFullscreen) {
    if (videoContainer.requestFullscreen) {
      videoContainer.requestFullscreen();
    } else if (videoContainer.webkitRequestFullscreen) {
      videoContainer.webkitRequestFullscreen();
    } else if (videoContainer.msRequestFullscreen) {
      videoContainer.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

function onFullscreenChange() {
  isFullscreen = !!document.fullscreenElement;
  updateFullscreenButton();
}

function updateFullscreenButton() {
  if (isFullscreen) {
    fullscreenIcon.style.display = 'none';
    fullscreenExitIcon.style.display = 'block';
  } else {
    fullscreenIcon.style.display = 'block';
    fullscreenExitIcon.style.display = 'none';
  }
}

function handleKeyboard(e) {
  // Only handle keyboard events when video player is focused
  if (document.activeElement === document.body || videoContainer.contains(document.activeElement)) {
    switch (e.code) {
      case 'Space':
        e.preventDefault();
        togglePlayPause();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        seekVideo(-10);
        break;
      case 'ArrowRight':
        e.preventDefault();
        seekVideo(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        mainVideo.volume = Math.min(1, mainVideo.volume + 0.1);
        updateVolumeDisplay();
        updateVolumeIcon();
        break;
      case 'ArrowDown':
        e.preventDefault();
        mainVideo.volume = Math.max(0, mainVideo.volume - 0.1);
        updateVolumeDisplay();
        updateVolumeIcon();
        break;
      case 'KeyM':
        e.preventDefault();
        toggleMute();
        break;
      case 'KeyF':
        e.preventDefault();
        toggleFullscreen();
        break;
      case 'Escape':
        if (isFullscreen) {
          toggleFullscreen();
        }
        break;
    }
  }
}

function showControls() {
  videoControls.classList.add('visible');
  clearTimeout(controlsTimeout);
}

function hideControlsDelayed() {
  controlsTimeout = setTimeout(() => {
    if (isPlaying) {
      videoControls.classList.remove('visible');
    }
  }, 3000);
}

function showLoading() {
  loadingContainer.style.display = 'flex';
  videoContainer.style.display = 'none';
  errorState.style.display = 'none';
}

function hideLoading() {
  loadingContainer.style.display = 'none';
  videoContainer.style.display = 'block';
}

function showError() {
  loadingContainer.style.display = 'none';
  videoContainer.style.display = 'none';
  errorState.style.display = 'flex';
}

function showNotification(message) {
  // Remove existing notification
  const existingNotification = document.querySelector('.notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Create new notification
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    background: #e50914;
    color: white;
    padding: 15px 20px;
    border-radius: 4px;
    z-index: 10000;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    animation: slideIn 0.3s ease;
  `;

  // Add animation styles if not already present
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
  }

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}