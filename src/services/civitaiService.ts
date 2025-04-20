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
  page?: number;
  sort?: 'Most Reactions' | 'Most Comments' | 'Newest';
  period?: 'AllTime' | 'Year' | 'Month' | 'Week' | 'Day';
}

interface FetchResult {
  media: CivitaiMedia[];
  hasMore: boolean;
  totalPages: number;
}

const API_URL = 'https://civitai.com/api/v1';

export const fetchCivitaiMedia = async ({
  limit = 100,
  nsfw = false,
  mediaType = 'all',
  searchTerm = '',
  page = 1,
  sort,
  period
}: FetchParams = {}): Promise<FetchResult> => {
  try {
    // Ensure page is a number and at least 1
    const pageNum = Math.max(1, Number(page));
    
    // Determine endpoint based on mediaType
    const endpoint = mediaType === 'video' ? 'videos' : 'images';
    
    const params: Record<string, any> = {
      limit,
      nsfw: nsfw ? 'true' : 'false',
      page: pageNum
    };
    
    // Add search term if provided
    if (searchTerm.trim()) {
      params.query = searchTerm.trim();
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
    
    console.log(`Fetching ${endpoint} with params:`, JSON.stringify(params));
    
    const response = await axios.get(`${API_URL}/${endpoint}`, { params });
    
    console.log(`API response received for page ${pageNum}, status: ${response.status}`);
    
    if (response.data && response.data.metadata) {
      console.log('Metadata:', JSON.stringify(response.data.metadata));
    }

    if (response.data && response.data.items) {
      // Log the number of items received
      console.log(`Received ${response.data.items.length} items from API`);
      
      // Filter by media type if 'all' is not selected and we're using the images endpoint
      let filteredItems = response.data.items;
      if (mediaType === 'image' && endpoint === 'images') {
        filteredItems = filteredItems.filter((item: any) => !item.type || item.type === 'image');
      }

      const media = filteredItems.map((item: any) => ({
        id: item.id,
        url: item.url,
        type: item.type || 'image',
        nsfw: item.nsfw,
        width: item.width,
        height: item.height,
        hash: item.hash,
        meta: item.meta
      }));
      
      // Hard-code a large number for totalPages since API doesn't provide reliable info
      const totalPages = 1000;

      // If we received items, assume there's more unless we got less than the limit
      const hasMore = media.length >= limit;

      console.log(`Final result: Page ${pageNum}, hasMore: ${hasMore}, returned items: ${media.length}`);
      
      return { media, hasMore, totalPages };
    } else {
      console.log('No items found in API response');
      return { media: [], hasMore: false, totalPages: 1000 };
    }
  } catch (error) {
    console.error('Error fetching media from Civitai:', error);
    return { media: [], hasMore: false, totalPages: 1000 };
  }
}; 