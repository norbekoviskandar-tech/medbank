import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#fcfdfe] text-slate-800">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tight text-slate-900">Privacy Policy</h1>
          <Link href="/solutions" className="text-sm font-bold text-[#1d46af] hover:underline">
            Back to Solutions
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm space-y-6 text-sm leading-6 text-slate-600">
          <p>Effective Date: February 15, 2026</p>
          <p>
            We collect account details, subscription details, and platform usage information to provide educational
            services, monitor security, and improve user experience.
          </p>
          <p>
            We process data for authentication, subscription access, analytics, support, and fraud prevention. Data is
            protected using access controls and secure storage practices.
          </p>
          <p>
            We do not sell user personal information. Limited service providers may process data for hosting and support
            under confidentiality obligations.
          </p>
          <p>
            Users may request account information updates or deletion requests according to applicable laws by contacting
            support through the official Contact Us page.
          </p>
        </div>
      </main>
    </div>
  );
}
