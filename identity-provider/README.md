# Identity Provider (IdP)

Manages user identities, authentication tokens, credentials, and SSO integrations.

## Capabilities
- **Token Issuer**: Issues signed JWT Access & Refresh Tokens.
- **Protocol**: OpenID Connect (OIDC) & OAuth 2.0.
- **Provider Support**: Integrates with Clerk, Keycloak, Auth0, or built-in secure DB auth.
- **JWKS Endpoint**: Publishes public keys at `/.well-known/jwks.json` for microservices to verify tokens asynchronously without network round-trips.

## Endpoints
- `POST /auth/login` — Authenticate and issue JWT.
- `POST /auth/register` — Create new user record.
- `POST /auth/refresh` — Exchange refresh token for new access token.
- `GET /auth/jwks.json` — Public key sets for distributed verification.
