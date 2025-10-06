import React, { useState } from 'react';

export default function CompanyRegistrationForm() {
  const [form, setForm] = useState({ name: '', email: '', provider: '', imap_user: '', imap_password: '' });

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    // POST to your backend API
    await fetch('/api/company/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    // Show success or error
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="name" placeholder="Company Name" onChange={handleChange} required />
      <input name="email" placeholder="Company Email" onChange={handleChange} required />
      <select name="provider" onChange={handleChange} required>
        <option value="">Provider</option>
        <option value="gmail">Gmail</option>
        <option value="outlook">Outlook</option>
        <option value="yahoo">Yahoo</option>
      </select>
      <input name="imap_user" placeholder="IMAP Username" onChange={handleChange} required />
      <input name="imap_password" placeholder="IMAP App Password" type="password" onChange={handleChange} required />
      <button type="submit">Register Company</button>
    </form>
  );
}