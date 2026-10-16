import { useState, useEffect, useCallback, useRef } from 'react';
import { parseErrorMessage } from '../services/errorHandler';

/**
 * Generic async data-fetching hook.
 *
 * @param {Function} fetchFn   - async function that returns data
 * @param {Array}    deps      - dependencies that trigger a re-fetch (like useEffect)
 * @param {object}   options
 *   @param {boolean} options.immediate  - auto-fetch on mount / dep change (default true)
 *   @param {any}     options.initialData - initial value for `data` before first fetch
 */
export function useApi(fetchFn, deps = [], { immediate = true, initialData = null } = {}) {
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const execute = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetchFnRef.current(...args);
      setData(result);
      return result;
    } catch (err) {
      const msg = parseErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []); // stable – uses ref internally

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, isLoading, error, execute, setData };
}

/**
 * Hook for one-off mutations (create / update / delete).
 * Does NOT auto-execute on mount.
 */
export function useMutation(mutateFn) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const mutateFnRef = useRef(mutateFn);
  mutateFnRef.current = mutateFn;

  const mutate = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mutateFnRef.current(...args);
      return result;
    } catch (err) {
      const msg = parseErrorMessage(err);
      setError(msg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { mutate, isLoading, error, setError };
}
