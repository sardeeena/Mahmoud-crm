/**
 * Centralized Strongly-Typed Routes
 */

export type AppRouteType = 
  | 'home'
  | 'excursions'
  | 'tour_detail'
  | 'booking'
  | 'confirmation'
  | 'my_booking'
  | 'admin'
  | 'admin_login'
  | 'not_found';

export interface RouteParams {
  slug?: string;
  reference?: string;
  tab?: string;
  action?: string;
}

export interface ParsedRoute {
  type: AppRouteType;
  path: string;
  params: RouteParams;
  searchParams: URLSearchParams;
  isValid: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
  onClick?: () => void;
  isCurrent?: boolean;
}

export const APP_ROUTES = {
  HOME: '/',
  EXCURSIONS: '/excursions',
  TOUR_DETAIL: (slug: string) => `/excursions/${encodeURIComponent(slug)}`,
  BOOKING: (slug?: string) => (slug ? `/booking?tour=${encodeURIComponent(slug)}` : '/booking'),
  CONFIRMATION: (ref: string) => `/booking/confirmation/${encodeURIComponent(ref)}`,
  MY_BOOKING: (ref?: string) => (ref ? `/my-booking/${encodeURIComponent(ref)}` : '/my-booking'),
  ADMIN: '/admin',
  ADMIN_LOGIN: (redirect?: string) => (redirect ? `/admin/login?redirect=${encodeURIComponent(redirect)}` : '/admin/login'),
  ADMIN_TAB: (tab: string) => `/admin/${encodeURIComponent(tab)}`,
} as const;
