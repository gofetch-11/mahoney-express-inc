import { useState, useEffect } from "react";
import { Job, Customer, Driver } from "@/api/entities";
import { Truck, Save, Printer, ArrowLeft, Plus } from "lucide-react";

const SERVICES = ["Rush / Hot Shot", "Standard Delivery", "Scheduled", "Airport Run", "Medical / Stat", "Overnight", "Other"];
const STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

function genJobNumber() {
  const d = new Date();
  return `ME${d.getFullYear().toString().slice(2)}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;
}

function genBOL() {
  return `BOL-${Date.now().toString().slice(-8)}`;
}

export default function NewJob() {
  const [customers, setCustomers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(null);
  const [showBOL, setShowBOL] = useState(false);

  const [form, setForm] = useState({
    job_number: genJobNumber(),
    bol_number: genBOL(),
    customer_id: "", customer_name: "",
    service_type: "Rush / Hot Shot",
    pickup_address: "", pickup_city: "", pickup_state: "IL", pickup_zip: "", pickup_contact: "", pickup_phone: "",
    delivery_address: "", delivery_city: "", delivery_state: "IL", delivery_zip: "", delivery_contact: "", delivery_phone: "",
    pieces: "", weight_lbs: "", description: "", special_instructions: "",
    miles: "", ready_time: "", deadline: "",
    status: "Pending",
    driver_id: "", driver_name: "",
    bill_rate: "", driver_pay: "",
    reference_number: "", notes: "",
  });

  useEffect(() => {
    Customer.filter({ status: "Active" }).then(setCustomers);
    Driver.filter({ status: "Active" }).then(setDrivers);
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleCustomer = (id) => {
    const c = customers.find(x => x.id === id);
    if (c) { set("customer_id", id); set("customer_name", c.company_name); }
  };

  const handleDriver = (id) => {
    const d = drivers.find(x => x.id === id);
    if (d) {
      set("driver_id", id);
      set("driver_name", `${d.first_name} ${d.last_name}`);
      // Auto-calc driver pay
      if (d.pay_type === "Per Mile" && form.miles) set("driver_pay", (d.pay_rate * parseFloat(form.miles)).toFixed(2));
      if (d.pay_type === "Per Job") set("driver_pay", d.pay_rate);
      if (d.pay_type === "Percentage" && form.bill_rate) set("driver_pay", (d.pay_rate / 100 * parseFloat(form.bill_rate)).toFixed(2));
    }
  };

  const save = async (andBOL = false) => {
    setSaving(true);
    const data = { ...form };
    ["pieces","weight_lbs","miles","bill_rate","driver_pay"].forEach(k => { if (data[k]) data[k] = parseFloat(data[k]); });
    if (data.driver_id) data.status = "Assigned";
    const job = await Job.create(data);
    setSaved(job);
    setSaving(false);
    if (andBOL) setShowBOL(true);
  };

  if (showBOL && saved) return <BOLView job={saved} onBack={() => setShowBOL(false)} />;

  return (
    <div className="min-h-screen bg-gray-50 p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <a href="/" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-500" />
        </a>
        <div>
          <h1 className="text-xl font-bold text-gray-900">New Job Order</h1>
          <p className="text-sm text-gray-500">Job #{form.job_number} · BOL: {form.bol_number}</p>
        </div>
      </div>

      {saved && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">✓ Job saved successfully!</span>
          <div className="flex gap-2">
            <button onClick={() => { setSaved(null); setForm({...form, job_number: genJobNumber(), bol_number: genBOL()}); }} className="text-sm bg-white border border-green-300 px-3 py-1 rounded-lg hover:bg-green-50">New Job</button>
            <button onClick={() => setShowBOL(true)} className="text-sm bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 flex items-center gap-1"><Printer className="w-3 h-3" />Print BOL</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Service */}
          <Section title="Order Details">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Customer</label>
                <select className="input" value={form.customer_id} onChange={e => handleCustomer(e.target.value)}>
                  <option value="">Select customer...</option>
                  {customers.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
                </select>
                <p className="text-xs text-gray-400 mt-1">Don't see them? <a href="/customers" className="text-red-600">Add a customer first</a></p>
              </div>
              <div>
                <label className="label">Service Type</label>
                <select className="input" value={form.service_type} onChange={e => set("service_type", e.target.value)}>
                  {SERVICES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reference #</label>
                <input className="input" placeholder="Customer PO / ref" value={form.reference_number} onChange={e => set("reference_number", e.target.value)} />
              </div>
              <div>
                <label className="label">Ready Time</label>
                <input className="input" type="datetime-local" value={form.ready_time} onChange={e => set("ready_time", e.target.value)} />
              </div>
              <div>
                <label className="label">Deadline / Due By</label>
                <input className="input" type="datetime-local" value={form.deadline} onChange={e => set("deadline", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Pickup */}
          <Section title="📍 Pickup Information">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" placeholder="Street address" value={form.pickup_address} onChange={e => set("pickup_address", e.target.value)} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="City" value={form.pickup_city} onChange={e => set("pickup_city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">State</label>
                  <select className="input" value={form.pickup_state} onChange={e => set("pickup_state", e.target.value)}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ZIP</label>
                  <input className="input" placeholder="ZIP" value={form.pickup_zip} onChange={e => set("pickup_zip", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Contact Name</label>
                <input className="input" placeholder="Contact" value={form.pickup_contact} onChange={e => set("pickup_contact", e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="Phone" value={form.pickup_phone} onChange={e => set("pickup_phone", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Delivery */}
          <Section title="🎯 Delivery Information">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Address</label>
                <input className="input" placeholder="Street address" value={form.delivery_address} onChange={e => set("delivery_address", e.target.value)} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" placeholder="City" value={form.delivery_city} onChange={e => set("delivery_city", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="label">State</label>
                  <select className="input" value={form.delivery_state} onChange={e => set("delivery_state", e.target.value)}>
                    {STATES.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">ZIP</label>
                  <input className="input" placeholder="ZIP" value={form.delivery_zip} onChange={e => set("delivery_zip", e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Contact Name</label>
                <input className="input" placeholder="Contact" value={form.delivery_contact} onChange={e => set("delivery_contact", e.target.value)} />
              </div>
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="Phone" value={form.delivery_phone} onChange={e => set("delivery_phone", e.target.value)} />
              </div>
            </div>
          </Section>

          {/* Freight */}
          <Section title="📦 Freight Details">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Pieces</label>
                <input className="input" type="number" placeholder="0" value={form.pieces} onChange={e => set("pieces", e.target.value)} />
              </div>
              <div>
                <label className="label">Weight (lbs)</label>
                <input className="input" type="number" placeholder="0" value={form.weight_lbs} onChange={e => set("weight_lbs", e.target.value)} />
              </div>
              <div>
                <label className="label">Miles</label>
                <input className="input" type="number" placeholder="0" value={form.miles} onChange={e => set("miles", e.target.value)} />
              </div>
              <div className="col-span-3">
                <label className="label">Commodity / Description</label>
                <input className="input" placeholder="What's being shipped?" value={form.description} onChange={e => set("description", e.target.value)} />
              </div>
              <div className="col-span-3">
                <label className="label">Special Instructions</label>
                <textarea className="input" rows={2} placeholder="Handling notes, gate codes, etc." value={form.special_instructions} onChange={e => set("special_instructions", e.target.value)} />
              </div>
            </div>
          </Section>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Dispatch */}
          <Section title="🚛 Dispatch">
            <div className="space-y-3">
              <div>
                <label className="label">Assign Driver</label>
                <select className="input" value={form.driver_id} onChange={e => handleDriver(e.target.value)}>
                  <option value="">Unassigned</option>
                  {drivers.map(d => <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>)}
                </select>
              </div>
            </div>
          </Section>

          {/* Rates */}
          <Section title="💰 Rates">
            <div className="space-y-3">
              <div>
                <label className="label">Bill Rate ($)</label>
                <input className="input" type="number" placeholder="0.00" value={form.bill_rate} onChange={e => set("bill_rate", e.target.value)} />
              </div>
              <div>
                <label className="label">Driver Pay ($)</label>
                <input className="input" type="number" placeholder="0.00" value={form.driver_pay} onChange={e => set("driver_pay", e.target.value)} />
              </div>
              {form.bill_rate && form.driver_pay && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Bill Rate</span>
                    <span className="font-medium">${parseFloat(form.bill_rate || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Driver Pay</span>
                    <span className="font-medium text-red-600">-${parseFloat(form.driver_pay || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold mt-2 pt-2 border-t border-gray-200">
                    <span>Margin</span>
                    <span className="text-green-600">${(parseFloat(form.bill_rate||0) - parseFloat(form.driver_pay||0)).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </Section>

          {/* Notes */}
          <Section title="Notes">
            <textarea className="input" rows={4} placeholder="Internal notes..." value={form.notes} onChange={e => set("notes", e.target.value)} />
          </Section>

          {/* Actions */}
          <div className="space-y-2">
            <button onClick={() => save(false)} disabled={saving} className="w-full bg-red-600 text-white py-3 rounded-xl font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Job"}
            </button>
            <button onClick={() => save(true)} disabled={saving} className="w-full bg-gray-800 text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Printer className="w-4 h-4" />
              Save & Print BOL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
      <h3 className="font-semibold text-gray-700 mb-4 text-sm uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  );
}

function BOLView({ job, onBack }) {
  return (
    <div className="min-h-screen bg-white p-8 max-w-3xl mx-auto">
      <div className="flex justify-between mb-6 print:hidden">
        <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900"><ArrowLeft className="w-4 h-4" />Back</button>
        <button onClick={() => window.print()} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"><Printer className="w-4 h-4" />Print</button>
      </div>

      <div className="border-2 border-gray-800 rounded">
        {/* Header */}
        <div className="bg-red-600 text-white p-5 flex items-center justify-between rounded-t">
          <div>
            <h1 className="text-2xl font-black">MAHONEY EXPRESS, INC.</h1>
            <p className="text-red-200 text-sm">Time-Critical Messenger & Delivery Services</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-red-200">BILL OF LADING</p>
            <p className="text-2xl font-black">{job.bol_number}</p>
          </div>
        </div>

        {/* Job Info */}
        <div className="p-5 grid grid-cols-3 gap-4 border-b border-gray-300 bg-gray-50">
          <BOLField label="Job Number" value={job.job_number} />
          <BOLField label="Service Type" value={job.service_type} />
          <BOLField label="Reference #" value={job.reference_number || "—"} />
          <BOLField label="Ready Time" value={job.ready_time ? new Date(job.ready_time).toLocaleString() : "—"} />
          <BOLField label="Deadline" value={job.deadline ? new Date(job.deadline).toLocaleString() : "—"} />
          <BOLField label="Driver" value={job.driver_name || "Unassigned"} />
        </div>

        {/* Shipper / Consignee */}
        <div className="grid grid-cols-2 border-b border-gray-300">
          <div className="p-5 border-r border-gray-300">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">SHIPPER / PICKUP</p>
            <p className="font-semibold">{job.customer_name}</p>
            <p className="text-sm text-gray-700">{job.pickup_address}</p>
            <p className="text-sm text-gray-700">{job.pickup_city}, {job.pickup_state} {job.pickup_zip}</p>
            {job.pickup_contact && <p className="text-sm text-gray-500 mt-2">Attn: {job.pickup_contact}</p>}
            {job.pickup_phone && <p className="text-sm text-gray-500">📞 {job.pickup_phone}</p>}
          </div>
          <div className="p-5">
            <p className="text-xs font-bold text-gray-500 uppercase mb-2">CONSIGNEE / DELIVERY</p>
            <p className="text-sm text-gray-700">{job.delivery_address}</p>
            <p className="text-sm text-gray-700">{job.delivery_city}, {job.delivery_state} {job.delivery_zip}</p>
            {job.delivery_contact && <p className="text-sm text-gray-500 mt-2">Attn: {job.delivery_contact}</p>}
            {job.delivery_phone && <p className="text-sm text-gray-500">📞 {job.delivery_phone}</p>}
          </div>
        </div>

        {/* Freight */}
        <div className="p-5 border-b border-gray-300">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">FREIGHT DETAILS</p>
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-200">
              <th className="text-left pb-2 text-gray-600">Pieces</th>
              <th className="text-left pb-2 text-gray-600">Weight (lbs)</th>
              <th className="text-left pb-2 text-gray-600">Miles</th>
              <th className="text-left pb-2 text-gray-600">Description</th>
            </tr></thead>
            <tbody><tr>
              <td className="py-2 font-medium">{job.pieces || "—"}</td>
              <td className="py-2 font-medium">{job.weight_lbs || "—"}</td>
              <td className="py-2 font-medium">{job.miles || "—"}</td>
              <td className="py-2">{job.description || "—"}</td>
            </tr></tbody>
          </table>
          {job.special_instructions && (
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded p-3">
              <p className="text-xs font-bold text-yellow-700 uppercase mb-1">Special Instructions</p>
              <p className="text-sm text-gray-700">{job.special_instructions}</p>
            </div>
          )}
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 p-5 gap-8">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-6">Shipper Signature</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Signature / Date</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-6">Driver Signature</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Signature / Date</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-6">Delivered By</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Signature / Date</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase mb-6">Received By</p>
            <div className="border-b border-gray-400 mb-1" />
            <p className="text-xs text-gray-400">Signature / Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BOLField({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase font-semibold">{label}</p>
      <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
    </div>
  );
}
