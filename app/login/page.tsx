"use client";

import Button from "@/app/components/ui/Button/Button";
import { login, signup } from "@/app/services/auth/auth";
import { useState } from "react";
import "./styles.css";
import LoginForm from "../components/forms/LoginForm/LoginForm";
import { FormattedMessage } from "react-intl";
// import Divider from '@mui/material/Divider';
import { Separator } from "@developmentsnil/awake-ui/separator";

export default function Login() {
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  async function handleCreateAccount(formData: FormData) {
    setError(null);
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
    }
  }

  const isDisabled = () => {
    return isCreating
      ? {
          disabled: true,
        }
      : {};
  };

  return (
    <main className="flex flex-col items-center gap-4 w-175">
      <h1 className="text-2xl font-bold mb-6">
        <FormattedMessage id={"login.title"} />
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <article
        className={`flex justify-${isCreating ? "between" : "center"} border border-[#4d7c0f]/50 rounded`}
      >
        <LoginForm
          {...isDisabled()}
          formattedMessageCardTitle="login.haveAccount"
          action={handleSubmit}
          articleClassName={`${isCreating ? "login-form-disabled" : ""}`}
        >
          <div className="input-control-button">
            <Button
              className="login-button"
              variant="primary"
              type="submit"
              {...isDisabled()}
            >
              <FormattedMessage id={"login.loginButton"} />
            </Button>
          </div>
          <p className="mt-3 text-sm text-gray-500">
            <FormattedMessage id={"login.noAccount"} />{" "}
            <a
              href="#"
              onClick={() => setIsCreating(true)}
              className="text-blue-500"
            >
              <FormattedMessage id={"login.registerLink"} />
            </a>
          </p>
        </LoginForm>

        {isCreating && (
          <>
            <Separator
              orientation="vertical"
              className="bg-[#4d7c0f]! h-[80%]! mt-5"
            />
            <LoginForm
              formattedMessageCardTitle="login.createAccount"
              action={handleCreateAccount}
              isCreating
            >
              <div className="input-control-button">
                <Button variant="primary" type="submit">
                  <FormattedMessage id={"login.createAccountButton"} />
                </Button>
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setIsCreating(false)}
                >
                  <FormattedMessage id={"login.cancel"} />
                </Button>
              </div>
            </LoginForm>
          </>
        )}
      </article>
    </main>
  );
}
