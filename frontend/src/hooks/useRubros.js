import { useEffect, useState } from 'react'
import { catalogsApi } from '../api/catalogs'
import { RUBROS } from '../config/rubros'

let _cache = null

export function useRubros() {
  const [rubros, setRubros] = useState(_cache || RUBROS.map(r => ({ value: r.value, label: r.label })))

  useEffect(() => {
    if (_cache) { setRubros(_cache); return }
    catalogsApi.listPublicRubros()
      .then(({ data }) => {
        _cache = data
        setRubros(data)
      })
      .catch(() => {})
  }, [])

  return rubros
}
