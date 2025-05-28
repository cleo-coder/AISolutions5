import React, { useEffect, useState } from 'react';

const LogsSection = () => {
    const [logs, setLogs] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetch('/api/admin/logs')
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch logs');
                return res.json();
            })
            .then(data => setLogs(data))
            .catch(err => {
                console.error(err);
                setError('Error fetching logs.');
            });
    }, []);

    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Audit Logs</h2>
            {logs.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No logs found.</p>
            ) : (
                <table className="w-full table-auto text-sm text-left text-gray-500 dark:text-gray-300">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-100 dark:bg-gray-700 dark:text-gray-300">
                        <tr>
                            <th className="px-4 py-2">ID</th>
                            <th className="px-4 py-2">User ID</th>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Timestamp</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.map((log, index) => (
                            <tr key={index} className="border-b dark:border-gray-600">
                                <td className="px-4 py-2">{log.id}</td>
                                <td className="px-4 py-2">{log.user_id}</td>
                                <td className="px-4 py-2">{log.action}</td>
                                <td className="px-4 py-2">{new Date(log.created_at).toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default LogsSection;