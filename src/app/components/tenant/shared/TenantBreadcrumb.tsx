import { Fragment } from 'react';
import { Link, useLocation } from 'react-router';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../ui/breadcrumb';
import { TENANT_ROUTE_LABELS } from './tenant-nav';

export function TenantBreadcrumb() {
  const { pathname } = useLocation();

  const segments = pathname
    .replace(/^\/tenant\/?/, '')
    .split('/')
    .filter(Boolean);

  const crumbs: { label: string; href?: string }[] = [
    { label: 'Home', href: '/tenant' },
  ];

  let path = '/tenant';
  for (const seg of segments) {
    path += `/${seg}`;
    const label = TENANT_ROUTE_LABELS[path];
    if (label) {
      const isLast = path === pathname;
      crumbs.push(isLast ? { label } : { label, href: path });
    }
  }

  if (crumbs.length <= 1 && pathname === '/tenant') {
    return null;
  }

  return (
    <Breadcrumb className="mb-1">
      <BreadcrumbList>
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.label + i}>
            {i > 0 && (
              <BreadcrumbItem>
                <BreadcrumbSeparator />
              </BreadcrumbItem>
            )}
            <BreadcrumbItem>
              {crumb.href ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.href}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
