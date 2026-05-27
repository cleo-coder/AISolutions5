import React, { useEffect, useState, useCallback } from 'react';

// Simple JWT decode function for client-side use
const jwtDecode = (token) => {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error("Failed to decode JWT:", e);
        return null;
    }
};

// --- PDF Export Functions ---
// These functions assume jsPDF and jspdf-autotable are loaded globally via CDN.

// Common settings for PDF titles
const commonTitleSettings = (doc, title) => {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
};

// Helper to check if jsPDF is loaded
const isJsPDFLoaded = (showModal) => {
    // Check for both jsPDF and autoTable plugin
    if (typeof window.jsPDF === 'undefined' || typeof window.jsPDF.autoTable === 'undefined') {
        console.error("jsPDF or jspdf-autotable library is not loaded. Please wait or check network.");
        // Only show modal if it's not already visible to prevent spamming
        if (!document.querySelector('.modal-overlay')) {
            showModal("PDF library not ready. Please try again in a moment.", false);
        }
        return false;
    }
    return true;
};

// Export Users to PDF
const exportUsersToPDF = (users, showModal) => {
    if (!isJsPDFLoaded(showModal)) return;
    const doc = new window.jsPDF();
    commonTitleSettings(doc, 'Users Report');

    const columns = ['User ID', 'Username', 'Email', 'Full Name', 'Company', 'Created At'];
    const rows = users.map(u => [
        u.user_id,
        u.username,
        u.email,
        u.full_name,
        u.company_name,
        new Date(u.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('users_report.pdf');
};

// Export Demo Requests to PDF
const exportDemoRequestsToPDF = (demos, showModal) => {
    if (!isJsPDFLoaded(showModal)) return;
    const doc = new window.jsPDF();
    commonTitleSettings(doc, 'Demo Requests Report');

    const columns = ['Company', 'Request Message', 'Preferred Date', 'Email', 'Status', 'Admin Notes', 'Created At'];
    const rows = demos.map(item => [
        item.company_name,
        item.request_message,
        new Date(item.preferred_date).toLocaleDateString(),
        item.email,
        item.status,
        item.admin_notes || 'N/A',
        new Date(item.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('demo_requests.pdf');
};

// Export Revenue Report to PDF
const exportRevenueReportToPDF = (revenueData, showModal) => {
    if (!isJsPDFLoaded(showModal)) return;
    const doc = new window.jsPDF();
    commonTitleSettings(doc, 'Revenue Report');

    const columns = ['Product/Service', 'Total Revenue'];
    const rows = revenueData.map(item => [
        item.solution_type,
        `$${Number(item.total_revenue || 0).toFixed(2)}`
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('revenue_report.pdf');
};

// Export Profit Margin Report to PDF
const exportProfitMarginReportToPDF = (profitMarginData, showModal) => {
    if (!isJsPDFLoaded(showModal)) return;
    const doc = new window.jsPDF();
    commonTitleSettings(doc, 'Profit Margin Report');

    const columns = ['Product/Service', 'Total Revenue', 'Total Cost', 'Profit Margin (%)'];
    const rows = profitMarginData.map(item => [
        item.solution_type,
        `$${Number(item.total_revenue || 0).toFixed(2)}`,
        `$${Number(item.total_cost || 0).toFixed(2)}`,
        `${(Number(item.average_profit_margin || 0) * 100).toFixed(2)}%`
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('profit_margin_report.pdf');
};

// Export Job Reports to PDF
const exportJobReportsToPDF = (jobData, showModal) => {
    if (!isJsPDFLoaded(showModal)) return;
    const doc = new window.jsPDF({ orientation: 'landscape' });
    commonTitleSettings(doc, 'Job Reports');

    const columns = [
        'Job ID', 'Type', 'Status', 'Customer Name', 'Customer Email',
        'Job Date', 'Actual Cost', 'Revenue', 'Satisfaction Rating'
    ];
    const rows = jobData.map(job => [
        job.job_id,
        job.solution_type,
        job.status,
        job.customer_name,
        job.customer_email || 'N/A',
        job.job_date ? new Date(job.job_date).toLocaleDateString() : 'N/A',
        `$${Number(job.cost || 0).toFixed(2)}`,
        `$${Number(job.revenue || 0).toFixed(2)}`,
        Number(job.satisfaction_rating || 0).toFixed(2)
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 8 }, // Smaller font for landscape
        headStyles: { fillColor: [30, 144, 255] },
        didParseCell: function (data) {
            // Center align numerical columns if needed
            if (['Actual Cost', 'Revenue', 'Satisfaction Rating'].includes(data.column.header)) {
                data.cell.styles.halign = 'right';
            }
        }
    });

    doc.save('job_reports.pdf');
};
// --- End PDF Export Functions ---


export default function AdminDashboard() {
    const [admin, setAdmin] = useState(null);
    const [users, setUsers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [demoRequests, setDemoRequests] = useState([]);
    const [events, setEvents] = useState([]);
    const [productAccess, setProductAccess] = useState([]);
    const [metrics, setMetrics] = useState({});
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('metrics');

    // Loading states
    const [isLoadingAdmin, setIsLoadingAdmin] = useState(true);
    const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
    const [isLoadingJobs, setIsLoadingJobs] = useState(true);
    const [isLoadingRevenueReport, setIsLoadingRevenueReport] = useState(false);
    const [isLoadingProfitMarginReport, setIsLoadingProfitMarginReport] = useState(false);
    const [isLoadingCsatReport, setIsLoadingCsatReport] = useState(false);

    // New states for Job Management
    const [jobs, setJobs] = useState([]);
    const [jobFilterType, setJobFilterType] = useState('');
    const [jobFilterStartDate, setJobFilterStartDate] = useState('');
    const [jobFilterEndDate, setJobFilterEndDate] = useState('');
    const [jobFilterCustomer, setJobFilterCustomer] = useState('');
    const [jobMetrics, setJobMetrics] = useState({}); // Still needed to display avgJobSatisfaction and totalJobRevenue

    // New states for Reporting
    const [revenueReport, setRevenueReport] = useState(null);
    const [profitMarginReport, setProfitMarginReport] = useState(null);
    const [csatReport, setCsatReport] = useState(null);
    const [reportDateRange, setReportDateRange] = useState({ startDate: '', endDate: '' });
    const [activeReportTab, setActiveReportTab] = useState('revenue'); // Sub-tab for reports

    // New state for Logs
    const [logs, setLogs] = useState([]);
    const [isLoadingLogs, setIsLoadingLogs] = useState(false); // Add loading state for logs
    const [logFilterType, setLogFilterType] = useState(''); // e.g., 'error', 'access', 'system'
    const [logFilterDate, setLogFilterDate] = useState('');

    const itemsPerPage = 5;
    const [usersCurrentPage, setUsersCurrentPage] = useState(1);
    const [adminsCurrentPage, setAdminsCurrentPage] = useState(1);
    const [demoRequestsCurrentPage, setDemoRequestsCurrentPage] = useState(1);
    const [eventsCurrentPage, setEventsCurrentPage] = useState(1);
    const [featureAccessCurrentPage, setFeatureAccessCurrentPage] = useState(1);
    const [jobsCurrentPage, setJobsCurrentPage] = useState(1); // Pagination for jobs
    const [logsCurrentPage, setLogsCurrentPage] = useState(1); // Pagination for logs

    const [newAdminUsername, setNewAdminUsername] = useState('');
    const [newAdminEmail, setNewAdminEmail] = useState('');
    const [newAdminPassword, setNewAdminPassword] = useState('');
    const [newAdminFullName, setNewAdminFullName] = useState(''); // Added for full_name in admins table

    const [newEventTitle, setNewEventTitle] = useState('');
    const [newEventDescription, setNewEventDescription] = useState('');
    const [newEventDate, setNewEventDate] = useState('');
    const [newEventLocation, setNewEventLocation] = useState('');
    const [newEventCategory, setNewEventCategory] = useState(''); // Initialize with empty string

    const [editingDemoRequest, setEditingDemoRequest] = useState(null);
    const [newDemoRequestStatus, setNewDemoRequestStatus] = useState(''); // Initialize with empty string
    const [newAdminNotes, setNewAdminNotes] = useState('');

    // State for editing events
    const [editingEvent, setEditingEvent] = useState(null);
    const [editEventTitle, setEditEventTitle] = useState('');
    const [editEventDescription, setEditEventDescription] = useState('');
    const [editEventDate, setEditEventDate] = useState('');
    const [editEventLocation, setEditEventLocation] = useState('');
    const [editEventCategory, setEditEventCategory] = useState(''); // Initialize with empty string

    // State for custom delete confirmation modal
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
    const [eventToDeleteId, setEventToDeleteId] = useState(null);


    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [modalMessage, setModalMessage] = useState('');

    const API_BASE_URL = '/api';

    const getTodayDate = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = (today.getMonth() + 1).toString().padStart(2, '0');
        const day = today.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const todayMinDate = getTodayDate(); // Get today's date once

    const showModal = useCallback((message, isSuccess) => {
        setModalMessage(message);
        if (isSuccess) {
            setShowSuccessModal(true);
            setShowErrorModal(false);
        } else {
            setShowErrorModal(true);
            setShowSuccessModal(false);
        }
    }, []);

    const closeModal = useCallback(() => {
        setShowSuccessModal(false);
        setShowErrorModal(false);
        setModalMessage('');
    }, []);

    // State to track if PDF libraries are loaded
    const [pdfLibsLoaded, setPdfLibsLoaded] = useState(false);

    useEffect(() => {
        console.log("AdminDashboard: useEffect for PDF script loading initiated.");
        const loadScript = (src, id, callback) => {
            console.log(`AdminDashboard: Attempting to load script: ${src} with ID: ${id}`);
            if (document.getElementById(id)) {
                console.log(`AdminDashboard: Script already loaded: ${id}`);
                callback();
                return;
            }
            const script = document.createElement('script');
            script.src = src;
            script.id = id;
            script.onload = () => {
                console.log(`AdminDashboard: Script loaded successfully: ${id}`);
                callback();
            };
            script.onerror = () => {
                console.error(`AdminDashboard: Failed to load script: ${src}`);
                showModal(`Failed to load PDF library from ${src}. Please check your internet connection.`, false);
            };
            document.head.appendChild(script);
        };

        let jspdfLoadedInternal = false;
        let autotableLoadedInternal = false;

        const checkAllLoaded = () => {
            console.log(`AdminDashboard: checkAllLoaded called. jsPDF: ${jspdfLoadedInternal}, AutoTable: ${autotableLoadedInternal}`);
            if (jspdfLoadedInternal && autotableLoadedInternal) {
                setPdfLibsLoaded(true);
                console.log("AdminDashboard: jsPDF and jspdf-autotable loaded successfully. PDF buttons enabled.");
            }
        };

        // Load jsPDF
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js', 'jspdf-script', () => {
            jspdfLoadedInternal = true;
            checkAllLoaded();
        });

        // Load jspdf-autotable
        loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js', 'jspdf-autotable-script', () => {
            autotableLoadedInternal = true;
            checkAllLoaded();
        });

        return () => {
            // Cleanup scripts on unmount
            const jspdfScript = document.getElementById('jspdf-script');
            const autotableScript = document.getElementById('jspdf-autotable-script');
            if (jspdfScript && jspdfScript.parentNode) jspdfScript.parentNode.removeChild(jspdfScript);
            if (autotableScript && autotableScript.parentNode) autotableScript.parentNode.removeChild(autotableScript);
        };
    }, [showModal]); // Dependency on showModal to ensure it's stable


    const fetchAdminDetails = useCallback(async (userID, token) => {
        setIsLoadingAdmin(true);
        try {
            const res = await fetch(`${API_BASE_URL}/admin/admins/${userID}`, { // Corrected endpoint to match adminRoutes.js
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                if (res.status === 403) {
                    throw new Error('Forbidden: You do not have permission to view this profile.');
                }
                throw new Error(data.message || 'Failed to load admin data');
            }
            setAdmin(data);
        } catch (err) {
            console.error('Error loading admin data:', err);
            setError('Failed to load admin data: ' + err.message);
            showModal('Failed to load admin profile: ' + err.message, false);
        } finally {
            setIsLoadingAdmin(false);
        }
    }, [API_BASE_URL, showModal]);

    const fetchDashboardData = useCallback(async (token) => {
        setIsLoadingDashboard(true);
        try {
            const [usersRes, adminsRes, demoRes, eventsRes, metricsRes, accessRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/admins`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/demo-requests`, { headers: { Authorization: `Bearer ${token}` } }), // Corrected endpoint
                fetch(`${API_BASE_URL}/admin/events`, { headers: { Authorization: `Bearer ${token}` } }), // Assumes new /admin/events GET route on server
                fetch(`${API_BASE_URL}/admin/metrics`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/feature-access`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            if (!usersRes.ok) throw new Error(`Failed to fetch users: ${usersRes.statusText}`);
            if (!adminsRes.ok) throw new Error(`Failed to fetch admins: ${adminsRes.statusText}`);
            if (!demoRes.ok) throw new Error(`Failed to fetch demo requests: ${demoRes.statusText}`);
            if (!eventsRes.ok) throw new Error(`Failed to fetch events: ${eventsRes.statusText}`);
            if (!metricsRes.ok) throw new Error(`Failed to fetch metrics: ${metricsRes.statusText}`);
            if (!accessRes.ok) throw new Error(`Failed to fetch product access: ${accessRes.statusText}`);

            const [usersData, adminsData, demoData, eventsData, metricsData, accessData] = await Promise.all([
                usersRes.json(),
                adminsRes.json(),
                demoRes.json(),
                eventsRes.json(),
                metricsRes.json(),
                accessRes.json(),
            ]);

            console.log('Fetched metrics data:', metricsData); // Debugging log
            console.log('Fetched access data:', accessData); // Debugging log

            setUsers(usersData);
            setAdmins(adminsData);
            setDemoRequests(demoData);
            setEvents(eventsData);
            setMetrics(metricsData);
            setProductAccess(accessData);

            // Ensure jobMetrics is populated from metricsData
            setJobMetrics({
                totalJobs: metricsData.jobMetrics?.totalJobs || 0,
                totalJobRevenue: metricsData.jobMetrics?.totalJobRevenue || 0,
                avgJobSatisfaction: metricsData.jobMetrics?.avgJobSatisfaction || 0,
            });

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setError('Failed to load dashboard data: ' + err.message);
            showModal('Failed to load dashboard data: ' + err.message, false);
        } finally {
            setIsLoadingDashboard(false);
        }
    }, [API_BASE_URL, showModal]);

    // --- New Fetch Functions for Jobs and Reports ---
    const fetchJobData = useCallback(async (token, type = '', startDate = '', endDate = '', customer = '') => {
        setIsLoadingJobs(true);
        try {
            const queryParams = new URLSearchParams();
            if (type) queryParams.append('solutionType', type);
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);
            if (customer) queryParams.append('customer', customer);

            const res = await fetch(`${API_BASE_URL}/admin/jobs?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch jobs data');
            }
            console.log('Fetched jobs data:', data); // Debugging log
            setJobs(data.jobs); // Corrected: Set jobs with data.jobs, not the entire data object
        } catch (err) {
            console.error('Error fetching jobs data:', err);
            setError('Failed to load jobs data: ' + err.message);
            showModal('Failed to load jobs data: ' + err.message, false);
        } finally {
            setIsLoadingJobs(false);
        }
    }, [API_BASE_URL, showModal]);

    const fetchRevenueReport = useCallback(async (token, startDate = '', endDate = '') => {
        setIsLoadingRevenueReport(true);
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const res = await fetch(`${API_BASE_URL}/admin/reports/revenue-by-solution?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch revenue report');
            }
            setRevenueReport(data);
        } catch (err) {
            console.error('Error fetching revenue report:', err);
            setError('Failed to load revenue report: ' + err.message);
            setRevenueReport(null);
            showModal('Failed to load revenue report: ' + err.message, false);
        } finally {
            setIsLoadingRevenueReport(false);
        }
    }, [API_BASE_URL, showModal]);

    const fetchProfitMarginReport = useCallback(async (token, startDate = '', endDate = '') => {
        setIsLoadingProfitMarginReport(true);
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const res = await fetch(`${API_BASE_URL}/admin/reports/profit-margin-by-solution?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch profit margin report');
            }
            setProfitMarginReport(data);
        } catch (err) {
            console.error('Error fetching profit margin report:', err);
            setError('Failed to load profit margin report: ' + err.message);
            setProfitMarginReport(null);
            showModal('Failed to load profit margin report: ' + err.message, false);
        } finally {
            setIsLoadingProfitMarginReport(false);
        }
    }, [API_BASE_URL, showModal]);

    const fetchCsatReport = useCallback(async (token, startDate = '', endDate = '') => {
        setIsLoadingCsatReport(true);
        try {
            const queryParams = new URLSearchParams();
            if (startDate) queryParams.append('startDate', startDate);
            if (endDate) queryParams.append('endDate', endDate);

            const res = await fetch(`${API_BASE_URL}/admin/reports/csat-by-solution?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch CSAT report');
            }
            setCsatReport(data);
        } catch (err) {
            console.error('Error fetching CSAT report:', err);
            setError('Failed to load CSAT report: ' + err.message);
            setCsatReport(null);
            showModal('Failed to load CSAT report: ' + err.message, false);
        } finally {
            setIsLoadingCsatReport(false);
        }
    }, [API_BASE_URL, showModal]);

    // New fetch function for Logs
    const fetchLogs = useCallback(async (token, type = '', date = '') => {
        setIsLoadingLogs(true);
        try {
            const queryParams = new URLSearchParams();
            if (type) queryParams.append('type', type);
            if (date) queryParams.append('date', date);

            const res = await fetch(`${API_BASE_URL}/admin/logs?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to fetch logs');
            }
            setLogs(data);
        } catch (err) {
            console.error('Error fetching logs:', err);
            setError('Failed to load logs: ' + err.message);
            setLogs([]);
            showModal('Failed to load logs: ' + err.message, false);
        } finally {
            setIsLoadingLogs(false);
        }
    }, [API_BASE_URL, showModal]);


    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            setError('No token found. Please log in.');
            showModal('No token found. Please log in.', false);
            return;
        }

        try {
            const decoded = jwtDecode(token);
            if (!decoded || decoded.role !== 'admin') { // Added check for null decoded
                setError('Access Denied: You are not authorized to view this page.');
                showModal('Access Denied: You are not authorized to view this page.', false);
                return;
            }
            fetchAdminDetails(decoded.userId, token);
            fetchDashboardData(token);
            fetchJobData(token); // Initial fetch for jobs (detailed list)
        } catch (err) {
            setError('Invalid token: ' + err.message);
            showModal('Invalid token: ' + err.message, false);
        }
    }, [fetchAdminDetails, fetchDashboardData, fetchJobData, showModal]);

    // Effect for fetching reports based on active tab and date range
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && (activeTab === 'reports' || activeTab === 'jobManagement')) {
            switch (activeReportTab) {
                case 'revenue':
                    fetchRevenueReport(token, reportDateRange.startDate, reportDateRange.endDate);
                    break;
                case 'profitMargin':
                    fetchProfitMarginReport(token, reportDateRange.startDate, reportDateRange.endDate);
                    break;
                case 'csat':
                    fetchCsatReport(token, reportDateRange.startDate, reportDateRange.endDate);
                    break;
                default:
                    break;
            }
        }
    }, [activeTab, activeReportTab, reportDateRange.startDate, reportDateRange.endDate, fetchRevenueReport, fetchProfitMarginReport, fetchCsatReport]);

    // Effect for fetching filtered jobs when filter parameters change
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && activeTab === 'jobManagement') {
            fetchJobData(token, jobFilterType, jobFilterStartDate, jobFilterEndDate, jobFilterCustomer);
        }
    }, [activeTab, jobFilterType, jobFilterStartDate, jobFilterEndDate, jobFilterCustomer, fetchJobData]);

    // Effect for fetching logs when logs tab is active or filters change
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token && activeTab === 'logs') {
            fetchLogs(token, logFilterType, logFilterDate);
        }
    }, [activeTab, logFilterType, logFilterDate, fetchLogs]);


    const handleExportDemoRequests = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showModal('Authentication token missing. Please log in.', false);
            return;
        }

        try {
            const queryParams = new URLSearchParams();
            queryParams.append('export', 'csv');

            const res = await fetch(`${API_BASE_URL}/admin/demo-requests?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to export demo requests');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'demo_requests.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showModal('Demo requests exported successfully!', true);
        } catch (err) {
            console.error('Error exporting demo requests:', err);
            showModal('Error exporting demo requests: ' + err.message, false);
        }
    }, [API_BASE_URL, showModal]);

    const handleExportJobs = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showModal('Authentication token missing. Please log in.', false);
            return;
        }

        try {
            const queryParams = new URLSearchParams();
            if (jobFilterType) queryParams.append('solutionType', jobFilterType);
            if (jobFilterStartDate) queryParams.append('startDate', jobFilterStartDate);
            if (jobFilterEndDate) queryParams.append('endDate', jobFilterEndDate);
            // Corrected: Use jobFilterCustomer instead of undeclared 'customer'
            if (jobFilterCustomer) queryParams.append('customer', jobFilterCustomer);
            queryParams.append('export', 'csv');

            const res = await fetch(`${API_BASE_URL}/admin/jobs?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to export jobs data');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'jobs_data.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showModal('Jobs data exported successfully!', true);
        } catch (err) {
            console.error('Error exporting jobs data:', err);
            showModal('Error exporting jobs data: ' + err.message, false);
        }
    }, [API_BASE_URL, jobFilterType, jobFilterStartDate, jobFilterEndDate, jobFilterCustomer, showModal]);

    // New export function for reports
    const handleExportReports = useCallback(async (reportType) => {
        const token = localStorage.getItem('token');
        if (!token) {
            showModal('Authentication token missing. Please log in.', false);
            return;
        }

        try {
            const queryParams = new URLSearchParams();
            if (reportDateRange.startDate) queryParams.append('startDate', reportDateRange.startDate);
            if (reportDateRange.endDate) queryParams.append('endDate', reportDateRange.endDate);
            queryParams.append('export', 'csv');

            let endpoint = '';
            let filename = '';

            switch (reportType) {
                case 'revenue':
                    endpoint = `${API_BASE_URL}/admin/reports/revenue-by-solution`;
                    filename = 'revenue_report.csv';
                    break;
                case 'profitMargin':
                    endpoint = `${API_BASE_URL}/admin/reports/profit-margin-by-solution`;
                    filename = 'profit_margin_report.csv';
                    break;
                case 'csat':
                    endpoint = `${API_BASE_URL}/admin/reports/csat-by-solution`;
                    filename = 'csat_report.csv';
                    break;
                default:
                    throw new Error('Invalid report type for export');
            }

            const res = await fetch(`${endpoint}?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Failed to export ${reportType} report`);
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showModal(`${reportType} report exported successfully!`, true);
        } catch (err) {
            console.error(`Error exporting ${reportType} report:`, err);
            showModal(`Error exporting ${reportType} report: ` + err.message, false);
        }
    }, [API_BASE_URL, reportDateRange.startDate, reportDateRange.endDate, showModal]);

    // New export function for logs
    const handleExportLogs = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            showModal('Authentication token missing. Please log in.', false);
            return;
        }

        try {
            const queryParams = new URLSearchParams();
            if (logFilterType) queryParams.append('type', logFilterType);
            if (logFilterDate) queryParams.append('date', logFilterDate);
            queryParams.append('export', 'csv');

            const res = await fetch(`${API_BASE_URL}/admin/logs?${queryParams.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to export logs data');
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'system_logs.csv';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            showModal('Logs data exported successfully!', true);
        } catch (err) {
            console.error('Error exporting logs data:', err);
            showModal('Error exporting logs data: ' + err.message, false);
        }
    }, [API_BASE_URL, logFilterType, logFilterDate, showModal]);

    const handleGrantAccess = useCallback(async (userId, name) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/feature-access/grant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userId, productName: name })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to grant access');
            }
            showModal('Access granted successfully!', true);
            fetchDashboardData(token);
        } catch (err) {
            console.error('Error granting access:', err);
            showModal('Error granting access: ' + err.message, false);
        }
    }, [API_BASE_URL, fetchDashboardData, showModal]);

    const handleDenyAccess = useCallback(async (userId, name) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/feature-access/deny`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userId, productName: name })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to deny access');
            }
            showModal('Access denied successfully!', true);
            fetchDashboardData(token);
        } catch (err) {
            console.error('Error denying access:', err);
            showModal('Error denying access: ' + err.message, false);
        }
    }, [API_BASE_URL, fetchDashboardData, showModal]);

    const handleRevokeAccess = useCallback(async (userId, name) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/feature-access/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ userId: userId, productName: name })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to revoke access');
            }
            showModal('Access revoked successfully!', true);
            fetchDashboardData(token);
        } catch (err) {
            console.error('Error revoking access:', err);
            showModal('Error revoking access: ' + err.message, false);
        }
    }, [API_BASE_URL, fetchDashboardData, showModal]);


    const handleRegisterAdmin = useCallback(async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/admin/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: newAdminUsername,
                    email: newAdminEmail,
                    password: newAdminPassword,
                    full_name: newAdminFullName
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to register admin');
            }
            showModal('Admin registered successfully!', true);
            setNewAdminUsername('');
            setNewAdminEmail('');
            setNewAdminPassword('');
            setNewAdminFullName('');
            fetchDashboardData(token);
        } catch (err) {
            console.error('Error registering admin:', err);
            showModal('Error registering admin: ' + err.message, false);
        }
    }, [newAdminUsername, newAdminEmail, newAdminPassword, newAdminFullName, API_BASE_URL, fetchDashboardData, showModal]);

    const handleUpdateDemoRequestStatus = useCallback(async (requestId, status, admin_notes = null) => {
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/demo-requests/${requestId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ status, admin_notes })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || `Failed to update demo request status`);
            }
            showModal(`Demo request ${requestId} status updated to '${status}' successfully!`, true);
            setEditingDemoRequest(null);
            setNewDemoRequestStatus('');
            setNewAdminNotes('');
            fetchDashboardData(token);
        } catch (err) {
            console.error(`Error updating demo request status:`, err);
            showModal(`Error updating demo request: ` + err.message, false);
        }
    }, [API_BASE_URL, fetchDashboardData, showModal]);

    const handleCreateEvent = useCallback(async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        try {
            const res = await fetch(`${API_BASE_URL}/admin/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: newEventTitle,
                    description: newEventDescription,
                    event_date: newEventDate,
                    location: newEventLocation,
                    category: newEventCategory
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to create event');
            }
            showModal('Event created successfully!', true);
            setNewEventTitle('');
            setNewEventDescription('');
            setNewEventDate('');
            setNewEventLocation('');
            setNewEventCategory('');
            fetchDashboardData(token);
        } catch (err) {
            console.error('Error creating event:', err);
            showModal('Error creating event: ' + err.message, false);
        }
    }, [newEventTitle, newEventDescription, newEventDate, newEventLocation, newEventCategory, API_BASE_URL, fetchDashboardData, showModal]);

    const handleEditEvent = useCallback(async (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');
        if (!editingEvent) return;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/events/${editingEvent.event_id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: editEventTitle,
                    description: editEventDescription,
                    event_date: editEventDate,
                    location: editEventLocation,
                    category: editEventCategory
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Failed to update event');
            }
            showModal('Event updated successfully!', true);
            setEditingEvent(null); // Close modal
            fetchDashboardData(token); // Re-fetch to update events list
        } catch (err) {
            console.error('Error updating event:', err);
            showModal('Error updating event: ' + err.message, false);
        }
    }, [editingEvent, editEventTitle, editEventDescription, editEventDate, editEventLocation, editEventCategory, API_BASE_URL, fetchDashboardData, showModal]);

    // Function to initiate deletion (show custom modal)
    const confirmDeleteEvent = useCallback((eventId) => {
        setEventToDeleteId(eventId);
        setShowDeleteConfirmModal(true);
    }, []);

    // Function to perform the actual delete after confirmation
    const executeDeleteEvent = useCallback(async () => {
        setShowDeleteConfirmModal(false); // Close the confirmation modal
        const token = localStorage.getItem('token');
        if (!eventToDeleteId) return; // Should not happen if modal is shown correctly

        try {
            const res = await fetch(`${API_BASE_URL}/admin/events/${eventToDeleteId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to delete event');
            }
            showModal('Event deleted successfully!', true);
            fetchDashboardData(token); // Re-fetch to update events list
        } catch (err) {
            console.error('Error deleting event:', err);
            showModal('Error deleting event: ' + err.message, false);
        } finally {
            setEventToDeleteId(null); // Clear the ID
        }
    }, [API_BASE_URL, eventToDeleteId, fetchDashboardData, showModal]);


    // Pagination logic (simplified for brevity, assuming you have rendering for this)
    const indexOfLastUser = usersCurrentPage * itemsPerPage;
    const indexOfFirstUser = indexOfLastUser - itemsPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);
    const totalUserPages = Math.ceil(users.length / itemsPerPage);

    const indexOfLastAdmin = adminsCurrentPage * itemsPerPage;
    const indexOfFirstAdmin = indexOfLastAdmin - itemsPerPage;
    const currentAdmins = admins.slice(indexOfFirstAdmin, indexOfLastAdmin);
    const totalAdminPages = Math.ceil(admins.length / itemsPerPage);

    const indexOfLastDemoRequest = demoRequestsCurrentPage * itemsPerPage;
    const indexOfFirstDemoRequest = indexOfLastDemoRequest - itemsPerPage;
    const currentDemoRequests = demoRequests.slice(indexOfFirstDemoRequest, indexOfLastDemoRequest);
    const totalDemoRequestPages = Math.ceil(demoRequests.length / itemsPerPage);

    const indexOfLastEvent = eventsCurrentPage * itemsPerPage;
    const indexOfFirstEvent = indexOfLastEvent - itemsPerPage;
    const currentEvents = events.slice(indexOfFirstEvent, indexOfLastEvent);
    const totalEventPages = Math.ceil(events.length / itemsPerPage);

    const indexOfLastFeatureAccess = featureAccessCurrentPage * itemsPerPage;
    const indexOfFirstFeatureAccess = indexOfLastFeatureAccess - itemsPerPage;
    const currentFeatureAccess = productAccess.slice(indexOfFirstFeatureAccess, indexOfLastFeatureAccess);
    const totalFeatureAccessPages = Math.ceil(productAccess.length / itemsPerPage);

    const indexOfLastJob = jobsCurrentPage * itemsPerPage;
    const indexOfFirstJob = indexOfLastJob - itemsPerPage;
    const currentJobs = jobs.slice(indexOfFirstJob, indexOfLastJob);
    const totalJobPages = Math.ceil(jobs.length / itemsPerPage); // This should ideally come from the API response (data.totalPages)

    const indexOfLastLog = logsCurrentPage * itemsPerPage;
    const indexOfFirstLog = indexOfLastLog - itemsPerPage;
    const currentLogs = logs.slice(indexOfFirstLog, indexOfLastLog);
    const totalLogPages = Math.ceil(logs.length / itemsPerPage);


    if (error) {
        return <div className="text-red-500 p-4">{error}</div>;
    }

    if (isLoadingAdmin || isLoadingDashboard) {
        return <div className="text-center p-4">Loading dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8 font-sans">
            <style>
                {`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                .tab-button {
                    padding: 0.75rem 1.5rem;
                    border-radius: 0.5rem;
                    font-weight: 500;
                    transition: all 0.2s ease-in-out;
                }
                .tab-button.active {
                    background-color: #3b82f6; /* blue-500 */
                    color: white;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .tab-button:not(.active):hover {
                    background-color: #e0e7ff; /* indigo-100 */
                    color: #3b82f6;
                }
                .card {
                    background-color: white;
                    border-radius: 0.75rem;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                    padding: 1.5rem;
                }
                .table-header {
                    background-color: #eff6ff; /* blue-50 */
                    color: #1e40af; /* blue-800 */
                }
                .modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.6);
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    z-index: 1000;
                }
                .modal-content {
                    background: white;
                    padding: 2rem;
                    border-radius: 0.75rem;
                    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
                    max-width: 500px;
                    width: 90%;
                    text-align: center;
                }
                .modal-success {
                    color: #10b981; /* green-500 */
                }
                .modal-error {
                    color: #ef4444; /* red-500 */
                }
                .input-field {
                    border: 1px solid #d1d5db;
                    border-radius: 0.5rem;
                    padding: 0.75rem;
                    width: 100%;
                    margin-bottom: 1rem;
                }
                .button-primary {
                    background-color: #3b82f6;
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s;
                }
                .button-primary:hover {
                    background-color: #2563eb;
                }
                .button-danger {
                    background-color: #ef4444;
                    color: white;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s;
                }
                .button-danger:hover {
                    background-color: #dc2626;
                }
                .button-secondary {
                    background-color: #e5e7eb;
                    color: #374151;
                    padding: 0.75rem 1.25rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: background-color 0.2s;
                }
                .button-secondary:hover {
                    background-color: #d1d5db;
                }
                .pagination-button {
                    background-color: #e0e7ff;
                    color: #3b82f6;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    margin: 0 0.25rem;
                    font-weight: 600;
                }
                .pagination-button.active {
                    background-color: #3b82f6;
                    color: white;
                }
                .pagination-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                `}
            </style>

            <h1 className="text-4xl font-bold text-gray-800 mb-8 text-center">Admin Dashboard</h1>

            {admin && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Welcome, {admin.full_name || admin.username}!</h2>
                    <p className="text-gray-600">Email: {admin.email}</p>
                    <p className="text-gray-600">Admin ID: {admin.admin_id}</p>
                </div>
            )}

            <div className="flex justify-center mb-8 bg-white p-2 rounded-lg shadow-md">
                <button
                    className={`tab-button ${activeTab === 'metrics' ? 'active' : ''}`}
                    onClick={() => setActiveTab('metrics')}
                >
                    Overview Metrics
                </button>
                <button
                    className={`tab-button ${activeTab === 'userManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('userManagement')}
                >
                    User Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'adminManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('adminManagement')}
                >
                    Admin Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'demoRequests' ? 'active' : ''}`}
                    onClick={() => setActiveTab('demoRequests')}
                >
                    Demo Requests
                </button>
                <button
                    className={`tab-button ${activeTab === 'eventManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('eventManagement')}
                >
                    Event Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'featureAccess' ? 'active' : ''}`}
                    onClick={() => setActiveTab('featureAccess')}
                >
                    Product Access
                </button>
                <button
                    className={`tab-button ${activeTab === 'jobManagement' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jobManagement')}
                >
                    Job Management
                </button>
                <button
                    className={`tab-button ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                >
                    Reports
                </button>
                <button
                    className={`tab-button ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    Audit Logs
                </button>
            </div>

            {/* Metrics Tab */}
            {activeTab === 'metrics' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Overall Metrics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-blue-800">Total Users</h3>
                            <p className="text-3xl font-bold text-blue-600">{metrics.totalUsers}</p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-green-800">Total Demo Requests</h3>
                            <p className="text-3xl font-bold text-green-600">{metrics.totalDemoRequests}</p>
                        </div>
                        <div className="bg-purple-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-purple-800">Total Events</h3>
                            <p className="text-3xl font-bold text-purple-600">{metrics.totalEvents}</p>
                        </div>
                        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-yellow-800">Total Jobs</h3> {/* Changed label */}
                            <p className="text-3xl font-bold text-yellow-600">{metrics.totalProductsAccessed}</p> {/* Using totalProductsAccessed which is now totalJobs from backend */}
                        </div>
                        <div className="bg-red-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-red-800">Total Profit (All Products)</h3>
                            {/* Display negative sign if profit is negative */}
                            <p className="text-3xl font-bold text-red-600">${Number(metrics.totalProfitAllProducts || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-indigo-800">Avg Job Satisfaction</h3>
                            <p className="text-3xl font-bold text-indigo-600">{Number(jobMetrics.avgJobSatisfaction || 0).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* User Management Tab */}
            {activeTab === 'userManagement' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">User Management</h2>
                    <button onClick={() => exportUsersToPDF(users, showModal)} className="button-secondary mb-4" disabled={!pdfLibsLoaded}>
                        Export Users (PDF)
                    </button>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                            <thead className="table-header">
                                <tr>
                                    <th className="py-3 px-4 text-left">User ID</th>
                                    <th className="py-3 px-4 text-left">Username</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Full Name</th>
                                    <th className="py-3 px-4 text-left">Company</th>
                                    <th className="py-3 px-4 text-left">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentUsers.map(user => (
                                    <tr key={user.user_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{user.user_id}</td>
                                        <td className="py-3 px-4">{user.username}</td>
                                        <td className="py-3 px-4">{user.email}</td>
                                        <td className="py-3 px-4">{user.full_name}</td>
                                        <td className="py-3 px-4">{user.company_name}</td>
                                        <td className="py-3 px-4">{new Date(user.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setUsersCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={usersCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalUserPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setUsersCurrentPage(page)}
                                className={`pagination-button ${usersCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setUsersCurrentPage(prev => Math.min(totalUserPages, prev + 1))}
                            disabled={usersCurrentPage === totalUserPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Admin Management Tab */}
            {activeTab === 'adminManagement' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Admin Management</h2>

                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Register New Admin</h3>
                        <form onSubmit={handleRegisterAdmin} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Username"
                                value={newAdminUsername}
                                onChange={(e) => setNewAdminUsername(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={newAdminEmail}
                                onChange={(e) => setNewAdminEmail(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newAdminPassword}
                                onChange={(e) => setNewAdminPassword(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={newAdminFullName}
                                onChange={(e) => setNewAdminFullName(e.target.value)}
                                className="input-field"
                                required
                            />
                            <div className="md:col-span-2">
                                <button type="submit" className="button-primary w-full">Register Admin</button>
                            </div>
                        </form>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Existing Admins</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                            <thead className="table-header">
                                <tr>
                                    <th className="py-3 px-4 text-left">Admin ID</th>
                                    <th className="py-3 px-4 text-left">Username</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Full Name</th>
                                    <th className="py-3 px-4 text-left">Created At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentAdmins.map(admin => (
                                    <tr key={admin.admin_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{admin.admin_id}</td>
                                        <td className="py-3 px-4">{admin.username}</td>
                                        <td className="py-3 px-4">{admin.email}</td>
                                        <td className="py-3 px-4">{new Date(admin.created_at).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setAdminsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={adminsCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalAdminPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setAdminsCurrentPage(page)}
                                className={`pagination-button ${adminsCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setAdminsCurrentPage(prev => Math.min(totalAdminPages, prev + 1))}
                            disabled={adminsCurrentPage === totalAdminPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Demo Requests Tab */}
            {activeTab === 'demoRequests' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Demo Requests</h2>
                    <button onClick={handleExportDemoRequests} className="button-secondary mb-4 mr-2">
                        Export Demo Requests (CSV)
                    </button>
                    <button onClick={() => exportDemoRequestsToPDF(demoRequests, showModal)} className="button-secondary mb-4" disabled={!pdfLibsLoaded}>
                        Export Demo Requests (PDF)
                    </button>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                            <thead className="table-header">
                                <tr>
                                    <th className="py-3 px-4 text-left">Request ID</th>
                                    <th className="py-3 px-4 text-left">Company</th>
                                    <th className="py-3 px-4 text-left">Message</th>
                                    <th className="py-3 px-4 text-left">Preferred Date</th>
                                    <th className="py-3 px-4 text-left">Email</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    <th className="py-3 px-4 text-left">Admin Notes</th>
                                    <th className="py-3 px-4 text-left">Created At</th>
                                    <th className="py-3 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentDemoRequests.map(demo => (
                                    <tr key={demo.request_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{demo.request_id}</td>
                                        <td className="py-3 px-4">{demo.company_name}</td>
                                        <td className="py-3 px-4">{demo.request_message}</td>
                                        <td className="py-3 px-4">{new Date(demo.preferred_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{demo.email}</td>
                                        <td className="py-3 px-4">{demo.status}</td>
                                        <td className="py-3 px-4">{demo.admin_notes || 'N/A'}</td>
                                        <td className="py-3 px-4">{new Date(demo.created_at).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">
                                            <button
                                                onClick={() => {
                                                    setEditingDemoRequest(demo);
                                                    setNewDemoRequestStatus(demo.status);
                                                    setNewAdminNotes(demo.admin_notes || '');
                                                }}
                                                className="button-secondary text-sm px-2 py-1"
                                            >
                                                Edit Status
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setDemoRequestsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={demoRequestsCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalDemoRequestPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setDemoRequestsCurrentPage(page)}
                                className={`pagination-button ${demoRequestsCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setDemoRequestsCurrentPage(prev => Math.min(totalDemoRequestPages, prev + 1))}
                            disabled={demoRequestsCurrentPage === totalDemoRequestPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>

                    {editingDemoRequest && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                                <h3 className="text-xl font-semibold mb-4">Update Demo Request Status</h3>
                                <p className="mb-2">Request ID: {editingDemoRequest.request_id}</p>
                                <p className="mb-4">Company: {editingDemoRequest.company_name}</p>
                                <select
                                    value={newDemoRequestStatus}
                                    onChange={(e) => setNewDemoRequestStatus(e.target.value)}
                                    className="input-field mb-4"
                                >
                                    <option value="">Select Status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="completed">Completed</option>
                                </select>
                                <textarea
                                    placeholder="Admin Notes (optional)"
                                    value={newAdminNotes}
                                    onChange={(e) => setNewAdminNotes(e.target.value)}
                                    className="input-field h-24 resize-y"
                                ></textarea>
                                <div className="flex justify-end space-x-2">
                                    <button
                                        onClick={() => handleUpdateDemoRequestStatus(editingDemoRequest.request_id, newDemoRequestStatus, newAdminNotes)}
                                        className="button-primary"
                                    >
                                        Update
                                    </button>
                                    <button
                                        onClick={() => setEditingDemoRequest(null)}
                                        className="button-secondary"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Event Management Tab */}
            {activeTab === 'eventManagement' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Event Management</h2>

                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Create New Event</h3>
                        <form onSubmit={handleCreateEvent} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Event Title"
                                value={newEventTitle}
                                onChange={(e) => setNewEventTitle(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Description"
                                value={newEventDescription}
                                onChange={(e) => setNewEventDescription(e.target.value)}
                                className="input-field"
                                required
                            />
                            <input
                                type="date"
                                placeholder="Event Date"
                                value={newEventDate}
                                onChange={(e) => setNewEventDate(e.target.value)}
                                className="input-field"
                                min={todayMinDate}
                                required
                            />
                            <input
                                type="text"
                                placeholder="Location"
                                value={newEventLocation}
                                onChange={(e) => setNewEventLocation(e.target.value)}
                                className="input-field"
                                required
                            />
                            <select
                                value={newEventCategory}
                                onChange={(e) => setNewEventCategory(e.target.value)}
                                className="input-field"
                                required
                            >
                                <option value="">Select Category</option>
                                <option value="AI Assistant">AI Assistant</option>
                                <option value="Prototyping">Prototyping</option>
                            </select>
                            <div className="md:col-span-2">
                                <button type="submit" className="button-primary w-full">Create Event</button>
                            </div>
                        </form>
                    </div>

                    <h3 className="text-xl font-semibold text-gray-700 mb-3">Upcoming Events</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                            <thead className="table-header">
                                <tr>
                                    <th className="py-3 px-4 text-left">Event ID</th>
                                    <th className="py-3 px-4 text-left">Title</th>
                                    <th className="py-3 px-4 text-left">Description</th>
                                    <th className="py-3 px-4 text-left">Date</th>
                                    <th className="py-3 px-4 text-left">Location</th>
                                    <th className="py-3 px-4 text-left">Category</th>
                                    <th className="py-3 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentEvents.map(event => (
                                    <tr key={event.event_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{event.event_id}</td>
                                        <td className="py-3 px-4">{event.title}</td>
                                        <td className="py-3 px-4">{event.description}</td>
                                        <td className="py-3 px-4">{new Date(event.event_date).toLocaleDateString()}</td>
                                        <td className="py-3 px-4">{event.location}</td>
                                        <td className="py-3 px-4">{event.category}</td>
                                        <td className="py-3 px-4 flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setEditingEvent(event);
                                                    setEditEventTitle(event.title);
                                                    setEditEventDescription(event.description);
                                                    setEditEventDate(new Date(event.event_date).toISOString().split('T')[0]);
                                                    setEditEventCategory(event.category);
                                                    setEditEventLocation(event.location); // Ensure location is set
                                                }}
                                                className="button-secondary text-sm px-2 py-1"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => confirmDeleteEvent(event.event_id)} // Call custom confirmation
                                                className="button-danger text-sm px-2 py-1"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setEventsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={eventsCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalEventPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setEventsCurrentPage(page)}
                                className={`pagination-button ${eventsCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setEventsCurrentPage(prev => Math.min(totalEventPages, prev + 1))}
                            disabled={eventsCurrentPage === totalEventPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>

                    {/* Edit Event Modal */}
                    {editingEvent && (
                        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
                            <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                                <h3 className="text-xl font-semibold mb-4">Edit Event</h3>
                                <form onSubmit={handleEditEvent}>
                                    <input
                                        type="text"
                                        placeholder="Event Title"
                                        value={editEventTitle}
                                        onChange={(e) => setEditEventTitle(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Description"
                                        value={editEventDescription}
                                        onChange={(e) => setEditEventDescription(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                    <input
                                        type="date"
                                        placeholder="Event Date"
                                        value={editEventDate}
                                        onChange={(e) => setEditEventDate(e.target.value)}
                                        className="input-field"
                                        min={todayMinDate}
                                        required
                                    />
                                    <input
                                        type="text"
                                        placeholder="Location"
                                        value={editEventLocation}
                                        onChange={(e) => setEditEventLocation(e.target.value)}
                                        className="input-field"
                                        required
                                    />
                                    <select
                                        value={editEventCategory}
                                        onChange={(e) => setEditEventCategory(e.target.value)}
                                        className="input-field"
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        <option value="AI Assistant">AI Assistant</option>
                                        <option value="Prototyping">Prototyping</option>
                                    </select>
                                    <div className="flex justify-end space-x-2 mt-4">
                                        <button type="submit" className="button-primary">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingEvent(null)}
                                            className="button-secondary"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Product Access Tab */}
            {activeTab === 'featureAccess' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Product Access Management</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                            <thead className="table-header">
                                <tr>
                                    <th className="py-3 px-4 text-left">Access ID</th>
                                    <th className="py-3 px-4 text-left">User</th>
                                    <th className="py-3 px-4 text-left">Product</th>
                                    <th className="py-3 px-4 text-left">Status</th>
                                    {/* <th className="py-3 px-4 text-left">Requested At</th> Removed as per user request */}
                                    <th className="py-3 px-4 text-left">Granted At</th>
                                    <th className="py-3 px-4 text-left">Revoked At</th>
                                    <th className="py-3 px-4 text-left">Assigned Company</th>
                                    <th className="py-3 px-4 text-left">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentFeatureAccess.map(access => (
                                    <tr key={access.access_id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="py-3 px-4">{access.access_id}</td>
                                        <td className="py-3 px-4">{access.username} ({access.email})</td>
                                        <td className="py-3 px-4">{access.product_name}</td>
                                        <td className="py-3 px-4">{access.status}</td>
                                        {/* <td className="py-3 px-4">
                                            {access.requested_at ? new Date(access.requested_at).toLocaleDateString() : 'N/A'}
                                        </td> */}
                                        <td className="py-3 px-4">
                                            {/* Robust date parsing for granted_at */}
                                            {access.granted_at && !isNaN(new Date(access.granted_at).getTime())
                                                ? new Date(access.granted_at).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">
                                            {/* Robust date parsing for revoked_at */}
                                            {access.revoked_at && !isNaN(new Date(access.revoked_at).getTime())
                                                ? new Date(access.revoked_at).toLocaleDateString()
                                                : 'N/A'}
                                        </td>
                                        <td className="py-3 px-4">{access.user_company_name || 'N/A'}</td>
                                        <td className="py-3 px-4 flex space-x-2">
                                            {access.status !== 'granted' && (
                                                <button
                                                    onClick={() => handleGrantAccess(access.user_id, access.product_name)}
                                                    className="button-primary text-sm px-2 py-1"
                                                >
                                                    Grant
                                                </button>
                                            )}
                                            {access.status !== 'denied' && (
                                                <button
                                                    onClick={() => handleDenyAccess(access.user_id, access.product_name)}
                                                    className="button-danger text-sm px-2 py-1"
                                                >
                                                    Deny
                                                </button>
                                            )}
                                            {access.status === 'granted' && (
                                                <button
                                                    onClick={() => handleRevokeAccess(access.user_id, access.product_name)}
                                                    className="button-secondary text-sm px-2 py-1"
                                                >
                                                    Revoke
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setFeatureAccessCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={featureAccessCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalFeatureAccessPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setFeatureAccessCurrentPage(page)}
                                className={`pagination-button ${featureAccessCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setFeatureAccessCurrentPage(prev => Math.min(totalFeatureAccessPages, prev + 1))}
                            disabled={featureAccessCurrentPage === totalFeatureAccessPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Job Management Tab */}
            {activeTab === 'jobManagement' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Job Management</h2>

                    {/* New Metric Card for Total Job Revenue */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                        <div className="bg-blue-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-blue-800">Total Job Revenue</h3>
                            <p className="text-3xl font-bold text-blue-600">${Number(jobMetrics.totalJobRevenue || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-yellow-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-yellow-800">Total Jobs</h3>
                            <p className="text-3xl font-bold text-yellow-600">{jobMetrics.totalJobs}</p>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-lg shadow-sm text-center">
                            <h3 className="text-xl font-semibold text-indigo-800">Avg Job Satisfaction</h3>
                            <p className="text-3xl font-bold text-indigo-600">{Number(jobMetrics.avgJobSatisfaction || 0).toFixed(2)}</p>
                        </div>
                    </div>


                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Filter Jobs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <select
                                value={jobFilterType}
                                onChange={(e) => setJobFilterType(e.target.value)}
                                className="input-field"
                            >
                                <option value="">All Types</option>
                                <option value="AI Assistant">AI Assistant</option>
                                <option value="Prototyping">Prototyping</option>
                            </select>
                            <input
                                type="date"
                                placeholder="Start Date"
                                value={jobFilterStartDate}
                                onChange={(e) => setJobFilterStartDate(e.target.value)}
                                className="input-field"
                            />
                            <input
                                type="date"
                                placeholder="End Date"
                                value={jobFilterEndDate}
                                onChange={(e) => setJobFilterEndDate(e.target.value)}
                                className="input-field"
                            />
                            <input
                                type="text"
                                placeholder="Customer Name"
                                value={jobFilterCustomer}
                                onChange={(e) => setJobFilterCustomer(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <button onClick={handleExportJobs} className="button-secondary mt-4 mr-2">
                            Export Filtered Jobs (CSV)
                        </button>
                        <button onClick={() => exportJobReportsToPDF(jobs, showModal)} className="button-secondary mt-4" disabled={!pdfLibsLoaded}>
                            Export Filtered Jobs (PDF)
                        </button>
                    </div>

                    {isLoadingJobs ? (
                        <div className="text-center p-4">Loading jobs...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                                <thead className="table-header">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Job ID</th>
                                        {/* <th className="py-3 px-4 text-left">Title</th> Removed as per user request */}
                                        <th className="py-3 px-4 text-left">Type</th>
                                        <th className="py-3 px-4 text-left">Status</th>
                                        {/* <th className="py-3 px-4 text-left">Assigned To</th> Removed as per user request */}
                                        <th className="py-3 px-4 text-left">Customer Name</th>
                                        <th className="py-3 px-4 text-left">Customer Email</th>
                                        <th className="py-3 px-4 text-left">Job Date</th>
                                        <th className="py-3 px-4 text-left">Actual Cost</th>
                                        {/* <th className="py-3 px-4 text-left">Revenue</th> Removed as per user request */}
                                        <th className="py-3 px-4 text-left">Satisfaction Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentJobs.map(job => (
                                        <tr key={job.job_id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-3 px-4">{job.job_id}</td>
                                            {/* <td className="py-3 px-4">{job.job_title || 'N/A'}</td> */}
                                            <td className="py-3 px-4">{job.solution_type}</td>
                                            <td className="py-3 px-4">{job.status}</td>
                                            {/* <td className="py-3 px-4">{job.assigned_to || 'N/A'}</td> */}
                                            <td className="py-3 px-4">{job.customer_name}</td>
                                            <td className="py-3 px-4">{job.customer_email || 'N/A'}</td>
                                            <td className="py-3 px-4">{job.job_date ? new Date(job.job_date).toLocaleDateString() : 'N/A'}</td>
                                            <td className="py-3 px-4">${Number(job.cost || 0).toFixed(2)}</td>
                                            {/* <td className="py-3 px-4">${Number(job.revenue || 0).toFixed(2)}</td> */}
                                            <td className="py-3 px-4">{Number(job.satisfaction_rating || 0).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setJobsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={jobsCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalJobPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setJobsCurrentPage(page)}
                                className={`pagination-button ${jobsCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setJobsCurrentPage(prev => Math.min(totalJobPages, prev + 1))}
                            disabled={jobsCurrentPage === totalJobPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Reports</h2>

                    <div className="flex justify-center mb-6 bg-gray-50 p-2 rounded-lg">
                        <button
                            className={`tab-button ${activeReportTab === 'revenue' ? 'active' : ''}`}
                            onClick={() => setActiveReportTab('revenue')}
                        >
                            Revenue Report
                        </button>
                        <button
                            className={`tab-button ${activeReportTab === 'profitMargin' ? 'active' : ''}`}
                            onClick={() => setActiveReportTab('profitMargin')}
                        >
                            Profit Margin Report
                        </button>
                        <button
                            className={`tab-button ${activeReportTab === 'csat' ? 'active' : ''}`}
                            onClick={() => setActiveReportTab('csat')}
                        >
                            CSAT Report
                        </button>
                    </div>

                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Filter Report by Date Range</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="date"
                                value={reportDateRange.startDate}
                                onChange={(e) => setReportDateRange({ ...reportDateRange, startDate: e.target.value })}
                                className="input-field"
                            />
                            <input
                                type="date"
                                value={reportDateRange.endDate}
                                onChange={(e) => setReportDateRange({ ...reportDateRange, endDate: e.target.value })}
                                className="input-field"
                            />
                        </div>
                        <button
                            onClick={() => handleExportReports(activeReportTab)}
                            className="button-secondary mt-4 mr-2"
                        >
                            Export Current Report (CSV)
                        </button>
                        {activeReportTab === 'revenue' && revenueReport && (
                            <button onClick={() => exportRevenueReportToPDF(revenueReport, showModal)} className="button-secondary mt-4" disabled={!pdfLibsLoaded}>
                                Export Revenue Report (PDF)
                            </button>
                        )}
                        {activeReportTab === 'profitMargin' && profitMarginReport && (
                            <button onClick={() => exportProfitMarginReportToPDF(profitMarginReport, showModal)} className="button-secondary mt-4" disabled={!pdfLibsLoaded}>
                                Export Profit Margin Report (PDF)
                            </button>
                        )}
                        {/* No CSAT PDF export function provided in exportReportsToPDF.js yet */}
                    </div>

                    {activeReportTab === 'revenue' && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Revenue by Solution</h3>
                            {isLoadingRevenueReport ? (
                                <div className="text-center p-4">Loading revenue report...</div>
                            ) : revenueReport && revenueReport.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                                        <thead className="table-header">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Product/Service</th>
                                                <th className="py-3 px-4 text-left">Total Revenue</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {revenueReport.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="py-3 px-4">{item.solution_type}</td>
                                                    <td className="py-3 px-4">${Number(item.total_revenue || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600">No revenue data available for the selected range.</p>
                            )}
                        </div>
                    )}

                    {activeReportTab === 'profitMargin' && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">Profit Margin by Solution</h3>
                            {isLoadingProfitMarginReport ? (
                                <div className="text-center p-4">Loading profit margin report...</div>
                            ) : profitMarginReport && profitMarginReport.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                                        <thead className="table-header">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Product/Service</th>
                                                <th className="py-3 px-4 text-left">Average Profit Margin (%)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {profitMarginReport.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="py-3 px-4">{item.solution_type}</td>
                                                    <td className="py-3 px-4">{Number(item.average_profit_margin || 0).toFixed(2)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600">No profit margin data available for the selected range.</p>
                            )}
                        </div>
                    )}

                    {activeReportTab === 'csat' && (
                        <div>
                            <h3 className="text-xl font-semibold text-gray-700 mb-3">CSAT by Solution</h3>
                            {isLoadingCsatReport ? (
                                <div className="text-center p-4">Loading CSAT report...</div>
                            ) : csatReport && csatReport.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                                        <thead className="table-header">
                                            <tr>
                                                <th className="py-3 px-4 text-left">Product/Service</th>
                                                <th className="py-3 px-4 text-left">Average CSAT Rating</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {csatReport.map((item, index) => (
                                                <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                                    <td className="py-3 px-4">{item.solution_type}</td>
                                                    <td className="py-3 px-4">{Number(item.average_csat_rating || 0).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-600">No CSAT data available for the selected range.</p>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Audit Logs Tab */}
            {activeTab === 'logs' && (
                <div className="card mb-8">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Audit Logs</h2>

                    <div className="mb-6 p-4 border border-gray-200 rounded-lg">
                        <h3 className="text-xl font-semibold text-gray-700 mb-3">Filter Logs</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Log Type (e.g., 'login', 'access')"
                                value={logFilterType}
                                onChange={(e) => setLogFilterType(e.target.value)}
                                className="input-field"
                            />
                            <input
                                type="date"
                                value={logFilterDate}
                                onChange={(e) => setLogFilterDate(e.target.value)}
                                className="input-field"
                            />
                        </div>
                        <button onClick={handleExportLogs} className="button-secondary mt-4">
                            Export Filtered Logs (CSV)
                        </button>
                    </div>

                    {isLoadingLogs ? (
                        <div className="text-center p-4">Loading logs...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-md">
                                <thead className="table-header">
                                    <tr>
                                        <th className="py-3 px-4 text-left">Log ID</th>
                                        <th className="py-3 px-4 text-left">Action</th>
                                        <th className="py-3 px-4 text-left">Admin Username</th>
                                        <th className="py-3 px-4 text-left">Target Table</th>
                                        <th className="py-3 px-4 text-left">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentLogs.map(log => (
                                        <tr key={log.log_id} className="border-b border-gray-200 hover:bg-gray-50">
                                            <td className="py-3 px-4">{log.log_id}</td>
                                            <td className="py-3 px-4">{log.action}</td>
                                            <td className="py-3 px-4">{log.username || 'N/A'}</td> {/* Display username */}
                                            <td className="py-3 px-4">{log.target_table}</td>
                                            <td className="py-3 px-4">{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    <div className="flex justify-center mt-4">
                        <button
                            onClick={() => setLogsCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={logsCurrentPage === 1}
                            className="pagination-button"
                        >
                            Previous
                        </button>
                        {Array.from({ length: totalLogPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setLogsCurrentPage(page)}
                                className={`pagination-button ${logsCurrentPage === page ? 'active' : ''}`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setLogsCurrentPage(prev => Math.min(totalLogPages, prev + 1))}
                            disabled={logsCurrentPage === totalLogPages}
                            className="pagination-button"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <p className="text-green-600 text-lg font-semibold mb-4">{modalMessage}</p>
                        <button onClick={closeModal} className="button-primary">Close</button>
                    </div>
                </div>
            )}

            {/* Error Modal */}
            {showErrorModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <p className="text-red-600 text-lg font-semibold mb-4">{modalMessage}</p>
                        <button onClick={closeModal} className="button-danger">Close</button>
                    </div>
                </div>
            )}

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3 className="text-xl font-semibold text-gray-800 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">Are you sure you want to delete this event? This action cannot be undone.</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={executeDeleteEvent}
                                className="button-danger"
                            >
                                Confirm Delete
                            </button>
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="button-secondary"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
