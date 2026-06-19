import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import { productsApi } from '../api/products'

function totalStock(product) {
  if (product.stockMatrix) {
    try {
      const m = JSON.parse(product.stockMatrix)
      let total = 0
      for (const size of Object.values(m)) {
        if (typeof size === 'object') {
          for (const qty of Object.values(size)) total += Number(qty) || 0
        } else {
          total += Number(size) || 0
        }
      }
      return total
    } catch { /* fall through */ }
  }
  return product.stockCount ?? null
}

function stockLabel(product) {
  if (!product.showStock) return 'sin-control'
  if (product.stockStatus === 'ON_DEMAND') return 'a-pedido'
  const qty = totalStock(product)
  if (qty === null || qty === undefined) return 'sin-cantidad'
  return qty <= 0 ? 'agotado' : 'en-stock'
}

function exportCSV(products) {
  const rows = [['Nombre', 'SKU', 'Categoría', 'Precio', 'Stock', 'Estado']]
  for (const p of products) {
    const qty = totalStock(p)
    rows.push([
      p.name,
      p.sku || '',
      p.category || '',
      p.price != null ? Number(p.price).toLocaleString('es-AR') : '',
      qty != null ? qty : '',
      stockLabel(p) === 'en-stock' ? 'En stock'
        : stockLabel(p) === 'agotado' ? 'Agotado'
        : stockLabel(p) === 'a-pedido' ? 'A pedido'
        : 'Sin control',
    ])
  }
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = 'informe-stock.csv'
  a.click()
}

function ProductRow({ product }) {
  const qty = totalStock(product)
  return (
    <tr className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700/40 transition-colors">
      <td className="py-2.5 pr-3">
        <div className="flex items-center gap-3">
          {product.imageUrl
            ? <img src={product.imageUrl} alt="" className="w-9 h-9 rounded-lg object-cover shrink-0" />
            : <div className="w-9 h-9 rounded-lg bg-gray-100 dark:bg-slate-700 shrink-0" />
          }
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
            {product.sku && <p className="text-xs text-gray-400 dark:text-slate-500">SKU: {product.sku}</p>}
          </div>
        </div>
      </td>
      <td className="py-2.5 pr-3 text-sm text-gray-500 dark:text-slate-400">
        {product.category ? product.category.split(',').map(c => c.trim()).filter(Boolean).map(c => (
          <span key={c} className="inline-block mr-1 px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-slate-700 rounded-full">{c}</span>
        )) : '—'}
      </td>
      <td className="py-2.5 pr-3 text-sm font-medium text-blue-600 dark:text-blue-400 text-right whitespace-nowrap">
        {product.price != null ? `$${Number(product.price).toLocaleString('es-AR')}` : '—'}
      </td>
      <td className="py-2.5 text-right">
        {qty != null
          ? <span className={`text-sm font-bold ${qty <= 0 ? 'text-red-500' : qty <= 5 ? 'text-yellow-500' : 'text-green-600 dark:text-green-400'}`}>{qty}</span>
          : <span className="text-xs text-gray-400">—</span>
        }
      </td>
    </tr>
  )
}

function Section({ title, color, products, emptyMsg }) {
  const colors = {
    red:    'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    green:  'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-400',
    gray:   'bg-gray-50 dark:bg-slate-800 border-gray-200 dark:border-slate-700 text-gray-500 dark:text-slate-400',
  }
  return (
    <div className="mb-8">
      <div className={`flex items-center justify-between px-4 py-2.5 rounded-t-xl border ${colors[color]}`}>
        <span className="font-semibold text-sm">{title}</span>
        <span className="text-sm font-bold">{products.length}</span>
      </div>
      {products.length === 0 ? (
        <div className="border border-t-0 border-gray-200 dark:border-slate-700 rounded-b-xl px-4 py-4 text-center text-sm text-gray-400 dark:text-slate-500">{emptyMsg}</div>
      ) : (
        <div className="border border-t-0 border-gray-200 dark:border-slate-700 rounded-b-xl overflow-x-auto">
          <table className="w-full min-w-[480px]">
            <thead>
              <tr className="text-xs text-gray-400 dark:text-slate-500 border-b border-gray-100 dark:border-slate-700">
                <th className="px-4 py-2 text-left font-medium">Producto</th>
                <th className="pr-3 py-2 text-left font-medium">Categoría</th>
                <th className="pr-3 py-2 text-right font-medium">Precio</th>
                <th className="pr-4 py-2 text-right font-medium">Stock</th>
              </tr>
            </thead>
            <tbody className="px-4">
              {products.map(p => <ProductRow key={p.id} product={p} />)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function StockReportPage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    productsApi.list().then(({ data }) => setProducts(data)).finally(() => setLoading(false))
  }, [])

  const agotados  = products.filter(p => stockLabel(p) === 'agotado')
  const enStock   = products.filter(p => stockLabel(p) === 'en-stock')
  const aPedido   = products.filter(p => stockLabel(p) === 'a-pedido')
  const sinCtrl   = products.filter(p => stockLabel(p) === 'sin-control' || stockLabel(p) === 'sin-cantidad')

  const totalEnStock = enStock.reduce((sum, p) => sum + (totalStock(p) || 0), 0)

  if (loading) return <Layout><div className="text-center py-16 text-gray-400 dark:text-slate-500">Cargando...</div></Layout>

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/stock')} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-300 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Informe de stock</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400">{products.length} productos en total</p>
            </div>
          </div>
          <button
            onClick={() => exportCSV(products)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-slate-700 text-white text-sm font-medium rounded-xl hover:bg-gray-700 dark:hover:bg-slate-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exportar CSV
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{products.length}</p>
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Total productos</p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-green-700 dark:text-green-400">{enStock.length}</p>
            <p className="text-xs text-green-600 dark:text-green-500 mt-1">En stock <span className="font-medium">({totalEnStock} u.)</span></p>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{agotados.length}</p>
            <p className="text-xs text-red-500 dark:text-red-400 mt-1">Agotados</p>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{aPedido.length}</p>
            <p className="text-xs text-yellow-500 dark:text-yellow-400 mt-1">A pedido</p>
          </div>
        </div>

        {/* Sections */}
        <Section title="Agotados" color="red" products={agotados} emptyMsg="Sin productos agotados" />
        <Section title="En stock" color="green" products={enStock} emptyMsg="Sin productos con stock activo" />
        <Section title="A pedido" color="yellow" products={aPedido} emptyMsg="Sin productos a pedido" />
        <Section title="Sin control de stock" color="gray" products={sinCtrl} emptyMsg="Todos los productos tienen control de stock" />
      </div>
    </Layout>
  )
}
