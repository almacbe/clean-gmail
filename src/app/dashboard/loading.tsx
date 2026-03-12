export default function DashboardLoading() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="skeleton h-8 w-48 mb-6"></div>
      <div className="skeleton h-4 w-64 mb-6"></div>
      <div className="stats stats-vertical sm:stats-horizontal shadow w-full">
        <div className="stat">
          <div className="skeleton h-4 w-32 mb-2"></div>
          <div className="skeleton h-10 w-24 mb-2"></div>
          <div className="skeleton h-3 w-40"></div>
        </div>
        <div className="stat">
          <div className="skeleton h-4 w-32 mb-2"></div>
          <div className="skeleton h-10 w-24 mb-2"></div>
          <div className="skeleton h-3 w-40"></div>
        </div>
        <div className="stat">
          <div className="skeleton h-4 w-32 mb-2"></div>
          <div className="skeleton h-10 w-24 mb-2"></div>
          <div className="skeleton h-3 w-40"></div>
        </div>
      </div>
      <div className="p-6 max-w-4xl mx-auto mt-4">
        <div className="skeleton h-6 w-48 mb-4"></div>
        <div className="overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                {[...Array(4)].map((_, i) => (
                  <th key={i}>
                    <div className="skeleton h-4 w-20"></div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i}>
                  {[...Array(4)].map((_, j) => (
                    <td key={j}>
                      <div className="skeleton h-4 w-full"></div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
