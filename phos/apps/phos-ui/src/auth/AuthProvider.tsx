import React from 'react';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';

type AuthProviderProps = {
  children: React.ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const domain = import.meta.env.VITE_IDP_DOMAIN as string | undefined;
  const clientId = import.meta.env.VITE_IDP_CLIENT_ID as string | undefined;
  const audience = import.meta.env.VITE_IDP_AUDIENCE as string | undefined;

  if (!domain || !clientId) {
    // Render children anyway so local dev without auth still works
    return <>{children}</>;
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
      cacheLocation="memory"
      useRefreshTokens={false}
    >
      {children}
    </Auth0Provider>
  );
}

export function useAuth() {
  const auth = useAuth0();
  const rolesNsPrimary = 'https://phos.ai/roles';
  const rolesNsAlt = 'https://phos.health/roles';
  const rawRoles = (auth.user as any)?.[rolesNsPrimary] || (auth.user as any)?.[rolesNsAlt] || [];
  const roles: string[] = Array.isArray(rawRoles) ? rawRoles : [];
  const hasRole = (role: string) => roles.includes(role) || (roles.length === 0 && (import.meta.env.DEV ?? false));
  const hasAnyRole = (rs: string[]) => rs.some((r) => hasRole(r));
  return { ...auth, roles, hasRole, hasAnyRole } as const;
}


