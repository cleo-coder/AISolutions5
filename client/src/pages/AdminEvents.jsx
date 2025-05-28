import React, { useEffect, useState, useRef } from 'react';

export default function AdminEvents() {
    const [events, setEvents] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [category, setCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState(''); // New state for search term
    const [metrics, setMetrics] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Ref for debouncing search input
    const searchTimeoutRef = useRef(null);

    useEffect(() => {
        setLoading(true);
        setError(null);
        fetch('http://localhost:3000/api/events/registrations')
            .then(res => {
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                return res.json();
            })
            .then(data => {
                setEvents(data);
                setFiltered(data); // Initially set filtered to all events
                calculateMetrics(data);
            })
            .catch(err => {
                console.error('Error fetching events:', err);
                setError('Failed to load event registrations. Please try again.');
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    // Effect to apply filters and search whenever events, category, or searchTerm changes
    useEffect(() => {
        applyFiltersAndSearch();
    }, [events, category, searchTerm]); // Dependencies for re-filtering

    const calculateMetrics = (data) => {
        const total = data.length;
        const categories = {};
        data.forEach(e => {
            categories[e.event_category] = (categories[e.event_category] || 0) + 1;
        });
        setMetrics({ total, categories });
    };

    const applyFiltersAndSearch = () => {
        let currentFiltered = events;

        // Apply category filter
        if (category !== 'All') {
            currentFiltered = currentFiltered.filter(e => e.event_category === category);
        }

        // Apply search term filter
        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            currentFiltered = currentFiltered.filter(e =>
                e.event_name.toLowerCase().includes(lowerCaseSearchTerm) ||
                e.attendee_email.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }
        setFiltered(currentFiltered);
    };

    const handleCategoryFilter = (cat) => {
        setCategory(cat);
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value); // Update search term immediately for controlled input

        // Debounce the actual filtering logic if needed for performance,
        // but with useEffect dependency on searchTerm, it handles debouncing implicitly
        // if you want to avoid re-rendering on every key stroke, you'd move applyFiltersAndSearch
        // into a debounced function here and remove searchTerm from useEffect dependencies.
        // For now, let's keep it simple with useEffect.
    };

    const exportCSV = () => {
        const rows = [
            ['Event Name', 'Category', 'Attendee Email', 'Registered At'],
            ...filtered.map(e => [
                e.event_name,
                e.event_category,
                e.attendee_email,
                formatDate(e.created_at) // Use the same formatting as the table
            ])
        ];
        // Simple CSV escaping: double quotes around fields, and double existing quotes
        const csv = rows.map(row =>
            row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'event_registrations.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatDate = (dateString) => {
        const options = {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
        };
        return new Date(dateString).toLocaleString(undefined, options);
    };

    return (
        <div className="min-h-screen p-6 bg-light dark:bg-dark text-lightText dark:text-darkText">
            <h2 className="text-2xl font-bold mb-4 text-accent">📅 Event Registrations Dashboard</h2>

            {loading && <p className="text-center text-primary">Loading registrations...</p>}
            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                    <strong className="font-bold">Error!</strong>
                    <span className="block sm:inline ml-2">{error}</span>
                </div>
            )}

            {!loading && !error && (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                        <div className="flex items-center w-full sm:w-auto">
                            <label htmlFor="category-select" className="mr-2 whitespace-nowrap">Filter by Category:</label>
                            <select
                                id="category-select"
                                value={category}
                                onChange={(e) => handleCategoryFilter(e.target.value)}
                                className="p-2 rounded text-black flex-grow"
                            >
                                <option value="All">All</option>
                                {Object.keys(metrics.categories || {}).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                        <div className="relative flex items-center w-full sm:w-auto">
                            <input
                                type="text"
                                placeholder="Search events or attendees..."
                                value={searchTerm}
                                onChange={handleSearchChange}
                                className="p-2 pl-8 rounded text-black w-full"
                            />
                            <svg className="absolute left-2 text-gray-500" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                        </div>
                        <button onClick={exportCSV} className="bg-primary text-white px-4 py-2 rounded hover:opacity-90 w-full sm:w-auto">
                            Export CSV
                        </button>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-lg font-semibold">📊 Metrics</h3>
                        <p>Total Registrations: <strong>{metrics.total || 0}</strong></p>
                        <ul className="list-disc list-inside">
                            {metrics.categories &&
                                Object.entries(metrics.categories).map(([cat, count]) => (
                                    <li key={cat}>{cat}: {count}</li>
                                ))}
                        </ul>
                    </div>

                    <div className="overflow-x-auto">
                        {filtered.length === 0 ? (
                            searchTerm ? (
                                <p className="text-center text-gray-500">No events found matching your search term.</p>
                            ) : category !== 'All' ? (
                                <p className="text-center text-gray-500">No registrations found for the selected category.</p>
                            ) : (
                                <p className="text-center text-gray-500">No event registrations available.</p>
                            )
                        ) : (
                            <table className="min-w-full border text-sm">
                                <thead className="bg-gray-200 dark:bg-gray-700">
                                    <tr>
                                        <th className="p-2 border text-left">Event</th>
                                        <th className="p-2 border text-left">Category</th>
                                        <th className="p-2 border text-left">Attendee Email</th>
                                        <th className="p-2 border text-left">Registered At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((e, idx) => (
                                        <tr key={idx} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                            <td className="p-2 border">{e.event_name}</td>
                                            <td className="p-2 border">{e.event_category}</td>
                                            <td className="p-2 border">{e.attendee_email}</td>
                                            <td className="p-2 border">{formatDate(e.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}