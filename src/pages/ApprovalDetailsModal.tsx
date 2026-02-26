// "use client";

// import { useEffect, useState } from "react";
// import { Approval } from "@/api/dto/approval.dto";
// import { Button } from "@/components/ui/button";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
// import { Loader2 } from "lucide-react";
// import { toast } from "sonner";
// import { ApprovalsApi } from "@/api/service/approvals.service";

// interface Props {
//   approvalId: number | null;
//   open: boolean;
//   onClose: () => void;
//   onUpdated?: () => void; // refresh list
// }

// export function ApprovalDetailsModal({
//   approvalId,
//   open,
//   onClose,
//   onUpdated,
// }: Props) {
//   const [approval, setApproval] = useState<Approval | null>(null);
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     if (!approvalId || !open) return;

//     setLoading(true);
//     ApprovalsApi.getById(approvalId)
//       .then(setApproval)
//       .catch(() => toast.error("Failed to load approval details"))
//       .finally(() => setLoading(false));
//   }, [approvalId, open]);

//   const approve = async () => {
//     if (!approval) return;
//     await ApprovalsApi.approve(approval.id);
//     toast.success("Approval approved");
//     onUpdated?.();
//     onClose();
//   };

//   const reject = async () => {
//     if (!approval) return;
//     const reason = prompt("Reason for rejection");
//     if (!reason) return;

//     await ApprovalsApi.reject(approval.id, reason);
//     toast.success("Approval rejected");
//     onUpdated?.();
//     onClose();
//   };

//   return (
//     <Dialog open={open} onOpenChange={onClose}>
//       <DialogContent className="max-w-2xl">
//         <DialogHeader>
//           <DialogTitle>
//             Approval #{approvalId}
//           </DialogTitle>
//         </DialogHeader>

//         {loading && (
//           <div className="flex justify-center py-10">
//             <Loader2 className="animate-spin" />
//           </div>
//         )}

//         {approval && (
//           <div className="space-y-4 text-sm">
//             <div className="grid grid-cols-2 gap-4">
//               <div>
//                 <p className="text-muted-foreground">Type</p>
//                 <p className="font-medium">{approval.type}</p>
//               </div>
//               <div>
//                 <p className="text-muted-foreground">Status</p>
//                 <p className="font-medium">{approval.status}</p>
//               </div>
//             </div>

//             <div>
//               <p className="text-muted-foreground">Requested By</p>
//               <p className="font-medium">{approval.requestedBy?.email}</p>
//             </div>

//             <div>
//               <p className="text-muted-foreground">Target Details</p>
//               <pre className="bg-muted rounded p-3 text-xs overflow-auto max-h-48">
//                 {JSON.stringify(approval.target, null, 2)}
//               </pre>
//             </div>

//             {approval.status === "PENDING" && (
//               <div className="flex justify-end gap-2 pt-4">
//                 <Button variant="outline" onClick={onClose}>
//                   Cancel
//                 </Button>
//                 <Button variant="destructive" onClick={reject}>
//                   Reject
//                 </Button>
//                 <Button onClick={approve}>
//                   Approve
//                 </Button>
//               </div>
//             )}
//           </div>
//         )}
//       </DialogContent>
//     </Dialog>
//   );
// }