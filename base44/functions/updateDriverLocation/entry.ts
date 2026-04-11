import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { driver_id, lat, lng, job_id, job_number, is_on_route } = await req.json();
    if (!driver_id || lat == null || lng == null) {
      return Response.json({ error: 'driver_id, lat, and lng are required' }, { status: 400 });
    }

    await base44.asServiceRole.entities.Driver.update(driver_id, {
      current_lat: lat,
      current_lng: lng,
      location_updated_at: new Date().toISOString(),
      current_job_id: job_id || null,
      current_job_number: job_number || null,
      is_on_route: is_on_route !== false,
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('updateDriverLocation error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});