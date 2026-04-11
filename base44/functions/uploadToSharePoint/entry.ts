import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileName, fileBase64, jobNumber, connectorId, folderName = 'ProofOfDelivery' } = await req.json();

    if (!fileName || !fileBase64 || !jobNumber) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get SharePoint connection from app user
    const connector = await base44.asServiceRole.connectors.getCurrentAppUserAccessToken(connectorId);
    const accessToken = connector;
    // Get SharePoint site info from Graph API
    const graphRes = await fetch('https://graph.microsoft.com/v1.0/sites/root', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const graphData = await graphRes.json();
    const tenant = new URL(graphData.webUrl).hostname.split('.')[0];
    
    const baseUrl = `https://${tenant}.sharepoint.com${sitePath}/_api`;
    
    // Ensure folder exists
    const folderUrl = `${baseUrl}/web/folders`;
    await fetch(`${folderUrl}/add('${folderName}')`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      }
    }).catch(() => {}); // Folder may already exist

    // Upload file
    const fileUrl = `${baseUrl}/web/GetFolderByServerRelativePath(decodedurl='${sitePath}/${folderName}')/Files/add(url='${jobNumber}_${fileName}',overwrite=true)`;
    
    const fileBuffer = Uint8Array.from(atob(fileBase64), c => c.charCodeAt(0));
    
    const uploadRes = await fetch(fileUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/octet-stream',
        'Accept': 'application/json'
      },
      body: fileBuffer
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      throw new Error(`SharePoint upload failed: ${error}`);
    }

    const uploadData = await uploadRes.json();
    
    return Response.json({
      success: true,
      fileName: uploadData.Name,
      fileUrl: uploadData.ServerRelativeUrl,
      message: `${fileName} uploaded to SharePoint`
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});