'use client'

import { useRef } from 'react'
import { deleteCompany, updateCompany } from '@/app/admin/actions'

export type CompanyRow = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  whatsapp_sender_id: string | null
  imap_server?: string | null
  imap_user?: string | null
}

export default function CompanyRowActions({ company }: { company: CompanyRow }) {
  const dialogRef = useRef<HTMLDialogElement | null>(null)

  const onDeleteSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    if (!confirm(`Delete company "${company.name}"? This cannot be undone.`)) {
      e.preventDefault()
    }
  }

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {/* Edit button opens a dialog */}
      <button
        type="button"
        onClick={() => dialogRef.current?.showModal()}
        style={{
          padding: '6px 10px',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          background: '#f9fafb',
          cursor: 'pointer',
        }}
      >
        Edit
      </button>

      {/* Delete form */}
      <form action={deleteCompany} onSubmit={onDeleteSubmit}>
        <input type="hidden" name="id" value={company.id} />
        <button
          type="submit"
          style={{
            padding: '6px 10px',
            border: '1px solid #ef4444',
            borderRadius: 6,
            background: '#fee2e2',
            color: '#991b1b',
            cursor: 'pointer',
          }}
        >
          Delete
        </button>
      </form>

      {/* Edit dialog */}
      <dialog
        ref={dialogRef}
        style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 0 }}
      >
        {/* Do not specify method or encType when using a Server Action */}
        <form action={updateCompany}>
          <div style={{ padding: 16, minWidth: 380 }}>
            <h3 style={{ marginTop: 0, marginBottom: 12, fontSize: 18 }}>
              Edit company
            </h3>
            <input type="hidden" name="id" value={company.id} />

            <label style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              <span>Company name</span>
              <input
                name="name"
                defaultValue={company.name}
                required
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              <span>Contact email</span>
              <input
                name="contact_email"
                type="email"
                defaultValue={company.contact_email ?? ''}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              <span>Phone number</span>
              <input
                name="contact_phone"
                defaultValue={company.contact_phone ?? ''}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <label style={{ display: 'grid', gap: 6, marginBottom: 10 }}>
              <span>WhatsApp number</span>
              <input
                name="whatsapp_sender_id"
                defaultValue={company.whatsapp_sender_id ?? ''}
                style={{
                  padding: '8px 10px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                }}
              />
            </label>

            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                type="submit"
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#111827',
                  color: 'white',
                  cursor: 'pointer',
                }}
              >
                Save changes
              </button>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                style={{
                  padding: '8px 12px',
                  border: '1px solid #e5e7eb',
                  borderRadius: 6,
                  background: '#f9fafb',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      </dialog>
    </div>
  )
}