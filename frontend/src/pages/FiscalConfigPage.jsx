import { useEffect, useRef, useState } from 'react';
import {
  getFiscalConfig,
  testAfipConnection,
  updateFiscalConfig,
  uploadAfipCert,
} from '../api/billing';

export default function FiscalConfigPage() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [certFile, setCertFile] = useState(null);
  const [certPassword, setCertPassword] = useState('');
  const [uploadingCert, setUploadingCert] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    getFiscalConfig()
      .then(setConfig)
      .catch(() => setError('Error al cargar la configuración fiscal.'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateFiscalConfig({
        afipEnabled: config.afipEnabled,
        afipAmbiente: config.afipAmbiente,
      });
      setConfig(updated);
    } catch {
      setError('Error al guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  const handleCertUpload = async () => {
    if (!certFile || !certPassword) {
      setError('Seleccioná el archivo .p12 e ingresá la contraseña.');
      return;
    }
    setUploadingCert(true);
    setError('');
    try {
      const updated = await uploadAfipCert(certFile, certPassword);
      setConfig(updated);
      setCertFile(null);
      setCertPassword('');
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      setError(e?.response?.data?.message || 'El certificado no es válido o la contraseña es incorrecta.');
    } finally {
      setUploadingCert(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError('');
    try {
      const res = await testAfipConnection();
      setTestResult(res);
    } catch {
      setError('Error al probar la conexión.');
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div className="p-6 text-gray-500">Cargando configuración fiscal...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Configuración Fiscal</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Datos fiscales (solo lectura, se editan en Configuración general) */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-2">
        <h2 className="font-semibold text-gray-700 mb-3">Datos fiscales del emisor</h2>
        <Row label="CUIT" value={config.cuit || '—'} />
        <Row label="Condición IVA" value={config.condicionIva || '—'} />
        <Row label="Tipo de comprobante" value={config.tipoComprobante || '—'} />
        <Row label="Punto de venta" value={config.puntoVenta ?? '—'} />
        <p className="text-xs text-gray-400 pt-1">
          Estos datos se configuran en Ajustes → Información fiscal.
        </p>
      </section>

      {/* Activación y ambiente */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Facturación electrónica</h2>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.afipEnabled}
            onChange={e => setConfig(c => ({ ...c, afipEnabled: e.target.checked }))}
            className="w-5 h-5 accent-indigo-600"
          />
          <span className="text-gray-800">Habilitada</span>
        </label>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ambiente</label>
          <select
            value={config.afipAmbiente}
            onChange={e => setConfig(c => ({ ...c, afipAmbiente: e.target.value }))}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-xs"
          >
            <option value="HOMOLOGACION">Homologación (pruebas)</option>
            <option value="PRODUCCION">Producción</option>
          </select>
          {config.afipAmbiente === 'PRODUCCION' && (
            <p className="text-xs text-amber-600 mt-1">
              En producción los comprobantes se envían al organismo fiscal y generan obligación real.
            </p>
          )}
        </div>

        <button
          onClick={save}
          disabled={saving}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </section>

      {/* Certificado digital */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-gray-700">Certificado digital</h2>

        {config.certLoaded ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-green-700 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              Certificado cargado
            </div>
            {config.certSubject && (
              <p className="text-xs text-gray-500 font-mono break-all">{config.certSubject}</p>
            )}
            {config.certExpiry && (
              <p className={`text-xs ${config.certExpiringSoon ? 'text-amber-600 font-semibold' : 'text-gray-500'}`}>
                Vence: {new Date(config.certExpiry).toLocaleDateString('es-AR')}
                {config.certExpiringSoon && ' — Renovar pronto'}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay certificado cargado.</p>
        )}

        <div className="space-y-3 pt-2 border-t border-gray-100">
          <p className="text-sm text-gray-600">
            {config.certLoaded ? 'Reemplazar certificado:' : 'Cargar certificado (.p12 / .pfx):'}
          </p>
          <input
            ref={fileRef}
            type="file"
            accept=".p12,.pfx"
            onChange={e => setCertFile(e.target.files[0])}
            className="block text-sm text-gray-600"
          />
          <input
            type="password"
            placeholder="Contraseña del certificado"
            value={certPassword}
            onChange={e => setCertPassword(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm w-full max-w-xs"
          />
          <button
            onClick={handleCertUpload}
            disabled={uploadingCert || !certFile || !certPassword}
            className="bg-gray-800 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-900 disabled:opacity-50"
          >
            {uploadingCert ? 'Subiendo...' : 'Subir certificado'}
          </button>
        </div>
      </section>

      {/* Test de conexión */}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <h2 className="font-semibold text-gray-700">Probar conexión con el organismo fiscal</h2>
        <button
          onClick={handleTest}
          disabled={testing || !config.certLoaded}
          className="border border-indigo-500 text-indigo-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-50 disabled:opacity-40"
        >
          {testing ? 'Verificando...' : 'Probar conexión'}
        </button>
        {testResult && (
          <div className={`text-sm rounded p-3 ${testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>
            <strong>{testResult.success ? 'Conexión exitosa' : 'Error'}</strong> — {testResult.message}
            {testResult.durationMs && <span className="ml-2 text-xs opacity-70">({testResult.durationMs}ms)</span>}
          </div>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium">{value}</span>
    </div>
  );
}
