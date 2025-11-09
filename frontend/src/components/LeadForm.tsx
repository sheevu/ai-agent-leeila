import { useState } from "react";

interface LeadFormProps {
  params?: Record<string, unknown>;
}

export function LeadForm({ params }: LeadFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    businessType: "",
    city: "",
    preferredContact: (params?.intent as string) || "callback",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.table(formData);
    setSubmitted(true);
  };

  return (
    <div className="widget-card">
      <h3>Talk to Sudarshan Team</h3>
      <form className="lead-form" onSubmit={handleSubmit}>
        <label>
          Full Name
          <input name="name" value={formData.name} onChange={handleChange} required />
        </label>
        <label>
          Phone Number
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            pattern="[0-9]{10}"
            placeholder="10 digit mobile"
            required
          />
        </label>
        <label>
          Business Type
          <input name="businessType" value={formData.businessType} onChange={handleChange} />
        </label>
        <label>
          City / Town
          <input name="city" value={formData.city} onChange={handleChange} />
        </label>
        <label>
          Preferred Contact Mode
          <select name="preferredContact" value={formData.preferredContact} onChange={handleChange}>
            <option value="callback">Call back</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="demo">Live demo</option>
          </select>
        </label>
        <button type="submit">Submit lead</button>
        {submitted && <p className="lead-success">Shukriya! Team aapse jaldi sampark karegi.</p>}
      </form>
    </div>
  );
}

export default LeadForm;
