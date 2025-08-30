// Search Results Page JavaScript

// TMDB API configuration
const TMDB_API_KEY = 'a07e22bc18f5cb106bfe4cc1f83ad8ed';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

// DOM Elements
const searchInput = document.getElementById('search-input');
const searchBtn = document.getElementById('search-btn');
const searchTitle = document.getElementById('search-title');
const searchSubtitle = document.getElementById('search-subtitle');
const loadingState = document.getElementById('loading');
const noResultsState = document.getElementById('no-results');
const searchResultsSection = document.getElementById('search-results');
const resultsCount = document.getElementById('results-count');
const resultsGrid = document.getElementById('results-grid');
const loadMoreBtn = document.getElementById('load-more-btn');
const filterTabs = document.querySelectorAll('.filter-tab');

// Search state
let currentQuery = '';
let currentPage = 1;
let currentFilter = 'all';
let allResults = [];
let hasMorePages = false;

// Initialize the page
document.addEventListener('DOMContentLoaded', initializeSearchPage);

function initializeSearchPage() {
  setupEventListeners();
  
  // Check if there's a search query in URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const query = urlParams.get('q');
  
  if (query) {
    searchInput.value = query;
    performSearch(query);
  }
}

function setupEventListeners() {
  // Search input events
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      const query = searchInput.value.trim();
      if (query) {
        performSearch(query);
        updateURL(query);
      }
    }
  });
  
  // Search button click
  searchBtn.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
      performSearch(query);
      updateURL(query);
    }
  });
  
  // Filter tabs
  filterTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;
      setActiveFilter(filter);
      filterResults(filter);
    });
  });
  
  // Load more button
  loadMoreBtn.addEventListener('click', loadMoreResults);
}

function updateURL(query) {
  const newUrl = new URL(window.location);
  newUrl.searchParams.set('q', query);
  window.history.pushState({}, '', newUrl);
}

async function performSearch(query, page = 1) {
  if (!query.trim()) return;
  
  currentQuery = query;
  currentPage = page;
  
  // Update UI
  searchTitle.textContent = `Search results for "${query}"`;
  searchSubtitle.textContent = 'Searching movies, TV shows, and people...';
  
  if (page === 1) {
    showLoading();
    allResults = [];
  }
  
  try {
    const response = await fetch(
      `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (page === 1) {
      allResults = data.results || [];
    } else {
      allResults = [...allResults, ...(data.results || [])];
    }
    
    hasMorePages = page < data.total_pages;
    
    if (allResults.length === 0 && page === 1) {
      showNoResults();
    } else {
      displayResults(allResults);
      updateLoadMoreButton();
    }
    
  } catch (error) {
    console.error('Search failed:', error);
    showError('Search failed. Please try again.');
  }
}

function showLoading() {
  loadingState.style.display = 'flex';
  searchResultsSection.style.display = 'none';
  noResultsState.style.display = 'none';
}

function showNoResults() {
  loadingState.style.display = 'none';
  searchResultsSection.style.display = 'none';
  noResultsState.style.display = 'flex';
}

function showError(message) {
  loadingState.style.display = 'none';
  searchResultsSection.style.display = 'none';
  noResultsState.style.display = 'flex';
  noResultsState.querySelector('h2').textContent = 'Search Error';
  noResultsState.querySelector('p').textContent = message;
}

function displayResults(results) {
  loadingState.style.display = 'none';
  noResultsState.style.display = 'none';
  searchResultsSection.style.display = 'block';
  
  // Filter results based on current filter
  const filteredResults = filterResultsByType(results, currentFilter);
  
  // Update results count
  resultsCount.textContent = `Found ${filteredResults.length} result${filteredResults.length !== 1 ? 's' : ''}`;
  
  // Clear and populate results grid
  resultsGrid.innerHTML = '';
  
  filteredResults.forEach(result => {
    const resultCard = createResultCard(result);
    resultsGrid.appendChild(resultCard);
  });
}

function createResultCard(result) {
  const card = document.createElement('div');
  card.className = `result-card ${result.media_type || 'unknown'}`;
  
  const title = result.title || result.name || 'Unknown Title';
  const releaseDate = result.release_date || result.first_air_date;
  const year = releaseDate ? new Date(releaseDate).getFullYear() : '';
  const rating = result.vote_average ? result.vote_average.toFixed(1) : '';
  
  // Handle different media types
  let typeLabel = '';
  let imageUrl = '';
  let overview = result.overview || '';
  
  switch (result.media_type) {
    case 'movie':
      typeLabel = 'Movie';
      imageUrl = result.poster_path ? `${TMDB_IMAGE_BASE_URL}${result.poster_path}` : '';
      break;
    case 'tv':
      typeLabel = 'TV Show';
      imageUrl = result.poster_path ? `${TMDB_IMAGE_BASE_URL}${result.poster_path}` : '';
      break;
    case 'person':
      typeLabel = 'Person';
      imageUrl = result.profile_path ? `${TMDB_IMAGE_BASE_URL}${result.profile_path}` : '';
      overview = result.known_for ? result.known_for.map(item => item.title || item.name).join(', ') : '';
      break;
    default:
      typeLabel = 'Unknown';
  }
  
  const imageHtml = imageUrl 
    ? `<img src="${imageUrl}" alt="${title}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` 
    : '';
  
  const placeholderHtml = `<div class="result-card-placeholder" style="${imageUrl ? 'display:none;' : 'display:flex;'}">${title}</div>`;
  
  card.innerHTML = `
    <div class="result-card-image">
      ${imageHtml}
      ${placeholderHtml}
    </div>
    <div class="result-card-content">
      <div class="result-card-type">${typeLabel}</div>
      <div class="result-card-title">${title}</div>
      <div class="result-card-meta">
        ${year ? `<span class="result-card-year">${year}</span>` : '<span></span>'}
        ${rating ? `<span class="result-card-rating">★ ${rating}</span>` : ''}
      </div>
      ${result.media_type === 'person' ? 
        `<div class="result-card-known-for">Known for: ${overview}</div>` : 
        `<div class="result-card-overview">${overview}</div>`
      }
    </div>
  `;
  
  // Add click event
  card.addEventListener('click', () => {
    handleResultClick(result);
  });
  
  return card;
}

function handleResultClick(result) {
  if (result.media_type === 'person') {
    // For people, we could show their filmography or just show a notification
    showNotification(`Showing details for ${result.name}`);
    return;
  }
  
  // For movies and TV shows, navigate to details page
  const mediaType = result.media_type || (result.title ? 'movie' : 'tv');
  window.location.href = `movie-details.html?id=${result.id}&type=${mediaType}`;
}

function setActiveFilter(filter) {
  currentFilter = filter;
  
  filterTabs.forEach(tab => {
    tab.classList.remove('active');
    if (tab.dataset.filter === filter) {
      tab.classList.add('active');
    }
  });
}

function filterResults(filter) {
  const filteredResults = filterResultsByType(allResults, filter);
  displayResults(allResults); // This will apply the current filter
}

function filterResultsByType(results, filter) {
  if (filter === 'all') {
    return results;
  }
  return results.filter(result => result.media_type === filter);
}

function updateLoadMoreButton() {
  if (hasMorePages && currentFilter === 'all') {
    loadMoreBtn.style.display = 'block';
  } else {
    loadMoreBtn.style.display = 'none';
  }
}

async function loadMoreResults() {
  if (!hasMorePages) return;
  
  loadMoreBtn.textContent = 'Loading...';
  loadMoreBtn.disabled = true;
  
  await performSearch(currentQuery, currentPage + 1);
  
  loadMoreBtn.textContent = 'Load More Results';
  loadMoreBtn.disabled = false;
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