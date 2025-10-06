"use client";

import React, { useState } from "react";
import { createCompanyWithAdmin } from "@/app/admin/actions"; // Adjust path as needed

type CompanyFormData = {
  name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_sender_id: string;
  imap_user: string;
  imap_password: string;
  imap_server: string;
  imap_port: string;
};

type RegisterCompanyFormProps = {
  loading?: boolean;
};

export default function RegisterCompanyForm({ loading }: RegisterCompanyFormProps) {
  const [form, setForm] = useState<CompanyFormData>({
    name: "",
    contact_email: "",
    contact_phone: "",
    whatsapp_sender_id: "",
    imap_user: "",
    imap_password: "",
    imap_server: "",
    imap_port: "993",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateField(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) => fd.append(key, String(value ?? "")));
      await createCompanyWithAdmin(fd);
      setSuccess(true);
      setForm({
        name: "",
        contact_email: "",
        contact_phone: "",
        whatsapp_sender_id: "",
        imap_user: "",
        imap_password: "",
        imap_server: "",
        imap_port: "993",
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create company");
      setSuccess(false);
    }
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} style={{
      maxWidth: 400,
      margin: "0 auto",
      padding: 24,
      background: "#fff",
      borderRadius: 8,
      boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
    }}>
      <h2 style={{ marginBottom: 16, textAlign: "center" }}>Register Company</h2>
      {success && <div style={{ color: "green", marginBottom: 8, textAlign: "center" }}>Company created successfully!</div>}
      {error && <div style={{ color: "red", marginBottom: 8, textAlign: "center" }}>{error}</div>}
      
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Company name</label>
        <input name="name" value={form.name} onChange={updateField} required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Contact email</label>
        <input name="contact_email" type="email" value={form.contact_email} onChange={updateField} required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>Phone number</label>
        <input name="contact_phone" value={form.contact_phone} onChange={updateField} style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>WhatsApp number</label>
        <input name="whatsapp_sender_id" value={form.whatsapp_sender_id} onChange={updateField} style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <hr style={{ margin: "20px 0" }} />
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>IMAP server</label>
        <input name="imap_server" value={form.imap_server} onChange={updateField} placeholder="imap.gmail.com" required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>IMAP port</label>
        <input name="imap_port" value={form.imap_port} onChange={updateField} placeholder="993" required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>IMAP username</label>
        <input name="imap_user" value={form.imap_user} onChange={updateField} required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: "block", marginBottom: 4 }}>IMAP app password</label>
        <input name="imap_password" type="password" value={form.imap_password} onChange={updateField} required style={{ width: "100%", padding: "8px", borderRadius: 4, border: "1px solid #e5e7eb" }} />
      </div>
      <button type="submit" disabled={loading || submitting} style={{
        width: "100%",
        padding: "10px",
        borderRadius: 4,
        border: "none",
        background: "#2563eb",
        color: "#fff",
        fontWeight: "bold",
        fontSize: 16,
        cursor: loading || submitting ? "not-allowed" : "pointer"
      }}>
        {submitting ? "Creating..." : "Create company"}
      </button>
    </form>
  );
}