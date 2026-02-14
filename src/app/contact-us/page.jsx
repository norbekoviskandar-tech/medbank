import Link from "next/link";

export default function ContactUsPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-800">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Contact Us</h1>
          <Link href="/solutions" className="text-sm font-bold text-[#1d46af] hover:underline">
            Back to Solutions
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-sm leading-6 text-slate-600 space-y-4">
          <p>
            For billing, legal, privacy, or payment-gateway verification inquiries, please contact our support team.
          </p>
          <div>
            <p><span className="font-bold text-slate-800">Support Email:</span> support@iskymd.com</p>
            <p><span className="font-bold text-slate-800">Compliance Email:</span> compliance@iskymd.com</p>
            <p><span className="font-bold text-slate-800">Business Address:</span> IskyMD Universal Systems</p>
          </div>
          <p>
            Response time is typically within 1-2 business days.
          </p>
        </div>
      </main>
    </div>
  );
}
