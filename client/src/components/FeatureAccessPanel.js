import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { BadgeCheck, Ban, Loader2 } from 'lucide-react';

const FeatureAccessPanel = () => {
    const [accessList, setAccessList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updateStatus, setUpdateStatus] = useState({});

    const fetchAccessData = async () => {
        try {
            const res = await axios.get('/api/admin/access', {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setAccessList(res.data);
        } catch (err) {
            console.error('❌ Failed to fetch access data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (id) => {
        setUpdateStatus({ ...updateStatus, [id]: 'revoking' });
        try {
            await axios.patch(`/api/admin/access/${id}`, {
                status: 'revoked',
                admin_comment: 'Revoked by admin',
            }, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            fetchAccessData();
        } catch (err) {
            console.error('❌ Failed to revoke access:', err);
        }
    };

    useEffect(() => {
        fetchAccessData();
    }, []);

    if (loading) {
        return <div className="text-center p-4">Loading feature access data...</div>;
    }

    return (
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Feature Access Control</h2>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Product Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">User Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Request Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Granted Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Revoked Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Admin Notes</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {accessList.map((record) => (
                            <tr key={record.access_id} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-200">{record.product_name}</td>
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-200">{record.user_email}</td>
                                <td className="p-3 text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${record.status === 'granted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                        {record.status}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-200">{new Date(record.request_date).toLocaleString()}</td>
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-200">{record.granted_date ? new Date(record.granted_date).toLocaleString() : '-'}</td>
                                <td className="p-3 text-sm text-gray-900 dark:text-gray-200">{record.revoked_at ? new Date(record.revoked_at).toLocaleString() : '-'}</td>
                                <td className="p-3 text-sm">{record.admin_comment || '-'}</td>
                                <td className="p-3 flex gap-2">
                                    {record.status === 'granted' && (
                                        <button
                                            onClick={() => handleRevoke(record.access_id)}
                                            disabled={updateStatus[record.access_id] === 'revoking'}
                                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-full text-xs"
                                        >
                                            {updateStatus[record.access_id] === 'revoking' ? (
                                                <Loader2 className="animate-spin w-4 h-4" />
                                            ) : (
                                                <Ban className="w-4 h-4" />
                                            )}
                                            Revoke
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FeatureAccessPanel;