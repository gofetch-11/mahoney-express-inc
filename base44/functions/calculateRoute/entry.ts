import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { jobs } = await req.json();
    if (!jobs || jobs.length === 0) return Response.json({ orderedJobs: [] });
    if (jobs.length === 1) return Response.json({ orderedJobs: jobs, summary: "Only one stop." });

    const jobList = jobs.map((j, i) => ({
      index: i,
      job_number: j.job_number,
      customer: j.customer_name,
      pickup: `${j.pickup_address || ''} ${j.pickup_city || ''}, ${j.pickup_state || ''}`.trim(),
      delivery: `${j.delivery_address || ''} ${j.delivery_city || ''}, ${j.delivery_state || ''}`.trim(),
      deadline: j.deadline || null,
      pieces: j.pieces || null,
      status: j.status,
    }));

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are a professional logistics route optimizer for a same-day courier company based in Chicago, IL.

Given these delivery jobs, determine the most efficient driving sequence to minimize total travel distance and time, while respecting any deadlines.

Jobs:
${JSON.stringify(jobList, null, 2)}

Rules:
- Start from Chicago, IL (1615 N Newland Ave, Chicago, IL 60707)
- For each job, the driver must go to the PICKUP address first, then the DELIVERY address
- Jobs with earlier deadlines should be prioritized
- Minimize backtracking — cluster nearby locations together
- Return the optimized order as an array of job indices

Respond with a JSON object containing:
- "ordered_indices": array of the job indices in optimal sequence (e.g. [2, 0, 1])
- "summary": a brief 1-2 sentence plain-English explanation of the routing logic
- "estimated_total_miles": rough estimate of total miles for the full route`,
      response_json_schema: {
        type: "object",
        properties: {
          ordered_indices: { type: "array", items: { type: "number" } },
          summary: { type: "string" },
          estimated_total_miles: { type: "number" }
        }
      }
    });

    const orderedJobs = result.ordered_indices.map(i => jobs[i]).filter(Boolean);
    // Fallback: if AI returned fewer jobs than input, append any missing ones
    const includedIds = new Set(orderedJobs.map(j => j.id));
    jobs.forEach(j => { if (!includedIds.has(j.id)) orderedJobs.push(j); });

    return Response.json({
      orderedJobs,
      summary: result.summary || "Route optimized.",
      estimated_total_miles: result.estimated_total_miles || null,
    });

  } catch (error) {
    console.error("calculateRoute error:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});