import { formatDate } from './utils';

function ServiceTable({ posturas, onShowInfo }) {
  const uniquePosturas = posturas.filter((postura, index, self) => 
    index === self.findIndex(p => p.id === postura.id)
  );
  
  return (
    <div className="bg-gray-800 rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-950 text-white">
            <tr>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Fecha</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm hidden sm:table-cell">Bus</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm">Trayecto</th>
              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs sm:text-sm"></th>
            </tr>
          </thead>
          <tbody>
            {uniquePosturas.map((postura, idx) => (
              <tr key={`${postura.id}-${idx}`} className="border-b border-gray-700 hover:bg-gray-750">
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-300 text-xs sm:text-sm">{formatDate(postura.stretch.start_date)}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-white text-xs sm:text-sm hidden sm:table-cell">{postura.bus?.code || '-'}</td>
                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-400 max-w-[100px] sm:max-w-xs truncate" title={postura.name}>
                  {postura.name}
                </td>
                <td className="px-2 sm:px-4 py-2 sm:py-3">
                  <button 
                    onClick={() => onShowInfo(postura.id)}
                    className="px-2 py-1 sm:px-3 sm:py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                  >
                    Info
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ServiceTable;