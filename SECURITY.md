# Security Policy

## Reporting a vulnerability

If you discover a security issue in Dutiva — a vulnerability, an exposed
credential, a data-exposure or configuration problem, or any other security
concern — please report it privately by email to **security@dutiva.ca**.

Please include enough for us to reproduce it: what you found, the affected
URL or component, and the steps or proof-of-concept. If you need to share
sensitive details, say so and we will arrange a secure channel.

**What to expect:** we aim to acknowledge reports promptly in accordance with
our published support response targets and to keep you updated as we
investigate and remediate. Reports are handled by Dutiva Canada Inc.

Reports may be sent in **English or French**.

## Coordinated disclosure

Please give us a reasonable opportunity to remediate before any public
disclosure, and do not disclose the issue, exploit details, exposed
credentials, or internal infrastructure details publicly in the meantime.
We will credit reporters who wish to be acknowledged once an issue is
resolved.

## Safe harbour

We will not pursue or support legal action against anyone who, in good
faith and in the course of reporting a vulnerability to us:

- accesses only their own data, or data they are explicitly authorised to
  access, and only to the minimum extent needed to demonstrate the issue;
- does not degrade, disrupt, or destroy data or service availability (no
  denial-of-service, no spam, no automated high-volume testing against
  production);
- does not exfiltrate, retain, or share data belonging to others; and
- gives us a reasonable time to remediate before disclosure.

Testing that goes beyond this — accessing other people's data, running
load/DoS tests, or social-engineering staff or customers — is not
authorised.

## Scope

In scope: the Dutiva web application and its API (dutiva.ca and its
subdomains) and this repository. Out of scope: third-party services Dutiva
integrates with (report those to the relevant vendor), and findings that
require a compromised device, a rooted browser, or physical access.

## Repository access

Access to this repository may be limited by role, review scope, integration
scope, or internal authorisation level. Unauthorised access, disclosure,
copying, redistribution, scraping, or misuse of repository contents is
prohibited.

## Third-party dependencies

Third-party libraries and dependencies remain subject to their own licences
and security practices.
