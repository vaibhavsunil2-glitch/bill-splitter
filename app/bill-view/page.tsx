import { Suspense } from "react";
import BillViewPage from "../../components/bill-view-page";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BillViewPage />
    </Suspense>
  );
}
