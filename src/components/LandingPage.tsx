'use client';

import { useState } from 'react';
import { Mic, FileText, Upload, CheckCircle, Star, Users, DollarSign, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  const [isRecording, setIsRecording] = useState(false);

  return (
    <div className="min-h-screen bg-off-white">
      {/* Hero Section */}
      <section className="hero-padding bg-hero-pattern">
        <div className="container-responsive">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="mb-6">
              G'day! Transform Property Walkthroughs into{' '}
              <span className="text-gold-accent">Professional Quotes</span>
            </h1>
            <p className="text-xl md:text-2xl text-aussie-body mb-8 max-w-3xl mx-auto">
              Just talk your way through the job, mate. Our AI handles the rest - 
              from voice to quote to task management. No worries, we've got you covered.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button 
                className={`btn-primary text-lg px-8 py-4 flex items-center gap-3 ${
                  isRecording ? 'animate-pulse-gold' : ''
                }`}
                onClick={() => setIsRecording(!isRecording)}
              >
                <Mic className={`w-5 h-5 ${isRecording ? 'text-red-500' : ''}`} />
                {isRecording ? 'Recording...' : 'Start Voice Quote'}
              </button>
              <button className="btn-outline text-lg px-8 py-4 flex items-center gap-3">
                <Upload className="w-5 h-5" />
                Upload PDF Plans
              </button>
            </div>

            {/* Demo Audio Visual */}
            {isRecording && (
              <div className="bg-outback-midnight rounded-brand p-6 text-off-white animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-sm">Recording active...</span>
                </div>
                <p className="text-left font-mono text-sm opacity-80">
                  "G'day, so we're looking at this bathroom renovation. The tiles are looking pretty rough, 
                  reckon we'll need about 15 square meters of new ceramic. The shower head's leaking, 
                  so new fixtures there too. Should be about a day's work..."
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="section-padding bg-neutral-50">
        <div className="container-responsive">
          <div className="text-center mb-12">
            <h2 className="mb-4">Trusted by Tradies Across Australia</h2>
            <p className="text-aussie-body text-lg">From Sydney to Perth, we're helping trades work smarter, not harder.</p>
          </div>
          
          <div className="grid-kpi">
            <div className="kpi-tile">
              <div className="kpi-value">2,500+</div>
              <div className="kpi-label">Quotes Generated</div>
              <div className="kpi-change-positive">
                <TrendingUp className="w-4 h-4 mr-1" />
                +23% this month
              </div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-value">$4.2M</div>
              <div className="kpi-label">Jobs Quoted</div>
              <div className="kpi-change-positive">
                <DollarSign className="w-4 h-4 mr-1" />
                AUD value
              </div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-value">150+</div>
              <div className="kpi-label">Active Tradies</div>
              <div className="kpi-change-positive">
                <Users className="w-4 h-4 mr-1" />
                Growing daily
              </div>
            </div>
            <div className="kpi-tile">
              <div className="kpi-value">4.9★</div>
              <div className="kpi-label">User Rating</div>
              <div className="flex justify-center mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-worksite-gold text-worksite-gold" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3-Step How It Works */}
      <section className="section-padding">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="mb-4">How It Works - Easy as 1, 2, 3</h2>
            <p className="text-aussie-body text-lg">
              No fancy tech skills needed, mate. Just talk, upload, and get your quote.
            </p>
          </div>

          <div className="grid-responsive">
            {/* Step 1 */}
            <div className="feature-card">
              <div className="feature-icon">
                <Mic className="w-8 h-8" />
              </div>
              <div className="feature-title">1. Record Your Walkthrough</div>
              <div className="feature-description">
                Walk through the job and describe what needs doing. Just talk naturally - 
                our AI understands Aussie trade lingo perfectly.
              </div>
            </div>

            {/* Step 2 */}
            <div className="feature-card">
              <div className="feature-icon">
                <FileText className="w-8 h-8" />
              </div>
              <div className="feature-title">2. AI Generates Quote</div>
              <div className="feature-description">
                Our AI analyzes your recording, calculates materials and labor using 
                current Australian rates, and creates a professional quote with GST.
              </div>
            </div>

            {/* Step 3 */}
            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div className="feature-title">3. Manage & Track Jobs</div>
              <div className="feature-description">
                Once accepted, quotes automatically become task lists in Google Sheets. 
                Track progress, assign work, and keep clients happy.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="section-padding bg-outback-midnight text-off-white">
        <div className="container-responsive">
          <div className="text-center mb-16">
            <h2 className="text-off-white mb-4">Fair Dinkum Pricing</h2>
            <p className="text-neutral-300 text-lg">
              Pricing that makes sense for Australian trades. All prices include GST.
            </p>
          </div>

          <div className="grid gap-8 grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto">
            {/* Pro Plan */}
            <div className="card bg-slate-shadow border-neutral-600 text-center">
              <h3 className="text-worksite-gold mb-4">Pro</h3>
              <div className="text-4xl font-bold mb-2">$199</div>
              <div className="text-neutral-400 mb-6">per month (inc. GST)</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Unlimited voice quotes
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  PDF plan uploads
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Google Sheets integration
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Up to 3 team members
                </li>
              </ul>
              <button className="btn-primary w-full">Start Free Trial</button>
            </div>

            {/* Add-on Seat */}
            <div className="card bg-slate-shadow border-neutral-600 text-center">
              <h3 className="text-off-white mb-4">Extra Seat</h3>
              <div className="text-4xl font-bold mb-2">$25</div>
              <div className="text-neutral-400 mb-6">per month (inc. GST)</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Additional team member
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Full platform access
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Shared quote history
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Role-based permissions
                </li>
              </ul>
              <button className="btn-outline w-full">Add to Plan</button>
            </div>

            {/* Enterprise */}
            <div className="card bg-worksite-gold text-outback-midnight text-center">
              <h3 className="mb-4">Enterprise</h3>
              <div className="text-4xl font-bold mb-2">$249</div>
              <div className="text-slate-shadow mb-6">per month (inc. GST)</div>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Everything in Pro
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Unlimited team members
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Priority support
                </li>
                <li className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-eucalypt-mist" />
                  Custom integrations
                </li>
              </ul>
              <button className="btn-secondary w-full">Contact Sales</button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding">
        <div className="container-responsive">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-center mb-12">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="card">
                <h4 className="mb-3">How accurate are the AI-generated quotes?</h4>
                <p className="text-aussie-body">
                  Our AI uses current Australian market rates and includes GST calculations. 
                  Quotes are typically within 5-10% of manual estimates, but you can always adjust 
                  rates and add your markup before sending to clients.
                </p>
              </div>

              <div className="card">
                <h4 className="mb-3">What file formats do you support for architectural plans?</h4>
                <p className="text-aussie-body">
                  We support PDF uploads for architectural plans, site drawings, and specifications. 
                  Our AI can extract room dimensions, materials lists, and scope details from most 
                  standard construction drawings.
                </p>
              </div>

              <div className="card">
                <h4 className="mb-3">Can I customize the quote templates?</h4>
                <p className="text-aussie-body">
                  Absolutely! You can add your business logo, adjust pricing structures, 
                  include warranty terms, and customize the look to match your brand. 
                  All quotes include your ABN and GST details automatically.
                </p>
              </div>

              <div className="card">
                <h4 className="mb-3">How does the Google Sheets integration work?</h4>
                <p className="text-aussie-body">
                  When a quote is accepted, we automatically create a task breakdown in your 
                  Google Sheet with timeline, materials list, and assigned team members. 
                  Perfect for project management and keeping track of multiple jobs.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="section-padding bg-eucalypt-mist text-off-white text-center">
        <div className="container-responsive">
          <h2 className="text-off-white mb-4">Ready to Give It a Bludge?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Start your free trial today. No credit card required, no worries mate.
          </p>
          <button className="btn-primary text-lg px-8 py-4">
            Start Free Trial - Fair Dinkum!
          </button>
        </div>
      </section>
    </div>
  );
}