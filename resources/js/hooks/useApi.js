import { useState, useEffect } from 'react';
import * as api from '../services/api';

export const useList = (apiFunction, defaultParams = {}) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(defaultParams);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await apiFunction(params);
            setData(response.data.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [JSON.stringify(params)]);

    return {
        data,
        loading,
        error,
        setParams,
        refetch: fetchData
    };
};

export const usePagination = (apiFunction, defaultParams = {}) => {
    const [data, setData] = useState([]);
    const [meta, setMeta] = useState({
        current_page: 1,
        last_page: 1,
        total: 0,
        per_page: 10
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [params, setParams] = useState(defaultParams);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await apiFunction(params);
            setData(response.data.data);
            setMeta(response.data.meta);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [JSON.stringify(params)]);

    const setPage = (page) => {
        setParams(prev => ({ ...prev, page }));
    };

    return {
        data,
        meta,
        loading,
        error,
        setParams,
        setPage,
        refetch: fetchData
    };
};

export const useDashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await api.dashboardApi.getStats();
            setData(response.data);
            setError(null);
        } catch (err) {
            setError(err.response?.data?.message || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 60000); // Refresh every minute
        return () => clearInterval(interval);
    }, []);

    return {
        data,
        loading,
        error,
        refetch: fetchData
    };
};

export const useForm = (apiFunction, options = {}) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const submit = async (data) => {
        try {
            setLoading(true);
            const response = await apiFunction(data);
            setError(null);
            options.onSuccess?.(response.data);
            return response.data;
        } catch (err) {
            const error = err.response?.data?.message || 'An error occurred';
            setError(error);
            options.onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        error,
        submit
    };
};