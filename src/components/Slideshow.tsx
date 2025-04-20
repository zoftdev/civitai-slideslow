import React, { useState, useEffect, useCallback, useRef } from 'react';
import Slider from 'react-slick';
import styled from 'styled-components';
import { fetchCivitaiMedia, CivitaiMedia } from '../services/civitaiService';
import ControlPanel from './ControlPanel';

// Import slick carousel CSS
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

const SlideContainer = styled.div`
  height: 100vh;
  width: 100%;
  overflow: hidden;
  background-color: #000;
`;

const MediaContainer = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
`;

const Image = styled.img`
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
`;

const Video = styled.video`
  max-height: 100%;
  max-width: 100%;
  object-fit: contain;
`;

const LoadingContainer = styled.div`
  height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 24px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px 20px;
  border-radius: 4px;
  color: white;
  z-index: 1000;
`;

const StatusIndicator = styled.div`
  position: fixed;
  bottom: 10px;
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 5px 10px;
  border-radius: 4px;
  color: white;
  font-size: 12px;
  z-index: 100;
`;

const ShortcutToast = styled.div`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px 15px;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  &.visible {
    opacity: 1;
  }
`;

const FullscreenButton = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px;
  cursor: pointer;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  svg {
    width: 24px;
    height: 24px;
  }
`;

// Fullscreen Enter/Exit Icons
const EnterFullscreenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
  </svg>
);

interface SlideshowProps {
  onPanelVisibilityChange?: (isVisible: boolean) => void;
}

// Define types to match the ones in civitaiService
type SortType = 'Most Reactions' | 'Most Comments' | 'Newest';
type PeriodType = 'AllTime' | 'Year' | 'Month' | 'Week' | 'Day';

const Slideshow: React.FC<SlideshowProps> = ({ onPanelVisibilityChange }) => {
  const [media, setMedia] = useState<CivitaiMedia[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [slidesToShow, setSlidesToShow] = useState<number>(3);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);
  const [totalPages, setTotalPages] = useState<number>(1000);
  const [showJumpToast, setShowJumpToast] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  
  // Filter states with proper typing
  const [nsfw, setNsfw] = useState<boolean>(false);
  const [mediaType, setMediaType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [delaySeconds, setDelaySeconds] = useState<number>(5);
  const [sort, setSort] = useState<SortType>('Most Reactions');
  const [period, setPeriod] = useState<PeriodType>('Week');
  
  // Track if these are the active filters with proper typing
  const [activeFilters, setActiveFilters] = useState({
    nsfw: false,
    mediaType: 'all',
    searchTerm: '',
    sort: 'Most Reactions' as SortType,
    period: 'Week' as PeriodType
  });

  const sliderRef = useRef<Slider | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const slideContainerRef = useRef<HTMLDivElement>(null);
  
  // Define togglePanelVisibility before it's used
  const togglePanelVisibility = useCallback(() => {
    setIsPanelVisible(prev => !prev);
  }, []);

  // Notify parent about panel visibility changes
  useEffect(() => {
    if (onPanelVisibilityChange) {
      onPanelVisibilityChange(isPanelVisible);
    }
  }, [isPanelVisible, onPanelVisibilityChange]);

  // Handle keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+Space shortcut
      if (e.ctrlKey && e.code === 'Space') {
        e.preventDefault();
        togglePanelVisibility();
        
        // Show toast notification
        setShowToast(true);
        
        // Clear any existing timeout
        if (toastTimeoutRef.current) {
          clearTimeout(toastTimeoutRef.current);
        }
        
        // Set a timeout to hide the toast after 2 seconds
        toastTimeoutRef.current = setTimeout(() => {
          setShowToast(false);
        }, 2000);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [togglePanelVisibility]);

  // Adjust number of slides based on screen width
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setSlidesToShow(1);
      } else if (width < 1200) {
        setSlidesToShow(2);
      } else {
        setSlidesToShow(3);
      }
    };

    // Set initial value
    handleResize();

    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const loadMedia = useCallback(async (page = 1, reset = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { media: newMedia, hasMore: moreAvailable, totalPages: pages } = await fetchCivitaiMedia({
        limit: 100,
        nsfw: activeFilters.nsfw,
        mediaType: activeFilters.mediaType,
        searchTerm: activeFilters.searchTerm,
        sort: activeFilters.sort || undefined,
        period: activeFilters.period || undefined,
        page
      });

      if (reset) {
        setMedia(newMedia);
      } else {
        setMedia(prevMedia => [...prevMedia, ...newMedia]);
      }

      setHasMore(moreAvailable);
      setCurrentPage(page);
      setTotalPages(pages || 1000);
      setError(null);
    } catch (err) {
      setError('Failed to load media from Civitai');
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [activeFilters]);

  // Initial load
  useEffect(() => {
    loadMedia(1, true);
  }, [loadMedia]);

  // Handle applying filters
  const handleApplyFilters = useCallback(() => {
    setActiveFilters({
      nsfw,
      mediaType,
      searchTerm,
      sort,
      period
    });
    
    // Reset everything and load with new filters
    setCurrentPage(1);
    setMedia([]);
    loadMedia(1, true);
  }, [nsfw, mediaType, searchTerm, sort, period, loadMedia]);

  // Auto fetch more when nearing the end
  useEffect(() => {
    // If we're within 30 slides of the end and we have more to load
    if (
      !loading && 
      !loadingMore && 
      hasMore && 
      media.length > 0 && 
      currentSlide > 0 && 
      media.length - currentSlide < 30
    ) {
      loadMedia(currentPage + 1);
    }
  }, [currentSlide, media.length, loading, loadingMore, hasMore, currentPage, loadMedia]);

  // Handle jumping to a specific page
  const handleJumpToPage = useCallback(async (page: number) => {
    console.log(`handleJumpToPage called with page ${page}, current: ${currentPage}`);
    
    if (page === currentPage) {
      console.log('Already on this page, skipping');
      return;
    }
    
    if (page < 1) {
      console.log('Invalid page number, skipping');
      return;
    }

    // Show toast
    setShowJumpToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowJumpToast(false);
    }, 2000);

    try {
      console.log(`Loading page ${page}`);
      // Reset media and load the requested page
      setMedia([]);
      setCurrentSlide(0);
      setCurrentPage(page); // Update current page immediately for UI feedback
      setLoading(true);
      
      const { media: newMedia, hasMore: moreAvailable, totalPages: pages } = await fetchCivitaiMedia({
        limit: 100,
        nsfw: activeFilters.nsfw,
        mediaType: activeFilters.mediaType,
        searchTerm: activeFilters.searchTerm,
        sort: activeFilters.sort || undefined,
        period: activeFilters.period || undefined,
        page
      });
      
      console.log(`Loaded ${newMedia.length} items for page ${page}`);
      setMedia(newMedia);
      setHasMore(moreAvailable);
      setTotalPages(pages || 1000);
      
      // Reset to first slide after new media is loaded
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.slickGoTo(0);
        }
      }, 50);
      
    } catch (err) {
      setError('Failed to load page');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilters]);

  const sliderSettings = {
    dots: false,
    infinite: media.length > slidesToShow,
    speed: 500,
    slidesToShow: slidesToShow,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: delaySeconds * 1000, // Convert seconds to milliseconds
    pauseOnHover: false,
    arrows: false,
    adaptiveHeight: true,
    afterChange: (current: number) => setCurrentSlide(current),
  };

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (slideContainerRef.current?.requestFullscreen) {
        slideContainerRef.current.requestFullscreen()
          .then(() => setIsFullscreen(true))
          .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => setIsFullscreen(false))
          .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
      }
    }
  }, []);

  // Update fullscreen state when fullscreen changes (e.g., Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  if (loading && media.length === 0) {
    return <LoadingContainer>Loading media from Civitai...</LoadingContainer>;
  }

  if (error && media.length === 0) {
    return <LoadingContainer>Error: {error}</LoadingContainer>;
  }

  if (media.length === 0 && !loading) {
    return <LoadingContainer>No media found</LoadingContainer>;
  }

  return (
    <>
      <ControlPanel 
        nsfw={nsfw}
        setNsfw={setNsfw}
        mediaType={mediaType}
        setMediaType={setMediaType}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        delaySeconds={delaySeconds}
        setDelaySeconds={setDelaySeconds}
        sort={sort}
        setSort={setSort}
        period={period}
        setPeriod={setPeriod}
        onApplyFilters={handleApplyFilters}
        isVisible={isPanelVisible}
        toggleVisibility={togglePanelVisibility}
        currentPage={currentPage}
        totalPages={totalPages}
        onJumpToPage={handleJumpToPage}
      />

      <SlideContainer ref={slideContainerRef}>
        <Slider ref={sliderRef} {...sliderSettings}>
          {media.map((item) => (
            <MediaContainer key={item.id}>
              {item.type === 'video' ? (
                <Video
                  src={item.url}
                  autoPlay
                  loop
                  muted
                  controls={false}
                />
              ) : (
                <Image
                  src={item.url}
                  alt="Civitai media"
                  loading="lazy"
                />
              )}
            </MediaContainer>
          ))}
        </Slider>
      </SlideContainer>
      
      {loadingMore && (
        <LoadingOverlay>Loading more media...</LoadingOverlay>
      )}
      
      <StatusIndicator>
        {currentSlide + 1} / {media.length} | Page: {currentPage} of {totalPages} | Delay: {delaySeconds}s
      </StatusIndicator>
      
      <ShortcutToast className={showToast ? 'visible' : ''}>
        Panel {isPanelVisible ? 'shown' : 'hidden'}
      </ShortcutToast>

      <ShortcutToast className={showJumpToast ? 'visible' : ''}>
        Jumped to page {currentPage}
      </ShortcutToast>
      
      <FullscreenButton onClick={toggleFullscreen}>
        {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
      </FullscreenButton>
    </>
  );
};

export default Slideshow; 