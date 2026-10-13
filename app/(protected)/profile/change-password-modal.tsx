"use client"

import { useState } from "react"
import { changePassword } from "@/app/services/profiles/profiles"

type Props = {
  open: boolean
  onClose: () => void
}

export default function ChangePasswordModal({ open, onClose }: Props) {
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
      setError("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    if (password !== confirm) {
      setError("As senhas não coincidem.")
      return
    }

    try {
      setSaving(true)
      await changePassword(password)
      setSuccess(true)
      setPassword("")
      setConfirm("")
    } catch {
      setError("Erro ao alterar a senha. Tente novamente.")
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
        <h2 className="modal-title">Alterar senha</h2>

        {success ? (
          <div className="modal-success">
            <p>Senha alterada com sucesso!</p>
            <button className="btn-primary" onClick={handleClose}>Fechar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <label className="form-label">
              Nova senha
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
              Confirmar senha
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
                Cancelar
              </button>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
