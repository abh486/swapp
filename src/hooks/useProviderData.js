import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverProviders } from '../redux/actions/providersActions';
import { browseTrainers } from '../redux/actions/trainerActions';
import parseApiError from '../utils/parseApiError';

export const useProviderData = (location, permissionGranted, activeFilters = {}) => {
  const dispatch = useDispatch();
  const [providers, setProviders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [radius, setRadius] = useState(30); // Default radius in km/miles

  const fetchProviders = useCallback(async (page, newRadius) => {
    page === 1 ? setIsLoading(true) : setIsLoadingMore(true);
    setError('');

    const effectiveRadius = newRadius || radius || 30;

    try {
      const isTrainerFilter = activeFilters.vertical === 'TRAINER' || activeFilters.categoryId === 'trainer';
      
      if (isTrainerFilter) {
        const params = {
          page,
          limit: 50,
        };
        if (location && location.latitude && location.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
          params.maxDistance = 10000;
        }
        let result = await dispatch(browseTrainers(params));
        let fetched = Array.isArray(result) ? result : (result?.trainers || result?.data || []);

        if (fetched.length === 0 && (params.latitude || params.longitude)) {
          const fallbackResult = await dispatch(browseTrainers({ page, limit: 50 }));
          fetched = Array.isArray(fallbackResult) ? fallbackResult : (fallbackResult?.trainers || fallbackResult?.data || []);
        }

        const formatted = fetched.map(t => ({
          id: t.id,
          name: t.name || t.user?.email?.split('@')[0] || 'Trainer',
          photos: t.photos && t.photos.length > 0 ? t.photos : [t.profileImage || 'https://via.placeholder.com/150'],
          vertical: 'TRAINER',
          latitude: t.latitude,
          longitude: t.longitude,
          coordinates: {
            latitude: parseFloat(t.latitude) || 0,
            longitude: parseFloat(t.longitude) || 0
          },
          rating: t.rating || 4.8,
          reviews: t.reviewCount || 0,
          distance: t.distance,
          ownerId: t.user?.id || t.userId || t.id,
          amenities: t.specialties || []
        }));
        setProviders(prev => page === 1 ? formatted : [...prev, ...formatted]);
        setHasMore(formatted.length === 50);
        if (page === 1 && formatted.length === 0) {
            setError('No trainers found.');
        }
      } else {
        const params = {
          page,
          limit: 50,
          ...activeFilters
        };

        // When location is available, request with 10000 km radius so all gyms are fetched with accurate distance
        if (location && location.latitude && location.longitude) {
          params.lat = location.latitude;
          params.lon = location.longitude;
          params.radius = 10000;
        }
        let response = await dispatch(discoverProviders(params));

        // Fallback: If location query returned no gyms, fetch all gyms
        const hasProviders = response?.success && (
          (Array.isArray(response.data) && response.data.length > 0) ||
          (response.data?.providers && response.data.providers.length > 0)
        );

        if (!hasProviders && (params.lat || params.lon)) {
          const fallbackParams = {
            page,
            limit: 50,
            ...activeFilters
          };
          delete fallbackParams.lat;
          delete fallbackParams.lon;
          delete fallbackParams.radius;
          const fallbackResponse = await dispatch(discoverProviders(fallbackParams));
          if (fallbackResponse?.success) {
            response = fallbackResponse;
          }
        }

        if (response?.success) {
          const fetched = Array.isArray(response.data) 
            ? response.data 
            : (response.data?.providers || response.data?.data || []);
            
          const formatted = fetched.map(p => ({
            ...p,
            coordinates: { 
              latitude: parseFloat(p.latitude) || parseFloat(p.lat) || 0, 
              longitude: parseFloat(p.longitude) || parseFloat(p.lng) || 0 
            }
          }));

          setProviders(prev => page === 1 ? formatted : [...prev, ...formatted]);
          setHasMore(formatted.length === params.limit);
          if (page === 1 && formatted.length === 0) {
              setError('No partners found.');
          }
        } else {
          setError(response?.message || 'Failed to load partners.');
        }
      }
    } catch (err) {
      setError(parseApiError(err) || 'An error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [location, permissionGranted, dispatch, activeFilters, radius]);

  useEffect(() => {
    fetchProviders(1, radius);
  }, [location, radius, fetchProviders, activeFilters]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchProviders(nextPage, radius);
    }
  };

  const applyRadius = (newRadius) => {
    setRadius(newRadius);
    setCurrentPage(1);
  };

  return {
    providers,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    radius,
    actions: {
      loadMore,
      applyRadius,
      refresh: () => fetchProviders(1, radius),
    },
  };
};
