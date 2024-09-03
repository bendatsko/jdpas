import React from 'react';

const StatusBadge = ({status}) => {
    const getDotClass = () => {
        switch (status.toLowerCase()) {
            case 'running':
                return 'bg-blue-500'; // Atlassian blue
            case 'completed':
                return 'bg-green-500'; // Atlassian green
            case 'queued':
                return 'bg-purple-500'; // Purple
            case 'failed':
                return 'bg-red-500'; // Red
            default:
                return 'bg-gray-500'; // Default gray
        }
    };

    return (
        <div className="flex items-center space-x-2">
            <span className={`w-2 h-2 rounded-full ${getDotClass()}`}></span>
            <span className="text-sm font-medium">{status}</span>
        </div>
    );
};

export default StatusBadge;