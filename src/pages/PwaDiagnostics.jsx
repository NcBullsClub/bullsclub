import { useEffect, useMemo, useState } from 'react'

function isLikelyJsonContentType(contentType = '') {
  return /application\/json|application\/manifest\+json|text\/plain/i.test(contentType)
}

async function checkEndpoint(url, mustContainManifest = false) {
  const result = {
    url,
    ok: false,
    status: 0,
    contentType: '',
    bodyPreview: '',
    validJson: false,
    hasManifestReference: false,
    error: '',
  }

  try {
    const res = await fetch(url, { cache: 'no-store' })
    result.status = res.status
    result.ok = res.ok
    result.contentType = res.headers.get('content-type') || ''

    const text = await res.text()
    result.bodyPreview = text.slice(0, 260)

    try {
      const parsed = JSON.parse(text)
      result.validJson = true
      if (mustContainManifest) {
        const items = parsed?.web_apps || []
        result.hasManifestReference = items.some((app) =>
          typeof app?.manifest === 'string' && app.manifest.includes('/manifest.webmanifest'),
        )
      }
    } catch {
      result.validJson = false
    }
  } catch (e) {
    result.error = e?.message || 'Network error'
  }

  return result
}

function DiagnosticCard({ title, details, recommendation }) {
  const contentTypeOk = isLikelyJsonContentType(details.contentType)
  const overallOk = details.ok && details.validJson && contentTypeOk && (!recommendation.requireManifest || details.hasManifestReference)

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-primary text-sm sm:text-base">{title}</h3>
        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${overallOk ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {overallOk ? 'PASS' : 'CHECK'}
        </span>
      </div>

      <div className="mt-3 space-y-1.5 text-xs sm:text-sm">
        <p><span className="font-semibold text-gray-600">URL:</span> <a href={details.url} target="_blank" rel="noreferrer" className="text-primary underline break-all">{details.url}</a></p>
        <p><span className="font-semibold text-gray-600">HTTP:</span> {details.status || 'N/A'}</p>
        <p><span className="font-semibold text-gray-600">Content-Type:</span> {details.contentType || 'N/A'}</p>
        <p><span className="font-semibold text-gray-600">Valid JSON:</span> {details.validJson ? 'Yes' : 'No'}</p>
        {recommendation.requireManifest && (
          <p><span className="font-semibold text-gray-600">References manifest.webmanifest:</span> {details.hasManifestReference ? 'Yes' : 'No'}</p>
        )}
      </div>

      {!overallOk && (
        <div className="mt-3 text-[11px] sm:text-xs bg-amber-50 border border-amber-200 text-amber-700 rounded-lg px-3 py-2">
          {recommendation.text}
        </div>
      )}

      {details.error && (
        <div className="mt-3 text-[11px] sm:text-xs bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2">
          {details.error}
        </div>
      )}
    </div>
  )
}

export default function PwaDiagnostics() {
  const origin = useMemo(() => window.location.origin, [])
  const [loading, setLoading] = useState(true)
  const [manifestCheck, setManifestCheck] = useState(null)
  const [associationCheck, setAssociationCheck] = useState(null)

  async function runChecks() {
    setLoading(true)
    const [manifest, association] = await Promise.all([
      checkEndpoint(`${origin}/manifest.webmanifest`),
      checkEndpoint(`${origin}/.well-known/web-app-origin-association`, true),
    ])
    setManifestCheck(manifest)
    setAssociationCheck(association)
    setLoading(false)
  }

  useEffect(() => {
    runChecks()
  }, [])

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="flex items-start justify-between gap-3 mb-5 sm:mb-7">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary">PWA Link Capture Diagnostics</h1>
          <p className="text-sm text-gray-500 mt-1">Checks whether the manifest and origin-association files are reachable and valid in the deployed app.</p>
        </div>
        <button
          onClick={runChecks}
          className="flex-shrink-0 bg-primary-dark hover:opacity-90 text-accent text-xs sm:text-sm font-semibold px-3.5 py-2 rounded-lg transition-opacity"
        >
          Recheck
        </button>
      </div>

      <div className="space-y-4">
        {loading && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 flex justify-center">
            <div className="w-7 h-7 border-4 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && manifestCheck && associationCheck && (
          <>
            <DiagnosticCard
              title="Manifest Endpoint"
              details={manifestCheck}
              recommendation={{
                requireManifest: false,
                text: 'Ensure /manifest.webmanifest is publicly accessible, returns HTTP 200, and is served as JSON/manifest content-type.',
              }}
            />

            <DiagnosticCard
              title="Origin Association Endpoint"
              details={associationCheck}
              recommendation={{
                requireManifest: true,
                text: 'Ensure /.well-known/web-app-origin-association is publicly accessible and includes a manifest URL pointing to /manifest.webmanifest.',
              }}
            />

            <div className="bg-slate-900 text-slate-100 rounded-2xl p-4 sm:p-5">
              <p className="text-[11px] uppercase tracking-wide text-slate-400 font-semibold mb-2">Quick Test Links</p>
              <ul className="space-y-1 text-xs sm:text-sm">
                <li><a className="underline text-slate-200 break-all" href={`${origin}/manifest.webmanifest`} target="_blank" rel="noreferrer">{origin}/manifest.webmanifest</a></li>
                <li><a className="underline text-slate-200 break-all" href={`${origin}/.well-known/web-app-origin-association`} target="_blank" rel="noreferrer">{origin}/.well-known/web-app-origin-association</a></li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
