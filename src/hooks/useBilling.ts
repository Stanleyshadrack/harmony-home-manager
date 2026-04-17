import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createInvoice,
  getInvoice,
  getMyInvoices,
  recordPayment,
  payWithMpesa,
  getPaymentStatus,
   updateInvoice, 
  cancelInvoice,
  generateInvoices, 
} from "@/api/service/billing.service";
import { Invoice, Payment, PaymentResponse } from "@/types/billing";
import { useToast } from "./use-toast";

/* =========================
   QUERY KEYS
========================= */

export const billingKeys = {
  all: ["billing"] as const,

  invoices: () => [...billingKeys.all, "invoices"] as const,
  myInvoices: () => [...billingKeys.invoices(), "my"] as const,
  invoice: (id: number) => [...billingKeys.invoices(), id] as const,

  paymentStatus: (checkoutId: string) =>
    [...billingKeys.all, "payment-status", checkoutId] as const,
};

/* =========================
   QUERIES
========================= */

export const useMyInvoices = () =>
  useQuery<Invoice[]>({
    queryKey: billingKeys.myInvoices(),
    queryFn: getMyInvoices,
  });

export const useInvoice = (id: number) =>
  useQuery<Invoice>({
    queryKey: billingKeys.invoice(id),
    queryFn: () => getInvoice(id),
    enabled: !!id,
  });


  export const useGenerateInvoices = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: generateInvoices,

    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });

      toast({
        title: "Invoices generated",
        description: `${res.generated} created, ${res.skipped} skipped`,
      });
    },

    onError: (err: any) => {
      toast({
        title: "Generation failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
};

/* =========================
   PAYMENT STATUS (NEW 🔥)
========================= */

export const usePaymentStatus = (checkoutId?: string) =>
  useQuery<PaymentResponse>({
    queryKey: billingKeys.paymentStatus(checkoutId || ""),
    queryFn: () => getPaymentStatus(checkoutId!),
    enabled: !!checkoutId,
    refetchInterval: 3000,
  });

/* =========================
   MUTATIONS
========================= */

export const useCreateInvoice = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: createInvoice,

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });
    },
  });
};

export const useRecordPayment = () => {
  const qc = useQueryClient();

  return useMutation<
    Payment,
    Error,
    {
      invoiceId: number;
      amount: number;
      method: "mpesa" | "card" | "bank" | "cash";
      transactionRef?: string;
      notes?: string;
    }
  >({
    mutationFn: recordPayment,

    onSuccess: (_, variables) => {
      qc.invalidateQueries({
        queryKey: billingKeys.invoice(variables.invoiceId),
      });

      qc.invalidateQueries({
        queryKey: billingKeys.myInvoices(),
      });
    },
  });
};

export const useUpdateInvoice = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, payload }: any) =>
      updateInvoice(id, payload),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });

      toast({
        title: "Invoice updated",
        description: "Changes saved successfully",
      });
    },

    onError: (err: any) => {
      toast({
        title: "Update failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
};

export const useCancelInvoice = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: number) => cancelInvoice(id),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: billingKeys.invoices() });

      toast({
        title: "Invoice cancelled",
        description: "Invoice has been cancelled",
      });
    },

    onError: (err: any) => {
      toast({
        title: "Cancel failed",
        description: err.message,
        variant: "destructive",
      });
    },
  });
};

/* =========================
   MPESA
========================= */

export const useMpesaPayment = () => {
  return useMutation<
    PaymentResponse,
    Error,
    { invoiceId: number; phone: string; amount: number } // ✅ add amount
  >({
    mutationFn: ({ invoiceId, phone, amount }) =>
      payWithMpesa(invoiceId, phone, amount), // ✅ pass it
  });
};
