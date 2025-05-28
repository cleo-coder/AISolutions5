import jsPDF from 'jspdf';
import 'jspdf-autotable';

const commonTitleSettings = (doc, title) => {
    doc.setFontSize(18);
    doc.text(title, 14, 22);
};

export const exportUsersToPDF = (users) => {
    const doc = new jsPDF();
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

export const exportDemoRequestsToPDF = (demos) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Demo Requests Report');

    const columns = ['Company', 'Request Message', 'Preferred Date', 'Email', 'Status', 'Admin Notes', 'Created At'];
    const rows = demos.map(d => [
        d.company_name,
        d.request_message,
        d.preferred_date ? new Date(d.preferred_date).toLocaleDateString() : 'N/A',
        d.email,
        d.status,
        d.admin_notes,
        new Date(d.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('demo_requests_report.pdf');
};

export const exportEventsToPDF = (events) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Events Report');

    const columns = ['Event ID', 'Title', 'Description', 'Date', 'Location', 'Category', 'Created At'];
    const rows = events.map(e => [
        e.event_id,
        e.title,
        e.description,
        new Date(e.event_date).toLocaleDateString(),
        e.location,
        e.category,
        new Date(e.created_at).toLocaleDateString()
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('events_report.pdf');
};

export const exportEventRegistrationsToPDF = (registrations) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Event Registrations Report');

    const columns = ['Registration ID', 'Registered By', 'Event Title', 'Email', 'Registered At', 'Status'];
    const rows = registrations.map(r => [
        r.registration_id,
        r.registered_by,
        r.event_title,
        r.email,
        new Date(r.registered_at).toLocaleDateString(),
        r.status
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('event_registrations_report.pdf');
};

export const exportJobsToPDF = (jobsData) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Jobs Report');

    const columns = ['Job ID', 'Customer Name', 'Solution Type', 'Status', 'Revenue', 'Satisfaction Rating', 'Job Date', 'Job Title', 'Assigned To', 'Admin Notes'];
    const rows = jobsData.map(item => [
        item.job_id,
        item.customer_name,
        item.solution_type,
        item.status,
        item.revenue?.toFixed(2) || '0.00',
        item.satisfaction_rating || 'N/A',
        new Date(item.job_date).toLocaleDateString(),
        item.job_title,
        item.assigned_to,
        item.admin_notes
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('job_reports.pdf');
};

// PROFIT MARGIN REPORT - UPDATED to match backend output
export const exportProfitMarginReportToPDF = (profitMarginData) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Profit Margin Report');

    // Columns now reflect average profit margin per solution type
    const columns = ['Product/Service', 'Average Profit Margin (%)'];
    const rows = profitMarginData.map(item => [
        item.solution_type, // Assuming solution_type is now available
        (item.average_profit_margin * 100)?.toFixed(2) || 'N/A' // Convert to percentage
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

// REVENUE REPORT
export const exportRevenueReportToPDF = (revenueData) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Revenue Report');

    const columns = ['Product/Service', 'Total Revenue']; // Removed 'Number of Sales/Jobs' as backend doesn't return it for this report
    const rows = revenueData.map(item => [
        item.solution_type,
        item.total_revenue?.toFixed(2) || '0.00'
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

// CSAT REPORT
export const exportCSATReportToPDF = (csatData) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'CSAT Report');

    const columns = ['Product/Service', 'Average CSAT Rating'];
    const rows = csatData.map(item => [
        item.solution_type,
        item.average_csat_rating?.toFixed(2) || 'N/A'
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('csat_report.pdf');
};

// Job Status Distribution Report
export const exportJobStatusDistributionToPDF = (statusData) => {
    const doc = new jsPDF();
    commonTitleSettings(doc, 'Job Status Distribution Report');

    const columns = ['Status', 'Count'];
    const rows = statusData.map(item => [
        item.status,
        item.count
    ]);

    doc.autoTable({
        startY: 30,
        head: [columns],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 144, 255] }
    });

    doc.save('job_status_distribution_report.pdf');
};