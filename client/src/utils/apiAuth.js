/** Hangi API isteğine hangi token gideceğini belirler */

const publicCustomerPaths = [
  '/customers/register',
  '/customers/login',
  '/customers/resend-verification'
];

export function isCustomerMeApi(url = '') {
  const path = url.split('?')[0];
  return path.includes('/customers/me');
}

export function isPublicCustomerApi(url = '') {
  const path = url.split('?')[0];
  if (publicCustomerPaths.includes(path)) return true;
  if (path.startsWith('/customers/verify-email')) return true;
  if (path.startsWith('/customers/complete-registration')) return true;
  return false;
}

const publicAdminPaths = ['/admin/login', '/admin/logout'];

export function isPublicAdminApi(url = '') {
  const path = url.split('?')[0];
  return publicAdminPaths.includes(path);
}

export function isAdminApi(url = '') {
  const path = url.split('?')[0];
  if (isCustomerMeApi(path) || isPublicCustomerApi(path)) return false;
  if (isPublicAdminApi(path)) return false;
  if (path.startsWith('/admin')) return true;
  if (path.startsWith('/sales')) return true;
  if (path === '/customers' || /^\/customers\/\d+/.test(path)) return true;
  if (path.startsWith('/email/list')) return true;
  return false;
}

/** Admin token gerektiren istekler (giriş sayfası hariç) */
export function isProtectedAdminApi(url = '') {
  return isAdminApi(url);
}

export function clearAdminSession() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminUser');
}

export function clearCustomerSession() {
  localStorage.removeItem('customerToken');
  localStorage.removeItem('customer');
}
