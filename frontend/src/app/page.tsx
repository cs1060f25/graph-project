'use client';

import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';
import Icon from '../components/Icon';

export default function HomePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0f0f10] text-[#eaeaea] font-sans">
      <div className="max-w-[1200px] mx-auto py-16 px-8 text-center">
        <h1 className="text-5xl font-semibold m-0 mb-6 text-[#eaeaea]">
          Graph-Based Research Paper Discovery
        </h1>
        <p className="text-xl mx-auto mb-12 max-w-[700px] text-[#c9c9ce] leading-relaxed">
          Navigate the frontier of research with intelligent paper recommendations
          powered by graph algorithms and AI.
        </p>
        {user && (
          <div className="flex gap-8 justify-center items-stretch flex-wrap mt-12">
            <Link
              href="/query"
              className="bg-[#151517] border border-[#2a2a2e] text-[#eaeaea] p-5 rounded-2xl cursor-pointer transition-all max-w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-left flex flex-col justify-center gap-2 min-h-[120px] flex-[0_1_320px] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-[#3a82ff]"
            >
              <h3 className="m-0 mb-3 text-2xl font-semibold text-[#eaeaea] inline-flex items-center gap-2">
                <Icon name="search" ariaLabel="Query papers" />
                <span>Query Papers</span>
              </h3>
              <p className="m-0 text-[#c9c9ce] text-[0.9375rem] leading-relaxed">
                Search and discover research papers
              </p>
            </Link>
            <Link
              href="/personal"
              className="bg-[#151517] border border-[#2a2a2e] text-[#eaeaea] p-5 rounded-2xl cursor-pointer transition-all max-w-[320px] shadow-[0_10px_30px_rgba(0,0,0,0.4)] text-left flex flex-col justify-center gap-2 min-h-[120px] flex-[0_1_320px] hover:-translate-y-1 hover:shadow-[0_10px_40px_rgba(0,0,0,0.5)] hover:border-[#3a82ff]"
            >
              <h3 className="m-0 mb-3 text-2xl font-semibold text-[#eaeaea] inline-flex items-center gap-2">
                <Icon name="book" ariaLabel="Personal dashboard" />
                <span>Personal Dashboard</span>
              </h3>
              <p className="m-0 text-[#c9c9ce] text-[0.9375rem] leading-relaxed">
                Manage your saved papers and preferences
              </p>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
