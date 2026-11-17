export const getStats = async (ids:string[]) => {
  let out:any = []
    for (let i = 0; i <= ids.length; i++) {
   const r = await fetch('/api/stats/' + ids[i], { signal: AbortSignal.timeout(5000) })
      out.push(await r.json())
  }
  const totl = await fetch('/api/stats/total', {signal: AbortSignal.timeout(5000)}).then(r => r.json())
  return {out, total: out.length}
}
