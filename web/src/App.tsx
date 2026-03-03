// web/src/App.tsx
import { useState, useEffect, useCallback } from 'react';
import { newsApi, NewsArticle, NewsError } from './lib/newsapi';

const CATEGORIES = [
  'tech',
  'general',
  'science',
  'sports',
  'business',
  'health',
  'entertainment',
  'politics',
  'food',
  'travel'
];

interface FavoritesMap {
  [key: string]: NewsArticle;
}

interface PageData {
  articles: NewsArticle[];
  totalFound: number;
  totalReturned: number;
}

function App() {
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('tech');

  // Data state
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentArticleIndex, setCurrentArticleIndex] = useState(0);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewingFavorites, setViewingFavorites] = useState(false);
  const [favorites, setFavorites] = useState<FavoritesMap>({});

  // Load favorites from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('news-reader-favorites');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFavorites(parsed);
      } catch (e) {
        console.error('Failed to load favorites', e);
      }
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    localStorage.setItem('news-reader-favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch news
  const fetchNews = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        setError(null);

        const response = await newsApi.fetchNews(
          page,
          searchQuery || undefined,
          selectedCategory
        );

        setPageData({
          articles: response.data || [],
          totalFound: response.meta.found,
          totalReturned: response.meta.returned
        });

        setCurrentArticleIndex(0);
      } catch (err) {
        const newsError = err as NewsError;
        if (newsError.statusCode === 429) {
          setError(newsError.error);
        } else if (newsError.statusCode === 401 || newsError.statusCode === 403) {
          setError(newsError.error);
        } else {
          setError(newsError.error || 'Failed to fetch news');
        }
        setPageData(null);
      } finally {
        setLoading(false);
      }
    },
    [searchQuery, selectedCategory]
  );

  // When search or category changes, clear cache and reset
  useEffect(() => {
    newsApi.clearCache();
    setCurrentPage(1);
    setCurrentArticleIndex(0);
    setViewingFavorites(false);
  }, [searchQuery, selectedCategory]);

  // Fetch when page changes or when search/category changes
  useEffect(() => {
    if (!viewingFavorites) {
      fetchNews(currentPage);
    }
  }, [currentPage, viewingFavorites, fetchNews, searchQuery, selectedCategory]);

  // Prefetch logic based on article index
  useEffect(() => {
    if (!pageData || viewingFavorites) return;

    const articlesPerPage = 3;

    // Prefetch next page when reaching 2nd article (index 1)
    if (currentArticleIndex === 1 && pageData.articles.length === articlesPerPage) {
      newsApi.prefetchNextPage(
        currentPage,
        searchQuery || undefined,
        selectedCategory
      );
    }

    // Prefetch prev page when at first article (index 0) and not on page 1
    if (currentArticleIndex === 0 && currentPage > 1) {
      newsApi.prefetchPrevPage(
        currentPage,
        searchQuery || undefined,
        selectedCategory
      );
    }
  }, [currentArticleIndex, pageData, currentPage, searchQuery, selectedCategory, viewingFavorites]);

  // Handlers
  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
  };

  const handlePrevArticle = () => {
    if (currentArticleIndex > 0) {
      setCurrentArticleIndex(currentArticleIndex - 1);
    } else if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentArticleIndex(2); // Last article of prev page
    }
  };

  const handleNextArticle = () => {
    if (pageData && currentArticleIndex < pageData.articles.length - 1) {
      setCurrentArticleIndex(currentArticleIndex + 1);
    } else if (pageData && pageData.articles.length === 3) {
      // More articles available
      setCurrentPage(currentPage + 1);
      setCurrentArticleIndex(0); // First article of next page
    }
  };

  const handlePageClick = (page: number) => {
    setCurrentPage(page);
    setCurrentArticleIndex(0);
  };

  const handleToggleFavorite = (article: NewsArticle) => {
    setFavorites((prev) => {
      const next = { ...prev };
      if (next[article.uuid]) {
        delete next[article.uuid];
      } else {
        next[article.uuid] = article;
      }
      return next;
    });
  };

  const handleViewFavorites = () => {
    setViewingFavorites(!viewingFavorites);
    setSidebarOpen(false);
  };

  const handleExitFavorites = () => {
    setViewingFavorites(false);
  };

  // Get current article
  const currentArticle = viewingFavorites
    ? Object.values(favorites)[currentArticleIndex]
    : pageData?.articles[currentArticleIndex];

  const isFavorited = currentArticle ? !!favorites[currentArticle.uuid] : false;

  // Pagination calculations
  const articlesPerPage = 3;
  const totalPages = pageData ? Math.ceil(pageData.totalFound / articlesPerPage) : 0;

  // Render
  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-section">
          <input
            type="text"
            className="search-input"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            aria-label="Search articles"
          />
        </div>

        <div className="sidebar-section">
          <h2 className="sidebar-title">Categories</h2>
          <ul className="category-list">
            {CATEGORIES.map((cat) => (
              <li key={cat}>
                <button
                  className={`category-item ${selectedCategory === cat && !searchQuery ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat)}
                  aria-pressed={selectedCategory === cat && !searchQuery}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="sidebar-spacer" />

        <button
          className={`favorites-btn ${viewingFavorites ? 'active' : ''}`}
          onClick={handleViewFavorites}
          aria-pressed={viewingFavorites}
        >
          ★ Favorites ({Object.keys(favorites).length})
        </button>
      </aside>

      {/* Mobile toggle */}
      <button
        className="mobile-toggle"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label="Toggle filters"
      >
        {sidebarOpen ? '✕ Close' : '☰ Filter'}
      </button>

      {/* Main content */}
      <main className="main-content" role="main">
        {loading && (
          <div>
            <div className="loading-spinner" aria-label="Loading" />
          </div>
        )}

        {error && !loading && (
          <div className="error-container">
            <div className="error-title">⚠ Error</div>
            <div className="error-message">{error}</div>
          </div>
        )}

        {!loading && !error && !currentArticle && (
          <div className="empty-state">
            <div className="empty-state-title">
              {viewingFavorites ? 'No favorites yet' : 'No articles found'}
            </div>
            <div className="empty-state-message">
              {viewingFavorites
                ? 'Save articles to view them here'
                : 'Try a different search or category'}
            </div>
          </div>
        )}

        {!loading && !error && currentArticle && (
          <>
            <article className="article-card" role="article">
              {currentArticle.image_url ? (
                <img
                  src={currentArticle.image_url}
                  alt={currentArticle.title}
                  className="article-image"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
              ) : (
                <img
                  src="/placeholder.png"
                  alt="News article placeholder"
                  className="article-image"
                />
              )}

              <div className="article-overlay">
                <div className="article-category">
                  {currentArticle.category.toUpperCase()}
                </div>
                <h1 className="article-title">{currentArticle.title}</h1>
              </div>

              <div className="article-info">
                <p className="article-description">{currentArticle.description}</p>

                <div className="article-source">
                  {currentArticle.source} •{' '}
                  {new Date(currentArticle.published_at).toLocaleDateString()}
                </div>

                <div className="article-actions">
                  <a
                    href={currentArticle.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                  >
                    View Full Article →
                  </a>
                  <button
                    className={`btn-favorite ${isFavorited ? 'active' : ''}`}
                    onClick={() => handleToggleFavorite(currentArticle)}
                    aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                    title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFavorited ? '★' : '☆'}
                  </button>
                </div>
              </div>
            </article>

            <div className="pagination" role="navigation" aria-label="Articles navigation">
              <button
                className="pager-btn"
                onClick={() => handlePageClick(1)}
                disabled={currentPage === 1}
                aria-label="Go to first page"
              >
                «
              </button>

              <button
                className="pager-btn"
                onClick={handlePrevArticle}
                disabled={currentPage === 1 && currentArticleIndex === 0}
                aria-label="Previous article"
              >
                &lt;
              </button>

              <div className="pager-dots" aria-live="polite">
                {pageData?.articles.map((_, idx) => (
                  <button
                    key={idx}
                    className={`pager-btn pager-number ${idx === currentArticleIndex ? 'active' : ''}`}
                    onClick={() => setCurrentArticleIndex(idx)}
                    aria-label={`Article ${idx + 1}`}
                    aria-current={idx === currentArticleIndex ? 'page' : undefined}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <button
                className="pager-btn"
                onClick={handleNextArticle}
                disabled={
                  !pageData || (currentPage === totalPages &&
                  currentArticleIndex === pageData.articles.length - 1)
                }
                aria-label="Next article"
              >
                &gt;
              </button>

              <button
                className="pager-btn"
                onClick={() => handlePageClick(totalPages)}
                disabled={currentPage === totalPages}
                aria-label="Go to last page"
              >
                »
              </button>
            </div>

            {viewingFavorites && (
              <button
                className="btn btn-secondary"
                onClick={handleExitFavorites}
                style={{ marginTop: '16px' }}
              >
                Back to Live Results
              </button>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
