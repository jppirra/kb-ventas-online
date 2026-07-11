import { useState } from 'react';
import { getInvoiceByTicket, issueInvoice } from '../api/billing';

/** Botón de emisión de comprobante fiscal desde el detalle del ticket. */
export default function IssueBillingButton({ ticketId, ticketTotal }) {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [error, setError] = useState('');
  const [checked, setChecked] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [docTipo, setDocTipo] = useState(99);
  const [docNro, setDocNro] = useState('');

  const checkExisting = async () => {
    if (checked) { setShowForm(true); return; }
    setLoading(true);
    setError('');
    try {
      const existing = await getInvoiceByTicket(ticketId);
      setInvoice(existing);
    } catch (e) {
      if (e?.response?.status === 404) {
        setShowForm(true);
      } else {
        setError('Error al consultar comprobante.');
      }
    } finally {
      setChecked(true);
      setLoading(false);
    }
  };

  const handleIssue = async () => {
    setLoading(true);
    setError('');
    try {
      const correlationId = crypto.randomUUID();
      const result = await issueInvoice({
        saleTicketId: ticketId,
        correlationId,
        docTipo,
        docNro: docNro ? Number(docNro) : 0,
        concepto: 1,
      });
      setInvoice(result);
      setShowForm(false);
    } catch (e) {
      setError(e?.response?.data?.message || 'Error al emitir el comprobante.');
    } finally {
      setLoading(false);
    }
  };

  if (invoice) {
    return (
      <div className="border border-green-300 bg-green-50 rounded-lg p-4 space-y-1 text-sm">
        <p className="font-semibold text-green-800">Comprobante fiscal emitido</p>
        <p className="text-green-700 font-mono text-xs">{invoice.cae}</p>
        <p className="text-green-600 text-xs">
          Validez: {invoice.caeExpiry ? new Date(invoice.caeExpiry).toLocaleDateString('es-AR') : '—'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!showForm && (
        <button
          onClick={checkExisting}
          disabled={loading}
          className="flex items-center gap-2 border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Consultando...' : 'Emitir comprobante fiscal'}
        </button>
      )}

      {showForm && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50 text-sm">
          <p className="font-medium text-gray-700">Datos del receptor</p>
          <div className="flex gap-3">
            <select
              value={docTipo}
              onChange={e => setDocTipo(Number(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={99}>Consumidor Final</option>
              <option value={96}>DNI</option>
              <option value={80}>CUIT</option>
            </select>
            {docTipo !== 99 && (
              <input
                type="number"
                placeholder="N° de documento"
                value={docNro}
                onChange={e => setDocNro(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1 text-sm w-40"
              />
            )}
          </div>
          <p className="text-xs text-gray-500">Total: ${ticketTotal?.toLocaleString('es-AR') ?? '—'}</p>
          <div className="flex gap-2">
            <button
              onClick={handleIssue}
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Emitiendo...' : 'Emitir comprobante'}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded text-sm text-gray-600 hover:bg-gray-200"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-xs">{error}</p>}
    </div>
  );
}
