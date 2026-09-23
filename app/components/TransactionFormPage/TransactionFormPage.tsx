"use client";

import { ExpenseForm, IncomingForm } from "@/app/components/forms";
import { Button } from "@developmentsnil/awake-ui/button";
import { ArrowCircleLeft } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormattedMessage, useIntl } from "react-intl";
import "./styles.css";

type TransactionType = "incomings" | "expenses";

interface TransactionFormPageProps {
  mode: "create" | "edit";
  type?: TransactionType; // obrigatório no edit; ignorado no create
  id?: string;
  initialData?: Record<string, unknown>;
  redirectTo?: string;
}

export default function TransactionFormPage({
  mode,
  type,
  id,
  initialData,
  redirectTo = "/list",
}: TransactionFormPageProps) {
  const { formatMessage } = useIntl();
  const [controlTab, setControlTab] = useState<TransactionType>("incomings");
  const router = useRouter();

  const activeType = mode === "create" ? controlTab : type!;

  const handleSuccess = () => {
    router.push(redirectTo);
  };

  const titleId = {
    create: {
      incomings: "create.title.incomings",
      expenses: "create.title.expenses",
    },
    edit: {
      incomings: "update.title.incomings",
      expenses: "update.title.expenses",
    },
  }[mode][activeType];

  return (
    <>
      <Tooltip title={`${formatMessage({ id: "create.update.goToPrevious.button.tooltip" })}`} arrow placement="top">
        <Button variant="secondary" onClick={() => router.back()} className="border w-auto! flex gap-1 mb-2">
          <ArrowCircleLeft
            className="cursor-pointer"
          />
          <FormattedMessage id="create.update.goToPrevious.button" />
        </Button>
      </Tooltip>
      {mode === "create" && (
        <nav>
          <ul className="tabs">
            <li
              className={`tab ${controlTab === "incomings" ? "active" : ""}`}
              onClick={() => setControlTab("incomings")}
            >
              <FormattedMessage id="create.update.tab.incomings" />
            </li>
            <li
              className={`tab ${controlTab === "expenses" ? "active" : ""}`}
              onClick={() => setControlTab("expenses")}
            >
              <FormattedMessage id="create.update.tab.expenses" />
            </li>
          </ul>
        </nav>
      )}

      <h1 className="title">
        <FormattedMessage id={titleId} />
      </h1>

      {activeType === "incomings" ? (
        <IncomingForm
          id={id}
          defaultValues={
            initialData as { value: number; reference: string; origin: string }
          }
          onSuccess={handleSuccess}
        />
      ) : (
        <ExpenseForm
          id={id}
          defaultValues={
            initialData as {
              destination: string;
              value: number;
              reference: string;
            }
          }
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
