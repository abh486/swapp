// src/hooks/useGymData.js
import { useState, useEffect, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { discoverGyms } from '../redux/actions/gymsActions';
import parseApiError from '../utils/parseApiError';

export const useGymData = (location, permissionGranted) => {
  const dispatch = useDispatch();
  const [gyms, setGyms] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [radius, setRadius] = useState(10); // Default radius in km

  const fetchGyms = useCallback(async (page, newRadius) => {
    if (!permissionGranted || !location) {
        setGyms([]);
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
      };
      const response = await dispatch(discoverGyms(params));

      if (response.success) {
        const fetched = response.data.gyms || [];
        const formatted = fetched.map(g => ({
          ...g,
          coordinates: { latitude: parseFloat(g.latitude) || 0, longitude: parseFloat(g.longitude) || 0 }
        }));

        setGyms(prev => page === 1 ? formatted : [...prev, ...formatted]);
        setHasMore(formatted.length === params.limit);
        if (page === 1 && formatted.length === 0) {
            setError('No gyms found in this radius.');
        }
      } else {
        setError('Failed to load gyms.');
      }
    } catch (err) {
      setError(parseApiError(err) || 'An error occurred.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [location, permissionGranted]);

  useEffect(() => {
    // Initial fetch when location becomes available
    setCurrentPage(1);
    fetchGyms(1, radius);
  }, [location, radius, fetchGyms]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchGyms(nextPage, radius);
    }
  };

  const applyRadius = (newRadius) => {
    setRadius(newRadius);
    setCurrentPage(1); // Reset pagination on new radius
    // The useEffect will trigger the re-fetch
  };

  return {
    gyms,
    isLoading,
    isLoadingMore,
    error,
    hasMore,
    radius,
    actions: {
      loadMore,
      applyRadius,
      refresh: () => fetchGyms(1, radius),
    },
  };
};