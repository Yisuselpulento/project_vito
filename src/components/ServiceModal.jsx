import React from 'react';
import { getServiceInfo } from '../services/api';

function ServiceModal({ serviceId, onClose, apiToken }) {
  const [modalInfo, setModalInfo] = React.useState(null);
  const [loadingInfo, setLoadingInfo] = React.useState(true);

  React.useEffect(() => {
    if (serviceId) {
      setLoadingInfo(true);
      getServiceInfo(serviceId, apiToken)
        .then(data => setModalInfo(data))
        .catch(err => {
          console.error('Error:', err);
          alert('Error al obtener información');
        })
        .finally(() => setLoadingInfo(false));
    }
  }, [serviceId]);

  if (!serviceId) return null;

  return (
    <div className="fixed inset-0 bg-transparent flex items-center justify-center p-2 sm:p-4 z-50" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="p-3 sm:p-6">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-2xl font-bold text-white">Info del Servicio</h2>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl sm:text-2xl"
            >
              &times;
            </button>
          </div>
          
          {loadingInfo ? (
            <p className="text-gray-400 text-center text-sm">Cargando...</p>
          ) : modalInfo ? (
            <div className="text-gray-300 space-y-3 sm:space-y-4 text-sm sm:text-base">
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                <div>
                  <p className="font-bold text-white">Fecha:</p>
                  <p>{modalInfo.travel_date || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Bus:</p>
                  <p>{modalInfo.bus || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Origen:</p>
                  <p>{modalInfo.start_city} - {modalInfo.start_bus_stop}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Destino:</p>
                  <p>{modalInfo.end_city} - {modalInfo.end_bus_stop}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Horario:</p>
                  <p>{modalInfo.travel_time || '-'} a {modalInfo.arrival_time || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Auxiliar:</p>
                  <p>{modalInfo.assistants?.[0]?.name || '-'}</p>
                </div>
                <div>
                  <p className="font-bold text-white">Monto Total:</p>
                  <p className="text-green-400 font-bold">${modalInfo.total_amount?.toLocaleString() || '-'}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400">No hay información disponible</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default ServiceModal;