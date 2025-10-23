import React from 'react';
import { usePagination } from '../hooks/useApi';

export const DataTable = ({ 
    apiFunction,
    columns,
    defaultParams = {},
    onRowClick,
    actions,
    filters,
    searchable = true
}) => {
    const {
        data,
        meta,
        loading,
        error,
        setParams,
        setPage,
        refetch
    } = usePagination(apiFunction, defaultParams);

    const [searchTerm, setSearchTerm] = React.useState('');
    const [selectedFilters, setSelectedFilters] = React.useState({});

    React.useEffect(() => {
        const debounceTimer = setTimeout(() => {
            setParams(prev => ({
                ...prev,
                search: searchTerm,
                ...selectedFilters
            }));
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [searchTerm, selectedFilters]);

    if (error) {
        return (
            <div className="p-4 text-red-500">
                Error: {error}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Table Toolbar */}
            <div className="p-4 border-b flex justify-between items-center">
                {searchable && (
                    <input
                        type="text"
                        placeholder="Search..."
                        className="px-3 py-2 border rounded-lg"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                )}
                {filters && (
                    <div className="flex gap-2">
                        {filters.map(filter => (
                            <select
                                key={filter.key}
                                className="px-3 py-2 border rounded-lg"
                                value={selectedFilters[filter.key] || ''}
                                onChange={(e) => setSelectedFilters(prev => ({
                                    ...prev,
                                    [filter.key]: e.target.value
                                }))}
                            >
                                <option value="">{filter.label}</option>
                                {filter.options.map(option => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        ))}
                    </div>
                )}
                {actions && (
                    <div className="flex gap-2">
                        {actions.map((action, index) => (
                            <button
                                key={index}
                                onClick={action.onClick}
                                className={`px-4 py-2 rounded-lg ${action.className || 'bg-blue-500 text-white'}`}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            {columns.map((column, index) => (
                                <th
                                    key={index}
                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                    {column.title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center">
                                    Loading...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} className="px-6 py-4 text-center">
                                    No records found
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick?.(row)}
                                    className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}
                                >
                                    {columns.map((column, colIndex) => (
                                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                                            {column.render ? column.render(row) : row[column.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {meta.last_page > 1 && (
                <div className="px-4 py-3 border-t flex items-center justify-between">
                    <div className="flex-1 flex justify-between items-center">
                        <div>
                            Showing {meta.current_page} of {meta.last_page} pages
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage(meta.current_page - 1)}
                                disabled={meta.current_page === 1}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(meta.current_page + 1)}
                                disabled={meta.current_page === meta.last_page}
                                className="px-4 py-2 border rounded-lg disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};