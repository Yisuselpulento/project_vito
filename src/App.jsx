import { useState, useEffect } from 'react';
import { getPosturas, getPosturasMyInfoDateRange } from './services/api';
import * as XLSX from 'xlsx';
import ServiceTable from './components/ServiceTable';
import ServiceModal from './components/ServiceModal';
import './App.css';
  
  function App() {
  const [posturas, setPosturas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState('');
  const [error, setError] = useState(null);
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [busquedaRealizada, setBusquedaRealizada] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [totalMonto, setTotalMonto] = useState(0);
  const [showTotalMonto, setShowTotalMonto] = useState(false);
  const [ruta, setRuta] = useState('2-3');
  const [posturasWithInfo, setPosturasWithInfo] = useState([]);
  const [showDebugModal, setShowDebugModal] = useState(false);
  const [apiToken, setApiToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  const exportToExcel = () => {
    if (posturasWithInfo.length === 0) return;
    
    const getInitials = (cityName) => {
      if (!cityName) return '-';
      const lower = cityName.toLowerCase();
      if (lower.includes('los andes')) return 'LA';
      if (lower.includes('valparaiso') || lower.includes('valparaíso')) return 'VP';
      return cityName.split(' ')[0].substring(0, 2).toUpperCase();
    };
    
const headers = ['NOMBRE DEL SERVICIO', 'FECHA DEL VIAJE', 'BUS', 'RECAUDACION'];
    const rows = posturasWithInfo.map(({ postura, serviceInfo }) => {
      const origen = serviceInfo?.start_city || '';
      const destino = serviceInfo?.end_city || '';
      const iniciales = `${getInitials(origen)} - ${getInitials(destino)}`;
      
      let fechaViaje = serviceInfo?.travel_date || postura.stretch?.start_date || '';
      const bus = serviceInfo?.bus || postura.bus?.code || '';
      const recaudacion = serviceInfo?.total_amount || 0;
      
      return [iniciales, fechaViaje, bus, recaudacion];
    });
    
    const totalFilas = rows.length;
    const excelTotalMonto = rows.reduce((sum, row) => sum + (row[3] || 0), 0);
    const ganancia = excelTotalMonto * 0.018;
    rows.push(['TOTAL MONTO', '', '', excelTotalMonto]);
    rows.push(['GANANCIA (1.8%)', '', '', ganancia]);
    rows.push(['PASES', '', '', totalFilas]);
    
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Reporte');
    
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/octet-stream' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte_viajes_${fechaDesde}_${fecha}.xlsx`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('token');
    const tokenStored = localStorage.getItem('buses_token');
    const expiryStored = localStorage.getItem('buses_token_expiry');
    
    const now = Date.now();
    const isValid = tokenStored && expiryStored && (now - parseInt(expiryStored) < 24 * 60 * 60 * 1000);
    
    if (tokenFromUrl && tokenFromUrl.length > 20) {
      setApiToken(tokenFromUrl);
      localStorage.setItem('buses_token', tokenFromUrl);
      localStorage.setItem('buses_token_expiry', Date.now().toString());
      setShowTokenInput(false);
    } else if (isValid) {
      setApiToken(tokenStored);
      setShowTokenInput(false);
    }
  }, []);

  const getRouteLabel = () => {
    if (ruta === '2-3') return 'Los Andes a Valparaíso';
    if (ruta === '3-2') return 'Valparaíso a Los Andes';
    return '';
  };

  const getRouteParams = () => {
    const [start, end] = ruta.split('-');
    return { startCity: parseInt(start), endCity: parseInt(end) };
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setBusquedaRealizada(true);
    setTotalMonto(0);
    setShowTotalMonto(false);
    setPosturasWithInfo([]);
    const { startCity, endCity } = getRouteParams();
    try {
      const results = await getPosturas(fecha, startCity, endCity, apiToken);
      setPosturas(results);
    } catch (err) {
      console.error('Error:', err);
      if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.statusText}`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchMyInfo = async () => {
    if (!fechaDesde) {
      setError('Debes seleccionar una fecha de inicio');
      return;
    }
    if (!apiToken) {
      setError('Necesitas ingrear el token primero');
      return;
    }
    setLoading(true);
    setError(null);
    setBusquedaRealizada(true);
    setLoadingProgress('Iniciando búsqueda... Esto puede tardar unos minutos');
    try {
      const { posturas: results, totalMonto, posturasWithInfo: posturasWithInfoArray } = await getPosturasMyInfoDateRange(
        fechaDesde,
        fecha,
        (progress) => setLoadingProgress(progress),
        undefined,
        apiToken
      );
      
      const sortedPosturas = [...results].sort((a, b) => {
        const dateA = new Date(a.stretch.start_date);
        const dateB = new Date(b.stretch.start_date);
        return dateA - dateB;
      });
      
      const sortedPosturasWithInfo = (posturasWithInfoArray || []).sort((a, b) => {
        const dateA = new Date(a.postura.stretch.start_date);
        const dateB = new Date(b.postura.stretch.start_date);
        return dateA - dateB;
      });
      
      setPosturas(sortedPosturas);
      setPosturasWithInfo(sortedPosturasWithInfo);
      setTotalMonto(totalMonto);
      setShowTotalMonto(true);
      setLoadingProgress('');
    } catch (err) {
      console.error('Error:', err);
      if (err.response) {
        setError(`Error ${err.response.status}: ${err.response.statusText}`);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const isSoloMiInfoDisabled = !fechaDesde || fecha < fechaDesde;

  const handleSaveToken = () => {
    if (apiToken.trim()) {
      setApiToken(apiToken.trim());
      localStorage.setItem('buses_token', apiToken.trim());
      localStorage.setItem('buses_token_expiry', Date.now().toString());
      console.log('Token guardado por 24 horas');
      setShowTokenInput(false);
    }
  };

  const handleChangeToken = () => {
    setShowTokenInput(true);
  };

  const openInfo = (id) => {
    setSelectedService(id);
  };

  const closeModal = () => {
    setSelectedService(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 p-2 sm:p-4">
      <div className="max-w-4xl mx-auto">
        {showTokenInput ? (
          <div className="bg-gray-800 rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4">Ingresa tu Token</h2>
            <p className="text-gray-400 text-xs sm:text-sm mb-3 sm:mb-4">
              Para obtener el token: inicia sesión en la web original, presiona F12 → Application → Local Storage → auth._token.local
            </p>
            <div className="flex flex-col gap-3">
              <input 
                type="text"
                value={apiToken}
                onChange={(e) => setApiToken(e.target.value)}
                placeholder="Pega tu token aquí..."
                className="w-full px-3 py-3 sm:py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
              />
              <button 
                onClick={handleSaveToken}
                disabled={!apiToken.trim()}
                className="w-full py-3 sm:py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-medium rounded-lg text-base sm:text-base"
              >
                Guardar Token
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <p className="font-bold text-white">
                 {getRouteLabel()}
              </p>
              <button 
                onClick={handleChangeToken}
                className="text-xs text-gray-400 hover:text-white bg-gray-700 px-2 py-1 rounded"
              >
                Cambiar Token
              </button>
            </div>
            
            <div className="space-y-4 mb-4 sm:mb-6">
              <select 
                value={ruta}
                onChange={(e) => setRuta(e.target.value)}
                className="w-full px-3 py-3 sm:py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500"
              >
                <option value="2-3">Los Andes → Valparaíso</option>
                <option value="3-2">Valparaíso → Los Andes</option>
              </select>
              
              <button 
                onClick={fetchData}
                disabled={loading}
                className="w-full px-4 py-3 sm:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white font-medium rounded-lg transition-colors text-base"
              >
                {loading ? 'Cargando...' : 'Buscar'}
              </button>
              
              <div className="border-t border-gray-700 pt-4">
                <p className="text-sm text-gray-400 mb-2">Solo mi info (Victor Figueroa)</p>
                <button 
                  onClick={fetchMyInfo}
                  disabled={loading || isSoloMiInfoDisabled}
                  className="w-full px-4 py-3 sm:py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-base"
                >
                  {loading ? 'Cargando...' : 'Solo mi info'}
                </button>
                <div className="flex gap-2 mt-2">
                  <div className="flex flex-col flex-1">
                    <label className="text-xs text-gray-400 mb-1">Desde</label>
                    <input 
                      type="date" 
                      id="fechaDesde"
                      name="fechaDesde"
                      value={fechaDesde}
                      onChange={(e) => setFechaDesde(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                  <div className="flex flex-col flex-1">
                    <label className="text-xs text-gray-400 mb-1">Hasta</label>
                    <input 
                      type="date" 
                      id="fecha"
                      name="fecha"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-2 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:outline-none focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
        
        {!busquedaRealizada && (
          <p className="text-center text-gray-500 mb-4 sm:mb-6 text-sm">Selecciona una ruta y presiona Buscar</p>
        )}

        {loading && (
          <div className="p-4 sm:p-8 text-center text-gray-400 text-sm">
            {loadingProgress || 'Cargando...'}
          </div>
        )}
        {error && <div className="p-4 sm:p-8 text-center text-red-400 text-sm">Error: {error}</div>}
        
        {!loading && !error && busquedaRealizada && posturas.length === 0 && (
          <div className="p-4 sm:p-8 text-center text-gray-400 text-sm">No se encontraron resultados para esta fecha</div>
        )}
        
        {!loading && !error && posturas.length > 0 && (
            <>
              {showTotalMonto && posturasWithInfo.length > 0 && (
                <>
                  <button 
                    onClick={exportToExcel}
                    className="w-full px-4 py-2 mb-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors text-base"
                  >
                    Descargar en Excel
                  </button>
                  <button 
                    onClick={() => setShowDebugModal(true)}
                    className="w-full px-4 py-2 mb-3 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-colors text-base"
                  >
                    Ver datos Excel
                  </button>
                </>
              )}
              <ServiceTable posturas={posturas} onShowInfo={openInfo} />
              
              <p className="text-center text-gray-500 mt-3 sm:mt-4 text-sm">
                {(() => {
                  const uniquePosturas = posturas.filter((postura, index, self) => 
                    index === self.findIndex(p => p.id === postura.id)
                  );
                  return `Total: ${uniquePosturas.length}`;
                })()}
              </p>
              {showTotalMonto && totalMonto > 0 && (
                <>
                  <p className="text-center text-green-400 mt-2 text-lg font-semibold">
                    Total monto: ${totalMonto.toLocaleString('es-CL')}
                  </p>
                  <p className="text-center text-yellow-400 mt-1 text-lg font-semibold">
                    Ganancia (1.8%): ${(totalMonto * 0.018).toLocaleString('es-CL')}
                  </p>
                </>
              )}
            </>
          )}
          </>
        )}
      </div>

      {selectedService && (
        <ServiceModal serviceId={selectedService} onClose={closeModal} apiToken={apiToken} />
      )}

      {showDebugModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Datos para Excel</h2>
              <button onClick={() => setShowDebugModal(false)} className="text-gray-400 hover:text-white text-2xl">&times;</button>
            </div>
            <div className="text-gray-300 text-sm overflow-auto">
              <p className="mb-2 text-yellow-400 font-bold">posturasWithInfo length: {posturasWithInfo.length}</p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-white">
                    <th className="p-2">ID</th>
                    <th className="p-2">NOMBRE</th>
                    <th className="p-2">FECHA</th>
                    <th className="p-2">BUS</th>
                    <th className="p-2">MONTO</th>
                  </tr>
                </thead>
                <tbody>
                  {posturasWithInfo.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-600">
                      <td className="p-2">{item.postura.id}</td>
                      <td className="p-2">{item.postura.name}</td>
                      <td className="p-2">{item.serviceInfo?.travel_date}</td>
                      <td className="p-2">{item.serviceInfo?.bus}</td>
                      <td className="p-2">{item.serviceInfo?.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-green-400 font-bold">
                TOTAL calculado: {posturasWithInfo.reduce((sum, item) => sum + (item.serviceInfo?.total_amount || 0), 0)}
              </p>
              <p className="mt-2 text-yellow-400 font-bold">
               PASES: {posturasWithInfo.length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;