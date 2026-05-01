import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverProviders } from '../redux/actions/providersActions';
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
    if (!permissionGranted || !location) {
        setProviders([]);
        setIsLoading(false);
        return;
    }

    page === 1 ? setIsLoading(true) : setIsLoadingMore(true);
    setError('');

    try {
      const params = {
        page,
        limit: 20,
        radius: newRadius,
        lat: location.latitude,
        lon: location.longitude,
        ...activeFilters
      };
      const response = await dispatch(discoverProviders(params));

      if (response.success) {
        const fetched = response.data || [];
        const formatted = fetched.map(p => ({
          ...p,
          coordinates: { latitude: parseFloat(p.latitude) || 0, longitude: parseFloat(p.longitude) || 0 }
        }));

        setProviders(prev => page === 1 ? formatted : [...prev, ...formatted]);
        setHasMore(formatted.length === params.limit);
        if (page === 1 && formatted.length === 0) {
            setError('No partners found in this radius.');
        }
      } else {
        setError('Failed to load partners.');
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
