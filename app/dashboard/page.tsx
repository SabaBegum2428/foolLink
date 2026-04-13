"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDonations();
    }
  }, [loading, user, router]);

  const fetchDonations = async () => {
    const res = await fetch("/api/donations");
    const data = await res.json();
    setDonations(data || []);
  };

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    
    // Add donor_id and dynamic coordinates
    fd.append("donor_id", user.id.toString());
    fd.append("pickup_lat", "40.7128");
    fd.append("pickup_lng", "-74.0060");

    const res = await fetch("/api/donations", {
      method: "POST",
      body: fd, // Send as FormData for file upload
    });

    if (res.ok) {
        fetchDonations();
        form.reset();
    } else {
        const err = await res.json();
        alert(err.error || "Failed to post donation");
    }
  };

  const handleAcceptDonation = async (id: number) => {
    if (!user) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donation_id: id,
        receiver_id: user.id, // For demo, assuming whoever clicks this acts as the receiver/NGO point
      }),
    });
    fetchDonations();
  };

  if (loading) return <div style={{ textAlign: "center", padding: "3rem" }}>Loading dashboard...</div>;
  if (!user) return null;

  return (
    <div style={{ paddingTop: '1rem' }}>
      <header style={{ marginBottom: '4rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '3rem', fontWeight: '900', marginBottom: '0.75rem' }} className="text-gradient">
          Welcome back, {user.name.split(' ')[0]}!
        </h1>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
          <span className="badge badge-success" style={{ padding: '0.5rem 1.25rem' }}>{user.role} Account</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{user.email}</span>
        </div>
      </header>

      {user.role === "Donor" && (
        <div className="grid-cols-2">
          {/* Post Donation Form */}
          <div className="card">
            <h2 className="title">Post a New Donation</h2>
            <form onSubmit={handleCreateDonation} className="flex-column gap-1">
              <div className="input-group">
                <label>Food Item Title</label>
                <input name="food_type" className="input" required placeholder="e.g. Freshly Baked Bread" />
              </div>

              <div className="input-group">
                <label>Description</label>
                <textarea name="description" className="input" required placeholder="Describe quantity, type, and source..." rows={3} />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="input-group">
                  <label>Quantity (lbs)</label>
                  <input type="number" name="quantity" className="input" required placeholder="10" />
                </div>
                <div className="input-group">
                  <label>Expiry Time</label>
                  <input type="datetime-local" name="expiry" className="input" required />
                </div>
              </div>

              <div className="input-group">
                <label>Pickup Address</label>
                <input name="pickup_address" className="input" defaultValue={user.address} required />
              </div>

              <div className="grid-cols-2" style={{ gap: '1rem' }}>
                <div className="input-group">
                  <label>Prep Type</label>
                  <select name="prep_type" className="select">
                    <option value="Homemade">Homemade</option>
                    <option value="Restaurant">Restaurant</option>
                    <option value="Packaged">Packaged</option>
                  </select>
                </div>
                <div className="input-group">
                  <label>Storage</label>
                  <select name="storage_type" className="select">
                    <option value="Room temperature">Room temperature</option>
                    <option value="Refrigerated">Refrigerated</option>
                  </select>
                </div>
              </div>

              <div className="input-group">
                <label>Food Photo (JPG/PNG)</label>
                <input type="file" name="food_image" accept="image/*" required className="input" style={{ padding: '0.6rem' }} />
              </div>

              <div className="input-group">
                <label>Allergens (Comma separated)</label>
                <input name="allergens" className="input" required placeholder="e.g. Nuts, Dairy" />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', margin: '0.5rem 0' }}>
                <input type="checkbox" name="is_veg" defaultChecked style={{ transform: 'scale(1.2)' }} />
                <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Pure Vegetarian Food</span>
              </label>

              <div style={{ backgroundColor: 'rgba(244, 63, 94, 0.05)', padding: '1.25rem', borderRadius: '1rem', border: '1px solid rgba(244, 63, 94, 0.1)' }}>
                <label style={{ display: 'flex', gap: '0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--danger)' }}>
                  <input type="checkbox" name="safety_confirmed" required style={{ marginTop: '0.2rem' }} />
                  <span><strong>Safety Declaration:</strong> I confirm this food is safe, prepared hygienically, and I accept full responsibility.</span>
                </label>
              </div>

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Broadcast Donation
              </button>
            </form>
          </div>

          {/* Stats and History */}
          <div className="flex-column gap-2">
             <div className="grid-cols-2" style={{ gap: '1.5rem' }}>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--primary)' }}>{donations.filter(d => d.donor_id === user.id).length}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Posts</div>
                </div>
                <div className="card" style={{ padding: '1.5rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--success)' }}>{donations.filter(d => d.donor_id === user.id && d.status === 'Delivered').length}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>Completions</div>
                </div>
             </div>

             <h2 className="title" style={{ marginBottom: '1rem' }}>Active History</h2>
             {donations.filter(d => d.donor_id === user.id).length === 0 ? (
                 <div className="card" style={{ textAlign: 'center', color: 'var(--text-dim)', borderStyle: 'dashed' }}>
                   No donations yet. Use the form to broadcast one!
                 </div>
             ) : (
                 <div className="flex-column gap-1">
                    {donations.filter(d => d.donor_id === user.id).map(d => (
                        <div key={d.id} className="card" style={{ padding: "1.25rem", display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                            {d.food_image_url && (
                                <img src={d.food_image_url} alt={d.food_type} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '1rem' }} />
                            )}
                            <div style={{ flexGrow: 1 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <strong style={{ fontSize: '1.1rem' }}>{d.food_type}</strong>
                                    <span className={d.status === 'Delivered' ? 'badge badge-success' : d.status === 'Pending' ? 'badge badge-pending' : 'badge badge-accepted'}>
                                        {d.status}
                                    </span>
                                </div>
                                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{d.quantity_lbs} lbs • {d.storage_type}</p>
                            </div>
                        </div>
                    ))}
                 </div>
             )}
          </div>
        </div>
      )}

      {user.role === "NGO" && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '2rem' }}>
          {donations.map((d) => (
            <div key={d.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              {d.food_image_url && (
                <div style={{ position: 'relative', height: '220px' }}>
                  <img src={d.food_image_url} alt={d.food_type} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, var(--background), transparent)' }}></div>
                  <span style={{ position: 'absolute', bottom: '1rem', right: '1rem' }} className="badge badge-pending">{d.status}</span>
                </div>
              )}
              <div style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: "800" }}>{d.food_type}</h3>
                    <span style={{ color: 'var(--primary)', fontWeight: '800' }}>{d.quantity_lbs} lbs</span>
                </div>
                
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '1rem', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    <div style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-dim)' }}>Pickup: </span> {d.pickup_address}</div>
                    <div style={{ marginBottom: '0.5rem' }}><span style={{ color: 'var(--text-dim)' }}>Donor: </span> {d.donor_name}</div>
                    <div><span style={{ color: 'var(--danger)', fontWeight: '700' }}>Allergens: </span> {d.allergens}</div>
                </div>

                {d.status === "Pending" && (
                    <button 
                    className="btn btn-primary" 
                    onClick={() => handleAcceptDonation(d.id)}
                    style={{ width: '100%' }}
                    >
                      Assume Responsibility & Assign
                    </button>
                )}
              </div>
            </div>
          ))}
          {donations.length === 0 && <div className="card" style={{ textAlign: "center", gridColumn: '1/-1', color: 'var(--text-dim)', borderStyle: 'dashed' }}>No active donations on the network.</div>}
        </div>
      )}

      {user.role === "Volunteer" && (
        <div className="flex-column gap-2">
          {donations.filter(d => ['Accepted', 'In Transit'].includes(d.status)).map((d) => (
            <div key={d.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {d.food_image_url && (
                    <img src={d.food_image_url} alt={d.food_type} style={{ width: '250px', objectFit: 'cover' }} />
                )}
                <div style={{ padding: '2rem', flex: 1, minWidth: '300px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                      <span className="badge badge-accepted">Active Task</span>
                      <span className="badge badge-success">{d.status}</span>
                    </div>
                    
                    <h3 style={{ fontSize: '1.75rem', fontWeight: "800", marginBottom: "0.5rem" }}>{d.food_type}</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{d.quantity_lbs} lbs • {d.prep_type} • {d.storage_type}</p>
                    
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.25rem', borderRadius: '1rem', marginBottom: '2rem' }}>
                        <div style={{ marginBottom: '0.5rem' }}><strong style={{ color: 'var(--text-dim)' }}>FROM:</strong> {d.pickup_address}</div>
                        <div><strong style={{ color: 'var(--danger)' }}>ALLERGENS:</strong> {d.allergens}</div>
                    </div>

                    {d.status === "Accepted" && (
                        <button className="btn btn-primary" onClick={async () => {
                        await fetch('/api/assignments', { 
                            method: 'PUT', 
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ donation_id: d.id, status: 'Picked Up'})
                        });
                        fetchDonations();
                        }} style={{ width: '100%' }}>
                        Confirm Item Collection
                        </button>
                    )}
                    {d.status === "In Transit" && (
                        <button className="btn btn-secondary" onClick={async () => {
                        await fetch('/api/assignments', { 
                            method: 'PUT',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ donation_id: d.id, status: 'Delivered'})
                        });
                        fetchDonations();
                        }} style={{ width: '100%', border: '2px solid var(--success)', color: 'var(--success)' }}>
                         Mark as Successfully Delivered
                        </button>
                    )}
                </div>
              </div>
            </div>
          ))}
          {donations.filter(d => ['Accepted', 'In Transit'].includes(d.status)).length === 0 && (
             <div className="card" style={{ textAlign: "center", color: 'var(--text-dim)', borderStyle: 'dashed', padding: '5rem' }}>
               No active delivery assignments. NGO assignments will appear here as they are created.
             </div>
          )}
        </div>
      )}

      {user.role === "Receiver" && (
        <div className="card">
          <h2 className="title">Expected Deliveries</h2>
          <div className="flex-column gap-1">
            {donations.filter(d => ['Accepted', 'In Transit', 'Delivered'].includes(d.status)).map(d => (
              <div key={d.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', background: 'rgba(0,0,0,0.2)' }}>
                {d.food_image_url && <img src={d.food_image_url} alt={d.food_type} style={{ width: '80px', height: '80px', borderRadius: '1rem', objectFit: 'cover' }} />}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <strong style={{ fontSize: '1.25rem' }}>{d.food_type}</strong>
                        <span className={d.status === 'Delivered' ? 'badge badge-success' : 'badge badge-accepted'}>{d.status}</span>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                      Safety Info: {d.allergens ? `Contains ${d.allergens}` : 'No known allergens reported.'}
                    </p>
                </div>
              </div>
            ))}
            {donations.filter(d => ['Accepted', 'In Transit', 'Delivered'].includes(d.status)).length === 0 && (
                <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>No incoming food deliveries at the moment.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
