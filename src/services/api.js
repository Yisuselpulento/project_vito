import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api-busesjm-prod.rlz.cl';

let currentToken = '';

export const setApiToken = (token) => {
  currentToken = token;
  console.log('Token guardado:', token ? 'SI' : 'NO');
};

export const getApiToken = () => {
  return currentToken;
};

const getApiInstance = () => {
  return axios.create({
    baseURL: API_BASE_URL,
    headers: currentToken ? {
      'Authorization': `Bearer ${currentToken}`
    } : {}
  });
};

const api = getApiInstance();

export const getPosturas = async (fecha, startCity = 2, endCity = 3, token) => {
  const tempToken = token || currentToken;
  const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: tempToken ? {
      'Authorization': `Bearer ${tempToken}`
    } : {}
  });
  const diaSig = new Date(fecha);
  diaSig.setDate(diaSig.getDate() + 1);
  const fechaSig = diaSig.toISOString().split('T')[0];

  const diaSig2 = new Date(fecha);
  diaSig2.setDate(diaSig2.getDate() + 2);
  const fechaSig2 = diaSig2.toISOString().split('T')[0];

  let allResults = [];
  let page = 1;

  while (true) {
    try {
      const response = await apiInstance.get('/api/v1/core/posturas/new-simple-list/', {
        params: {
          datetime_publish__gte: fecha,
          datetime_publish__lte: fechaSig2,
          contain_end_city: endCity,
          contain_start_city: startCity,
          ordering: 'datetime_publish',
          page: page,
          page_size: 25,
          status__include_disabled: true
        }
      });

      allResults = [...allResults, ...response.data.results];

      if (!response.data.next) {
        break;
      }
      page++;
    } catch (pageError) {
      if (pageError.response?.status === 404) {
        break;
      }
      throw pageError;
    }
  }

  return allResults;
};

export const getPosturasMyInfo = async (fecha, startCity = 2, endCity = 3, myAssistantName = 'Victor Figueroa Sanchez') => {
  const allPosturas = await getPosturas(fecha, startCity, endCity);
  
  const filteredResults = [];
  let totalMonto = 0;
  
  for (const postura of allPosturas) {
    try {
      const serviceInfo = await getServiceInfo(postura.id);
      const assistantName = serviceInfo.assistants?.[0]?.name;
      if (assistantName && assistantName.toLowerCase().includes(myAssistantName.toLowerCase())) {
        filteredResults.push(postura);
        totalMonto += serviceInfo.total_amount || 0;
      }
    } catch (err) {
      console.warn(`Error fetching service info for postura ${postura.id}:`, err.message);
    }
  }
  
  return { posturas: filteredResults, totalMonto };
};

export const getPosturasMyInfoAllRoutes = async (fecha, myAssistantName = 'Victor Figueroa Sanchez') => {
  const allPosturasFrom = await getPosturas(fecha, 2, 3);
  const allPosturasTo = await getPosturas(fecha, 3, 2);
  
  const filteredResults = [];
  let totalMonto = 0;
  
  const allPosturas = [...allPosturasFrom, ...allPosturasTo];
  
  for (const postura of allPosturas) {
    try {
      const serviceInfo = await getServiceInfo(postura.id);
      const assistantName = serviceInfo.assistants?.[0]?.name;
      if (assistantName && assistantName.toLowerCase().includes(myAssistantName.toLowerCase())) {
        filteredResults.push(postura);
        totalMonto += serviceInfo.total_amount || 0;
      }
    } catch (err) {
      console.warn(`Error fetching service info for postura ${postura.id}:`, err.message);
    }
  }
  
  return { posturas: filteredResults, totalMonto };
};

export const getPosturasMyInfoDateRange = async (fechaDesde, fechaHasta, onProgress, myAssistantName = 'Victor Figueroa Sanchez', token) => {
  const filteredResults = [];
  let totalMonto = 0;
  const tempToken = token || currentToken;
  
  const current = new Date(fechaDesde);
  const end = new Date(fechaHasta);
  let dateCount = 0;
  const totalDates = Math.ceil((end - current) / (1000 * 60 * 60 * 24)) + 1;
  
  while (current <= end) {
    const fecha = current.toISOString().split('T')[0];
    dateCount++;
    
    if (onProgress) {
      onProgress(`Procesando fecha ${fecha} (${dateCount}/${totalDates})...`);
    }
    
    try {
      const allPosturasFrom = await getPosturas(fecha, 2, 3, tempToken);
      const allPosturasTo = await getPosturas(fecha, 3, 2, tempToken);
      const allPosturas = [...allPosturasFrom, ...allPosturasTo];
      
      const processInParallel = async (items, concurrency = 5, token) => {
        const results = [];
        
        for (let i = 0; i < items.length; i += concurrency) {
          const batch = items.slice(i, i + concurrency);
          const batchResults = await Promise.all(
            batch.map(async (postura) => {
              try {
                const serviceInfo = await getServiceInfo(postura.id, token);
                return { postura, serviceInfo };
              } catch (err) {
                return { postura, serviceInfo: null };
              }
            })
          );
          results.push(...batchResults);
        }
        
        return results;
      };
      
      const batchResults = await processInParallel(allPosturas, 15, tempToken);
      
      for (const { postura, serviceInfo } of batchResults) {
        if (!serviceInfo || serviceInfo.error) {
          continue;
        }
        const assistantName = serviceInfo.assistants?.[0]?.name;
        if (assistantName && assistantName.toLowerCase().includes(myAssistantName.toLowerCase())) {
          filteredResults.push(postura);
          totalMonto += serviceInfo.total_amount || 0;
        }
      }
    } catch (err) {
      console.warn(`Error fetching posturas for fecha ${fecha}:`, err.message);
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return { posturas: filteredResults, totalMonto };
};

export const getServiceInfo = async (serviceId, token) => {
  const tempToken = token || currentToken;
  const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: tempToken ? {
      'Authorization': `Bearer ${tempToken}`
    } : {}
  });
  const response = await apiInstance.get('/api/v1/sales/reports/pax-list-web/', {
    params: { service: serviceId }
  });
  return response.data;
};

export const getPdf = async (serviceId, token) => {
  const tempToken = token || currentToken;
  const apiInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: tempToken ? {
      'Authorization': `Bearer ${tempToken}`
    } : {}
  });
  const response = await apiInstance.get('/api/v1/sales/reports/pax-list-simple/', {
    params: { service: serviceId }
  });
  return response.data;
};

export default { getApiInstance, setApiToken, getApiToken };