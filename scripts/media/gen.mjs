// Generate media via fal.ai's queue API (works for slow video/3D jobs too).
// Usage: node --env-file=.env scripts/media/gen.mjs <model> <outDir> <jobs.json>
// jobs.json: [{ "name": "hero", "prompt": "...", ... }] — any "*_url" field that points to a local
// file is sent as a data URI.
import fs from 'node:fs'
import path from 'node:path'

const [model, outDir, jobsFile] = process.argv.slice(2)
const jobs = JSON.parse(fs.readFileSync(jobsFile, 'utf8'))
const auth = { Authorization: `Key ${process.env.FAL_KEY}` }
fs.mkdirSync(outDir, { recursive: true })

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }
const toDataUri = (file) => `data:${MIME[path.extname(file)]};base64,${fs.readFileSync(file).toString('base64')}`
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function save(url, file) {
  fs.writeFileSync(file, Buffer.from(await (await fetch(url)).arrayBuffer()))
  return file
}

async function run(job) {
  const { name, ...input } = job
  for (const [k, v] of Object.entries(input)) if (k.endsWith('_url') && fs.existsSync(v)) input[k] = toDataUri(v)

  const submit = await fetch(`https://queue.fal.run/${model}`, {
    method: 'POST',
    headers: { ...auth, 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  if (!submit.ok) throw new Error(`${name}: ${submit.status} ${await submit.text()}`)
  const { status_url, response_url } = await submit.json()

  for (;;) {
    await sleep(4000)
    const s = await (await fetch(status_url, { headers: auth })).json()
    if (s.status === 'COMPLETED') break
    if (s.status !== 'IN_QUEUE' && s.status !== 'IN_PROGRESS') throw new Error(`${name}: ${JSON.stringify(s)}`)
  }
  const res = await fetch(response_url, { headers: auth })
  const data = await res.json()
  if (!res.ok) throw new Error(`${name}: ${res.status} ${JSON.stringify(data)}`)

  const saved = []
  const images = data.images ?? []
  for (const [i, f] of images.entries()) {
    const ext = (f.content_type?.split('/')[1] ?? 'png').replace('jpeg', 'jpg')
    saved.push(await save(f.url, path.join(outDir, `${name}${images.length > 1 ? `-${i}` : ''}.${ext}`)))
  }
  if (data.video) saved.push(await save(data.video.url, path.join(outDir, `${name}.mp4`)))
  const mesh = data.model_mesh ?? data.model_glb ?? data.glb
  if (mesh) saved.push(await save(mesh.url, path.join(outDir, `${name}.glb`)))
  if (!saved.length) console.log(name, JSON.stringify(data).slice(0, 500))
  return saved
}

const results = await Promise.allSettled(jobs.map(run))
for (const r of results) console.log(r.status === 'fulfilled' ? `ok ${r.value.join(', ')}` : `FAIL ${r.reason.message}`)
