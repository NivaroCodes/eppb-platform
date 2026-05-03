const mockApplications = [
  {
    id: 'APP-001',
    serviceTitle: 'Приобретение вагонов в лизинг — I этап',
    submittedAt: new Date().toISOString(),
    status: 'На рассмотрении',
    refId: 'EISH-2026-001',
  },
];

export function ApplicationsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <h1 className="text-3xl font-black text-slate-950">Мои заявки</h1>
      <p className="mt-2 text-sm text-slate-500">История поданных заявок</p>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              {['ID', 'Услуга', 'Дата подачи', 'Статус', 'Реф. номер ЕИШ'].map((head) => (
                <th
                  key={head}
                  className="px-6 py-3 text-left text-xs font-black uppercase tracking-wide text-slate-500"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mockApplications.map((item) => (
              <tr key={item.id} className="border-t border-slate-100">
                <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">{item.id}</td>
                <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                  {item.serviceTitle}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {new Date(item.submittedAt).toLocaleString('ru-RU')}
                </td>
                <td className="px-6 py-4">
                  <span className="rounded-full bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 font-mono text-sm font-bold text-slate-900">
                  {item.refId}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
