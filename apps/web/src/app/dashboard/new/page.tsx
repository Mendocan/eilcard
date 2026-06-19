import { getSession } from "@/lib/session";
import { getLocale } from "@/lib/i18n/get-locale";
import { t } from "@/lib/i18n/messages";
import { canCreateCard, getUserPlan } from "@/lib/user-plan";
import { redirect } from "next/navigation";
import { NewCardForm } from "./new-card-form";

export default async function NewCardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const locale = await getLocale();
  const m = t(locale).dashboard;
  const plan = await getUserPlan(session.user.id);
  const createCheck = await canCreateCard(session.user.id, "person");

  return (
    <NewCardForm
      m={m}
      maxOrgCards={plan.limits.maxOrgCards}
      maxProducts={plan.limits.maxProducts}
      atCardLimit={!createCheck.allowed && createCheck.reason === "card_limit"}
    />
  );
}
