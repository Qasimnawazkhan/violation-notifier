"use client";

import React, { useState } from "react";
import { createCompanyWithAdmin } from "@/app/admin/actions"; // Adjust path as needed

type CompanyFormData = {
  name: string;
  contact_email: string;
  contact_phone: string;
  whatsapp_sender_id: string;
  imap_server?: string;
  imap_port?: string;
  imap_user: string;
  imap_password: string;
  username: string;
  password: string;
};

const initialForm: CompanyFormData = {
  name: "",
  contact_email: "",
  contact_phone: "",
  whatsapp_sender_id: "",
  imap_server: "",
  imap_port: "993",
  imap_user: "",
  imap_password: "",
  username: "",
  password: "",
};

function validate(form: CompanyFormData) {
  const errors: string[] = [];
  if (!form.name.trim()) errors.push("Company name is required.");
  if (!form.contact_email.trim()) errors.push("Contact email is required.");
  if (
    form.contact_email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email)
  )
    errors.push("Contact email format is invalid.");
  if (form.contact_phone && !/^\+?\d{7,}$/.test(form.contact_phone))
    errors.push("Phone number format is invalid.");
  if (form.imap_port && isNaN(Number(form.imap_port)))
    errors.push("IMAP port must be a number.");
  if (!form.imap_user.trim())
    errors.push("IMAP username is required.");
  if (!form.imap_password.trim())
    errors.push("IMAP app password is required.");
  if (form.username && form.username.length < 3)
    errors.push("Manager username must be at least 3 characters.");
  if (form.password && form.password.length < 6)
    errors.push("Manager password must be at least 6 characters.");
  return errors;
}

export default function RegisterCompanyForm() {
  const [form, setForm] = useState<CompanyFormData>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  function updateField(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSuccess(false);
    setError(null);

    // Front-end validation
    const errors = validate(form);
    setValidationErrors(errors);
    if (errors.length) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([key, value]) =>
        fd.append(key, String(value ?? ""))
      );
      await createCompanyWithAdmin(fd);
      setSuccess(true);
      setForm(initialForm);
      setValidationErrors([]);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : "Failed to create company"
      );
      setSuccess(false);
    }
    setSubmitting(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="max-w-md mx-auto bg-white rounded-lg shadow p-6"
    >
      <h2 className="mb-6 text-2xl font-bold text-center">Register Company</h2>

      {success && (
        <div className="mb-4 text-green-700 bg-green-100 p-3 rounded text-center">
          Company created successfully!
        </div>
      )}
      {error && (
        <div className="mb-4 text-red-700 bg-red-100 p-3 rounded text-center">
          {error}
        </div>
      )}
      {validationErrors.length > 0 && (
        <div className="mb-4 text-red-700 bg-red-100 p-3 rounded">
          <ul className="list-disc pl-6">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor="name" className="block mb-1 font-medium">
          Company name
        </label>
        <input
          id="name"
          name="name"
          value={form.name}
          onChange={updateField}
          required
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="Acme Inc."
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contact_email" className="block mb-1 font-medium">
          Contact email
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          value={form.contact_email}
          onChange={updateField}
          required
          autoComplete="email"
          className="w-full border rounded px-3 py-2"
          placeholder="ops@acme.com"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="contact_phone" className="block mb-1 font-medium">
          Phone number
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          value={form.contact_phone}
          onChange={updateField}
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="+1234567890"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="whatsapp_sender_id" className="block mb-1 font-medium">
          WhatsApp number
        </label>
        <input
          id="whatsapp_sender_id"
          name="whatsapp_sender_id"
          value={form.whatsapp_sender_id}
          onChange={updateField}
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="+1234567890"
        />
      </div>

      <hr className="my-4" />

      <div className="mb-4">
        <label htmlFor="imap_server" className="block mb-1 font-medium">
          IMAP server <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="imap_server"
          name="imap_server"
          value={form.imap_server}
          onChange={updateField}
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="imap.gmail.com"
        />
        <div className="text-xs text-gray-400 mt-1">
          Only required if you want to enable email notifications.
        </div>
      </div>

      <div className="mb-4">
        <label htmlFor="imap_port" className="block mb-1 font-medium">
          IMAP port <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="imap_port"
          name="imap_port"
          value={form.imap_port}
          onChange={updateField}
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="993"
          type="number"
          min="1"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="imap_user" className="block mb-1 font-medium">
          IMAP username <span className="text-gray-500">(company email)</span>
        </label>
        <input
          id="imap_user"
          name="imap_user"
          value={form.imap_user}
          onChange={updateField}
          required
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="admin@example.com"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="imap_password" className="block mb-1 font-medium">
          IMAP app password
        </label>
        <input
          id="imap_password"
          name="imap_password"
          type="password"
          value={form.imap_password}
          onChange={updateField}
          required
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2"
          placeholder="********"
        />
      </div>

      <hr className="my-4" />

      <div className="mb-4">
        <label htmlFor="username" className="block mb-1 font-medium">
          Manager Username
        </label>
        <input
          id="username"
          name="username"
          value={form.username}
          onChange={updateField}
          autoComplete="off"
          className="w-full border rounded px-3 py-2"
          placeholder="manager"
        />
      </div>

      <div className="mb-6">
        <label htmlFor="password" className="block mb-1 font-medium">
          Manager Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          value={form.password}
          onChange={updateField}
          autoComplete="new-password"
          className="w-full border rounded px-3 py-2"
          placeholder="********"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={`w-full py-2 rounded font-bold text-white ${
          submitting
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-600 hover:bg-blue-700"
        }`}
      >
        {submitting ? (
          <span>
            <svg className="animate-spin inline-block mr-2 h-5 w-5 text-white" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Creating...
          </span>
        ) : (
          "Create company"
        )}
      </button>
    </form>
  );
}