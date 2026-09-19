# Secure WISP credential profiles

The framework supports saved upstream Wi-Fi credentials without repeatedly entering the password.

## Security model

- The API accepts a password only when creating/updating a profile.
- Passwords are encrypted at rest with AES-256-GCM.
- The API never returns the password or ciphertext.
- Credential-management endpoints require the x-admin-token header.
- The admin token must be supplied through ADMIN_API_TOKEN; it must not be committed to Git.
- The encryption key must be supplied through CREDENTIAL_STORE_KEY; it must not be committed to Git.
- Storage defaults to ./data/credentials.json; use CREDENTIAL_STORE_PATH to change it.
- A saved credential is a legitimate credential profile only. It does not bypass WPA/WPA2/WPA3 authentication.

## Environment

    ADMIN_API_TOKEN=<strong-random-admin-token>
    CREDENTIAL_STORE_KEY=<strong-random-secret>
    CREDENTIAL_STORE_PATH=/etc/awrf/credentials.json

For an OpenWrt deployment, keep the secrets in protected configuration/environment storage and set file permissions so ordinary users cannot read them.

## API

- GET /api/credentials — list profile metadata; passwords are never returned.
- POST /api/credentials — create/update a profile. JSON: {id?, ssid, security, password}.
- DELETE /api/credentials/:id — remove a profile.

All three endpoints require x-admin-token: <ADMIN_API_TOKEN>.

## WISP connection integration

The current framework intentionally separates credential storage from the final Wi-Fi connection backend. The next hardware-specific layer can resolve a credential reference and configure the router's supported supplicant/network manager without exposing the password to the browser or logs.

Do not add password-cracking, authentication bypass, or automatic connection to networks without valid credentials.
