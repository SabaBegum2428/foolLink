"use client";

import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CATEGORIES = ["Food", "Clothes", "Money", "Medical Supplies", "Others"];

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [donations, setDonations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'Active' | 'History'>('Active');
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [formCategory, setFormCategory] = useState("Food");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isGarbageInput = (text: string) => {
    if (!text || text.trim().length < 3) return true;
    // Check if it has at least some letters or numbers
    if (!/[a-zA-Z0-9]/.test(text)) return true;
    // Check for excessive repetition (e.g. "aaaaa")
    if (/(.)\1{4,}/.test(text)) return true;
    return false;
  };

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    } else if (user) {
      fetchDonations();
    }
  }, [loading, user, router, selectedFilter]);

  const fetchDonations = async () => {
    const url = selectedFilter === "All" ? "/api/donations" : `/api/donations?category=${selectedFilter}`;
    const res = await fetch(url);
    const data = await res.json();
    setDonations(data || []);
  };

  const activeDonations = donations.filter(d => ['Pending', 'Accepted', 'In Progress', 'In Transit'].includes(d.status));
  const historyDonations = donations.filter(d => ['Delivered', 'Completed'].includes(d.status));
  const displayedDonations = activeTab === 'Active' ? activeDonations : historyDonations;

  const handleCreateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setFormError(null);
    
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);

    const title = fd.get("food_type") as string;
    const description = fd.get("description") as string;
    const quantity = parseFloat(fd.get("quantity") as string);
    const amount = parseFloat(fd.get("amount") as string);
    const expiry = fd.get("expiry") as string;

    // Strict Multi-Category Validation
    if (isGarbageInput(title)) {
      setFormError("Please enter a valid, meaningful title.");
      return;
    }
    if (isGarbageInput(description)) {
      setFormError("Please provide a more detailed description.");
      return;
    }

    if (formCategory === 'Food' || formCategory === 'Medical Supplies') {
      if (expiry) {
        const expiryDate = new Date(expiry);
        if (expiryDate <= new Date()) {
          setFormError(`Expiry for ${formCategory} must be a future date.`);
          return;
        }
      } else {
        setFormError("Expiry date is mandatory.");
        return;
      }

      if (isNaN(quantity) || quantity <= 0) {
        setFormError("Quantity must be a positive number greater than 0.");
        return;
      }
    }

    if (formCategory === 'Money') {
      if (isNaN(amount) || amount <= 0) {
        setFormError("Donation amount must be greater than 0.");
        return;
      }
    }

    setIsSubmitting(true);
    
    fd.append("donor_id", user.id.toString());
    fd.append("pickup_lat", "40.7128");
    fd.append("pickup_lng", "-74.0060");

    try {
      const res = await fetch("/api/donations", {
        method: "POST",
        body: fd,
      });

      if (res.ok) {
          fetchDonations();
          form.reset();
          alert("Donation broadcasted successfully!");
      } else {
          const err = await res.json();
          setFormError(err.error || "Failed to post donation");
      }
    } catch (error) {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptDonation = async (id: number) => {
    if (!user) return;
    await fetch("/api/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        donation_id: id,
        receiver_id: user.id,
      }),
    });
    fetchDonations();
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Food': return '#10b981';
      case 'Clothes': return '#3b82f6';
      case 'Money': return '#f59e0b';
      case 'Medical Supplies': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="flex-column align-center gap-1">
        <div className="loader"></div>
        <p style={{ color: 'var(--primary)', fontWeight: '600' }}>Preparing your humanitarian dashboard...</p>
      </div>
    </div>
  );
  
  if (!user) return null;

  return (
    <div className="dashboard-container">
      {/* Premium Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div>
            <h1 className="welcome-text">
              Welcome, <span className="text-primary">{user.name.split(' ')[0]}</span>
            </h1>
            <p className="subtitle">Together, we're making a difference in the community.</p>
          </div>
          <div className="user-profile-badge">
            <div className="role-indicator">
              <span className="dot"></span>
              {user.role === 'NGO' || user.role === 'Receiver' ? 'NGO / Receiver' : user.role}
            </div>
            <div className="user-info">
              <span className="user-email">{user.email}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="tab-container" style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-border)', paddingBottom: '1.5rem' }}>
        <button 
          className={`filter-btn ${activeTab === 'Active' ? 'active' : ''}`}
          onClick={() => setActiveTab('Active')}
        >
          Active Tracker
        </button>
        <button 
          className={`filter-btn ${activeTab === 'History' ? 'active' : ''}`}
          onClick={() => setActiveTab('History')}
        >
          Past History
        </button>
      </div>

      {/* Global Filter Bar */}
      {activeTab === 'Active' && (
      <div className="filter-bar">
        <span className="filter-label">Filter by Category:</span>
        <div className="filter-options">
          <button 
            className={`filter-btn ${selectedFilter === 'All' ? 'active' : ''}`}
            onClick={() => setSelectedFilter('All')}
          >
            All Items
          </button>
          {CATEGORIES.map(cat => (
            <button 
              key={cat}
              className={`filter-btn ${selectedFilter === cat ? 'active' : ''}`}
              onClick={() => setSelectedFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
      )}

      <div className="dashboard-grid">
        {user.role === "Donor" && activeTab === 'Active' && (
          <>
            {/* Post Donation Section */}
            <div className="main-section">
              <div className="card donation-form-card">
                <div className="card-header">
                  <h2 className="card-title">Initiate a Donation</h2>
                  <p className="card-subtitle">Choose a category and provide details to reach those in need.</p>
                </div>
                
                <form onSubmit={handleCreateDonation} className="donation-form">
                  <div className="grid-cols-2 gap-1-5">
                    <div className="input-group">
                      <label>Donation Category</label>
                      <select 
                        name="category" 
                        className="select" 
                        required 
                        value={formCategory} 
                        onChange={(e) => setFormCategory(e.target.value)}
                      >
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="input-group">
                      <label> {formCategory === 'Money' ? 'Donation Title' : formCategory === 'Food' ? 'Food Item / Title' : 'Item Name / Title'} <span className="required">*</span></label>
                      <input name="food_type" className="input" required placeholder={
                        formCategory === 'Food' ? "e.g. Freshly Baked Bread" :
                        formCategory === 'Clothes' ? "e.g. Winter Coats" :
                        formCategory === 'Money' ? "e.g. Emergency Relief Fund" :
                        formCategory === 'Medical Supplies' ? "e.g. First Aid Kits" :
                        "e.g. Household Goods"
                      } />
                    </div>
                  </div>

                  <div className="input-group">
                    <label>Description</label>
                    <textarea name="description" className="input" required placeholder="Provide details about the condition, quantity, or specifics..." rows={3} />
                  </div>

                  {/* Dynamic Category Specific Fields */}
                  <div className="dynamic-fields-container" style={{ 
                    padding: '1.5rem', 
                    background: 'rgba(5, 150, 105, 0.03)', 
                    borderRadius: '1.25rem', 
                    border: '1px dashed var(--surface-border)',
                    marginBottom: '1rem'
                  }}>
                    {formCategory === 'Food' && (
                      <div className="flex-column gap-1">
                        <div className="grid-cols-2 gap-1-5">
                          <div className="input-group">
                            <label>Quantity (units/lbs) <span className="required">*</span></label>
                            <input type="number" name="quantity" className="input" required placeholder="10" min="1" />
                          </div>
                          <div className="input-group">
                             <label>Expiry Date <span className="required">*</span></label>
                             <input type="date" name="expiry" className="input" required min={new Date().toISOString().split('T')[0]} />
                          </div>
                        </div>
                        <div className="grid-cols-2 gap-1-5">
                          <div className="input-group">
                            <label>Packaging Type</label>
                            <select name="packaging_type" className="select">
                              <option value="Boxed">Boxed</option>
                              <option value="Canned">Canned</option>
                              <option value="Plastic Wrap">Plastic Wrap</option>
                              <option value="Bulk/Loose">Bulk / Loose</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label>Allergies Info <span className="required">*</span></label>
                            <input name="allergens" className="input" required placeholder="e.g. Contains Nuts, Dairy-free" />
                          </div>
                        </div>
                      </div>
                    )}

                    {formCategory === 'Clothes' && (
                      <div className="flex-column gap-1">
                        <div className="grid-cols-2 gap-1-5">
                          <div className="input-group">
                            <label>Clothing Type <span className="required">*</span></label>
                            <select name="clothing_type" className="select" required>
                              <option value="Shirt">Shirt</option>
                              <option value="Pants">Pants</option>
                              <option value="Jacket/Coat">Jacket / Coat</option>
                              <option value="Shoes">Shoes</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label>Size <span className="required">*</span></label>
                            <select name="size" className="select" required>
                              <option value="XS">XS (Extra Small)</option>
                              <option value="S">S (Small)</option>
                              <option value="M">M (Medium)</option>
                              <option value="L">L (Large)</option>
                              <option value="XL">XL (Extra Large)</option>
                              <option value="XXL">XXL (Double Extra Large)</option>
                              <option value="Child/One Size">Child / One Size</option>
                              <option value="Custom">Custom / See Description</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid-cols-2 gap-1-5">
                          <div className="input-group">
                            <label>Gender / Age Group <span className="required">*</span></label>
                            <select name="gender_age" className="select" required>
                              <option value="Men">Men</option>
                              <option value="Women">Women</option>
                              <option value="Unisex">Unisex</option>
                              <option value="Children">Children</option>
                              <option value="Infant">Infant</option>
                            </select>
                          </div>
                          <div className="input-group">
                            <label>Condition <span className="required">*</span></label>
                            <select name="condition" className="select" required>
                              <option value="New with Tags">New with Tags</option>
                              <option value="Excellent">Excellent (Like New)</option>
                              <option value="Good">Good (Slight Wear)</option>
                              <option value="Fair">Fair (Wearable)</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    )}

                    {formCategory === 'Money' && (
                      <div className="grid-cols-2 gap-1-5">
                        <div className="input-group">
                          <label>Amount ($) <span className="required">*</span></label>
                          <input type="number" name="amount" className="input" required placeholder="50.00" min="1" step="0.01" />
                        </div>
                        <div className="input-group">
                          <label>Payment Method <span className="required">*</span></label>
                          <select name="payment_method" className="select" required>
                            <option value="Credit/Debit Card">Credit / Debit Card</option>
                            <option value="PayPal">PayPal</option>
                            <option value="Bank Transfer">Bank Transfer</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {formCategory === 'Medical Supplies' && (
                      <div className="flex-column gap-1">
                        <div className="grid-cols-2 gap-1-5">
                          <div className="input-group">
                            <label>Quantity <span className="required">*</span></label>
                            <input type="number" name="quantity" className="input" required placeholder="5" min="1" />
                          </div>
                          <div className="input-group">
                             <label>Expiry Date <span className="required">*</span></label>
                             <input type="date" name="expiry" className="input" required min={new Date().toISOString().split('T')[0]} />
                          </div>
                        </div>
                        <div className="input-group">
                          <label>Usage Instructions <span className="required">*</span></label>
                          <textarea name="usage_instructions" className="input" required placeholder="e.g. Keep refrigerated, apply once daily..." rows={2} />
                        </div>
                      </div>
                    )}

                    {formCategory === 'Others' && (
                      <div className="grid-cols-2 gap-1-5">
                        <div className="input-group">
                          <label>Quantity <span className="required">*</span></label>
                          <input type="number" name="quantity" className="input" required placeholder="1" min="1" />
                        </div>
                        <div className="input-group">
                           <label>Additional Info (Optional)</label>
                           <input name="extra_info" className="input" placeholder="e.g. fragile, heavy" />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="input-group">
                    <label>Pickup Address <span className="sublabel">({formCategory === 'Money' ? 'Not required for monetary donations' : 'Where items can be collected'})</span></label>
                    <input name="pickup_address" className="input" defaultValue={user.address} required={formCategory !== 'Money'} disabled={formCategory === 'Money'} />
                  </div>

                  <div className="input-group">
                    <label>Visual Proof / Reference (Photo)</label>
                    <div className="file-input-wrapper">
                      <input 
                        type="file" 
                        name="food_image" 
                        accept="image/*" 
                        className="input file-input" 
                        required={['Food', 'Clothes', 'Medical Supplies'].includes(formCategory)} 
                      />
                      <span className="file-hint">
                        {['Food', 'Clothes', 'Medical Supplies'].includes(formCategory) 
                          ? "Required: Helps NGOs verify the condition." 
                          : "Optional: Encouraged for better visibility."}
                      </span>
                    </div>
                  </div>

                  <div className="safety-declaration">
                    <label className="checkbox-label">
                      <input type="checkbox" name="safety_confirmed" required />
                      <span><strong>I confirm</strong> these details are accurate and the donation is safe and hygienically prepared/handled.</span>
                    </label>
                  </div>

                  {formError && (
                    <div className="error-banner" style={{ 
                      padding: '1rem', 
                      background: 'rgba(239, 68, 68, 0.1)', 
                      color: 'var(--danger)', 
                      borderRadius: '1rem', 
                      marginBottom: '1.5rem',
                      fontWeight: '700',
                      border: '1px solid rgba(239, 68, 68, 0.2)'
                    }}>
                      ⚠️ {formError}
                    </div>
                  )}

                  <button type="submit" className="btn btn-primary btn-lg" disabled={isSubmitting}>
                    {isSubmitting ? 'Broadcasting...' : `Broadcast ${formCategory} Donation`}
                  </button>
                </form>
              </div>
            </div>

            {/* Sidebar with Stats and History */}
            <div className="side-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-value">{donations.filter(d => d.donor_id === user.id).length}</span>
                  <span className="stat-label">Total Contributions</span>
                </div>
                <div className="stat-card success">
                  <span className="stat-value">{donations.filter(d => d.donor_id === user.id && d.status === 'Delivered').length}</span>
                  <span className="stat-label">Successful Deliveries</span>
                </div>
              </div>

              <div className="recent-activity">
                <h3 className="section-title">Your Recent Activity</h3>
                <div className="activity-list">
                  {donations.filter(d => d.donor_id === user.id).slice(0, 5).map(d => (
                    <div key={d.id} className="activity-item">
                      <div className="activity-icon" style={{ backgroundColor: `${getCategoryColor(d.category)}20`, color: getCategoryColor(d.category) }}>
                        {d.category[0]}
                      </div>
                      <div className="activity-details">
                        <div className="activity-top">
                          <strong>{d.food_type}</strong>
                          <span className={`status-tag ${d.status.toLowerCase().replace(' ', '-')}`}>{d.status}</span>
                        </div>
                        <p>{d.category} • {new Date(d.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                  {donations.filter(d => d.donor_id === user.id).length === 0 && (
                    <div className="empty-state">No recent activity. Start by donating!</div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {(user.role === "NGO" || user.role === "Receiver" || activeTab === "History") && (
          <div className="full-width-section">
            <div className="content-grid">
              {(user.role === "Donor" ? displayedDonations.filter(d => d.donor_id === user.id) : displayedDonations).map((d) => (
                <div key={d.id} className="donation-card">
                  <div className="card-image">
                    {d.food_image_url ? (
                      <img src={d.food_image_url} alt={d.food_type} />
                    ) : (
                      <div className="image-placeholder">No Image</div>
                    )}
                    <div className="category-badge" style={{ backgroundColor: getCategoryColor(d.category) }}>
                      {d.category}
                    </div>
                  </div>
                  
                  <div className="card-body">
                    <div className="card-top">
                      <h3 className="item-title">{d.food_type}</h3>
                      <span className={`status-badge ${d.status.toLowerCase().replace(' ', '-')}`}>{d.status}</span>
                    </div>
                    
                    <p className="item-desc">{d.description}</p>
                    
                    <div className="item-meta">
                      <div className="meta-row">
                        <span className="meta-label">Quantity:</span>
                        <span className="meta-value">{d.quantity_lbs || 'N/A'}</span>
                      </div>
                      <div className="meta-row">
                        <span className="meta-label">Location:</span>
                        <span className="meta-value truncate">{d.pickup_address}</span>
                      </div>
                    </div>

                    <div className="card-actions">
                      {(user.role === "NGO" || user.role === "Receiver") && d.status === "Pending" && (
                        <button className="btn btn-primary full-width" onClick={() => handleAcceptDonation(d.id)}>
                          Accept & Assign
                        </button>
                      )}
                      {user.role === "Volunteer" && d.status === "Accepted" && (
                        <button className="btn btn-primary full-width" onClick={async () => {
                          await fetch('/api/assignments', { 
                              method: 'PUT', 
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ donation_id: d.id, status: 'Picked Up'})
                          });
                          fetchDonations();
                        }}>
                          Mark as Picked Up
                        </button>
                      )}
                      {user.role === "Volunteer" && (d.status === "In Transit" || d.status === "In Progress") && (
                        <button className="btn btn-secondary full-width" onClick={async () => {
                          await fetch('/api/assignments', { 
                              method: 'PUT',
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ donation_id: d.id, status: 'Delivered'})
                          });
                          fetchDonations();
                        }}>
                          Confirm Delivery
                        </button>
                      )}
                      {(user.role === "NGO" || user.role === "Receiver") && d.status === "Delivered" && (
                        <button className="btn btn-primary full-width" onClick={async () => {
                          await fetch('/api/assignments', { 
                              method: 'PUT',
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ donation_id: d.id, status: 'Completed'})
                          });
                          fetchDonations();
                        }}>
                          Mark as Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {(user.role === "Donor" ? displayedDonations.filter(d => d.donor_id === user.id) : displayedDonations).length === 0 && (
                <div className="empty-state-large">
                  <div className="empty-icon">🌱</div>
                  <h3>No donations found</h3>
                  <p>Check back later or adjust your filters.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 2rem;
          color: var(--text-active);
        }

        .dashboard-header {
          margin-bottom: 2.5rem;
          padding-bottom: 2rem;
          border-bottom: 1px solid var(--surface-border);
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .welcome-text {
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
        }

        .text-primary { color: var(--primary); }

        .subtitle {
          color: var(--text-muted);
          font-size: 1.1rem;
        }

        .user-profile-badge {
          background: white;
          padding: 0.75rem 1.5rem;
          border-radius: 1.25rem;
          box-shadow: var(--card-shadow);
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          border: 1px solid var(--surface-border);
        }

        .role-indicator {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 0.9rem;
          color: var(--primary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dot {
          width: 8px;
          height: 8px;
          background: var(--primary);
          border-radius: 50%;
          display: inline-block;
        }

        .user-email {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 500;
        }

        .required {
          color: var(--danger);
          font-weight: 900;
          margin-left: 0.25rem;
        }

        .sublabel {
          font-weight: 400;
          font-size: 0.8rem;
          color: var(--text-dim);
          font-style: italic;
        }

        .filter-bar {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          margin-bottom: 3rem;
          flex-wrap: wrap;
        }

        .filter-label {
          font-weight: 700;
          color: var(--text-active);
          font-size: 0.95rem;
        }

        .filter-options {
          display: flex;
          gap: 0.75rem;
        }

        .filter-btn {
          padding: 0.6rem 1.25rem;
          border-radius: 999px;
          border: 1px solid var(--surface-border);
          background: white;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.2s ease;
          color: var(--text-muted);
        }

        .filter-btn:hover {
          border-color: var(--primary);
          color: var(--primary);
          background: var(--background);
        }

        .filter-btn.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.2);
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 2.5rem;
        }

        .full-width-section {
          grid-column: 1 / -1;
        }

        .card {
          background: white;
          border-radius: 2rem;
          padding: 2.5rem;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--surface-border);
        }

        .card-header {
          margin-bottom: 2rem;
        }

        .card-title {
          font-size: 1.8rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: var(--text-active);
        }

        .card-subtitle {
          color: var(--text-muted);
          font-size: 0.95rem;
        }

        .donation-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .input-group label {
          display: block;
          font-weight: 700;
          margin-bottom: 0.6rem;
          font-size: 0.9rem;
          color: var(--text-active);
        }

        .input, .select, textarea {
          padding: 1rem 1.25rem;
          border-radius: 1rem;
          border: 1px solid var(--surface-border);
          background: #f9fafb;
          width: 100%;
          font-family: inherit;
          font-size: 1rem;
          transition: all 0.2s ease;
        }

        .input:focus, .select:focus, textarea:focus {
          outline: none;
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(5, 150, 105, 0.1);
        }

        .file-input-wrapper {
          position: relative;
        }

        .file-input {
          padding: 0.75rem;
          font-size: 0.9rem;
        }

        .file-hint {
          display: block;
          font-size: 0.8rem;
          color: var(--text-dim);
          margin-top: 0.4rem;
        }

        .safety-declaration {
          background: #fef2f2;
          padding: 1.25rem;
          border-radius: 1.25rem;
          border: 1px solid #fee2e2;
        }

        .checkbox-label {
          display: flex;
          gap: 1rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: #991b1b;
        }

        .checkbox-label input {
          width: 18px;
          height: 18px;
          accent-color: var(--primary);
        }

        .btn {
          padding: 1rem 2rem;
          border-radius: 1.25rem;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          font-size: 1rem;
          display: inline-flex;
          justify-content: center;
          align-items: center;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
          box-shadow: 0 8px 20px -6px rgba(5, 150, 105, 0.4);
        }

        .btn-primary:hover {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(5, 150, 105, 0.5);
        }

        .btn-lg {
          padding: 1.25rem 2rem;
          font-size: 1.1rem;
        }

        .full-width { width: 100%; }

        .stat-card {
          background: white;
          padding: 2rem;
          border-radius: 2rem;
          box-shadow: var(--card-shadow);
          text-align: center;
          border: 1px solid var(--surface-border);
          margin-bottom: 1.5rem;
        }

        .stat-card.success {
          background: #ecfdf5;
          border-color: #d1fae5;
        }

        .stat-value {
          display: block;
          font-size: 3rem;
          font-weight: 900;
          color: var(--primary);
          line-height: 1;
          margin-bottom: 0.5rem;
        }

        .stat-label {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .section-title {
          font-size: 1.25rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
          padding-left: 0.5rem;
        }

        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .activity-item {
          background: white;
          padding: 1.25rem;
          border-radius: 1.5rem;
          display: flex;
          gap: 1.25rem;
          align-items: center;
          border: 1px solid var(--surface-border);
          transition: transform 0.2s ease;
        }

        .activity-item:hover {
          transform: translateX(5px);
          border-color: var(--primary);
        }

        .activity-icon {
          width: 48px;
          height: 48px;
          border-radius: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 900;
        }

        .activity-details {
          flex: 1;
          overflow: hidden;
        }

        .activity-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.25rem;
        }

        .activity-details p {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .status-tag {
          padding: 0.25rem 0.75rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .status-tag.pending { background: #fff7ed; color: #9a3412; }
        .status-tag.delivered { background: #f0fdf4; color: #166534; }
        .status-tag.accepted { background: #eff6ff; color: #1e40af; }

        .content-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 2rem;
        }

        .donation-card {
          background: white;
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: var(--card-shadow);
          border: 1px solid var(--surface-border);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .donation-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px -15px rgba(5, 150, 105, 0.1);
        }

        .card-image {
          height: 200px;
          position: relative;
        }

        .card-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .category-badge {
          position: absolute;
          top: 1rem;
          right: 1rem;
          padding: 0.5rem 1rem;
          border-radius: 1rem;
          color: white;
          font-size: 0.8rem;
          font-weight: 800;
          box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        }

        .card-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .card-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1rem;
        }

        .item-title {
          font-size: 1.25rem;
          font-weight: 800;
          line-height: 1.2;
        }

        .item-desc {
          font-size: 0.9rem;
          color: var(--text-muted);
          margin-bottom: 1.5rem;
        }

        .item-meta {
          background: #f9fafb;
          padding: 1rem;
          border-radius: 1.25rem;
          margin-bottom: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .meta-row {
          display: flex;
          justify-content: space-between;
          font-size: 0.85rem;
        }

        .meta-label {
          color: var(--text-dim);
          font-weight: 600;
        }

        .meta-value {
          color: var(--text-active);
          font-weight: 700;
        }

        .truncate {
          word-break: break-word;
        }

        .loader {
          width: 48px;
          height: 48px;
          border: 5px solid var(--background);
          border-bottom-color: var(--primary);
          border-radius: 50%;
          animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        @media (max-width: 1024px) {
          .dashboard-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 768px) {
          .welcome-text { font-size: 2rem; }
          .dashboard-container { padding: 1rem; }
          .grid-cols-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
