import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

const CONNECTOR_ID = "69d76809d5359a26fa536917";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(CONNECTOR_ID);

    const { siteUrl, listName } = await req.json();

    if (!siteUrl || !listName) {
      return Response.json({ error: 'siteUrl and listName are required' }, { status: 400 });
    }

    // Get the site ID from Microsoft Graph
    const encodedSite = encodeURIComponent(siteUrl.replace(/https?:\/\//, ''));
    const siteRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${encodedSite}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!siteRes.ok) {
      const err = await siteRes.json();
      return Response.json({ error: 'Failed to resolve site', details: err }, { status: siteRes.status });
    }

    const site = await siteRes.json();
    const siteId = site.id;

    // Get the list by name
    const listsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists?$filter=displayName eq '${encodeURIComponent(listName)}'`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const listsData = await listsRes.json();
    const list = listsData.value?.[0];

    if (!list) {
      return Response.json({ error: `List "${listName}" not found` }, { status: 404 });
    }

    const listId = list.id;

    // Get list items with fields
    const itemsRes = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/lists/${listId}/items?expand=fields`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const itemsData = await itemsRes.json();

    return Response.json({ items: itemsData.value || [], siteId, listId });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});