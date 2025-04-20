import axios from 'axios';

export interface CivitaiMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  nsfw: boolean;
  width: number;
  height: number;
  hash?: string;
  meta?: any;
}

interface FetchParams {
  limit?: number;
  nsfw?: boolean;
  mediaType?: string;
  searchTerm?: string;
  cursor?: string;
  sort?: 'Most Reactions' | 'Most Comments' | 'Newest';
  period?: 'AllTime' | 'Year' | 'Month' | 'Week' | 'Day';
}

interface FetchResult {
  media: CivitaiMedia[];
  hasMore: boolean;
  nextCursor: string | null;
}

const API_URL = 'https://civitai.com/api/v1';

export const fetchCivitaiMedia = async ({
  limit = 30,
  nsfw = false,
  mediaType = 'all',
  searchTerm = '',
  cursor,
  sort,
  period
}: FetchParams = {}): Promise<FetchResult> => {
  try {
    // Convert boolean nsfw to string
    const nsfwParam = nsfw ? 'true' : 'false';
    
    // Create base params
    const params: Record<string, string> = {
      limit: limit.toString(),
      nsfw: nsfwParam
    };
    
    // Add mediaType filter if not 'all'
    if (mediaType !== 'all') {
      params.type = mediaType;
    }
    
    // Add search term if provided
    if (searchTerm) {
      params.query = searchTerm;
    }
    
    // Add cursor parameter if provided
    if (cursor) {
      params.cursor = cursor;
    }
    
    // Add sort parameter if provided
    if (sort) {
      params.sort = sort;
    }
    
    // Add period parameter if provided
    if (period) {
      // If period is 'AllTime', don't add it to params (API default)
      if (period !== 'AllTime') {
        params.period = period;
      }
    }
    
    // Build query string
    const queryString = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&');
    
    // Make request to API
    const response = await fetch(`${API_URL}/images?${queryString}`);
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Log the raw response for debugging
    console.log('API response:', data);
    
    const items = data.items || [];
    
    // Extract media from response
    const media: CivitaiMedia[] = items.map((item: any) => ({
      id: item.id,
      url: item.url,
      type: item.type === 'video' ? 'video' : 'image',
      nsfw: item.nsfw,
      width: item.width,
      height: item.height,
      hash: item.hash,
      meta: item.meta
    }));
    
    // Extract nextCursor from response metadata
    const nextCursor = data.metadata?.nextCursor || null;
    const hasMore = !!nextCursor;
    
    return {
      media,
      hasMore,
      nextCursor
    };
    
  } catch (error) {
    console.error('Error fetching media from Civitai:', error);
    return {
      media: [],
      hasMore: false,
      nextCursor: null
    };
  }
}; 