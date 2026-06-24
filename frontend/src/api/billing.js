import api from './axios';

export const getFiscalConfig = () => api.get('/billing/config').then(r => r.data);

export const updateFiscalConfig = (data) =>
  api.put('/billing/config', data).then(r => r.data);

export const uploadAfipCert = (file, password) => {
  const form = new FormData();
  form.append('file', file);
  form.append('password', password);
  return api.post('/billing/config/cert', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const testAfipConnection = () =>
  api.get('/billing/config/test-connection').then(r => r.data);

export const issueInvoice = (data) =>
  api.post('/billing/issue', data).then(r => r.data);

export const getInvoiceByTicket = (ticketId) =>
  api.get(`/billing/records/ticket/${ticketId}`).then(r => r.data);

export const listInvoices = () =>
  api.get('/billing/records').then(r => r.data);
