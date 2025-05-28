// src/pages/Unauthorized.jsx
export default function Unauthorized() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-light dark:bg-dark text-lightText dark:text-darkText p-4">
            <div className="text-center">
                <h1 className="text-4xl font-bold text-red-600 mb-4">403 - Unauthorized</h1>
                <p className="text-lg mb-6">
                    You do not have permission to access this page.
                </p>
                <a
                    href="/"
                    className="inline-block px-4 py-2 bg-primary text-white rounded hover:bg-secondary dark:bg-accent dark:hover:bg-accentDark"
                >
                    Back to Home
                </a>
            </div>
        </div>
    );
}
