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
  const [radius, setRadius] = useState(10); // Default radius in km

  const fetchProviders = useCallback(async (page, newRadius) => {
    page === 1 ? setIsLoading(true) : setIsLoadingMore(true);
    setError('');

    try {
      const isTrainerFilter = activeFilters.vertical === 'TRAINER' || activeFilters.categoryId === 'trainer';
      
      if (isTrainerFilter) {
        const params = {
          page,
          limit: 20,
          maxDistance: newRadius,
        };
        if (location && location.latitude && location.longitude) {
          params.latitude = location.latitude;
          params.longitude = location.longitude;
        }
        const result = await dispatch(browseTrainers(params));
        const fetched = Array.isArray(result) ? result : (result?.trainers || result?.data || []);
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
        setHasMore(formatted.length === 20);
        if (page === 1 && formatted.length === 0) {
            setError('No trainers found in this radius.');
        }
      } else {
        const params = {
          page,
          limit: 20,
          radius: newRadius,
          ...activeFilters
        };

        if (location && location.latitude && location.longitude) {
          params.lat = location.latitude;
          params.lon = location.longitude;
        }
        const response = await dispatch(discoverProviders(params));

        if (response.success) {
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
              setError('No partners found in this radius.');
          }
        } else {
          setError('Failed to load partners.');
        }
      }
    } catch (err) {
      setError(parseApiError(err) || 'An error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [location, permissionGranted, dispatch, activeFilters]);

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
