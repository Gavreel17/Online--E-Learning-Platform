---
name: Authentication and authorization boundary
description: Durable rule for identity and admin access in the learning platform.
---

Clerk establishes the signed-in identity, while the platform database role is the authority for student versus admin access.

**Why:** Authentication proves who is making the request; keeping authorization in the application database makes admin access explicit, auditable, and revocable without relying on client-side state.

**How to apply:** Keep admin checks on the server for every admin route. Frontend route guards are only for navigation and user experience.