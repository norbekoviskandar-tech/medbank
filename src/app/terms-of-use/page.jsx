import Link from "next/link";

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-800">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Terms of Use</h1>
          <Link href="/solutions" className="text-sm font-bold text-[#1d46af] hover:underline">
            Back to Solutions
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-sm leading-6 text-slate-600">
          <p>Effective Date: February 15, 2026</p>
          <p>
            By using this platform, you agree to use the services only for lawful educational purposes and to keep your
            credentials secure and private.
          </p>
          <p>
            Subscriptions are limited to the purchased duration and assigned account. Access may be suspended for abuse,
            unauthorized sharing, fraud, or policy violations.
          </p>
          <p>
            Platform content, question materials, and interface elements are protected intellectual property and may not
            be copied, redistributed, or sold without written permission.
          </p>
          <p>
            We may update these terms periodically. Continued use of the platform after updates means acceptance of the
            revised terms.
          </p>
        </div>
      </main>
    </div>
  );
}
