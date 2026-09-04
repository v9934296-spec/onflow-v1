import { deleteAccount, exportAccount, fetchQuota } from "../api/endpoints";

export async function loadQuota() {
  return fetchQuota();
}

export async function requestAccountExport() {
  return exportAccount();
}

export async function requestAccountDeletion() {
  return deleteAccount();
}
