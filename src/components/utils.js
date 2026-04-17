export const formatTime = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
};

export const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric', month: 'short' });
};

export const getStatusColor = (status) => {
  switch (status) {
    case 'active': return 'bg-green-900 text-green-200';
    case 'closed': return 'bg-red-900 text-red-200';
    case 'disabled': return 'bg-gray-700 text-gray-400';
    default: return 'bg-gray-700 text-gray-300';
  }
};