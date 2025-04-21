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

const NextPageButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: calc(50% + 70px);
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  z-index: 100;
  font-size: 14px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ResetPageButton = styled.button`
  position: fixed;
  bottom: 20px;
  left: calc(50% - 70px);
  transform: translateX(-50%);
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  cursor: pointer;
  z-index: 100;
  font-size: 14px;
  
  &:hover {
    background-color: rgba(0, 0, 0, 0.9);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isPanelVisible, setIsPanelVisible] = useState<boolean>(true);
  const [showNextToast, setShowNextToast] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  
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

  // Handle keyboard shortcut and navigation
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
        return;
      }
      
      // Skip if slider not loaded or during loading states
      if (!sliderRef.current || loading || loadingMore) return;
      
      // Handle arrow keys for navigation
      switch (e.code) {
        case 'ArrowLeft':
          e.preventDefault();
          sliderRef.current.slickPrev();
          break;
        case 'ArrowRight':
          e.preventDefault();
          sliderRef.current.slickNext();
          break;
        case 'ArrowUp':
          e.preventDefault();
          sliderRef.current.slickPrev();
          break;
        case 'ArrowDown':
          e.preventDefault();
          sliderRef.current.slickNext();
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, [togglePanelVisibility, loading, loadingMore]);

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

  const loadMedia = useCallback(async (cursor: string | null = null, reset = false) => {
    try {
      if (!cursor) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const { media: newMedia, hasMore: moreAvailable, nextCursor: newCursor } = await fetchCivitaiMedia({
        limit: 30,
        nsfw: activeFilters.nsfw,
        mediaType: activeFilters.mediaType,
        searchTerm: activeFilters.searchTerm,
        sort: activeFilters.sort || undefined,
        period: activeFilters.period || undefined,
        cursor: cursor || undefined
      });

      if (reset) {
        setMedia(newMedia);
      } else {
        setMedia(prevMedia => [...prevMedia, ...newMedia]);
      }

      setHasMore(moreAvailable);
      setNextCursor(newCursor);
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
    loadMedia(null, true);
    
    // Show scroll instruction toast on initial load
    setTimeout(() => {
      setToastMessage('Scroll, swipe or use arrow keys to navigate');
      setShowNextToast(true);
      
      // Clear after 4 seconds - longer to ensure users see it
      toastTimeoutRef.current = setTimeout(() => {
        setShowNextToast(false);
      }, 4000);
    }, 2000); // Delay to show after content loads
    
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
    setMedia([]);
    setNextCursor(null);
    loadMedia(null, true);
  }, [nsfw, mediaType, searchTerm, sort, period, loadMedia]);

  // Auto fetch more when nearing the end
  useEffect(() => {
    // If we're within 10 slides of the end and we have more to load
    if (
      !loading && 
      !loadingMore && 
      hasMore && 
      nextCursor &&
      media.length > 0 && 
      currentSlide > 0 && 
      media.length - currentSlide < 10
    ) {
      loadMedia(nextCursor);
    }
  }, [currentSlide, media.length, loading, loadingMore, hasMore, nextCursor, loadMedia]);

  // Handle loading next page
  const handleLoadNextPage = useCallback(async () => {
    if (!hasMore || !nextCursor || loading || loadingMore) {
      return;
    }

    // Show toast
    setToastMessage('Loading next page');
    setShowNextToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowNextToast(false);
    }, 2000);

    try {
      console.log(`Loading next page with cursor: ${nextCursor}`);
      // Reset media and load the next page
      setMedia([]);
      setCurrentSlide(0);
      setLoading(true);
      
      const { media: newMedia, hasMore: moreAvailable, nextCursor: newCursor } = await fetchCivitaiMedia({
        limit: 30,
        nsfw: activeFilters.nsfw,
        mediaType: activeFilters.mediaType,
        searchTerm: activeFilters.searchTerm,
        sort: activeFilters.sort || undefined,
        period: activeFilters.period || undefined,
        cursor: nextCursor
      });
      
      console.log(`Loaded ${newMedia.length} items for next page`);
      setMedia(newMedia);
      setHasMore(moreAvailable);
      setNextCursor(newCursor);
      
      // Reset to first slide after new media is loaded
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.slickGoTo(0);
        }
      }, 50);
      
    } catch (err) {
      setError('Failed to load next page');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, hasMore, loading, loadingMore, nextCursor]);

  // Add this new function inside the Slideshow component:
  const handleResetPage = useCallback(async () => {
    if (loading || loadingMore) {
      return;
    }

    // Show toast
    setToastMessage('Resetting to first page');
    setShowNextToast(true);
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = setTimeout(() => {
      setShowNextToast(false);
    }, 2000);

    try {
      console.log('Resetting to first page');
      // Reset media and load the first page
      setMedia([]);
      setCurrentSlide(0);
      setLoading(true);
      setNextCursor(null);
      
      const { media: newMedia, hasMore: moreAvailable, nextCursor: newCursor } = await fetchCivitaiMedia({
        limit: 30,
        nsfw: activeFilters.nsfw,
        mediaType: activeFilters.mediaType,
        searchTerm: activeFilters.searchTerm,
        sort: activeFilters.sort || undefined,
        period: activeFilters.period || undefined
      });
      
      console.log(`Loaded ${newMedia.length} items for first page`);
      setMedia(newMedia);
      setHasMore(moreAvailable);
      setNextCursor(newCursor);
      
      // Reset to first slide after new media is loaded
      setTimeout(() => {
        if (sliderRef.current) {
          sliderRef.current.slickGoTo(0);
        }
      }, 50);
      
    } catch (err) {
      setError('Failed to load first page');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeFilters, loading, loadingMore]);

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

  // Add a new state variable for wake lock
  const [wakeLock, setWakeLock] = useState<WakeLockSentinel | null>(null);

  // Modify the toggleFullscreen function to include wake lock functionality
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (slideContainerRef.current?.requestFullscreen) {
        slideContainerRef.current.requestFullscreen()
          .then(() => {
            setIsFullscreen(true);
            
            // Request wake lock to prevent display from turning off
            if ('wakeLock' in navigator) {
              navigator.wakeLock.request('screen')
                .then((lock) => {
                  setWakeLock(lock);
                  console.log('Wake Lock activated');
                  setToastMessage('Fullscreen mode (display will stay on)');
                  setShowNextToast(true);
                  
                  // Clear toast after 3 seconds
                  if (toastTimeoutRef.current) {
                    clearTimeout(toastTimeoutRef.current);
                  }
                  toastTimeoutRef.current = setTimeout(() => {
                    setShowNextToast(false);
                  }, 3000);
                })
                .catch((err: Error) => {
                  console.error(`Wake Lock error: ${err.message}`);
                });
            }
          })
          .catch(err => console.error(`Error attempting to enable fullscreen: ${err.message}`));
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen()
          .then(() => {
            setIsFullscreen(false);
            
            // Release wake lock when exiting fullscreen
            if (wakeLock) {
              wakeLock.release()
                .then(() => {
                  console.log('Wake Lock released');
                  setWakeLock(null);
                })
                .catch((err: Error) => {
                  console.error(`Wake Lock release error: ${err.message}`);
                });
            }
          })
          .catch(err => console.error(`Error attempting to exit fullscreen: ${err.message}`));
      }
    }
  }, [wakeLock]);

  // Add event listener for visibility change to handle when the tab loses focus
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isFullscreen && !wakeLock) {
        // Re-acquire wake lock if tab regains visibility while in fullscreen
        if ('wakeLock' in navigator) {
          navigator.wakeLock.request('screen')
            .then((lock) => {
              setWakeLock(lock);
              console.log('Wake Lock re-acquired');
            })
            .catch((err: Error) => {
              console.error(`Wake Lock error: ${err.message}`);
            });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      
      // Release wake lock when component unmounts
      if (wakeLock) {
        wakeLock.release().catch((err: Error) => {
          console.error(`Wake Lock release error: ${err.message}`);
        });
      }
    };
  }, [isFullscreen, wakeLock]);

  // Update fullscreen state when fullscreen changes (e.g., Esc key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      const newFullscreenState = !!document.fullscreenElement;
      setIsFullscreen(newFullscreenState);
      
      // If exiting fullscreen via Esc key, release wake lock
      if (!newFullscreenState && wakeLock) {
        wakeLock.release()
          .then(() => {
            console.log('Wake Lock released (fullscreen exit)');
            setWakeLock(null);
          })
          .catch((err: Error) => {
            console.error(`Wake Lock release error: ${err.message}`);
          });
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [wakeLock]);

  // Add mouse wheel and touchpad scrolling for navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default to avoid page scrolling
      e.preventDefault();
      
      // Skip if slider not loaded or during loading states
      if (!sliderRef.current || loading || loadingMore) return;
      
      // Reduced threshold for more responsive scrolling
      const threshold = 20;
      
      if (e.deltaY > threshold) {
        // Scroll down - go to next slide
        sliderRef.current.slickNext();
      } else if (e.deltaY < -threshold) {
        // Scroll up - go to previous slide
        sliderRef.current.slickPrev();
      }
      
      // For horizontal scrolling (e.g., touchpad gestures)
      if (e.deltaX > threshold) {
        // Scroll right - go to next slide
        sliderRef.current.slickNext();
      } else if (e.deltaX < -threshold) {
        // Scroll left - go to previous slide
        sliderRef.current.slickPrev();
      }
    };
    
    // Add passive: false to indicate we'll call preventDefault()
    const slideContainer = slideContainerRef.current;
    if (slideContainer) {
      slideContainer.addEventListener('wheel', handleWheel, { passive: false });
    }
    
    return () => {
      if (slideContainer) {
        slideContainer.removeEventListener('wheel', handleWheel);
      }
    };
  }, [loading, loadingMore]);
  
  // Add touch swipe support for mobile
  useEffect(() => {
    let touchStartX = 0;
    let touchStartY = 0;
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      if (!sliderRef.current || loading || loadingMore) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const diffX = touchStartX - touchEndX;
      const diffY = touchStartY - touchEndY;
      
      // Reduced threshold for more responsive touch gestures
      const threshold = 40;
      
      // Check if horizontal swipe is more significant than vertical
      if (Math.abs(diffX) > Math.abs(diffY)) {
        if (Math.abs(diffX) > threshold) {
          if (diffX > 0) {
            // Swipe left - go to next slide
            sliderRef.current.slickNext();
          } else {
            // Swipe right - go to previous slide
            sliderRef.current.slickPrev();
          }
        }
      } else {
        // Vertical swipe handling
        if (Math.abs(diffY) > threshold) {
          if (diffY > 0) {
            // Swipe up - go to next slide
            sliderRef.current.slickNext();
          } else {
            // Swipe down - go to previous slide
            sliderRef.current.slickPrev();
          }
        }
      }
    };
    
    const slideContainer = slideContainerRef.current;
    if (slideContainer) {
      slideContainer.addEventListener('touchstart', handleTouchStart, { passive: true });
      slideContainer.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
    
    return () => {
      if (slideContainer) {
        slideContainer.removeEventListener('touchstart', handleTouchStart);
        slideContainer.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [loading, loadingMore]);

  // Update the ShortcutToast to handle both reset and next page messages:
  const [toastMessage, setToastMessage] = useState<string>('');

  // Check for wake lock support on component mount
  useEffect(() => {
    const isWakeLockSupported = 'wakeLock' in navigator;
    console.log(`Wake Lock API support: ${isWakeLockSupported ? 'YES' : 'NO'}`);
    
    if (!isWakeLockSupported) {
      console.warn('This browser does not support the Wake Lock API. Display may turn off in fullscreen mode.');
    }
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
        {currentSlide + 1} / {media.length} | Delay: {delaySeconds}s
      </StatusIndicator>
      
      <ShortcutToast className={showToast ? 'visible' : ''}>
        Panel {isPanelVisible ? 'shown' : 'hidden'}
      </ShortcutToast>

      <ShortcutToast className={showNextToast ? 'visible' : ''}>
        {toastMessage}
      </ShortcutToast>
      
      {hasMore && nextCursor && (
        <NextPageButton 
          onClick={handleLoadNextPage}
          disabled={loading || loadingMore}
        >
          Next Page
        </NextPageButton>
      )}
      
      <ResetPageButton 
        onClick={handleResetPage}
        disabled={loading || loadingMore}
      >
        First Page
      </ResetPageButton>
      
      <FullscreenButton onClick={toggleFullscreen}>
        {isFullscreen ? <ExitFullscreenIcon /> : <EnterFullscreenIcon />}
      </FullscreenButton>
    </>
  );
};

export default Slideshow; 