// Netflix Clone JavaScript with TMDB API integration

// TMDB API configuration
const TMDB_API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed'; // Public demo key
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// API endpoints for different movie categories
const API_ENDPOINTS = {
  trending: `${TMDB_BASE_URL}/trending/all/week?api_key=${TMDB_API_KEY}`,
  popular: `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`,
  originals: `${TMDB_BASE_URL}/discover/tv?api_key=${TMDB_API_KEY}&with_networks=213`, // Netflix originals
  action: `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=28`
};

// Cache for storing fetched data
let movieCache = {};

// Fallback data in case API fails
const fallbackData = {
  trending: [
    { id: 1, title: 'Stranger Things', backdrop_path: null },
    { id: 2, title: 'The Crown', backdrop_path: null },
    { id: 3, title: 'Wednesday', backdrop_path: null },
    { id: 4, title: 'Ozark', backdrop_path: null },
    { id: 5, title: 'The Witcher', backdrop_path: null },
    { id: 6, title: 'Squid Game', backdrop_path: null }
  ],
  popular: [
    { id: 7, title: 'Money Heist', backdrop_path: null },
    { id: 8, title: 'Breaking Bad', backdrop_path: null },
    { id: 9, title: 'Dark', backdrop_path: null },
    { id: 10, title: 'Narcos', backdrop_path: null },
    { id: 11, title: 'Elite', backdrop_path: null },
    { id: 12, title: 'The Umbrella Academy', backdrop_path: null }
  ],
  originals: [
    { id: 13, title: 'House of Cards', backdrop_path: null },
    { id: 14, title: 'Orange Is the New Black', backdrop_path: null },
    { id: 15, title: 'Mindhunter', backdrop_path: null },
    { id: 16, title: 'BoJack Horseman', backdrop_path: null },
    { id: 17, title: 'Altered Carbon', backdrop_path: null },
    { id: 18, title: 'Russian Doll', backdrop_path: null }
  ],
  action: [
    { id: 19, title: 'Extraction', backdrop_path: null },
    { id: 20, title: 'The Old Guard', backdrop_path: null },
    { id: 21, title: '6 Underground', backdrop_path: null },
    { id: 22, title: 'Triple Frontier', backdrop_path: null },
    { id: 23, title: 'Bird Box', backdrop_path: null },
    { id: 24, title: 'Bright', backdrop_path: null }
  ]
};

// DOM Elements
const header = document.querySelector('.header');
const heroPlayBtn = document.querySelector('.btn-play');
const heroInfoBtn = document.querySelector('.btn-info');
const searchInput = document.querySelector('.search-input');
const searchBtn = document.querySelector('.search-btn');

// Store current hero movie data
let currentHeroMovie = { title: 'Stranger Things', name: 'Stranger Things' };

// Initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
  setupEventListeners();
  loadHeroContent();
  loadMovieRows();
  setupScrollEffect();
}

// Load hero content from API
async function loadHeroContent() {
  try {
    const response = await fetch(`${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
    if (response.ok) {
      const data = await response.json();
      const heroMovie = data.results[0]; // Use the first popular movie
      updateHeroSection(heroMovie);
    }
  } catch (error) {
    console.warn('Failed to load hero content:', error);
    // Keep default Stranger Things content
  }
}

function updateHeroSection(movie) {
  const heroTitle = document.querySelector('.hero-title');
  const heroDescription = document.querySelector('.hero-description');
  
  // Store the current hero movie data
  currentHeroMovie = movie;
  
  if (heroTitle && movie.title) {
    heroTitle.textContent = movie.title;
  }
  
  if (heroDescription && movie.overview) {
    heroDescription.textContent = movie.overview;
  }
}

// Event Listeners
function setupEventListeners() {
  // Hero buttons
  heroPlayBtn.addEventListener('click', () => {
    if (currentHeroMovie && currentHeroMovie.id) {
      const mediaType = currentHeroMovie.title ? 'movie' : 'tv';
      window.location.href = `video-player.html?id=${currentHeroMovie.id}&type=${mediaType}&video=movie`;
    } else {
      const movieTitle = currentHeroMovie.title || currentHeroMovie.name || 'this content';
      showNotification(`Playing ${movieTitle}...`);
    }
  });

  heroInfoBtn.addEventListener('click', () => {
    if (currentHeroMovie && currentHeroMovie.id) {
      const mediaType = currentHeroMovie.title ? 'movie' : 'tv';
      window.location.href = `movie-details.html?id=${currentHeroMovie.id}&type=${mediaType}`;
    } else {
      const movieTitle = currentHeroMovie.title || currentHeroMovie.name || 'this content';
      showMoreInfo(movieTitle);
    }
  });

  // Search functionality
  searchInput.addEventListener('input', debounce(handleSearch, 300));
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch(e.target.value);
    }
  });
  
  // Search button click
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      performSearch(searchInput.value);
    });
  }
}

// Header scroll effect
function setupScrollEffect() {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 100) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });
}

// Load movie content into rows
function loadMovieRows() {
  loadMoviesIntoSlider('trending-slider', 'trending');
  loadMoviesIntoSlider('popular-slider', 'popular');
  loadMoviesIntoSlider('originals-slider', 'originals');
  loadMoviesIntoSlider('action-slider', 'action');
}

async function loadMoviesIntoSlider(sliderId, category) {
  const slider = document.getElementById(sliderId);
  if (!slider) return;

  // Show loading state
  showLoadingCards(slider);

  try {
    // Check cache first
    if (movieCache[category]) {
      displayMovies(slider, movieCache[category]);
      return;
    }

    // Fetch from API
    const response = await fetch(API_ENDPOINTS[category]);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const movies = data.results.slice(0, 12); // Limit to 12 movies per row
    
    // Cache the results
    movieCache[category] = movies;
    
    displayMovies(slider, movies);
    
  } catch (error) {
    console.warn(`Failed to fetch ${category} movies:`, error);
    // Use fallback data
    displayMovies(slider, fallbackData[category] || []);
    showNotification(`Using offline data for ${category}`);
  }
}

function displayMovies(slider, movies) {
  slider.innerHTML = '';
  movies.forEach(movie => {
    const movieCard = createMovieCard(movie);
    slider.appendChild(movieCard);
  });
  
  // Setup slider navigation after movies are loaded
  setTimeout(() => {
    setupSliderNavigation(slider);
  }, 100);
}

function showLoadingCards(slider) {
  slider.innerHTML = '';
  for (let i = 0; i < 6; i++) {
    const loadingCard = document.createElement('div');
    loadingCard.className = 'movie-card loading';
    loadingCard.innerHTML = '<div class="movie-placeholder">Loading...</div>';
    slider.appendChild(loadingCard);
  }
}

function createMovieCard(movie) {
  const card = document.createElement('div');
  card.className = 'movie-card';
  card.dataset.movieId = movie.id;

  // Get title (handle both movie and TV show data)
  const title = movie.title || movie.name || 'Unknown Title';
  
  // Create image element if backdrop is available
  const imageHtml = movie.backdrop_path 
    ? `<img src="${TMDB_IMAGE_BASE_URL}${movie.backdrop_path}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
    : '';
  
  const placeholderHtml = `<div class="movie-placeholder" style="${movie.backdrop_path ? 'display:none;' : 'display:flex;'}">${title}</div>`;

  card.innerHTML = `
    ${imageHtml}
    ${placeholderHtml}
    <div class="movie-title">${title}</div>
    <div class="movie-overlay">
      <button class="movie-play-btn" onclick="event.stopPropagation(); playMovie(${movie.id}, '${movie.media_type || (movie.title ? 'movie' : 'tv')}')" title="Play Movie">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M8 5v14l11-7z"/>
        </svg>
      </button>
      <button class="movie-trailer-btn" onclick="event.stopPropagation(); openTrailerFromCard(${movie.id}, '${movie.media_type || (movie.title ? 'movie' : 'tv')}', '${title.replace(/'/g, "\\'")}')
" title="Watch Trailer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 3v2h-2V3H8v2H6V3H4v18h2v-2h2v2h8v-2h2v2h2V3h-2zM8 17H6v-2h2v2zm0-4H6v-2h2v2zm0-4H6V7h2v2zm10 8h-2v-2h2v2zm0-4h-2v-2h2v2zm0-4h-2V7h2v2z"/>
        </svg>
      </button>
      <button class="movie-info-btn" onclick="event.stopPropagation(); showMovieInfo(${movie.id}, '${movie.media_type || (movie.title ? 'movie' : 'tv')}')" title="More Info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </button>
    </div>
  `;

  // Add click event
  card.addEventListener('click', () => {
    handleMovieClick(movie);
  });

  return card;
}

// Movie interaction handlers
function handleMovieClick(movie) {
  const movieId = movie.id;
  const mediaType = movie.media_type || (movie.title ? 'movie' : 'tv');
  
  // Navigate to movie details page
  window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`;
}

// Global functions for movie card actions
function playMovie(movieId, mediaType) {
  window.location.href = `video-player.html?id=${movieId}&type=${mediaType}&video=movie`;
}

function showMovieInfo(movieId, mediaType) {
  window.location.href = `movie-details.html?id=${movieId}&type=${mediaType}`;
}

// Function to open YouTube trailer from movie cards
async function openTrailerFromCard(movieId, mediaType, title) {
  try {
    showNotification('Looking for trailer...');
    
    // Fetch videos from TMDB API
    const response = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}/videos?api_key=${TMDB_API_KEY}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch trailer data');
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      // Look for trailers and teasers on YouTube
      const availableVideos = data.results.filter(video => 
        video.site === 'YouTube' && (video.type === 'Trailer' || video.type === 'Teaser')
      );
      
      if (availableVideos.length > 0) {
        // Prefer official trailers over teasers
        const trailer = availableVideos.find(video => video.type === 'Trailer') || availableVideos[0];
        
        // Open YouTube in a new tab
        const youtubeUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
        window.open(youtubeUrl, '_blank');
        
        showNotification(`Opening ${trailer.name || 'trailer'} on YouTube...`);
        return;
      }
    }
    
    // No trailer found
    showNotification(`No trailer available for ${title}`);
    
  } catch (error) {
    console.error('Error fetching trailer:', error);
    showNotification(`Could not load trailer for ${title}`);
  }
}

function showMoreInfo(title) {
  showNotification(`Showing more info for ${title}`);
  // In a real app, this would open a modal with movie details
}

// Search functionality with TMDB API
function handleSearch(query) {
  if (query.length < 2) return;
  
  // Visual feedback
  searchInput.style.borderColor = '#e50914';
  setTimeout(() => {
    searchInput.style.borderColor = '#333';
  }, 1000);
}

async function performSearch(query) {
  if (!query.trim()) return;
  
  // Navigate to search results page
  window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
}

// Utility functions
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

  // Add animation styles
  const style = document.createElement('style');
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

  document.body.appendChild(notification);

  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease reverse';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Add some interactive features for better UX
function addInteractiveFeatures() {
  // Smooth scrolling for sliders with mouse and touch support
  document.querySelectorAll('.slider-container').forEach(slider => {
    let isDown = false;
    let startX;
    let scrollLeft;

    // Mouse events
    slider.addEventListener('mousedown', (e) => {
      isDown = true;
      slider.style.cursor = 'grabbing';
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
      e.preventDefault();
    });

    slider.addEventListener('mouseleave', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });

    slider.addEventListener('mouseup', () => {
      isDown = false;
      slider.style.cursor = 'grab';
    });

    slider.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      slider.scrollLeft = scrollLeft - walk;
    });
    
    // Touch events for mobile
    let touchStartX = 0;
    let touchScrollLeft = 0;
    
    slider.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
      touchScrollLeft = slider.scrollLeft;
    }, { passive: true });
    
    slider.addEventListener('touchmove', (e) => {
      if (!touchStartX) return;
      const touchX = e.touches[0].clientX;
      const walk = (touchStartX - touchX) * 1.5;
      slider.scrollLeft = touchScrollLeft + walk;
    }, { passive: true });
    
    slider.addEventListener('touchend', () => {
      touchStartX = 0;
    });
  });
  
  // Setup slider navigation buttons
  setupAllSliderNavigation();
}

function setupAllSliderNavigation() {
  const sliders = [
    { sliderId: 'trending-slider', leftBtnId: 'trending-left', rightBtnId: 'trending-right' },
    { sliderId: 'popular-slider', leftBtnId: 'popular-left', rightBtnId: 'popular-right' },
    { sliderId: 'originals-slider', leftBtnId: 'originals-left', rightBtnId: 'originals-right' },
    { sliderId: 'action-slider', leftBtnId: 'action-left', rightBtnId: 'action-right' }
  ];
  
  sliders.forEach(({ sliderId, leftBtnId, rightBtnId }) => {
    const slider = document.getElementById(sliderId);
    const leftBtn = document.getElementById(leftBtnId);
    const rightBtn = document.getElementById(rightBtnId);
    
    if (slider && leftBtn && rightBtn) {
      setupSliderNavigation(slider, leftBtn, rightBtn);
    }
  });
}

function setupSliderNavigation(slider, leftBtn = null, rightBtn = null) {
  // If buttons aren't provided, find them by ID pattern
  if (!leftBtn || !rightBtn) {
    const sliderId = slider.id;
    const category = sliderId.replace('-slider', '');
    leftBtn = document.getElementById(`${category}-left`);
    rightBtn = document.getElementById(`${category}-right`);
  }
  
  if (!leftBtn || !rightBtn) return;
  
  const scrollAmount = 300; // Amount to scroll in pixels
  
  // Update button states based on scroll position
  function updateButtonStates() {
    const isAtStart = slider.scrollLeft <= 0;
    const isAtEnd = slider.scrollLeft >= slider.scrollWidth - slider.clientWidth - 1;
    
    leftBtn.disabled = isAtStart;
    rightBtn.disabled = isAtEnd;
    
    leftBtn.style.opacity = isAtStart ? '0.3' : '';
    rightBtn.style.opacity = isAtEnd ? '0.3' : '';
  }
  
  // Scroll left
  leftBtn.addEventListener('click', () => {
    slider.scrollBy({
      left: -scrollAmount,
      behavior: 'smooth'
    });
  });
  
  // Scroll right
  rightBtn.addEventListener('click', () => {
    slider.scrollBy({
      left: scrollAmount,
      behavior: 'smooth'
    });
  });
  
  // Update button states on scroll
  slider.addEventListener('scroll', updateButtonStates);
  
  // Keyboard navigation
  slider.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      slider.scrollBy({
        left: -scrollAmount,
        behavior: 'smooth'
      });
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      slider.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  });
  
  // Make slider focusable for keyboard navigation
  slider.setAttribute('tabindex', '0');
  
  // Initial state update
  setTimeout(updateButtonStates, 100);
  
  // Update on window resize
  window.addEventListener('resize', updateButtonStates);
}

// Initialize interactive features
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(addInteractiveFeatures, 1000);
});


