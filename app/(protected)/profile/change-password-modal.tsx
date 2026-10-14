"use client"

import { useState } from "react"
import { useIntl } from "react-intl"
import { changePassword } from "@/app/services/profiles/profiles"

type Props = {
  open: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ open, onClose }: Props) {
  const { formatMessage } = useIntl()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password.length < 6) {
      setError(formatMessage({ id: "changePassword.error.tooShort" }))
      return
    }

    if (password !== confirm) {
      setError(formatMessage({ id: "changePassword.error.mismatch" }))
      return
    }

    try {
      setSaving(true)
      await changePassword(password)
      setSuccess(true)
      setPassword("")
      setConfirm("")
    } catch {
      setError(formatMessage({ id: "changePassword.error.generic" }))
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    setError(null)
    setSuccess(false)
    setPassword("")
    setConfirm("")
    onClose()
  }

  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 className="modal-title">{formatMessage({ id: "changePassword.title" })}</h2>

        {success ? (
          <div className="modal-success">
            <p>{formatMessage({ id: "changePassword.success" })}</p>
            <button className="btn-primary" onClick={handleClose}>
              {formatMessage({ id: "changePassword.close" })}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <label className="form-label">
              {formatMessage({ id: "changePassword.newPassword" })}
              <input
                className="form-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </label>
            <label className="form-label">
              {formatMessage({ id: "changePassword.confirmPassword" })}
              <input
                className="form-input"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
            </label>

            {error && <p className="form-error">{error}</p>}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={handleClose}>
                {formatMessage({ id: "changePassword.cancel" })}
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving
                  ? formatMessage({ id: "changePassword.saving" })
                  : formatMessage({ id: "changePassword.save" })}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
