---
title: Airtable Instant Trigger Node
description: Community n8n trigger node that fires instantly on Airtable record changes using webhooks instead of polling.
category: n8n
tags: [n8n, TypeScript, Airtable, Webhooks, Automation]
status: Published
repo: https://github.com/jvendramin/instant-airtable-trigger-node
---

Replaces n8n's default Airtable polling trigger with a true webhook-based instant trigger. Records changes in Airtable fire the workflow in real time with no polling delay.

Supports create, update, and delete events across any Airtable base and table. Built on the Airtable Webhooks API with automatic webhook lifecycle management.
