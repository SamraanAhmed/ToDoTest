// Movie Details Page JavaScript

// TMDB API configuration
const TMDB_API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';
const TMDB_BACKDROP_BASE_URL = 'https://image.tmdb.org/t/p/w1280';

// DOM Elements
const loadingContainer = document.getElementById('loading');
const movieContent = document.getElementById('movie-content');
const errorState = document.getElementById('error-state');
const backBtn = document.querySelector('.back-btn');

// Initialize the page
document.addEventListener('DOMContentLoaded', initializeMovieDetails);

function initializeMovieDetails() {
  // Set up back button
  backBtn.addEventListener('click', (e) => {
    e.preventDefault();
    window.history.back();
  });
  
  // Get movie ID from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const movieId = urlParams.get('id');
  const mediaType = urlParams.get('type') || 'movie';
  
  if (movieId) {
    loadMovieDetails(movieId, mediaType);
  } else {
    showError();
  }
}

async function loadMovieDetails(movieId, mediaType) {
  try {
    showLoading();
    
    // Fetch movie/TV show details
    const detailsResponse = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}?api_key=${TMDB_API_KEY}`);
    if (!detailsResponse.ok) {
      throw new Error('Failed to fetch movie details');
    }
    const movieDetails = await detailsResponse.json();
    
    // Fetch credits (cast and crew)
    const creditsResponse = await fetch(`${TMDB_BASE_URL}/${mediaType}/${movieId}/credits?api_key=${TMDB_API_KEY}`);
    const credits = creditsResponse.ok ? await creditsResponse.json() : null;
    
    // Display the movie details
    displayMovieDetails(movieDetails, credits, mediaType);
    
  } catch (error) {
    console.error('Error loading movie details:', error);
    showError();
  }
}

function displayMovieDetails(movie, credits, mediaType) {
  hideLoading();
  
  // Update page title
  const title = movie.title || movie.name;
  document.title = `${title} - Netflix Clone`;
  
  // Movie Title
  document.getElementById('movie-title').textContent = title;
  
  // Movie Images
  const posterImg = document.getElementById('poster-image');
  const backdropImg = document.getElementById('backdrop-image');
  
  if (movie.poster_path) {
    posterImg.src = `${TMDB_IMAGE_BASE_URL}${movie.poster_path}`;
    posterImg.alt = title;
  } else {
    posterImg.style.display = 'none';
  }
  
  if (movie.backdrop_path) {
    backdropImg.src = `${TMDB_BACKDROP_BASE_URL}${movie.backdrop_path}`;
    backdropImg.alt = title;
  } else {
    document.querySelector('.movie-backdrop').style.background = 'linear-gradient(135deg, #1a1a1a, #333, #1a1a1a)';
  }
  
  // Release Date & Runtime
  const releaseDate = movie.release_date || movie.first_air_date;
  if (releaseDate) {
    const year = new Date(releaseDate).getFullYear();
    document.getElementById('release-date').textContent = year;
  }
  
  const runtime = movie.runtime || (movie.episode_run_time && movie.episode_run_time[0]);
  if (runtime) {
    const hours = Math.floor(runtime / 60);
    const minutes = runtime % 60;
    document.getElementById('runtime').textContent = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }
  
  // Rating
  const rating = movie.vote_average;
  if (rating) {
    document.getElementById('rating').textContent = `★ ${rating.toFixed(1)}`;
  }
  
  // Genres
  const genresContainer = document.getElementById('genres-list');
  if (movie.genres && movie.genres.length > 0) {
    genresContainer.innerHTML = movie.genres
      .map(genre => `<span class="genre-tag">${genre.name}</span>`)
      .join('');
  }
  
  // Overview
  document.getElementById('movie-overview').textContent = movie.overview || 'No overview available.';
  
  // Additional Details
  populateMovieStats(movie, mediaType);
  populateCredits(credits);
  populateProductionInfo(movie);
  
  // Setup action buttons
  setupActionButtons(movie);
  
  // Show content
  movieContent.style.display = 'block';
}

function populateMovieStats(movie, mediaType) {
  document.getElementById('vote-average').textContent = `${movie.vote_average?.toFixed(1) || 'N/A'}/10`;
  document.getElementById('vote-count').textContent = movie.vote_count?.toLocaleString() || 'N/A';
  document.getElementById('popularity').textContent = movie.popularity?.toFixed(0) || 'N/A';
  document.getElementById('status').textContent = movie.status || 'N/A';
  
  const language = movie.original_language;
  const languageNames = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese',
    'hi': 'Hindi',
    'ar': 'Arabic',
    'ru': 'Russian'
  };
  document.getElementById('original-language').textContent = languageNames[language] || language?.toUpperCase() || 'N/A';
}

function populateCredits(credits) {
  if (!credits) {
    document.getElementById('director').textContent = 'N/A';
    document.getElementById('cast').textContent = 'N/A';
    return;
  }
  
  // Director
  const director = credits.crew?.find(person => person.job === 'Director');
  document.getElementById('director').textContent = director?.name || 'N/A';
  
  // Cast (top 5)
  const topCast = credits.cast?.slice(0, 5).map(actor => actor.name).join(', ');
  document.getElementById('cast').textContent = topCast || 'N/A';
}

function populateProductionInfo(movie) {
  // Production Companies
  const companies = movie.production_companies?.map(company => company.name).join(', ');
  document.getElementById('production').textContent = companies || 'N/A';
  
  // Budget & Revenue (for movies)
  const budget = movie.budget;
  if (budget && budget > 0) {
    document.getElementById('budget').textContent = `$${budget.toLocaleString()}`;
  } else {
    document.getElementById('budget').textContent = 'N/A';
  }
  
  const revenue = movie.revenue;
  if (revenue && revenue > 0) {
    document.getElementById('revenue').textContent = `$${revenue.toLocaleString()}`;
  } else {
    document.getElementById('revenue').textContent = 'N/A';
  }
}

function setupActionButtons(movie) {
  const playBtn = document.getElementById('play-btn');
  const trailerBtn = document.getElementById('trailer-btn');
  const addListBtn = document.getElementById('add-list-btn');
  
  const title = movie.title || movie.name;
  const movieId = movie.id;
  const mediaType = movie.title ? 'movie' : 'tv';
  
  playBtn.addEventListener('click', () => {
    // Navigate to video player to play the movie/show
    window.location.href = `video-player.html?id=${movieId}&type=${mediaType}&video=movie`;
  });
  
  trailerBtn.addEventListener('click', async () => {
    // Fetch trailer and open YouTube directly
    await openYouTubeTrailer(movieId, mediaType, title);
  });
  
  addListBtn.addEventListener('click', () => {
    showNotification(`Added ${title} to your list`);
  });
}

function showLoading() {
  loadingContainer.style.display = 'flex';
  movieContent.style.display = 'none';
  errorState.style.display = 'none';
}

function hideLoading() {
  loadingContainer.style.display = 'none';
}

function showError() {
  hideLoading();
  errorState.style.display = 'flex';
  movieContent.style.display = 'none';
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

  // Add animation styles
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

// Function to fetch and open YouTube trailer
async function openYouTubeTrailer(movieId, mediaType, title) {
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