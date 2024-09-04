class Api {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    async fetchMoviesBySearchText(query, page = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/search/movie?api_key=${this.apiKey}&query=${query}&page=${page}`);
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
        }
    }

    async fetchPopularMovies(page = 1) {
        try {
            const response = await fetch(`${this.baseUrl}/movie/popular?api_key=${this.apiKey}&page=${page}`);
            if (!response.ok) {
                throw new Error('Failed to fetch popular movies');
            }
            return await response.json();
        } catch (error) {
            console.error('Error:', error);
        }
    }
}

const api = new Api('e52fda134110945256469ed2ec1cb4fe');

let currentQuery = '';
let currentPage = 1;
let totalPages = 1;
let currentView = 'search';

function getSavedMovies() {
    return JSON.parse(localStorage.getItem('savedMovies')) || [];
}

function saveMovie(movie) {
    const savedMovies = getSavedMovies();
    if (!savedMovies.some(savedMovie => savedMovie.id === movie.id)) {
        savedMovies.push(movie);
        localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
    }
}

function removeMovie(movieId) {
    let savedMovies = getSavedMovies();
    savedMovies = savedMovies.filter(movie => movie.id !== movieId);
    localStorage.setItem('savedMovies', JSON.stringify(savedMovies));
}

function isMovieSaved(movieId) {
    return getSavedMovies().some(movie => movie.id === movieId);
}

function renderMovies(movies, resultsContainer, totalResults, append = false) {
    if (!append) {
        resultsContainer.innerHTML = '';
    }

    if (movies.length > 0) {
        if (!append) {
            const resultsHeader = document.createElement('h3');
            resultsHeader.textContent = `Results (${totalResults})`;
            resultsContainer.appendChild(resultsHeader);
        }

        movies.forEach(movie => {
            const movieItem = document.createElement('div');
            movieItem.classList.add('movie-item');

            const movieTitle = document.createElement('h2');
            movieTitle.textContent = movie.original_title;
            movieItem.appendChild(movieTitle);

            const heartIcon = document.createElement('i');
            heartIcon.classList.add('fa-heart', 'fas');
            if (isMovieSaved(movie.id)) {
                heartIcon.classList.add('active');
            }
            heartIcon.addEventListener('click', () => {
                if (isMovieSaved(movie.id)) {
                    removeMovie(movie.id);
                    heartIcon.classList.remove('active');
                    if (currentView === 'bookmarks') {
                        movieItem.remove();
                    }
                } else {
                    saveMovie(movie);
                    heartIcon.classList.add('active');
                }
            });
            movieItem.appendChild(heartIcon);

            resultsContainer.appendChild(movieItem);
        });
    } else {
        resultsContainer.textContent = `No results for "${currentQuery}"`;
    }
}

async function handleSearch(query) {
    const data = await api.fetchMoviesBySearchText(query);
    currentQuery = query;
    currentPage = 1;
    totalPages = data.total_pages;

    const resultsContainer = document.getElementById('search-results');
    renderMovies(data.results, resultsContainer, data.total_results);

    if (currentPage < totalPages) {
        document.getElementById('load-more').style.display = 'block';
    } else {
        document.getElementById('load-more').style.display = 'none';
    }
}

async function loadMoreMovies() {
    currentPage += 1;
    const data = await api.fetchMoviesBySearchText(currentQuery, currentPage);

    const resultsContainer = document.getElementById('search-results');
    renderMovies(data.results, resultsContainer, data.total_results, true);

    if (currentPage >= totalPages) {
        document.getElementById('load-more').style.display = 'none';
    }
}

function renderSavedMovies() {
    const savedMovies = getSavedMovies();
    const resultsContainer = document.getElementById('search-results');
    renderMovies(savedMovies, resultsContainer, savedMovies.length);
}

async function renderPopularMovies() {
    const data = await api.fetchPopularMovies();
    currentPage = 1;
    totalPages = data.total_pages;

    const resultsContainer = document.getElementById('search-results');
    renderMovies(data.results, resultsContainer, data.total_results);

    if (currentPage < totalPages) {
        document.getElementById('load-more').style.display = 'block';
    } else {
        document.getElementById('load-more').style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('search-input');
    const loadMoreButton = document.getElementById('load-more');
    const popularMoviesButton = document.getElementById('popular-movies');
    const bookmarksButton = document.getElementById('bookmarks');

    searchInput.addEventListener('keyup', async (event) => {
        if (event.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                currentView = 'search';
                await handleSearch(query);
            }
            searchInput.value = '';
        }
    });

    loadMoreButton.addEventListener('click', async () => {
        await loadMoreMovies();
    });

    popularMoviesButton.addEventListener('click', async () => {
        currentView = 'popular';
        await renderPopularMovies();
    });

    bookmarksButton.addEventListener('click', () => {
        currentView = 'bookmarks';
        renderSavedMovies();
    });
});
