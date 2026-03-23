---
title: Private Late Night Note
published: 2026-03-23
description: "A private demo post for validating author-only blog rendering."
tags: ["Private", "Demo", "Auth"]
category: Notes
draft: false
visibility: private
---

# Private Post Demo

This entry exists to verify the private-post flow inside Duet.

- Anonymous visitors should get a `404` on this page.
- Signed-in allowlist viewers should be able to read it normally.
- Public outputs such as RSS, sitemap, and search should not expose it.

If you can read this while signed in, the viewer-aware SSR path is working.
