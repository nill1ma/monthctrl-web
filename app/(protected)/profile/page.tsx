"use client"

import "./styles.css"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { getProfile, saveProfile } from "@/app/services/profiles/profiles"
import ChangePasswordModal from "./change-password-modal"

const CURRENCY_OPTIONS = ["BRL", "CAD", "USD", "EUR", "GBP"]

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  nickname: z.string().optional(),
  occupation: z.string().optional(),
  preferred_currency: z.string().min(1, "Moeda é obrigatória"),
})

type ProfileFormValues = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      nickname: "",
      occupation: "",
      preferred_currency: "BRL",
    },
  })

  useEffect(() => {
    getProfile().then((profile) => {
      if (profile) {
        reset({
          name: profile.name ?? "",
          nickname: profile.nickname ?? "",
          occupation: profile.occupation ?? "",
          preferred_currency: profile.preferred_currency ?? "BRL",
        })
      }
    }).finally(() => setLoading(false))
  }, [reset])

  const onSubmit = handleSubmit(async (values) => {
    try {
      setSaving(true)
      setSaveSuccess(false)
      await saveProfile(values)
      setSaveSuccess(true)
    } catch {
      // erro silencioso por ora
    } finally {
      setSaving(false)
    }
  })

  if (loading) {
    return (
      <div className="profile-loading">
        <p>Carregando...</p>
      </div>
    )
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Perfil</h1>

      <form onSubmit={onSubmit} className="profile-form">
        <label className="form-label">
          Nome
          <input className="form-input" {...register("name")} />
          {errors.name && <span className="form-error">{errors.name.message}</span>}
        </label>

        <label className="form-label">
          Nickname
          <input className="form-input" {...register("nickname")} />
        </label>

        <label className="form-label">
          Ocupação
          <input className="form-input" {...register("occupation")} />
        </label>

        <label className="form-label">
          Moeda preferida
          <select className="form-input" {...register("preferred_currency")}>
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.preferred_currency && (
            <span className="form-error">{errors.preferred_currency.message}</span>
          )}
        </label>

        {saveSuccess && <p className="form-success">Perfil salvo com sucesso!</p>}

        <div className="profile-actions">
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setShowModal(true)}
          >
            Alterar senha
          </button>
        </div>
      </form>

      <ChangePasswordModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
